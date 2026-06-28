package com.aurafit.service.impl;

import com.aurafit.dto.request.CheckoutItemRequest;
import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.entity.*;
import com.aurafit.enums.CartStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.ReturnStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.*;
import com.aurafit.service.OrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final RentalOrderRepository rentalOrderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final HandoverRecordRepository handoverRecordRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final PaymentRepository paymentRepository;

    public OrderServiceImpl(RentalOrderRepository rentalOrderRepository,
                            CartRepository cartRepository,
                            CartItemRepository cartItemRepository,
                            CostumeItemRepository costumeItemRepository,
                            UserRepository userRepository,
                            HandoverRecordRepository handoverRecordRepository,
                            RentalOrderDetailRepository rentalOrderDetailRepository,
                            PaymentRepository paymentRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.handoverRecordRepository = handoverRecordRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.paymentRepository = paymentRepository;
    }

    /**
     * Creates a PENDING rental order from a list of items.
     *
     * Transaction boundaries:
     * - Entire flow is atomic: if any step fails, all DB changes are rolled back.
     * - Inventory is locked BEFORE the order is saved (fail-fast on stock conflict).
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse placeOrder(Long userId, CheckoutRequest request) {

        // ── Step 1: Validate item list is present and non-empty ─────────────────
        List<CheckoutItemRequest> items = request.items();
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("Danh sach mat hang thanh toan khong duoc de trong.");
        }

        // ── Step 2: Load authenticated user (fail-fast) ────────────────────────
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        // ── Step 3: Accumulation buckets ───────────────────────────────────────
        BigDecimal totalRentalPrice = BigDecimal.ZERO;
        BigDecimal totalDeposit = BigDecimal.ZERO;
        LocalDateTime orderStartDate = null;
        LocalDateTime orderEndDate = null;
        List<RentalOrderDetail> orderDetails = new ArrayList<>();

        // Collect all SKUs successfully processed so we can clean up the cart later
        Set<String> orderedSkus = items.stream()
                .map(CheckoutItemRequest::sku)
                .collect(Collectors.toSet());

        // ── Step 4: Process each item in the request list ─────────────────────
        for (CheckoutItemRequest item : items) {

            // ── 4a. Locate physical CostumeItem by SKU ──────────────────────────
            CostumeItem costumeItem = costumeItemRepository.findBySku(item.sku())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "CostumeItem", "sku", item.sku()
                    ));

            // ── 4b. Stock availability check ──────────────────────────────────
            if (costumeItem.getStatus() != ItemStatus.AVAILABLE) {
                throw new BadRequestException(
                        "San pham ma [SKU: " + item.sku() + "] hien khong kha dung. "
                        + "Trang thai hien tai: " + costumeItem.getStatus()
                );
            }

            // ── 4c. Validate rental date window ────────────────────────────────
            if (!item.rentalEndDate().isAfter(item.rentalStartDate())) {
                throw new BadRequestException(
                        "Ngay tra (rentalEndDate) cua san pham [SKU: " + item.sku()
                        + "] phai sau ngay nhan (rentalStartDate)."
                );
            }

            // ── 4d. Calculate rental duration in days ───────────────────────────
            long rentalDays = ChronoUnit.DAYS.between(
                    item.rentalStartDate(),
                    item.rentalEndDate()
            );
            if (rentalDays <= 0) {
                throw new BadRequestException(
                        "So ngay thue phai lon hon 0 cho san pham [SKU: " + item.sku() + "]."
                );
            }

            // ── 4e. Pull financial data from parent Costume ─────────────────────
            Costume costume = costumeItem.getCostume();
            BigDecimal pricePerDay = costume.getRentalPrice();
            BigDecimal depositPerItem = costume.getDepositPrice();

            // subtotalRental = pricePerDay * rentalDays * quantity
            BigDecimal subtotalRental = pricePerDay
                    .multiply(BigDecimal.valueOf(rentalDays))
                    .multiply(BigDecimal.valueOf(item.quantity()));

            // subtotalDeposit = depositPerItem * quantity
            BigDecimal subtotalDeposit = depositPerItem
                    .multiply(BigDecimal.valueOf(item.quantity()));

            // ── 4f. Accumulate into order totals ────────────────────────────────
            totalRentalPrice = totalRentalPrice.add(subtotalRental);
            totalDeposit = totalDeposit.add(subtotalDeposit);

            // Track the global rental window across all items
            LocalDateTime itemStart = item.rentalStartDate().atStartOfDay();
            LocalDateTime itemEnd = item.rentalEndDate().atTime(LocalTime.MAX);
            if (orderStartDate == null || itemStart.isBefore(orderStartDate)) {
                orderStartDate = itemStart;
            }
            if (orderEndDate == null || itemEnd.isAfter(orderEndDate)) {
                orderEndDate = itemEnd;
            }

            // ── 4g. Build and attach RentalOrderDetail ──────────────────────────
            RentalOrderDetail detail = RentalOrderDetail.builder()
                    .costumeItem(costumeItem)
                    .pricePerDay(pricePerDay)
                    .rentalDays((int) rentalDays)
                    .subtotal(subtotalRental)
                    .deposit(depositPerItem)
                    .price(pricePerDay)
                    .returnStatus(ReturnStatus.NOT_RETURNED)
                    .build();
            orderDetails.add(detail);

            // ── 4h. Lock inventory immediately ─────────────────────────────────
            // Prevents double-booking race conditions across concurrent requests.
            // Will be rolled back automatically if transaction fails downstream.
            costumeItem.setStatus(ItemStatus.RENTED);
            costumeItemRepository.save(costumeItem);
        }

        // ── Step 5: Create and persist RentalOrder ──────────────────────────────
        RentalOrder order = RentalOrder.builder()
                .user(user)
                .receiverName(request.receiverName())
                .receiverPhone(request.receiverPhone())
                .deliveryAddress(request.deliveryAddress())
                .totalRentalPrice(totalRentalPrice)
                .totalDeposit(totalDeposit)
                .discountAmount(BigDecimal.ZERO)
                .totalPrice(totalRentalPrice)
                .rentalStartDate(orderStartDate)
                .rentalEndDate(orderEndDate)
                .details(orderDetails)
                .status(com.aurafit.enums.OrderStatus.PENDING)
                .build();

        // Attach each detail to the order before persisting (cascade = ALL)
        for (RentalOrderDetail detail : orderDetails) {
            detail.setRentalOrder(order);
        }

        RentalOrder savedOrder = rentalOrderRepository.save(order);

        // ── Step 6: Smart cart cleanup ─────────────────────────────────────────
        // Only remove from cart the SKUs that were just ordered.
        cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .ifPresent(cart -> {
                    List<CartItem> cartItemsToDelete = cart.getItems().stream()
                            .filter(ci -> orderedSkus.contains(ci.getCostumeItem().getSku()))
                            .toList();
                    if (!cartItemsToDelete.isEmpty()) {
                        cartItemRepository.deleteAll(cartItemsToDelete);
                    }
                });

        // ── Step 7: Re-fetch with full graph for response DTO ───────────────────
        RentalOrder responseOrder = rentalOrderRepository
                .findByIdWithDetailsAndCostumes(savedOrder.getId())
                .orElse(savedOrder);

        return OrderResponse.fromEntity(responseOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSummaryResponse> getUserOrders(Long userId) {
        List<RentalOrder> orders = rentalOrderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream()
                .map(OrderSummaryResponse::fromEntity)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getUserOrderDetail(Long orderId, Long userId) {
        RentalOrder order = rentalOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long userId) {
        RentalOrder order = rentalOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.PENDING &&
            order.getStatus() != com.aurafit.enums.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Khong the huy don hang voi trang thai: " + order.getStatus());
        }

        // Return items to AVAILABLE
        for (RentalOrderDetail detail : order.getDetails()) {
            CostumeItem item = detail.getCostumeItem();
            item.setStatus(ItemStatus.AVAILABLE);
            costumeItemRepository.save(item);
        }

        // If CONFIRMED (which implies PAID via SePay), log REFUND payment
        if (order.getStatus() == com.aurafit.enums.OrderStatus.CONFIRMED) {
            BigDecimal totalPaid = order.getPayments().stream()
                    .filter(p -> p.getType() == com.aurafit.enums.PaymentType.PAYMENT && p.getStatus() == com.aurafit.enums.PaymentStatus.PAID)
                    .map(Payment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                Payment refundPayment = Payment.builder()
                        .rentalOrder(order)
                        .amount(totalPaid)
                        .method(com.aurafit.enums.PaymentMethod.BANKING)
                        .type(com.aurafit.enums.PaymentType.REFUND)
                        .status(com.aurafit.enums.PaymentStatus.PENDING)
                        .build();
                paymentRepository.save(refundPayment);
            }
        }

        order.setStatus(com.aurafit.enums.OrderStatus.CANCELLED);
        rentalOrderRepository.save(order);

        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<com.aurafit.dto.response.HandoverRecordDTO> processPickupHandover(Long orderId, Long staffId, com.aurafit.dto.request.PickupRequestDTO request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", staffId));
        if (staff.getRole() != com.aurafit.enums.Role.STAFF && staff.getRole() != com.aurafit.enums.Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Chi nhan vien hoac admin moi co quyen thuc hien thao tac nay.");
        }

        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Chi co the giao hang khi don hang da duoc xac nhan (CONFIRMED). Trang thai hien tai: " + order.getStatus());
        }

        order.setStatus(com.aurafit.enums.OrderStatus.PICKED_UP);
        rentalOrderRepository.save(order);

        List<HandoverRecord> records = new ArrayList<>();
        for (RentalOrderDetail detail : order.getDetails()) {
            detail.getCostumeItem().setStatus(ItemStatus.RENTED);
            costumeItemRepository.save(detail.getCostumeItem());

            HandoverRecord record = HandoverRecord.builder()
                    .rentalOrderDetail(detail)
                    .staffUser(staff)
                    .handoverType(com.aurafit.enums.HandoverType.PICKUP)
                    .returnStatus(detail.getReturnStatus())
                    .imageUrl(request.imageUrl())
                    .note(request.note())
                    .build();
            records.add(record);
        }
        return handoverRecordRepository.saveAll(records).stream()
                .map(com.aurafit.dto.response.HandoverRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<com.aurafit.dto.response.HandoverRecordDTO> processReturnHandover(Long orderId, Long staffId, com.aurafit.dto.request.ReturnRequestDTO request) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", staffId));
        if (staff.getRole() != com.aurafit.enums.Role.STAFF && staff.getRole() != com.aurafit.enums.Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Chi nhan vien hoac admin moi co quyen thuc hien thao tac nay.");
        }

        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.PICKED_UP) {
            throw new BadRequestException("Chi co the tra hang khi don hang da duoc giao (PICKED_UP). Trang thai hien tai: " + order.getStatus());
        }

        order.setStatus(com.aurafit.enums.OrderStatus.RETURNED);
        rentalOrderRepository.save(order);

        List<HandoverRecord> records = new ArrayList<>();

        for (com.aurafit.dto.request.ItemAssessmentDTO assessment : request.assessments()) {
            RentalOrderDetail detail = order.getDetails().stream()
                    .filter(d -> d.getId().equals(assessment.rentalOrderDetailId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Khong tim thay chi tiet don hang voi ID: " + assessment.rentalOrderDetailId()));

            detail.setReturnStatus(assessment.returnStatus());
            rentalOrderDetailRepository.save(detail);

            if (assessment.returnStatus() == ReturnStatus.RETURNED) {
                detail.getCostumeItem().setStatus(ItemStatus.AVAILABLE);
            } else if (assessment.returnStatus() == ReturnStatus.DAMAGED) {
                detail.getCostumeItem().setStatus(ItemStatus.MAINTENANCE);
            } else if (assessment.returnStatus() == ReturnStatus.LOST) {
                detail.getCostumeItem().setStatus(ItemStatus.LOST);
            }
            costumeItemRepository.save(detail.getCostumeItem());

            HandoverRecord record = HandoverRecord.builder()
                    .rentalOrderDetail(detail)
                    .staffUser(staff)
                    .handoverType(com.aurafit.enums.HandoverType.RETURN)
                    .returnStatus(assessment.returnStatus())
                    .imageUrl(request.imageUrl())
                    .note(assessment.note() != null && !assessment.note().isBlank() ? assessment.note() : request.note())
                    .build();
            records.add(record);
        }

        // Calculate and process refund post-return
        calculateAndProcessRefund(order);

        return handoverRecordRepository.saveAll(records).stream()
                .map(com.aurafit.dto.response.HandoverRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void calculateAndProcessRefund(RentalOrder order) {
        BigDecimal totalDeposit = order.getTotalDeposit();
        BigDecimal deductions = BigDecimal.ZERO;

        for (RentalOrderDetail detail : order.getDetails()) {
            if (detail.getReturnStatus() == ReturnStatus.DAMAGED || detail.getReturnStatus() == ReturnStatus.LOST) {
                // Deduct the deposit for this item as penalty
                deductions = deductions.add(detail.getDeposit());
            }
        }

        BigDecimal refundAmount = totalDeposit.subtract(deductions);
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            refundAmount = BigDecimal.ZERO;
        }

        if (refundAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment refundPayment = Payment.builder()
                    .rentalOrder(order)
                    .amount(refundAmount)
                    .method(com.aurafit.enums.PaymentMethod.BANKING)
                    .type(com.aurafit.enums.PaymentType.REFUND)
                    .status(com.aurafit.enums.PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(refundPayment);
        }

        order.setStatus(com.aurafit.enums.OrderStatus.COMPLETED);
        rentalOrderRepository.save(order);
    }
}
