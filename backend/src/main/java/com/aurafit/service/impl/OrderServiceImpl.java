package com.aurafit.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.aurafit.dto.request.AiStylistAttributionRequest;
import com.aurafit.dto.request.CheckoutItemRequest;
import com.aurafit.dto.request.CheckoutRequest;
import com.aurafit.dto.response.OrderResponse;
import com.aurafit.dto.response.OrderSummaryResponse;
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
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {
    private static final TypeReference<Map<String, Object>> METADATA_TYPE = new TypeReference<>() {
    };

    private final RentalOrderRepository rentalOrderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;
    private final UserInteractionEventRepository userInteractionEventRepository;
    private final InteractionEventRecorderService interactionEventRecorderService;
    private final ObjectMapper objectMapper;
    private final HandoverRecordRepository handoverRecordRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final PaymentRepository paymentRepository;
    private final PricingEngineService pricingEngineService;

    public OrderServiceImpl(RentalOrderRepository rentalOrderRepository,
                            CartRepository cartRepository,
                            CartItemRepository cartItemRepository,
                            CostumeItemRepository costumeItemRepository,
                            UserRepository userRepository,
                            UserInteractionEventRepository userInteractionEventRepository,
                            InteractionEventRecorderService interactionEventRecorderService,
                            ObjectMapper objectMapper,
                            HandoverRecordRepository handoverRecordRepository,
                            RentalOrderDetailRepository rentalOrderDetailRepository,
                            PaymentRepository paymentRepository,
                            PricingEngineService pricingEngineService) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
        this.userInteractionEventRepository = userInteractionEventRepository;
        this.interactionEventRecorderService = interactionEventRecorderService;
        this.objectMapper = objectMapper;
        this.handoverRecordRepository = handoverRecordRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.paymentRepository = paymentRepository;
        this.pricingEngineService = pricingEngineService;
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

            // ── 4a. Locate physical CostumeItem by SKU and lock it ───────────────
            CostumeItem representativeItem = costumeItemRepository.findBySku(item.sku())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "CostumeItem", "sku", item.sku()
                    ));

            Costume costume = representativeItem.getCostume();
            String size = representativeItem.getSize();
            String color = representativeItem.getColor();

            // ── 4b. Stock availability check and dynamic allocation ─────────────────
            List<CostumeItem> availableItems = costumeItemRepository.findAvailableItemsForUpdate(
                    costume.getId(), size, color, ItemStatus.AVAILABLE, org.springframework.data.domain.PageRequest.of(0, item.quantity())
            );

            if (availableItems.size() < item.quantity()) {
                throw new BadRequestException(
                        "Chỉ còn " + availableItems.size() + " sản phẩm khả dụng cho mẫu này (Size: " + size + (color != null ? ", Màu: " + color : "") + ")."
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
            BigDecimal pricePerDay = costume.getRentalPrice();
            BigDecimal retailValue = costume.getDepositPrice(); // depositPrice = retail value

            // Use Tiered Pricing Engine for consistency with Cart
            BigDecimal subtotalRental = pricingEngineService.calculateItemRentalFee(pricePerDay, (int) rentalDays, item.quantity());
            BigDecimal subtotalDeposit = pricingEngineService.calculateItemDeposit(retailValue, subtotalRental, item.quantity());

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

            // ── 4g. Accumulate for each physical item ──────────────────────────
            BigDecimal singleItemRentalFee = pricingEngineService.calculateItemRentalFee(pricePerDay, (int) rentalDays, 1);
            BigDecimal singleItemDeposit = pricingEngineService.calculateItemDeposit(retailValue, singleItemRentalFee, 1);
            
            for (CostumeItem allocatedItem : availableItems) {
                // Lock inventory immediately
                allocatedItem.setStatus(ItemStatus.RENTED);
                costumeItemRepository.save(allocatedItem);

                RentalOrderDetail detail = RentalOrderDetail.builder()
                        .costumeItem(allocatedItem)
                        .pricePerDay(pricePerDay)
                        .rentalDays((int) rentalDays)
                        .subtotal(singleItemRentalFee)
                        .deposit(singleItemDeposit)
                        .price(pricingEngineService.calculateTotal(singleItemRentalFee, singleItemDeposit))
                        .returnStatus(ReturnStatus.NOT_RETURNED)
                        .build();
                orderDetails.add(detail);
            }
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
                .totalPrice(totalRentalPrice.add(totalDeposit))
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

        recordRentEvent(user, responseOrder, items, orderDetails);

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

    private void recordRentEvent(User user,
                                 RentalOrder order,
                                 List<CheckoutItemRequest> requestItems,
                                 List<RentalOrderDetail> orderDetails) {
        List<MatchedAiStylistAttribution> matchedAttributions = matchAiStylistAttributions(user, requestItems, orderDetails);

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
        metadata.put("rentalStartDate", order.getRentalStartDate() != null ? order.getRentalStartDate().toLocalDate().toString() : null);
        metadata.put("rentalEndDate", order.getRentalEndDate() != null ? order.getRentalEndDate().toLocalDate().toString() : null);

        String interactionSessionId = null;
        if (!matchedAttributions.isEmpty()) {
            metadata.put("aiStylistAttribution", buildAiStylistAttributionSummary(matchedAttributions));
            interactionSessionId = matchedAttributions.stream()
                    .map(MatchedAiStylistAttribution::interactionSessionId)
                    .filter(value -> value != null && !value.isBlank())
                    .findFirst()
                    .orElse(null);
        }

        interactionEventRecorderService.record(
                user,
                interactionSessionId,
                InteractionEventType.RENT,
                InteractionTargetType.ORDER,
                order.getId() != null ? String.valueOf(order.getId()) : null,
                "/orders",
                null,
                metadata
        );
    }

    private List<MatchedAiStylistAttribution> matchAiStylistAttributions(User user,
                                                                         List<CheckoutItemRequest> requestItems,
                                                                         List<RentalOrderDetail> orderDetails) {
        Map<String, MatchedAiStylistAttribution> explicitBySignature = new LinkedHashMap<>();
        for (int index = 0; index < requestItems.size() && index < orderDetails.size(); index++) {
            CheckoutItemRequest requestItem = requestItems.get(index);
            RentalOrderDetail detail = orderDetails.get(index);
            if (requestItem.aiStylistAttribution() == null) {
                continue;
            }
            MatchedAiStylistAttribution attribution = buildMatchedAttribution(requestItem.aiStylistAttribution(), requestItem, detail);
            explicitBySignature.put(buildSignature(requestItem.sku(), requestItem.rentalStartDate().toString(), requestItem.rentalEndDate().toString()), attribution);
        }

        List<UserInteractionEvent> recentAddToCartEvents = user != null && user.getId() != null
                ? userInteractionEventRepository.findTop120ByUser_IdAndEventTypeOrderByCreatedAtDesc(user.getId(), InteractionEventType.ADD_TO_CART)
                : List.of();

        Map<String, MatchedAiStylistAttribution> inferredBySignature = new HashMap<>();
        for (UserInteractionEvent event : recentAddToCartEvents) {
            Map<String, Object> metadata = parseMetadata(event.getMetadataJson());
            Map<String, Object> aiStylistAttribution = readNestedMap(metadata.get("aiStylistAttribution"));
            if (aiStylistAttribution.isEmpty()) {
                continue;
            }

            String sku = readString(metadata.get("sku"));
            String rentalStartDate = readString(metadata.get("rentalStartDate"));
            String rentalEndDate = readString(metadata.get("rentalEndDate"));
            String signature = buildSignature(sku, rentalStartDate, rentalEndDate);
            if (signature == null || explicitBySignature.containsKey(signature) || inferredBySignature.containsKey(signature)) {
                continue;
            }

            Long costumeItemId = parseLong(metadata.get("costumeItemId"));
            Long costumeId = parseLong(metadata.get("costumeId"));
            inferredBySignature.put(signature, new MatchedAiStylistAttribution(
                    costumeId,
                    costumeItemId,
                    sku,
                    rentalStartDate,
                    rentalEndDate,
                    readString(aiStylistAttribution.get("interactionSessionId")),
                    parseLong(aiStylistAttribution.get("aiStylistSessionId")),
                    parseLong(aiStylistAttribution.get("aiStylistMessageId")),
                    readString(aiStylistAttribution.get("guestSessionId")),
                    parseInteger(aiStylistAttribution.get("recommendationPosition")),
                    readString(aiStylistAttribution.get("recommendationReason"))
            ));
        }

        LinkedHashMap<String, MatchedAiStylistAttribution> merged = new LinkedHashMap<>(explicitBySignature);
        for (int index = 0; index < requestItems.size(); index++) {
            CheckoutItemRequest requestItem = requestItems.get(index);
            String signature = buildSignature(
                    requestItem.sku(),
                    requestItem.rentalStartDate() != null ? requestItem.rentalStartDate().toString() : null,
                    requestItem.rentalEndDate() != null ? requestItem.rentalEndDate().toString() : null
            );
            if (signature == null || merged.containsKey(signature)) {
                continue;
            }
            MatchedAiStylistAttribution inferred = inferredBySignature.get(signature);
            if (inferred != null) {
                merged.put(signature, inferred);
            }
        }

        return new ArrayList<>(merged.values());
    }

    private MatchedAiStylistAttribution buildMatchedAttribution(AiStylistAttributionRequest requestAttribution,
                                                                CheckoutItemRequest requestItem,
                                                                RentalOrderDetail detail) {
        Long costumeItemId = detail.getCostumeItem() != null ? detail.getCostumeItem().getId() : null;
        Long costumeId = detail.getCostumeItem() != null && detail.getCostumeItem().getCostume() != null
                ? detail.getCostumeItem().getCostume().getId()
                : null;
        return new MatchedAiStylistAttribution(
                costumeId,
                costumeItemId,
                requestItem.sku(),
                requestItem.rentalStartDate() != null ? requestItem.rentalStartDate().toString() : null,
                requestItem.rentalEndDate() != null ? requestItem.rentalEndDate().toString() : null,
                requestAttribution.interactionSessionId(),
                requestAttribution.aiStylistSessionId(),
                requestAttribution.aiStylistMessageId(),
                requestAttribution.guestSessionId(),
                requestAttribution.recommendationPosition(),
                requestAttribution.recommendationReason()
        );
    }

    private Map<String, Object> buildAiStylistAttributionSummary(List<MatchedAiStylistAttribution> matchedAttributions) {
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("source", "AI_STYLIST");
        summary.put("slot", "ai_stylist_chat");
        summary.put("chatAttributedItemCount", matchedAttributions.size());
        summary.put("aiStylistSessionIds", matchedAttributions.stream()
                .map(MatchedAiStylistAttribution::aiStylistSessionId)
                .filter(id -> id != null)
                .distinct()
                .toList());
        summary.put("attributedCostumeIds", matchedAttributions.stream()
                .map(MatchedAiStylistAttribution::costumeId)
                .filter(id -> id != null)
                .distinct()
                .toList());
        summary.put("attributedItems", matchedAttributions.stream()
                .map(item -> {
                    Map<String, Object> attributedItem = new LinkedHashMap<>();
                    attributedItem.put("costumeItemId", item.costumeItemId());
                    attributedItem.put("sku", item.sku());
                    attributedItem.put("rentalStartDate", item.rentalStartDate());
                    attributedItem.put("rentalEndDate", item.rentalEndDate());
                    attributedItem.put("aiStylistSessionId", item.aiStylistSessionId());
                    attributedItem.put("aiStylistMessageId", item.aiStylistMessageId());
                    attributedItem.put("guestSessionId", item.guestSessionId());
                    attributedItem.put("interactionSessionId", item.interactionSessionId());
                    attributedItem.put("recommendationPosition", item.recommendationPosition());
                    attributedItem.put("recommendationReason", item.recommendationReason());
                    return attributedItem;
                })
                .toList());
        return summary;
    }

    private Map<String, Object> parseMetadata(String metadataJson) {
        if (metadataJson == null || metadataJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(metadataJson.trim(), METADATA_TYPE);
        } catch (Exception ignored) {
            return Map.of();
        }
    }

    private Map<String, Object> readNestedMap(Object value) {
        if (value instanceof Map<?, ?> rawMap) {
            LinkedHashMap<String, Object> normalized = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
                if (entry.getKey() != null) {
                    normalized.put(entry.getKey().toString(), entry.getValue());
                }
            }
            return normalized;
        }
        return Map.of();
    }

    private String buildSignature(String sku, String rentalStartDate, String rentalEndDate) {
        if (sku == null || sku.isBlank() || rentalStartDate == null || rentalEndDate == null) {
            return null;
        }
        return sku.trim() + "|" + rentalStartDate.trim() + "|" + rentalEndDate.trim();
    }

    private String readString(Object value) {
        return value != null ? value.toString() : null;
    }

    private Long parseLong(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Long.parseLong(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private Integer parseInteger(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return Integer.parseInt(value.toString());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }

    private record MatchedAiStylistAttribution(
            Long costumeId,
            Long costumeItemId,
            String sku,
            String rentalStartDate,
            String rentalEndDate,
            String interactionSessionId,
            Long aiStylistSessionId,
            Long aiStylistMessageId,
            String guestSessionId,
            Integer recommendationPosition,
            String recommendationReason
    ) {
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public OrderResponse cancelOrder(Long orderId, Long userId, String cancelReason) {
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
        order.setCancelReason(cancelReason);
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

        if (order.getStatus() != com.aurafit.enums.OrderStatus.PICKED_UP && order.getStatus() != com.aurafit.enums.OrderStatus.RETURNED) {
            throw new BadRequestException("Chi co the tra hang khi don hang da duoc giao (PICKED_UP). Trang thai hien tai: " + order.getStatus());
        }

        List<HandoverRecord> records = new ArrayList<>();

        for (com.aurafit.dto.request.ItemAssessmentDTO assessment : request.assessments()) {
            RentalOrderDetail detail = order.getDetails().stream()
                    .filter(d -> d.getId().equals(assessment.rentalOrderDetailId()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Khong tim thay chi tiet don hang voi ID: " + assessment.rentalOrderDetailId()));

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
