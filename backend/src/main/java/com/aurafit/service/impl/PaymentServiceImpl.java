package com.aurafit.service.impl;

import com.aurafit.dto.request.PaymentCreateRequest;
import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.dto.response.PaymentInitResponse;
import com.aurafit.dto.response.PaymentStatusResponse;
import com.aurafit.entity.Payment;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.User;
import com.aurafit.enums.OrderStatus;
import com.aurafit.enums.PaymentMethod;
import com.aurafit.enums.PaymentStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.PaymentRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.PaymentService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final Pattern ORDER_ID_PATTERN = Pattern.compile("ARF(\\d+)");
    private static final String BANK_CODE         = "970422";
    private static final String VIETQR_TEMPLATE    = "compact2";

    private final PaymentRepository paymentRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;

    @Value("${sepay.api-key}")
    private String sepayApiKey;

    @Value("${sepay.webhook-secret}")
    private String sepayWebhookSecret;

    @Value("${sepay.va-account}")
    private String sepayVaAccount;

    @Value("${sepay.vietqr-base-url}")
    private String sepayVietQrBaseUrl;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              RentalOrderRepository rentalOrderRepository,
                              UserRepository userRepository) {
        this.paymentRepository     = paymentRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.userRepository        = userRepository;
    }

    @Override
    public PaymentInitResponse initializePayment(PaymentCreateRequest request, String currentUserEmail) {

        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentUserEmail));

        RentalOrder order = rentalOrderRepository.findById(request.orderId().longValue())
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", request.orderId()));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("RentalOrder", "id", request.orderId());
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException(
                    "Don hang nay khong o trang thai cho phep thanh toan. Trang thai hien tai: "
                    + order.getStatus()
            );
        }

        BigDecimal amountPayable = order.getTotalRentalPrice()
                .add(order.getTotalDeposit())
                .subtract(order.getDiscountAmount());

        Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(
                        Long.valueOf(request.orderId()), PaymentStatus.PENDING, com.aurafit.enums.PaymentType.PAYMENT)
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
                request.orderId()
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processSePayWebhook(SePayWebhookRequest webhookBody, String authToken) {

        if (authToken == null || !authToken.equals(sepayWebhookSecret)) {
            throw new BadRequestException("Invalid Webhook Token");
        }

        Matcher matcher = ORDER_ID_PATTERN.matcher(webhookBody.content());
        if (!matcher.find()) {
            throw new BadRequestException(
                    "No valid order reference found in transfer content: " + webhookBody.content()
            );
        }
        Long orderId = Long.valueOf(matcher.group(1));

        Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(
                        orderId, PaymentStatus.PENDING, com.aurafit.enums.PaymentType.PAYMENT)
                .orElseThrow(() -> new BadRequestException(
                        "No pending payment found for orderId: " + orderId
                ));

        if (webhookBody.transferAmount().compareTo(payment.getAmount()) < 0) {
            throw new BadRequestException(
                    "Transfer amount mismatch. Expected >= " + payment.getAmount()
                    + ", got " + webhookBody.transferAmount()
            );
        }

        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(webhookBody.code());
        paymentRepository.save(payment);

        RentalOrder order = payment.getRentalOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        rentalOrderRepository.save(order);
    }

    private String buildSepayVietQrUrl(String paymentContent, BigDecimal amount) {
        StringBuilder url = new StringBuilder(sepayVietQrBaseUrl);
        url.append("?bankCode=").append(BANK_CODE);
        url.append("&accountNo=").append(sepayVaAccount);
        url.append("&template=").append(VIETQR_TEMPLATE);
        url.append("&amount=").append(amount.toPlainString());
        url.append("&description=").append(java.net.URLEncoder.encode(paymentContent, java.nio.charset.StandardCharsets.UTF_8));
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
                .findByRentalOrderIdAndStatusAndType(orderId, PaymentStatus.PENDING, com.aurafit.enums.PaymentType.PAYMENT)
                .map(p -> new PaymentStatusResponse(p.getStatus(), paymentContent, p.getAmount(), p.getTransactionId()))
                .orElseGet(() -> new PaymentStatusResponse(null, paymentContent, null, null));
    }
}
