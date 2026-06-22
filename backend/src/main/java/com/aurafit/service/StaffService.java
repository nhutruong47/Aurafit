package com.aurafit.service;

import com.aurafit.dto.request.HandoverRequest;
import com.aurafit.dto.response.StaffOrderDetailResponse;
import com.aurafit.dto.response.HandoverRecordDTO;

import java.util.List;

public interface StaffService {

    List<StaffOrderDetailResponse> getAllOrdersForStaff();

    StaffOrderDetailResponse getOrderDetail(Long orderId);

    HandoverRecordDTO createPickupHandover(Long staffUserId, Long orderId, HandoverRequest request);

    HandoverRecordDTO createReturnHandover(Long staffUserId, Long orderId, HandoverRequest request);
}
