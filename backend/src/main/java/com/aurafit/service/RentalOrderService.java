package com.aurafit.service;

import com.aurafit.dto.CostumeHandoverResponse;
import com.aurafit.dto.RentalOrderDetailResponse;
import com.aurafit.dto.StaffHandoverRequest;
import com.aurafit.dto.StaffRentalOrderResponse;
import com.aurafit.entity.CostumeHandover;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeHandoverRepository;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.RentalOrderDetailRepository;
import com.aurafit.repository.RentalOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RentalOrderService {

    private final RentalOrderRepository rentalOrderRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final CostumeHandoverRepository costumeHandoverRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<StaffRentalOrderResponse> getStaffOrders() {
        return rentalOrderRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toStaffRentalOrderResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StaffRentalOrderResponse getStaffOrder(Long orderId) {
        RentalOrder rentalOrder = getRentalOrder(orderId);
        return toStaffRentalOrderResponse(rentalOrder);
    }

    @Transactional
    public StaffRentalOrderResponse createPickupHandover(Long orderId, StaffHandoverRequest request) {
        RentalOrder rentalOrder = getRentalOrder(orderId);
        RentalOrderDetail detail = getDetailForOrder(orderId, request.rentalOrderDetailId());
        CostumeItem item = detail.getCostumeItem();
        User staff = getStaff(request.staffUserId());

        CostumeHandover handover = CostumeHandover.builder()
                .rentalOrder(rentalOrder)
                .rentalOrderDetail(detail)
                .costumeItem(item)
                .staff(staff)
                .type("PICKUP")
                .handoverImageUrl(request.handoverImageUrl())
                .note(request.note())
                .build();

        item.setStatus("RENTED");
        rentalOrder.setStatus("PICKED_UP");

        costumeHandoverRepository.save(handover);
        costumeItemRepository.save(item);
        rentalOrderRepository.save(rentalOrder);

        return toStaffRentalOrderResponse(rentalOrder);
    }

    @Transactional
    public StaffRentalOrderResponse createReturnHandover(Long orderId, StaffHandoverRequest request) {
        RentalOrder rentalOrder = getRentalOrder(orderId);
        RentalOrderDetail detail = getDetailForOrder(orderId, request.rentalOrderDetailId());
        CostumeItem item = detail.getCostumeItem();
        User staff = getStaff(request.staffUserId());
        String returnStatus = normalizeReturnStatus(request.returnStatus());

        CostumeHandover handover = CostumeHandover.builder()
                .rentalOrder(rentalOrder)
                .rentalOrderDetail(detail)
                .costumeItem(item)
                .staff(staff)
                .type("RETURN")
                .returnStatus(returnStatus)
                .handoverImageUrl(request.handoverImageUrl())
                .note(request.note())
                .build();

        detail.setReturnStatus(returnStatus);
        item.setStatus(switch (returnStatus) {
            case "DAMAGED" -> "DAMAGED";
            case "LOST" -> "LOST";
            default -> "AVAILABLE";
        });
        rentalOrder.setStatus("RETURNED");

        costumeHandoverRepository.save(handover);
        rentalOrderDetailRepository.save(detail);
        costumeItemRepository.save(item);
        rentalOrderRepository.save(rentalOrder);

        return toStaffRentalOrderResponse(rentalOrder);
    }

    private StaffRentalOrderResponse toStaffRentalOrderResponse(RentalOrder rentalOrder) {
        List<RentalOrderDetailResponse> details = rentalOrderDetailRepository.findByRentalOrderId(rentalOrder.getId())
                .stream()
                .map(RentalOrderDetailResponse::from)
                .toList();
        List<CostumeHandoverResponse> handovers = costumeHandoverRepository.findByRentalOrderIdOrderByCreatedAtDesc(rentalOrder.getId())
                .stream()
                .map(CostumeHandoverResponse::from)
                .toList();

        return StaffRentalOrderResponse.from(rentalOrder, details, handovers);
    }

    private RentalOrder getRentalOrder(Long orderId) {
        return rentalOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", orderId));
    }

    private RentalOrderDetail getDetailForOrder(Long orderId, Long detailId) {
        RentalOrderDetail detail = rentalOrderDetailRepository.findById(detailId)
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrderDetail", "id", detailId));

        if (!detail.getRentalOrder().getId().equals(orderId)) {
            throw new IllegalArgumentException("Rental order detail does not belong to this order.");
        }

        return detail;
    }

    private User getStaff(Long staffUserId) {
        User staff = userService.getUserById(staffUserId);
        String role = staff.getRole() == null ? "" : staff.getRole();
        if (!role.contains("STAFF") && !role.contains("ADMIN")) {
            throw new IllegalArgumentException("User must have STAFF or ADMIN role to create handover.");
        }
        return staff;
    }

    private String normalizeReturnStatus(String returnStatus) {
        if (returnStatus == null || returnStatus.isBlank()) {
            return "RETURNED";
        }
        String normalized = returnStatus.trim().toUpperCase();
        if (!List.of("RETURNED", "DAMAGED", "LOST").contains(normalized)) {
            throw new IllegalArgumentException("returnStatus must be RETURNED, DAMAGED, or LOST.");
        }
        return normalized;
    }
}
