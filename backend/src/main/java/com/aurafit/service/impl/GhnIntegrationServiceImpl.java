package com.aurafit.service.impl;

import com.aurafit.service.GhnIntegrationService;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.HttpStatusCodeException;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Collections;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class GhnIntegrationServiceImpl implements GhnIntegrationService {

    @Value("${ghn.api.url:https://dev-online-gateway.ghn.vn/shiip/public-api}")
    private String ghnApiUrl;

    @Value("${ghn.api.token:}")
    private String apiToken;

    @Value("${ghn.shop.id:}")
    private String shopId;

    private final RestTemplate restTemplate;

    public GhnIntegrationServiceImpl() {
        this.restTemplate = new RestTemplate();
    }

    private HttpHeaders createHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Token", apiToken);
        headers.set("ShopId", shopId);
        return headers;
    }

    @Override
    public List<Map<String, Object>> getProvinces() {
        String url = ghnApiUrl + "/master-data/province";
        try {
            HttpEntity<Void> request = new HttpEntity<>(createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (RestClientException e) {
            log.error("Failed to fetch provinces from GHN API", e);
        }
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getDistricts(int provinceId) {
        String url = ghnApiUrl + "/master-data/district?province_id=" + provinceId;
        try {
            HttpEntity<Void> request = new HttpEntity<>(createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (RestClientException e) {
            log.error("Failed to fetch districts from GHN API", e);
        }
        return Collections.emptyList();
    }

    @Override
    public List<Map<String, Object>> getWards(int districtId) {
        String url = ghnApiUrl + "/master-data/ward?district_id=" + districtId;
        try {
            HttpEntity<Void> request = new HttpEntity<>(createHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                return (List<Map<String, Object>>) response.getBody().get("data");
            }
        } catch (RestClientException e) {
            log.error("Failed to fetch wards from GHN API", e);
        }
        return Collections.emptyList();
    }

    @Override
    public BigDecimal calculateShippingFee(int toDistrictId, String toWardCode) {
        String url = ghnApiUrl + "/v2/shipping-order/fee";
        
        Map<String, Object> body = new HashMap<>();
        body.put("to_district_id", toDistrictId);
        body.put("to_ward_code", toWardCode);
        body.put("from_district_id", 1452); // ID for Quận 9
        body.put("from_ward_code", "20314"); // ID for Phường Long Thạnh Mỹ
        body.put("weight", 1000); // Default 1kg if not specified
        body.put("service_type_id", 2); // Standard service
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders());
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                if (data.containsKey("total")) {
                    return new BigDecimal(data.get("total").toString());
                }
            }
        } catch (RestClientException e) {
            if (e instanceof HttpStatusCodeException httpEx) {
                log.error("Failed to calculate shipping fee from GHN API: {}", httpEx.getResponseBodyAsString(), e);
            } else {
                log.error("Failed to calculate shipping fee from GHN API", e);
            }
        }
        
        return BigDecimal.ZERO; // Fallback or could throw custom exception
    }

    @Override
    public String createForwardOrder(RentalOrder order, int toDistrictId, String toWardCode, int weight) {
        String url = ghnApiUrl + "/v2/shipping-order/create";
        
        Map<String, Object> body = new HashMap<>();
        body.put("payment_type_id", 1); // 1 = Seller pays shipping, 2 = Buyer pays shipping
        body.put("note", "Cho thử hàng");
        body.put("required_note", "CHOXEMHANGKHONGTHU");
        body.put("to_name", order.getReceiverName());
        body.put("to_phone", order.getReceiverPhone());
        body.put("to_address", order.getDeliveryAddress());
        body.put("to_ward_code", toWardCode);
        body.put("to_district_id", toDistrictId);
        body.put("from_district_id", 1452); // ID for Quận 9
        body.put("from_ward_code", "20314"); // ID for Phường Long Thạnh Mỹ
        body.put("weight", weight);
        body.put("service_type_id", 2);
        
        // Map actual items from RentalOrder
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        int perItemWeight = weight / (order.getDetails() != null && !order.getDetails().isEmpty() ? order.getDetails().size() : 1);
        
        if (order.getDetails() != null) {
            for (RentalOrderDetail detail : order.getDetails()) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", detail.getCostumeItem() != null && detail.getCostumeItem().getCostume() != null ? detail.getCostumeItem().getCostume().getName() : "Trang phục AuraFit");
                item.put("quantity", 1);
                item.put("weight", perItemWeight);
                items.add(item);
            }
        }
        
        if (items.isEmpty()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", "Trang phục cho thuê AuraFit");
            item.put("quantity", 1);
            item.put("weight", weight);
            items.add(item);
        }
        
        body.put("items", items);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders());
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return (String) data.get("order_code");
            }
        } catch (RestClientException e) {
            if (e instanceof HttpStatusCodeException httpEx) {
                log.error("Failed to create forward order from GHN API: {}", httpEx.getResponseBodyAsString(), e);
            } else {
                log.error("Failed to create forward order from GHN API", e);
            }
        }
        
        return null;
    }

    @Override
    public String createReturnOrder(RentalOrder order, int fromDistrictId, String fromWardCode, int weight) {
        String url = ghnApiUrl + "/v2/shipping-order/create";
        
        // Reverse order: Customer is the sender, Store is the receiver.
        Map<String, Object> body = new HashMap<>();
        body.put("payment_type_id", 1); // Seller pays returning shipping 
        body.put("note", "Khách hàng trả đồ thuê AuraFit");
        body.put("required_note", "CHOXEMHANGKHONGTHU");
        
        // Return sender info
        body.put("return_name", order.getReceiverName());
        body.put("return_phone", order.getReceiverPhone());
        body.put("return_address", order.getDeliveryAddress());
        body.put("return_district_id", fromDistrictId);
        body.put("return_ward_code", fromWardCode);
        
        body.put("client_order_code", "RETURN_" + System.currentTimeMillis());
        body.put("to_name", "AuraFit Store");
        body.put("to_phone", "0987654321"); // Store phone
        body.put("to_address", "Địa chỉ cửa hàng AuraFit"); // Store address
        body.put("to_ward_code", "20308"); // Mock ward
        body.put("to_district_id", 1444); // Mock district
        body.put("weight", weight);
        body.put("service_type_id", 2);
        
        // Map actual items from RentalOrder
        List<Map<String, Object>> items = new java.util.ArrayList<>();
        int perItemWeight = weight / (order.getDetails() != null && !order.getDetails().isEmpty() ? order.getDetails().size() : 1);
        
        if (order.getDetails() != null) {
            for (RentalOrderDetail detail : order.getDetails()) {
                Map<String, Object> item = new HashMap<>();
                item.put("name", detail.getCostumeItem() != null && detail.getCostumeItem().getCostume() != null ? detail.getCostumeItem().getCostume().getName() : "Trang phục AuraFit");
                item.put("quantity", 1);
                item.put("weight", perItemWeight);
                items.add(item);
            }
        }
        
        if (items.isEmpty()) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", "Trang phục cho thuê AuraFit (Trả hàng)");
            item.put("quantity", 1);
            item.put("weight", weight);
            items.add(item);
        }
        
        body.put("items", items);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createHeaders());
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.POST, request, Map.class);
            if (response.getBody() != null && response.getBody().containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) response.getBody().get("data");
                return (String) data.get("order_code");
            }
        } catch (RestClientException e) {
            log.error("Failed to create return order from GHN API", e);
        }
        
        return null;
    }
}
