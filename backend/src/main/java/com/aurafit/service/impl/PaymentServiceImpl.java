package com.aurafit.service.impl;

import com.aurafit.dto.request.PaymentCreateRequest;
import com.aurafit.dto.request.SePayWebhookRequest;
import com.aurafit.dto.response.PaymentInitResponse;
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
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PaymentServiceImpl implements PaymentService {

    private static final String BANK_CODE      = "BIDV";
    private static final String ACCOUNT_NO      = "8824354356";
    private static final String ACCOUNT_NAME    = "BUI LE HUY HOANG";
    private static final String VIETQR_BASE_URL = "https://img.vietqr.io/image/";

    private static final Pattern ORDER_ID_PATTERN = Pattern.compile("ARF(\\d+)");

    private final PaymentRepository paymentRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final UserRepository userRepository;

    @Value("${sepay.webhook-token}")
    private String sepayWebhookToken;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              RentalOrderRepository rentalOrderRepository,
                              UserRepository userRepository) {
        this.paymentRepository    = paymentRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.userRepository       = userRepository;
    }

    @Override
    public PaymentInitResponse initializePayment(PaymentCreateRequest request, String currentUserEmail) {

        // 1. Truy xuất user hiện tại từ email trong SecurityContext (chống IDOR)
        User user = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", currentUserEmail));

        // 2. Tìm đơn hàng và xác thực quyền sở hữu
        RentalOrder order = rentalOrderRepository.findById(request.orderId().longValue())
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", request.orderId()));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("RentalOrder", "id", request.orderId());
        }

        // 3. Chỉ đơn hàng PENDING mới được khởi tạo thanh toán
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new BadRequestException(
                    "Don hang nay khong o trang thai cho phep thanh toan. Trang thai hien tai: "
                    + order.getStatus()
            );
        }

        // 4. Tinh so tien: tong tien thue + tien dat coc - giam gia
        BigDecimal amountPayable = order.getTotalRentalPrice()
                .add(order.getTotalDeposit())
                .subtract(order.getDiscountAmount());

        // 5. Tai hoac tao ban ghi Payment PENDING
        Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(Long.valueOf(request.orderId()), PaymentStatus.PENDING, com.aurafit.enums.PaymentType.PAYMENT)
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

        // 6. Sinh noi dung chuyen khoan va link VietQR
        String paymentContent = "ARF" + request.orderId();

        String qrUrl = buildVietQrUrl(paymentContent, amountPayable);

        // 7. Neu payment da ton tai, cap nhat lai so tien (de chong thay doi gia)
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

        // 1. Xac thuc token tu SePay
        if (authToken == null || !authToken.equals(sepayWebhookToken)) {
            throw new BadRequestException("Invalid Webhook Token");
        }

        // 2. Trích xuất orderId từ nội dung chuyển khoản bằng regex ARF(\\d+)
        Matcher matcher = ORDER_ID_PATTERN.matcher(webhookBody.content());
        if (!matcher.find()) {
            throw new BadRequestException(
                    "No valid order reference found in transfer content: " + webhookBody.content()
            );
        }
        Long orderId = Long.valueOf(matcher.group(1));

        // 3. Tim ban ghi Payment PENDING
        Payment payment = paymentRepository.findByRentalOrderIdAndStatusAndType(orderId, PaymentStatus.PENDING, com.aurafit.enums.PaymentType.PAYMENT)
                .orElseThrow(() -> new BadRequestException(
                        "No pending payment found for orderId: " + orderId
                ));

        // 4. Kiem tra so tien: SePay gui transferAmount phai >= so tien can thanh toan
        if (webhookBody.transferAmount().compareTo(payment.getAmount()) < 0) {
            throw new BadRequestException(
                    "Transfer amount mismatch. Expected >= " + payment.getAmount()
                    + ", got " + webhookBody.transferAmount()
            );
        }

        // 5. Cap nhat trang thai Payment -> PAID, luu ma giao dich tu SePay
        payment.setStatus(PaymentStatus.PAID);
        payment.setTransactionId(webhookBody.code());
        paymentRepository.save(payment);

        // 6. Cap nhat trang thai RentalOrder -> CONFIRMED
        RentalOrder order = payment.getRentalOrder();
        order.setStatus(OrderStatus.CONFIRMED);
        rentalOrderRepository.save(order);
    }

    private String buildVietQrUrl(String paymentContent, BigDecimal amount) {
        String encodedAddInfo = URLEncoder.encode(paymentContent, StandardCharsets.UTF_8);
        String encodedAccountName = URLEncoder.encode(ACCOUNT_NAME, StandardCharsets.UTF_8);
        return VIETQR_BASE_URL
                + BANK_CODE + "-" + ACCOUNT_NO + "-compact2.jpg"
                + "?amount=" + amount
                + "&addInfo=" + encodedAddInfo
                + "&accountName=" + encodedAccountName;
    }
}
