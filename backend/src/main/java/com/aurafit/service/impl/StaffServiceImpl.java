package com.aurafit.service.impl;

import com.aurafit.dto.request.HandoverRequest;
import com.aurafit.dto.response.HandoverRecordDTO;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.entity.*;
import com.aurafit.enums.HandoverType;
import com.aurafit.enums.ItemStatus;
import org.springframework.security.access.AccessDeniedException;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.*;
import com.aurafit.service.StaffService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class StaffServiceImpl implements StaffService {

    private final RentalOrderRepository rentalOrderRepository;
    private final RentalOrderDetailRepository rentalOrderDetailRepository;
    private final HandoverRecordRepository handoverRecordRepository;
    private final CostumeItemRepository costumeItemRepository;
    private final UserRepository userRepository;

    public StaffServiceImpl(RentalOrderRepository rentalOrderRepository,
                            RentalOrderDetailRepository rentalOrderDetailRepository,
                            HandoverRecordRepository handoverRecordRepository,
                            CostumeItemRepository costumeItemRepository,
                            UserRepository userRepository) {
        this.rentalOrderRepository = rentalOrderRepository;
        this.rentalOrderDetailRepository = rentalOrderDetailRepository;
        this.handoverRecordRepository = handoverRecordRepository;
        this.costumeItemRepository = costumeItemRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<StaffOrderDetailResponse> getAllOrdersForStaff() {
        return rentalOrderRepository.findAllOrdersForStaff()
                .stream()
                .map(order -> {
                    List<HandoverRecord> handovers = handoverRecordRepository.findByOrderId(order.getId());
                    return StaffOrderDetailResponse.fromEntity(order, handovers);
                })
                .toList();
    }

    @Override
    public StaffOrderDetailResponse getOrderDetail(Long orderId) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        List<HandoverRecord> handovers = handoverRecordRepository.findByOrderId(orderId);
        return StaffOrderDetailResponse.fromEntity(order, handovers);
    }

    @Override
    @Transactional
    public HandoverRecordDTO createPickupHandover(Long staffUserId, Long orderId, HandoverRequest request) {
        validateStaffUser(staffUserId);
        RentalOrderDetail detail = loadDetail(orderId, request.rentalOrderDetailId());

        HandoverRecord record = HandoverRecord.builder()
                .rentalOrderDetail(detail)
                .staffUser(userRepository.getReferenceById(staffUserId))
                .handoverType(HandoverType.PICKUP)
                .returnStatus(detail.getReturnStatus())
                .imageUrl(request.imageUrl())
                .note(request.note())
                .build();

        return HandoverRecordDTO.fromEntity(handoverRecordRepository.save(record));
    }

    @Override
    @Transactional
    public HandoverRecordDTO createReturnHandover(Long staffUserId, Long orderId, HandoverRequest request) {
        validateStaffUser(staffUserId);
        RentalOrderDetail detail = loadDetail(orderId, request.rentalOrderDetailId());

        // Update item return status and inventory
        detail.setReturnStatus(request.returnStatus());
        if (request.returnStatus() == com.aurafit.enums.ReturnStatus.RETURNED) {
            detail.getCostumeItem().setStatus(ItemStatus.AVAILABLE);
            costumeItemRepository.save(detail.getCostumeItem());
        }
        rentalOrderDetailRepository.save(detail);

        HandoverRecord record = HandoverRecord.builder()
                .rentalOrderDetail(detail)
                .staffUser(userRepository.getReferenceById(staffUserId))
                .handoverType(HandoverType.RETURN)
                .returnStatus(request.returnStatus())
                .imageUrl(request.imageUrl())
                .note(request.note())
                .build();

        return HandoverRecordDTO.fromEntity(handoverRecordRepository.save(record));
    }

    private void validateStaffUser(Long staffUserId) {
        User user = userRepository.findById(staffUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", staffUserId));
        if (user.getRole() != com.aurafit.enums.Role.STAFF &&
            user.getRole() != com.aurafit.enums.Role.ADMIN) {
            throw new AccessDeniedException("Chi nhan vien hoac admin moi co quyen thuc hien thao tac nay.");
        }
    }

    private RentalOrderDetail loadDetail(Long orderId, Long detailId) {
        RentalOrder order = rentalOrderRepository.findByIdWithDetailsAndCostumes(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        return order.getDetails().stream()
                .filter(d -> d.getId().equals(detailId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("OrderDetail", "id", detailId));
    }
}
