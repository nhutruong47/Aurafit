package com.aurafit.controller;

import com.aurafit.entity.RentalOrder;
import com.aurafit.enums.OrderStatus;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/webhook/ghn")
@RequiredArgsConstructor
@Slf4j
public class GhnWebhookController {

    private final OrderService orderService;
    private final RentalOrderRepository rentalOrderRepository;

    @PostMapping
    public ResponseEntity<String> handleGhnWebhook(@RequestBody Map<String, Object> payload) {
        log.info("Received GHN Webhook: {}", payload);

        try {
            String orderCode = (String) payload.get("OrderCode");
            String status = (String) payload.get("Status");

            if (orderCode == null || status == null) {
                return ResponseEntity.badRequest().body("Missing OrderCode or Status");
            }

            Optional<RentalOrder> orderOpt = rentalOrderRepository.findByGhnOrderCode(orderCode);
            if (orderOpt.isEmpty()) {
                // Try searching in return order code
                orderOpt = rentalOrderRepository.findByGhnReturnOrderCode(orderCode);
            }

            if (orderOpt.isPresent()) {
                RentalOrder order = orderOpt.get();

                if ("delivered".equalsIgnoreCase(status) && order.getStatus() == OrderStatus.SHIPPING) {
                    log.info("GHN delivered, marking order {} as RENTED", order.getId());
                    orderService.markOrderRented(order.getId());
                } else if ("returned".equalsIgnoreCase(status) || "delivery_failed".equalsIgnoreCase(status) || "cancel".equalsIgnoreCase(status)) {
                    log.info("GHN failed/returned, marking order {} as CANCELLED", order.getId());
                    // In a real scenario, this might need a specific service method to handle refund logic
                    order.setStatus(OrderStatus.CANCELLED);
                    rentalOrderRepository.save(order);
                }
            }
        } catch (Exception e) {
            log.error("Error processing GHN webhook", e);
        }

        // Always return 200 OK to acknowledge receipt to GHN
        return ResponseEntity.ok("OK");
    }
}
