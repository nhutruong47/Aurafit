package com.aurafit.service;

import com.aurafit.dto.response.StaffOrderDetailResponse;

import java.util.List;

public interface StaffService {

    List<StaffOrderDetailResponse> getAllOrdersForStaff();

    StaffOrderDetailResponse getOrderDetail(Long orderId);
}
