package com.aurafit.service.impl;

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

}
