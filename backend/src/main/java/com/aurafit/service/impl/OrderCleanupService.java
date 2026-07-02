package com.aurafit.service.impl;

import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.RentalOrderDetail;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.OrderStatus;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.RentalOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderCleanupService {

    private final RentalOrderRepository rentalOrderRepository;
    private final CostumeItemRepository costumeItemRepository;

    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredPendingOrders() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(15);
        List<RentalOrder> expiredOrders = rentalOrderRepository.findByStatusAndCreatedAtBefore(OrderStatus.PENDING, cutoffTime);

        if (!expiredOrders.isEmpty()) {
            log.info("Found {} expired pending orders. Cancelling and restoring stock...", expiredOrders.size());
            
            for (RentalOrder order : expiredOrders) {
                order.setStatus(OrderStatus.CANCELLED);
                order.setCancelReason("Hệ thống tự động hủy do quá hạn thanh toán");
                
                for (RentalOrderDetail detail : order.getDetails()) {
                    CostumeItem item = detail.getCostumeItem();
                    if (item != null) {
                        item.setStatus(ItemStatus.AVAILABLE);
                        costumeItemRepository.save(item);
                    }
                }
            }
            
            rentalOrderRepository.saveAll(expiredOrders);
            log.info("Successfully cancelled expired orders.");
        }
    }
}
