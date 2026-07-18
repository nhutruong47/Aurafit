package com.aurafit.service.impl;

import com.aurafit.dto.request.PaymentCreateRequest;
import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.dto.response.PaymentInitResponse;
import com.aurafit.dto.response.PaymentStatusResponse;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.Payment;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.entity.User;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.PaymentMethod;
import com.aurafit.enums.PaymentStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.PaymentRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PaymentServiceImpl implements PaymentService {

        private static final Logger log = LoggerFactory.getLogger(PaymentServiceImpl.class);

        private static final Pattern ORDER_ID_PATTERN = Pattern.compile("ARF(\\d+)");
        private static final String VIETQR_BANK = "BIDV";
        private static final String VIETQR_TEMPLATE = "compact";

        private final PaymentRepository paymentRepository;
        private final RentalOrderRepository rentalOrderRepository;
        private final UserRepository userRepository;
        private final CostumeItemRepository costumeItemRepository;

        @Value("${sepay.api-key}")
        private String sepayApiKey;

        @Value("${sepay.webhook-secret}")
        private String sepayWebhookSecret;

        @Value("${sepay.va-account}")
        private String sepayVaAccount;

        @Value("${sepay.vietqr-base-url:https://qr.sepay.vn/img}")
        private String sepayVietQrBaseUrl;

        public PaymentServiceImpl(PaymentRepository paymentRepository,
                        RentalOrderRepository rentalOrderRepository,
                        UserRepository userRepository,
                        CostumeItemRepository costumeItemRepository) {
                this.paymentRepository = paymentRepository;
                this.rentalOrderRepository = rentalOrderRepository;
                this.userRepository = userRepository;
                this.costumeItemRepository = costumeItemRepository;
        }

        @Override
        public PaymentInitResponse initializePayment(PaymentCreateRequest request, String currentUserEmail) {

                User user = userRepository.findByEmail(currentUserEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentUserEmail));

                RentalOrder order = rentalOrderRepository.findById(request.orderId().longValue())
                                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id",
                                                request.orderId()));

                if (!order.getUser().getId().equals(user.getId())) {
                        throw new ResourceNotFoundException("RentalOrder", "id", request.orderId());
                }

                if (order.getStatus() != OrderStatus.PENDING) {
                        throw new BadRequestException(
                                        "Đơn hàng không ở trạng thái hợp lệ để thanh toán. Trạng thái hiện tại: "
                                                        + order.getStatus());
                }

                BigDecimal amountPayable = order.getTotalRentalPrice()
                                .add(order.getTotalDeposit())
                                .subtract(order.getDiscountAmount())
                                .add(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO);

                Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(
                                Long.valueOf(request.orderId()), PaymentStatus.PENDING,
                                com.aurafit.enums.PaymentType.PAYMENT)
                                .orElseGet(() -> {
                                        Payment newPayment = Payment.builder()
                                                        .rentalOrder(order)
                                                        .amount(amountPayable)
                                                        .method(PaymentMethod.BANKING)
                                                        .type(com.aurafit.enums.PaymentType.PAYMENT)
                                                        .status(PaymentStatus.PENDING)
                                                        .build();
                                        return paymentRepository.save(newPayment);
                                });

                String paymentContent = "ARF" + request.orderId();
                String qrUrl = buildSepayVietQrUrl(paymentContent, amountPayable);

                if (payment.getId() != null) {
                        payment.setAmount(amountPayable);
                        payment = paymentRepository.save(payment);
                }

                return new PaymentInitResponse(
                                qrUrl,
                                paymentContent,
                                amountPayable,
                                request.orderId());
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public void processSePayWebhook(SePayWebhookRequest webhookBody, String authToken) {
                log.info("Received webhook: {}", webhookBody);
                log.info("Auth token provided: {}", authToken != null ? "yes" : "no");
                log.info("Expected secret: {}", sepayWebhookSecret);

                // Allow empty or missing token for testing (SePay sends Apikey header)
                if (sepayWebhookSecret != null && !sepayWebhookSecret.isBlank()) {
                    if (authToken == null || !authToken.equals(sepayWebhookSecret)) {
                        log.warn("REJECTED: Invalid token");
                        throw new BadRequestException("Invalid Webhook Token");
                    }
                } else {
                    log.warn("WARNING: sepayWebhookSecret not configured, allowing all requests");
                }

                log.info("Token validated successfully");

                // 1) Idempotency - skip if already processed
                String transactionCode = webhookBody.getCode();
                if (transactionCode.isBlank() || paymentRepository.findFirstByTransactionId(transactionCode).isPresent()) {
                        log.info("Already processed or invalid code, skipping: {}", transactionCode);
                        return;
                }

                // 2) Sanity check on the receiving account
                String accountNumber = webhookBody.accountNumber();
                log.info("VA Account: {}, Webhook accountNumber: {}", sepayVaAccount, accountNumber);
                if (accountNumber != null && !accountNumber.isBlank() && !accountNumber.equals(sepayVaAccount)) {
                        log.warn("REJECTED: Account mismatch");
                        throw new BadRequestException(
                                        "Transfer arrived on a different account. Expected " + sepayVaAccount
                                                        + ", got " + accountNumber);
                }

                // 3) Resolve order from content
                String content = webhookBody.getContent();
                Matcher matcher = ORDER_ID_PATTERN.matcher(content);
                if (!matcher.find()) {
                        log.warn("REJECTED: No valid order reference in content: {}", content);
                        throw new BadRequestException(
                                        "No valid order reference found in transfer content: " + content);
                }
                Long orderId = Long.valueOf(matcher.group(1));
                log.info("Found orderId: {}", orderId);

                log.info("Looking for payment with orderId: {}", orderId);
                Payment payment = paymentRepository.findByRentalOrderIdAndType(
                                orderId, com.aurafit.enums.PaymentType.PAYMENT)
                                .orElseThrow(() -> new BadRequestException(
                                                "No payment found for orderId: " + orderId));

                BigDecimal transferAmount = webhookBody.getTransferAmount();
                log.info("Payment found: {}, Amount in DB: {}, Transfer amount: {}",
                                payment.getId(), payment.getAmount(), transferAmount);

                if (transferAmount.compareTo(payment.getAmount()) < 0) {
                        log.warn("REJECTED: Amount mismatch");
                        throw new BadRequestException(
                                        "Transfer amount mismatch. Expected >= " + payment.getAmount()
                                                        + ", got " + transferAmount);
                }

                payment.setStatus(PaymentStatus.PAID);
                payment.setTransactionId(transactionCode);
                paymentRepository.save(payment);
                log.info("Payment updated to PAID");

                RentalOrder order = payment.getRentalOrder();
                order.setStatus(OrderStatus.CONFIRMED);
                rentalOrderRepository.save(order);
                log.info("Order status updated to CONFIRMED");

                // Promote inventory hold to active rental now that payment has cleared.
                for (RentalOrderDetail detail : order.getDetails()) {
                        CostumeItem item = detail.getCostumeItem();
                        if (item != null && item.getStatus() == ItemStatus.RESERVED) {
                                item.setStatus(ItemStatus.RENTED);
                                costumeItemRepository.save(item);
                        }
                }
                log.info("SUCCESS: Webhook processed completely");
        }

        @Override
        @Transactional(rollbackFor = Exception.class)
        public void processTestWebhook(SePayWebhookRequest webhookBody) {
                if (paymentRepository.findFirstByTransactionId(webhookBody.code()).isPresent()) {
                        return;
                }

                Matcher matcher = ORDER_ID_PATTERN.matcher(webhookBody.content());
                if (!matcher.find()) {
                        throw new BadRequestException(
                                        "No valid order reference found in transfer content: " + webhookBody.content());
                }
                Long orderId = Long.valueOf(matcher.group(1));

                Payment payment = paymentRepository.findByRentalOrderIdAndType(
                                orderId, com.aurafit.enums.PaymentType.PAYMENT)
                                .orElseThrow(() -> new BadRequestException(
                                                "No payment found for orderId: " + orderId));

                payment.setStatus(PaymentStatus.PAID);
                payment.setTransactionId(webhookBody.code());
                paymentRepository.save(payment);

                RentalOrder order = payment.getRentalOrder();
                order.setStatus(OrderStatus.CONFIRMED);
                rentalOrderRepository.save(order);

                // Mirror the real webhook: flip the held inventory to RENTED on test path too.
                for (RentalOrderDetail detail : order.getDetails()) {
                        CostumeItem item = detail.getCostumeItem();
                        if (item != null && item.getStatus() == ItemStatus.RESERVED) {
                                item.setStatus(ItemStatus.RENTED);
                                costumeItemRepository.save(item);
                        }
                }
        }

        private String buildSepayVietQrUrl(String paymentContent, BigDecimal amount) {
                StringBuilder url = new StringBuilder(sepayVietQrBaseUrl);
                url.append("?acc=").append(sepayVaAccount);
                url.append("&bank=").append(VIETQR_BANK);
                url.append("&amount=").append(amount.toPlainString());
                url.append("&des=").append(
                                java.net.URLEncoder.encode(paymentContent, java.nio.charset.StandardCharsets.UTF_8));
                url.append("&template=").append(VIETQR_TEMPLATE);
                return url.toString();
        }

        @Override
        public PaymentStatusResponse getPaymentStatus(Long orderId, String currentUserEmail) {
                User user = userRepository.findByEmail(currentUserEmail)
                                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentUserEmail));

                RentalOrder order = rentalOrderRepository.findById(orderId)
                                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", orderId));

                if (!order.getUser().getId().equals(user.getId())) {
                        throw new ResourceNotFoundException("RentalOrder", "id", orderId);
                }

                String paymentContent = "ARF" + orderId;

                return paymentRepository
                                .findByRentalOrderIdAndType(orderId, com.aurafit.enums.PaymentType.PAYMENT)
                                .map(p -> new PaymentStatusResponse(p.getStatus(), paymentContent, p.getAmount(),
                                                p.getTransactionId()))
                                .orElseGet(() -> new PaymentStatusResponse(null, paymentContent, null, null));
        }
}
