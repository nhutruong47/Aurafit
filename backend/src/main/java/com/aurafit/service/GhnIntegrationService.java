package com.aurafit.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface GhnIntegrationService {
    
    List<Map<String, Object>> getProvinces();
    
    List<Map<String, Object>> getDistricts(int provinceId);
    
    List<Map<String, Object>> getWards(int districtId);

    
    /**
     * Calculates the shipping fee for forwarding the item to the customer.
     * @param toDistrictId The destination district ID (GHN specific)
     * @param toWardCode The destination ward code (GHN specific)
     * @return The calculated shipping fee
     */
    BigDecimal calculateShippingFee(int toDistrictId, String toWardCode);

    /**
     * Creates a forward order to ship items from the store to the customer.
     * @param toName Customer's name
     * @param toPhone Customer's phone number
     * @param toAddress Customer's full address
     * @param toDistrictId Customer's district ID
     * @param toWardCode Customer's ward code
     * @param weight Total weight of the items in grams
     * @return The GHN Order Code (e.g. tracking number)
     */
    String createForwardOrder(String toName, String toPhone, String toAddress, int toDistrictId, String toWardCode, int weight);

    /**
     * Creates a return order to ship items back from the customer to the store.
     * The sender and receiver are swapped compared to the forward order.
     * @param fromName Customer's name
     * @param fromPhone Customer's phone number
     * @param fromAddress Customer's full address
     * @param fromDistrictId Customer's district ID
     * @param fromWardCode Customer's ward code
     * @param weight Total weight of the items in grams
     * @return The GHN Return Order Code
     */
    String createReturnOrder(String fromName, String fromPhone, String fromAddress, int fromDistrictId, String fromWardCode, int weight);
}
