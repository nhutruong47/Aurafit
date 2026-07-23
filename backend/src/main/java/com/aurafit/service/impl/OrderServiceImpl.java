package com.aurafit.service.impl;

import com.aurafit.dto.request.CheckoutItemRequest;
import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.CheckoutSessionResponse;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.entity.*;
import com.aurafit.enums.CartStatus;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.ReturnStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.*;
import com.aurafit.service.InteractionEventRecorderService;
import com.aurafit.service.OrderService;
import com.aurafit.service.PricingEngineService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {
    private final RentalOrderRepository rentalOrderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final InteractionEventRecorderService interactionEventRecorderService;
    private final HandoverRecordRepository handoverRecordRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final PaymentRepository paymentRepository;
    private final PricingEngineService pricingEngineService;
    private final com.aurafit.service.GhnIntegrationService ghnIntegrationService;
    private final PromotionRepository promotionRepository;

    public OrderServiceImpl(RentalOrderRepository rentalOrderRepository,
                            CartRepository cartRepository,
                            CartItemRepository cartItemRepository,
                            CostumeItemRepository costumeItemRepository,
                            UserRepository userRepository,
                            InteractionEventRecorderService interactionEventRecorderService,
                            HandoverRecordRepository handoverRecordRepository,
                            RentalOrderDetailRepository rentalOrderDetailRepository,
                            PaymentRepository paymentRepository,
                            PricingEngineService pricingEngineService,
                            com.aurafit.service.GhnIntegrationService ghnIntegrationService,
                            PromotionRepository promotionRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.interactionEventRecorderService = interactionEventRecorderService;
        this.handoverRecordRepository = handoverRecordRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.paymentRepository = paymentRepository;
        this.pricingEngineService = pricingEngineService;
        this.ghnIntegrationService = ghnIntegrationService;
        this.promotionRepository = promotionRepository;
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
    public CheckoutSessionResponse placeOrder(Long userId, CheckoutRequest request) {

        List<CheckoutItemRequest> items = request.items();
        if (items == null || items.isEmpty()) {
            throw new BadRequestException("Danh sách sản phẩm thanh toán không được để trống.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        if (user.getStatus() == com.aurafit.enums.UserStatus.BLOCKED) {
            throw new BadRequestException("Tài khoản của bạn đã bị vô hiệu hóa do tỷ lệ hủy đơn bất thường. Vui lòng liên hệ bộ phận CSKH.");
        }

        Map<String, List<CheckoutItemRequest>> groupedItems = items.stream()
                .collect(Collectors.groupingBy(item -> item.rentalStartDate().toString() + "_" + item.rentalEndDate().toString()));

        BigDecimal sessionTotalAmount = BigDecimal.ZERO;
        List<OrderResponse> splitOrderResponses = new ArrayList<>();
        Set<String> orderedSkus = new java.util.HashSet<>();
        
        BigDecimal splitShippingFee = BigDecimal.ZERO;
        if (request.shippingFee() != null && !groupedItems.isEmpty()) {
            splitShippingFee = request.shippingFee().divide(new BigDecimal(groupedItems.size()), 0, java.math.RoundingMode.HALF_UP);
        }
        String checkoutSessionId = java.util.UUID.randomUUID().toString();

        for (Map.Entry<String, List<CheckoutItemRequest>> entry : groupedItems.entrySet()) {
            List<CheckoutItemRequest> groupItems = entry.getValue();
            
            BigDecimal totalRentalPrice = BigDecimal.ZERO;
            BigDecimal totalDeposit = BigDecimal.ZERO;
            List<RentalOrderDetail> orderDetails = new ArrayList<>();

            for (CheckoutItemRequest item : groupItems) {
                orderedSkus.add(item.sku());

                CostumeItem representativeItem = costumeItemRepository.findBySku(item.sku())
                        .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "sku", item.sku()));

                Costume costume = representativeItem.getCostume();
                String size = representativeItem.getSize();
                String color = representativeItem.getColor();

                java.time.LocalDate bufferedReqStart = item.rentalStartDate().minusDays(2);
                java.time.LocalDate bufferedReqEnd = item.rentalEndDate().plusDays(2);

                List<CostumeItem> availableItems = costumeItemRepository.findAvailableItemsWithBufferForUpdate(
                        costume.getId(), size, color, bufferedReqStart, bufferedReqEnd, org.springframework.data.domain.PageRequest.of(0, item.quantity())
                );

                if (availableItems.size() < item.quantity()) {
                    throw new BadRequestException("Chỉ còn " + availableItems.size() + " sản phẩm khả dụng cho mẫu này (Size: " + size + (color != null ? ", Màu: " + color : "") + ") trong khoảng thời gian đã chọn.");
                }

                if (!item.rentalEndDate().isAfter(item.rentalStartDate())) {
                    throw new BadRequestException("Ngày trả của sản phẩm [SKU: " + item.sku() + "] phai sau ngay nhan.");
                }

                long rentalDays = ChronoUnit.DAYS.between(item.rentalStartDate(), item.rentalEndDate());
                if (rentalDays <= 0) {
                    throw new BadRequestException("Số ngày thuê phải lớn hơn 0.");
                }

                BigDecimal pricePerDay = costume.getRentalPrice();
                BigDecimal retailValue = costume.getDepositPrice();

                BigDecimal subtotalRental = pricingEngineService.calculateItemRentalFee(pricePerDay, (int) rentalDays, item.quantity());
                BigDecimal subtotalDeposit = pricingEngineService.calculateItemDeposit(retailValue, subtotalRental, item.quantity());

                totalRentalPrice = totalRentalPrice.add(subtotalRental);
                totalDeposit = totalDeposit.add(subtotalDeposit);

                BigDecimal singleItemRentalFee = pricingEngineService.calculateItemRentalFee(pricePerDay, (int) rentalDays, 1);
                BigDecimal singleItemDeposit = pricingEngineService.calculateItemDeposit(retailValue, singleItemRentalFee, 1);
                
                for (CostumeItem allocatedItem : availableItems) {
                    RentalOrderDetail detail = RentalOrderDetail.builder()
                            .costumeItem(allocatedItem)
                            .pricePerDay(pricePerDay)
                            .rentalDays((int) rentalDays)
                            .rentalStartDate(item.rentalStartDate())
                            .rentalEndDate(item.rentalEndDate())
                            .subtotal(singleItemRentalFee)
                            .deposit(singleItemDeposit)
                            .price(pricingEngineService.calculateTotal(singleItemRentalFee, singleItemDeposit))
                            .returnStatus(ReturnStatus.NOT_RETURNED)
                            .build();
                    orderDetails.add(detail);
                }
            }

            BigDecimal finalTotalPrice = totalRentalPrice.add(totalDeposit).add(splitShippingFee);
            sessionTotalAmount = sessionTotalAmount.add(finalTotalPrice);

            java.time.LocalDate groupStartDate = groupItems.isEmpty() ? null : groupItems.get(0).rentalStartDate();
            java.time.LocalDate groupEndDate = groupItems.isEmpty() ? null : groupItems.get(0).rentalEndDate();

            RentalOrder order = RentalOrder.builder()
                    .user(user)
                    .sessionId(checkoutSessionId)
                    .receiverName(request.receiverName())
                    .receiverPhone(request.receiverPhone())
                    .deliveryAddress(request.deliveryAddress())
                    .districtId(request.districtId())
                    .wardCode(request.wardCode())
                    .deliveryMethod(request.deliveryMethod())
                    .shippingFee(splitShippingFee)
                    .totalRentalPrice(totalRentalPrice)
                    .totalDeposit(totalDeposit)
                    .discountAmount(BigDecimal.ZERO)
                    .totalPrice(finalTotalPrice)
                    .rentalStartDate(groupStartDate)
                    .rentalEndDate(groupEndDate)
                    .details(orderDetails)
                    .status(com.aurafit.enums.OrderStatus.PENDING)
                    .build();

            if (order.getRentalStartDate() == null || order.getRentalEndDate() == null) {
                throw new IllegalStateException("Rental dates cannot be null before saving");
            }

            for (RentalOrderDetail detail : orderDetails) {
                detail.setRentalOrder(order);
            }

            RentalOrder savedOrder = rentalOrderRepository.save(order);
            
            RentalOrder responseOrder = rentalOrderRepository.findByIdWithDetailsAndCostumes(savedOrder.getId()).orElse(savedOrder);
            recordRentEvent(user, responseOrder, orderDetails);
            
            splitOrderResponses.add(OrderResponse.fromEntity(responseOrder));
        }

        cartRepository.findByUserIdAndStatus(userId, CartStatus.ACTIVE)
                .ifPresent(cart -> {
                    List<CartItem> cartItemsToDelete = cart.getItems().stream()
                            .filter(ci -> orderedSkus.contains(ci.getCostumeItem().getSku()))
                            .toList();
                    if (!cartItemsToDelete.isEmpty()) {
                        cartItemRepository.deleteAll(cartItemsToDelete);
                    }
                });

        return CheckoutSessionResponse.builder()
                .sessionTotalAmount(sessionTotalAmount)
                .orders(splitOrderResponses)
                .build();
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse extendRentalOrder(Long orderId, LocalDate newEndDate) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", orderId));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.RENTED && order.getStatus() != com.aurafit.enums.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể gia hạn khi đơn hàng đang ở trạng thái CONFIRMED hoặc RENTED.");
        }

        BigDecimal additionalFee = BigDecimal.ZERO;

        for (RentalOrderDetail detail : order.getDetails()) {
            if (!newEndDate.isAfter(detail.getRentalEndDate())) {
                continue;
            }
            
            java.time.LocalDate bufferedReqStart = detail.getRentalEndDate();
            java.time.LocalDate bufferedReqEnd = newEndDate.plusDays(2);
            
            boolean isBooked = rentalOrderDetailRepository.existsOverlappingBookingForCostumeItem(
                    detail.getCostumeItem().getId(),
                    order.getId(),
                    bufferedReqStart,
                    bufferedReqEnd
            );
            
            if (isBooked) {
                throw new BadRequestException("Sản phẩm [SKU: " + detail.getCostumeItem().getSku() + "] đã được khách hàng khác đặt trước trong khoảng thời gian gia hạn.");
            }
            
            long extraDays = ChronoUnit.DAYS.between(detail.getRentalEndDate(), newEndDate);
            BigDecimal extraFee = detail.getPricePerDay().multiply(BigDecimal.valueOf(extraDays));
            
            detail.setRentalEndDate(newEndDate);
            detail.setRentalDays(detail.getRentalDays() + (int) extraDays);
            detail.setSubtotal(detail.getSubtotal().add(extraFee));
            detail.setPrice(detail.getPrice().add(extraFee));
            
            additionalFee = additionalFee.add(extraFee);
        }
        
        if (additionalFee.compareTo(BigDecimal.ZERO) > 0) {
            order.setExtensionFee(order.getExtensionFee().add(additionalFee));
            order.setTotalRentalPrice(order.getTotalRentalPrice().add(additionalFee));
            order.setTotalPrice(order.getTotalPrice().add(additionalFee));
            
            order.setTotalDeposit(order.getTotalDeposit().subtract(additionalFee));
        }

        order.setRentalEndDate(newEndDate);
        RentalOrder savedOrder = rentalOrderRepository.save(order);
        return OrderResponse.fromEntity(savedOrder);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse compensateOrder(Long orderId, String reason) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", orderId));

        if (order.getStatus() == com.aurafit.enums.OrderStatus.CANCELLED || order.getStatus() == com.aurafit.enums.OrderStatus.COMPLETED) {
            throw new BadRequestException("Không thể bồi thường cho đơn hàng đã Hủy hoặc Hoàn thành.");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.CANCELLED);
        order.setTotalRefundedAmount(order.getTotalPrice());
        
        String compensationNote = "Order cancelled due to incident: " + reason + ". Compensated full refund.";
        
        String promoCode = "COMP50-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        Promotion promotion = Promotion.builder()
                .code(promoCode)
                .discountPercent(50)
                .maxDiscount(BigDecimal.valueOf(500000))
                .expiryDate(LocalDateTime.now().plusDays(30))
                .user(order.getUser())
                .build();
        
        promotionRepository.save(promotion);
        
        compensationNote += " Issued 50% discount code: " + promoCode;
        
        if (order.getInspectionNote() != null) {
            order.setInspectionNote(order.getInspectionNote() + "\n" + compensationNote);
        } else {
            order.setInspectionNote(compensationNote);
        }

        RentalOrder savedOrder = rentalOrderRepository.save(order);
        return OrderResponse.fromEntity(savedOrder);
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
    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<StaffOrderDetailResponse> getAllOrdersForAdmin(
            org.springframework.data.domain.Pageable pageable,
            com.aurafit.enums.OrderStatus status,
            String keyword
    ) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        if (status != null) {
            return rentalOrderRepository.searchByStatusForAdmin(status, normalizedKeyword, pageable)
                    .map(order -> StaffOrderDetailResponse.fromEntity(order, handoverRecordRepository.findByOrderId(order.getId())));
        }
        return rentalOrderRepository.searchForAdmin(normalizedKeyword, pageable)
                .map(order -> StaffOrderDetailResponse.fromEntity(order, handoverRecordRepository.findByOrderId(order.getId())));
    }

    @Override
    @Transactional
    public void shipOrder(Long orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        
        if (order.getStatus() != com.aurafit.enums.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order must be CONFIRMED to ship");
        }

        if (order.getDistrictId() == null || order.getWardCode() == null) {
            throw new BadRequestException("Order does not have a valid district ID or ward code for shipping.");
        }
        int toDistrictId = order.getDistrictId();
        String toWardCode = order.getWardCode();
        int totalWeight = 1000 * order.getDetails().size();

        String ghnCode = ghnIntegrationService.createForwardOrder(
                order, 
                toDistrictId, 
                toWardCode, 
                totalWeight
        );

        if (ghnCode == null || ghnCode.isEmpty()) {
            throw new BadRequestException("Failed to create GHN forward order");
        }

        order.setGhnOrderCode(ghnCode);
        order.setStatus(com.aurafit.enums.OrderStatus.SHIPPING);
        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void markOrderRented(Long orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.SHIPPING) {
            throw new BadRequestException("Order must be SHIPPING to mark as rented");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.RENTED);
        order.getDetails().forEach(detail -> detail.setReturnStatus(com.aurafit.enums.ReturnStatus.NOT_RETURNED));
        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void markOrderReturned(Long orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.RETURNING) {
            throw new BadRequestException("Order must be RETURNING to mark as returned");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.RETURNED);
        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void returnOrder(Long orderId) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.RENTED) {
            throw new BadRequestException("Order must be RENTED to return");
        }

        if (order.getDistrictId() == null || order.getWardCode() == null) {
            throw new BadRequestException("Order does not have a valid district ID or ward code for return shipping.");
        }
        int fromDistrictId = order.getDistrictId(); 
        String fromWardCode = order.getWardCode();
        int totalWeight = 1000 * order.getDetails().size();

        String ghnCode = ghnIntegrationService.createReturnOrder(
                order, 
                fromDistrictId, 
                fromWardCode, 
                totalWeight
        );

        if (ghnCode == null || ghnCode.isEmpty()) {
            throw new BadRequestException("Failed to create GHN return order");
        }

        order.setGhnReturnOrderCode(ghnCode);
        order.setStatus(com.aurafit.enums.OrderStatus.RETURNING);
        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void completeOrder(Long orderId, com.aurafit.dto.request.InspectionRequest request) {
        RentalOrder order = rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.RETURNED && 
            order.getStatus() != com.aurafit.enums.OrderStatus.RETURNING && 
            order.getStatus() != com.aurafit.enums.OrderStatus.RENTED &&
            order.getStatus() != com.aurafit.enums.OrderStatus.PENDING_REFUND &&
            order.getStatus() != com.aurafit.enums.OrderStatus.CANCELLED) {
            throw new BadRequestException("Order must be RETURNED, RETURNING, RENTED, PENDING_REFUND or CANCELLED to complete");
        }

        if (order.getStatus() != com.aurafit.enums.OrderStatus.CANCELLED) {
            order.setStatus(com.aurafit.enums.OrderStatus.COMPLETED);
        }

        java.time.LocalDate actualReturnDate = request.getActualReturnDate() != null ? request.getActualReturnDate() : java.time.LocalDate.now();
        
        java.time.LocalDate maxRentalEndDate = order.getDetails().stream()
                .map(RentalOrderDetail::getRentalEndDate)
                .max(java.time.LocalDate::compareTo)
                .orElse(null);
                
        java.time.LocalDate minRentalStartDate = order.getDetails().stream()
                .map(RentalOrderDetail::getRentalStartDate)
                .min(java.time.LocalDate::compareTo)
                .orElse(null);

        long lateDays = 0;
        if (maxRentalEndDate != null) {
            lateDays = java.time.temporal.ChronoUnit.DAYS.between(maxRentalEndDate, actualReturnDate);
        }
        
        BigDecimal lateFee = BigDecimal.ZERO;
        String inspectionNote = request.getInspectionNote() != null ? request.getInspectionNote() : "";

        if (lateDays > 0) {
            if (request.getLateFee() != null) {
                lateFee = request.getLateFee(); // Manual override
            } else {
                long rentalDays = 1;
                if (minRentalStartDate != null && maxRentalEndDate != null) {
                    rentalDays = java.time.temporal.ChronoUnit.DAYS.between(minRentalStartDate, maxRentalEndDate);
                }
                if (rentalDays <= 0) rentalDays = 1;
                
                BigDecimal dailyRentalRate = order.getTotalRentalPrice().divide(BigDecimal.valueOf(rentalDays), 0, java.math.RoundingMode.HALF_UP);
                lateFee = dailyRentalRate.multiply(new BigDecimal("1.5")).multiply(new BigDecimal(lateDays));
                
                if (lateFee.compareTo(order.getTotalDeposit()) > 0) {
                    lateFee = order.getTotalDeposit();
                }
            }
            inspectionNote += (inspectionNote.isEmpty() ? "" : " | ") + String.format("Trả trễ %d ngày, áp dụng hệ số 1.5x giá thuê ngày (phí %s VND)", lateDays, lateFee.toPlainString());
        } else {
            if (request.getLateFee() != null) {
                lateFee = request.getLateFee();
            }
        }

        BigDecimal damageFee = request.getDamageFee() != null ? request.getDamageFee() : BigDecimal.ZERO;
        
        BigDecimal refundAmount;
        if (order.getStatus() == com.aurafit.enums.OrderStatus.CANCELLED) {
            refundAmount = order.getTotalDeposit().add(order.getTotalRentalPrice());
        } else {
            refundAmount = order.getTotalDeposit().subtract(damageFee).subtract(lateFee);
        }
        
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            refundAmount = BigDecimal.ZERO;
        }

        order.setTotalDamageFee(damageFee);
        order.setTotalLateFee(lateFee);
        order.setInspectionNote(inspectionNote);
        order.setTotalRefundedAmount(refundAmount);
        
        // Update payments to PAID if there is a REFUND pending payment
        order.getPayments().stream()
             .filter(p -> p.getType() == com.aurafit.enums.PaymentType.REFUND && p.getStatus() == com.aurafit.enums.PaymentStatus.PENDING)
             .forEach(p -> p.setStatus(com.aurafit.enums.PaymentStatus.PAID));
        
        // Update items to AVAILABLE or MAINTENANCE
        for (RentalOrderDetail detail : order.getDetails()) {
            detail.setReturnStatus(com.aurafit.enums.ReturnStatus.RETURNED);
            CostumeItem item = detail.getCostumeItem();
            if (damageFee.compareTo(BigDecimal.ZERO) > 0) {
                item.setStatus(ItemStatus.MAINTENANCE);
            } else {
                item.setStatus(ItemStatus.AVAILABLE);
            }
            costumeItemRepository.save(item);
        }

        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void handleDeliveryFailed(Long orderId, String reason) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.SHIPPING) {
            throw new BadRequestException("Order must be SHIPPING to mark as delivery failed.");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.CANCELLED);
        
        order.getDetails().forEach(detail -> {
            CostumeItem costumeItem = detail.getCostumeItem();
            costumeItem.setStatus(com.aurafit.enums.ItemStatus.AVAILABLE);
            costumeItemRepository.save(costumeItem);
        });

        BigDecimal refundAmount = order.getTotalDeposit()
                .add(order.getTotalRentalPrice())
                .subtract(order.getShippingFee());
        
        if (refundAmount.compareTo(BigDecimal.ZERO) < 0) {
            refundAmount = BigDecimal.ZERO;
        }
        order.setTotalRefundedAmount(refundAmount);

        String note = "Giao hàng thất bại (Boom hàng). Lý do: " + reason;
        order.setInspectionNote(order.getInspectionNote() != null && !order.getInspectionNote().isEmpty()
                ? order.getInspectionNote() + "\n" + note 
                : note);

        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void handleLostPackage(Long orderId, String reason) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.SHIPPING && 
            order.getStatus() != com.aurafit.enums.OrderStatus.RETURNING) {
            throw new BadRequestException("Order must be SHIPPING or RETURNING to mark as lost package.");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.CANCELLED);
        
        order.getDetails().forEach(detail -> {
            CostumeItem costumeItem = detail.getCostumeItem();
            costumeItem.setStatus(com.aurafit.enums.ItemStatus.MAINTENANCE);
            costumeItemRepository.save(costumeItem);
        });

        BigDecimal refundAmount = order.getTotalDeposit().add(order.getTotalRentalPrice());
        order.setTotalRefundedAmount(refundAmount);

        String note = "Thất lạc kiện hàng. Lý do: " + reason;
        order.setInspectionNote(order.getInspectionNote() != null && !order.getInspectionNote().isEmpty()
                ? order.getInspectionNote() + "\n" + note 
                : note);

        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional
    public void reportInvalidBank(Long orderId) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.RENTED && order.getStatus() != com.aurafit.enums.OrderStatus.RETURNING && order.getStatus() != com.aurafit.enums.OrderStatus.RETURNED && order.getStatus() != com.aurafit.enums.OrderStatus.PENDING_REFUND) {
            throw new BadRequestException("Order must be RENTED, RETURNING, RETURNED or PENDING_REFUND to report invalid bank.");
        }

        order.setStatus(com.aurafit.enums.OrderStatus.PENDING_REFUND);
        String note = "Thông tin ngân hàng bị sai, chờ khách cập nhật.";
        order.setInspectionNote(order.getInspectionNote() != null && !order.getInspectionNote().isEmpty()
                ? order.getInspectionNote() + "\n" + note
                : note);

        rentalOrderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffOrderDetailResponse> getAllOrdersForStaff() {
        List<RentalOrder> orders = rentalOrderRepository.findAllOrdersForStaff();
        if (orders.isEmpty()) return List.of();

        List<Long> orderIds = orders.stream().map(RentalOrder::getId).toList();
        
        java.util.Map<Long, List<HandoverRecord>> handoversMap = handoverRecordRepository.findByOrderIdIn(orderIds)
                .stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        h -> h.getRentalOrderDetail().getRentalOrder().getId()
                ));

        return orders.stream()
                .map(order -> {
                    List<HandoverRecord> handovers = handoversMap.getOrDefault(order.getId(), List.of());
                    return StaffOrderDetailResponse.fromEntity(order, handovers);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public StaffOrderDetailResponse getOrderDetail(Long orderId) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        List<HandoverRecord> handovers = handoverRecordRepository.findByOrderId(orderId);
        return StaffOrderDetailResponse.fromEntity(order, handovers);
    }

    private void recordRentEvent(User user,
                                 RentalOrder order,
                                 List<RentalOrderDetail> orderDetails) {
        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("itemCount", orderDetails.size());
        metadata.put("costumeIds", orderDetails.stream()
                .map(detail -> detail.getCostumeItem() != null && detail.getCostumeItem().getCostume() != null
                        ? detail.getCostumeItem().getCostume().getId()
                        : null)
                .filter(id -> id != null)
                .distinct()
                .toList());
        metadata.put("costumeItemIds", orderDetails.stream()
                .map(detail -> detail.getCostumeItem() != null ? detail.getCostumeItem().getId() : null)
                .filter(id -> id != null)
                .toList());
        metadata.put("skus", orderDetails.stream()
                .map(detail -> detail.getCostumeItem() != null ? detail.getCostumeItem().getSku() : null)
                .filter(sku -> sku != null && !sku.isBlank())
                .toList());
        java.time.LocalDate minRentalStartDate = order.getDetails().stream()
                .map(RentalOrderDetail::getRentalStartDate)
                .min(java.time.LocalDate::compareTo)
                .orElse(null);
        java.time.LocalDate maxRentalEndDate = order.getDetails().stream()
                .map(RentalOrderDetail::getRentalEndDate)
                .max(java.time.LocalDate::compareTo)
                .orElse(null);
        metadata.put("rentalStartDate", minRentalStartDate != null ? minRentalStartDate.toString() : null);
        metadata.put("rentalEndDate", maxRentalEndDate != null ? maxRentalEndDate.toString() : null);

        interactionEventRecorderService.record(
                user,
                null,
                InteractionEventType.RENT,
                InteractionTargetType.ORDER,
                order.getId() != null ? String.valueOf(order.getId()) : null,
                "/orders",
                null,
                metadata
        );
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long userId, String cancelReason) {
        RentalOrder order = rentalOrderRepository.findByIdAndUserIdWithDetails(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (order.getStatus() != com.aurafit.enums.OrderStatus.PENDING &&
            order.getStatus() != com.aurafit.enums.OrderStatus.CONFIRMED) {
            throw new BadRequestException("Không thể hủy đơn hàng đang ở trạng thái: " + order.getStatus());
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
        order.setCancelReason(cancelReason);
        rentalOrderRepository.save(order);

        User user = order.getUser();
        user.setConsecutiveCancelCount(user.getConsecutiveCancelCount() + 1);
        if (user.getConsecutiveCancelCount() >= 3) {
            user.setStatus(com.aurafit.enums.UserStatus.BLOCKED);
        }
        userRepository.save(user);

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

        order.setStatus(com.aurafit.enums.OrderStatus.RENTED);
        rentalOrderRepository.save(order);

        User customer = order.getUser();
        if (customer.getConsecutiveCancelCount() > 0) {
            customer.setConsecutiveCancelCount(0);
            userRepository.save(customer);
        }

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

        if (order.getStatus() != com.aurafit.enums.OrderStatus.PICKED_UP && order.getStatus() != com.aurafit.enums.OrderStatus.RETURNED && order.getStatus() != com.aurafit.enums.OrderStatus.RENTED) {
            throw new BadRequestException("Chi co the tra hang khi don hang da duoc giao (PICKED_UP/RENTED). Trang thai hien tai: " + order.getStatus());
        }

        List<HandoverRecord> records = new ArrayList<>();

        for (com.aurafit.dto.request.ItemAssessmentDTO assessment : request.assessments()) {
            RentalOrderDetail detail = order.getDetails().stream()
                    .filter(d -> d.getId().equals(assessment.rentalOrderDetailId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy chi tiết đơn hàng với mã ID: " + assessment.rentalOrderDetailId()));

            detail.setReturnStatus(assessment.returnStatus());
            
            // Map fees
            detail.setLateFee(assessment.lateFee() != null ? assessment.lateFee() : BigDecimal.ZERO);
            detail.setDamageFee(assessment.damageFee() != null ? assessment.damageFee() : BigDecimal.ZERO);
            
            // Calculate itemRefund = deposit - (lateFee + damageFee)
            BigDecimal itemRefund = detail.getDeposit().subtract(detail.getLateFee()).subtract(detail.getDamageFee());
            if (itemRefund.compareTo(BigDecimal.ZERO) < 0) {
                itemRefund = BigDecimal.ZERO;
            }
            detail.setRefundedAmount(itemRefund);

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

        boolean allReturned = order.getDetails().stream().noneMatch(d -> d.getReturnStatus() == ReturnStatus.NOT_RETURNED);

        if (allReturned) {
            calculateAndProcessRefund(order);
        } else {
            // Keep it as RETURNED to mean partially returned for now if not already
            if (order.getStatus() != com.aurafit.enums.OrderStatus.RETURNED) {
                order.setStatus(com.aurafit.enums.OrderStatus.RETURNED);
                rentalOrderRepository.save(order);
            }
        }

        return handoverRecordRepository.saveAll(records).stream()
                .map(com.aurafit.dto.response.HandoverRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<com.aurafit.dto.response.HandoverRecordDTO> updateHandoverImage(
            Long orderId,
            Long staffId,
            com.aurafit.enums.HandoverType handoverType,
            com.aurafit.dto.request.HandoverImageUpdateRequest request
    ) {
        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", staffId));
        if (staff.getRole() != com.aurafit.enums.Role.STAFF && staff.getRole() != com.aurafit.enums.Role.ADMIN) {
            throw new org.springframework.security.access.AccessDeniedException("Chi nhan vien hoac admin moi co quyen thuc hien thao tac nay.");
        }

        String imageUrl = request.imageUrl() == null ? "" : request.imageUrl().trim();
        if (imageUrl.isBlank()) {
            throw new BadRequestException("Vui long tai anh minh chung truoc khi cap nhat.");
        }

        List<HandoverRecord> records = handoverRecordRepository.findByOrderIdAndHandoverType(orderId, handoverType);
        if (records.isEmpty()) {
            throw new ResourceNotFoundException("HandoverRecord", "orderId/type", orderId + "/" + handoverType);
        }

        records.forEach(record -> record.setImageUrl(imageUrl));
        return handoverRecordRepository.saveAll(records).stream()
                .map(com.aurafit.dto.response.HandoverRecordDTO::fromEntity)
                .collect(Collectors.toList());
    }

    private void calculateAndProcessRefund(RentalOrder order) {
        BigDecimal totalLateFee = BigDecimal.ZERO;
        BigDecimal totalDamageFee = BigDecimal.ZERO;
        BigDecimal totalRefundedAmount = BigDecimal.ZERO;

        for (RentalOrderDetail detail : order.getDetails()) {
            totalLateFee = totalLateFee.add(detail.getLateFee() != null ? detail.getLateFee() : BigDecimal.ZERO);
            totalDamageFee = totalDamageFee.add(detail.getDamageFee() != null ? detail.getDamageFee() : BigDecimal.ZERO);
            totalRefundedAmount = totalRefundedAmount.add(detail.getRefundedAmount() != null ? detail.getRefundedAmount() : BigDecimal.ZERO);
        }

        order.setTotalLateFee(totalLateFee);
        order.setTotalDamageFee(totalDamageFee);
        order.setTotalRefundedAmount(totalRefundedAmount);
        order.setStatus(com.aurafit.enums.OrderStatus.COMPLETED);
        rentalOrderRepository.save(order);

        if (totalRefundedAmount.compareTo(BigDecimal.ZERO) > 0) {
            Payment refundPayment = Payment.builder()
                    .rentalOrder(order)
                    .amount(totalRefundedAmount)
                    .method(com.aurafit.enums.PaymentMethod.BANKING)
                    .type(com.aurafit.enums.PaymentType.REFUND)
                    .status(com.aurafit.enums.PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(refundPayment);
        }
    }
}
