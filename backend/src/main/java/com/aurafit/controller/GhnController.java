package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.service.GhnIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ghn")
@RequiredArgsConstructor
public class GhnController {

    private final GhnIntegrationService ghnIntegrationService;

    @GetMapping("/provinces")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProvinces() {
        List<Map<String, Object>> provinces = ghnIntegrationService.getProvinces();
        return ResponseEntity.ok(ApiResponse.success("Fetched provinces successfully", provinces));
    }

    @GetMapping("/districts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getDistricts(@RequestParam int provinceId) {
        List<Map<String, Object>> districts = ghnIntegrationService.getDistricts(provinceId);
        return ResponseEntity.ok(ApiResponse.success("Fetched districts successfully", districts));
    }

    @GetMapping("/wards")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWards(@RequestParam int districtId) {
        List<Map<String, Object>> wards = ghnIntegrationService.getWards(districtId);
        return ResponseEntity.ok(ApiResponse.success("Fetched wards successfully", wards));
    }

    @PostMapping("/calculate-fee")
    public ResponseEntity<ApiResponse<BigDecimal>> calculateFee(@RequestBody Map<String, Object> request) {
        int toDistrictId = Integer.parseInt(request.get("toDistrictId").toString());
        String toWardCode = request.get("toWardCode").toString();
        
        BigDecimal fee = ghnIntegrationService.calculateShippingFee(toDistrictId, toWardCode);
        return ResponseEntity.ok(ApiResponse.success("Calculated shipping fee", fee));
    }
}
