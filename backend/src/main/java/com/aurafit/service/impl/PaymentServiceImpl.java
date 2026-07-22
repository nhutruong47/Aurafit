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
import java.util.List;
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

                BigDecimal amountPayable = BigDecimal.ZERO;
                List<RentalOrder> sessionOrders = order.getSessionId() != null ? rentalOrderRepository.findBySessionId(order.getSessionId()) : null;
                if (sessionOrders != null && !sessionOrders.isEmpty()) {
                        for (RentalOrder o : sessionOrders) {
                                amountPayable = amountPayable
                                                .add(o.getTotalRentalPrice())
                                                .add(o.getTotalDeposit())
                                                .subtract(o.getDiscountAmount())
                                                .add(o.getShippingFee() != null ? o.getShippingFee() : BigDecimal.ZERO);
                        }
                } else {
                        amountPayable = order.getTotalRentalPrice()
                                        .add(order.getTotalDeposit())
                                        .subtract(order.getDiscountAmount())
                                        .add(order.getShippingFee() != null ? order.getShippingFee() : BigDecimal.ZERO);
                }

                final BigDecimal finalAmountPayable = amountPayable;
                Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(
                                Long.valueOf(request.orderId()), PaymentStatus.PENDING,
                                com.aurafit.enums.PaymentType.PAYMENT)
                                .orElseGet(() -> {
                                        Payment newPayment = Payment.builder()
                                                        .rentalOrder(order)
                                                        .amount(finalAmountPayable)
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
                    if (authToken == null) {
                        log.warn("REJECTED: Missing Authorization header. Expected value: '{}'", sepayWebhookSecret);
                        throw new BadRequestException("Invalid Webhook Token");
                    }
                    if (!authToken.equals(sepayWebhookSecret)) {
                        log.warn("REJECTED: Token mismatch. Received='{}' Expected='{}'", authToken, sepayWebhookSecret);
                        throw new BadRequestException("Invalid Webhook Token");
                    }
                } else {
                    log.warn("WARNING: sepayWebhookSecret not configured, allowing all requests");
                }

                log.info("Token validated successfully");

                // 1) Idempotency - use sePayId (id field) as dedup key
                Long sePayId = webhookBody.sePayId();
                if (sePayId == null) {
                        log.warn("REJECTED: No sePayId provided");
                        throw new BadRequestException("Invalid webhook: missing id");
                }
                if (paymentRepository.findFirstByTransactionId(String.valueOf(sePayId)).isPresent()) {
                        log.info("Already processed sePayId: {}, skipping", sePayId);
                        return;
                }

                // 2) Sanity check on the receiving account
                // SePay sends: accountNumber = real bank account, subAccount = virtual sub-account
                String accountNumber = webhookBody.accountNumber();
                String subAccount = webhookBody.subAccount();
                log.info("VA Account configured: {}, Webhook accountNumber: {}, subAccount: {}",
                                sepayVaAccount, accountNumber, subAccount);
                boolean accountMatches = (sepayVaAccount == null || sepayVaAccount.isBlank())
                        || (accountNumber != null && accountNumber.equals(sepayVaAccount))
                        || (subAccount != null && subAccount.equals(sepayVaAccount));
                if (!accountMatches) {
                        log.warn("REJECTED: Account mismatch. Expected={}, got accountNumber={} subAccount={}",
                                        sepayVaAccount, accountNumber, subAccount);
                        throw new BadRequestException(
                                        "Transfer arrived on a different account. Expected " + sepayVaAccount
                                                        + ", got accountNumber=" + accountNumber
                                                        + " subAccount=" + subAccount);
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
                payment.setTransactionId(String.valueOf(sePayId));
                paymentRepository.save(payment);
                log.info("Payment updated to PAID");

                RentalOrder mainOrder = payment.getRentalOrder();
                List<RentalOrder> ordersToConfirm = new java.util.ArrayList<>();
                List<RentalOrder> sessionOrders = mainOrder.getSessionId() != null ? rentalOrderRepository.findBySessionId(mainOrder.getSessionId()) : null;
                if (sessionOrders != null && !sessionOrders.isEmpty()) {
                        ordersToConfirm.addAll(sessionOrders);
                } else {
                        ordersToConfirm.add(mainOrder);
                }

                for (RentalOrder o : ordersToConfirm) {
                        o.setStatus(OrderStatus.CONFIRMED);
                        rentalOrderRepository.save(o);
                        for (RentalOrderDetail detail : o.getDetails()) {
                                CostumeItem item = detail.getCostumeItem();
                                if (item != null && item.getStatus() == ItemStatus.RESERVED) {
                                        item.setStatus(ItemStatus.RENTED);
                                        costumeItemRepository.save(item);
                                }
                        }
                }
                log.info("Order status updated to CONFIRMED");
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

                RentalOrder mainOrder = payment.getRentalOrder();
                List<RentalOrder> ordersToConfirm = new java.util.ArrayList<>();
                List<RentalOrder> sessionOrders = mainOrder.getSessionId() != null ? rentalOrderRepository.findBySessionId(mainOrder.getSessionId()) : null;
                if (sessionOrders != null && !sessionOrders.isEmpty()) {
                        ordersToConfirm.addAll(sessionOrders);
                } else {
                        ordersToConfirm.add(mainOrder);
                }

                for (RentalOrder o : ordersToConfirm) {
                        o.setStatus(OrderStatus.CONFIRMED);
                        rentalOrderRepository.save(o);
                        for (RentalOrderDetail detail : o.getDetails()) {
                                CostumeItem item = detail.getCostumeItem();
                                if (item != null && item.getStatus() == ItemStatus.RESERVED) {
                                        item.setStatus(ItemStatus.RENTED);
                                        costumeItemRepository.save(item);
                                }
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
