package com.aurafit.service.impl;

import com.aurafit.dto.request.TrackUserBehaviorRequest;
import com.aurafit.dto.response.UserBehaviorTrackResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.User;
import com.aurafit.entity.UserBehaviorEvent;
import com.aurafit.enums.AiBehaviorEventType;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.RentalOrderRepository;
import com.aurafit.repository.UserBehaviorEventRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AiDataCodec;
import com.aurafit.service.BehaviorTrackingService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class BehaviorTrackingServiceImpl implements BehaviorTrackingService {

    private final UserBehaviorEventRepository userBehaviorEventRepository;
    private final UserRepository userRepository;
    private final CostumeRepository costumeRepository;
    private final RentalOrderRepository rentalOrderRepository;
    private final AiDataCodec aiDataCodec;

    public BehaviorTrackingServiceImpl(UserBehaviorEventRepository userBehaviorEventRepository,
                                       UserRepository userRepository,
                                       CostumeRepository costumeRepository,
                                       RentalOrderRepository rentalOrderRepository,
                                       AiDataCodec aiDataCodec) {
        this.userBehaviorEventRepository = userBehaviorEventRepository;
        this.userRepository = userRepository;
        this.costumeRepository = costumeRepository;
        this.rentalOrderRepository = rentalOrderRepository;
        this.aiDataCodec = aiDataCodec;
    }

    @Override
    public UserBehaviorTrackResponse trackEvent(Long authenticatedUserId, TrackUserBehaviorRequest request) {
        User user = authenticatedUserId != null
                ? userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", authenticatedUserId))
                : null;

        Long costumeId = request.costumeId() != null
                ? request.costumeId()
                : ("COSTUME".equalsIgnoreCase(request.targetType()) || request.targetType() == null ? request.targetId() : null);

        Costume costume = costumeId != null
                ? costumeRepository.findByIdWithCategory(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId))
                : null;

        RentalOrder order = request.orderId() != null
                ? rentalOrderRepository.findById(request.orderId())
                .orElseThrow(() -> new ResourceNotFoundException("RentalOrder", "id", request.orderId()))
                : null;

        UserBehaviorEvent event = UserBehaviorEvent.builder()
                .user(user)
                .costume(costume)
                .rentalOrder(order)
                .sessionId(blankToNull(request.sessionId()))
                .eventType(resolveEventType(request))
                .queryText(blankToNull(request.queryText()))
                .filterPayload(aiDataCodec.toJson(buildFilterPayload(request)))
                .eventPayload(aiDataCodec.toJson(buildMetadataPayload(request)))
                .sourcePage(blankToNull(request.sourcePage()))
                .sourceModule(blankToNull(request.sourceModule()))
                .occurredAt(LocalDateTime.now())
                .build();

        UserBehaviorEvent saved = userBehaviorEventRepository.save(event);
        return new UserBehaviorTrackResponse(saved.getId(), "RECORDED");
    }

    @Override
    public void recordAddToCart(User user, Long costumeId, String sourceModule) {
        if (user == null || costumeId == null) {
            return;
        }

        Costume costume = costumeRepository.findById(costumeId).orElse(null);
        if (costume == null) {
            return;
        }

        userBehaviorEventRepository.save(UserBehaviorEvent.builder()
                .user(user)
                .costume(costume)
                .eventType(AiBehaviorEventType.ADD_TO_CART)
                .sourceModule(sourceModule)
                .occurredAt(LocalDateTime.now())
                .build());
    }

    @Override
    public void recordCompletedRental(User user, RentalOrder order) {
        if (user == null || order == null) {
            return;
        }

        for (var detail : order.getDetails()) {
            userBehaviorEventRepository.save(UserBehaviorEvent.builder()
                    .user(user)
                    .costume(detail.getCostumeItem().getCostume())
                    .rentalOrder(order)
                    .eventType(AiBehaviorEventType.COMPLETE_RENTAL)
                    .sourceModule("payment-webhook")
                    .occurredAt(LocalDateTime.now())
                    .build());
        }
    }

    private AiBehaviorEventType resolveEventType(TrackUserBehaviorRequest request) {
        String rawType = request.eventType() != null ? request.eventType() : request.actionType();
        if (rawType == null || rawType.isBlank()) {
            throw new IllegalArgumentException("eventType is required.");
        }
        return AiBehaviorEventType.valueOf(rawType.trim().toUpperCase());
    }

    private Map<String, Object> buildFilterPayload(TrackUserBehaviorRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (request.filterPayload() != null) {
            payload.put("raw", request.filterPayload());
        }
        addIfPresent(payload, "styleTags", request.styleTags());
        addIfPresent(payload, "occasionTags", request.occasionTags());
        addIfPresent(payload, "colorTags", request.colorTags());
        addIfPresent(payload, "sizeTags", request.sizeTags());
        addIfPresent(payload, "genderTags", request.genderTags());
        addIfPresent(payload, "budgetTier", request.budgetTier());
        return payload;
    }

    private Map<String, Object> buildMetadataPayload(TrackUserBehaviorRequest request) {
        Map<String, Object> payload = new LinkedHashMap<>();
        if (request.metadata() != null) {
            payload.put("raw", request.metadata());
        }
        addIfPresent(payload, "targetType", request.targetType());
        addIfPresent(payload, "styleTags", request.styleTags());
        addIfPresent(payload, "occasionTags", request.occasionTags());
        addIfPresent(payload, "colorTags", request.colorTags());
        addIfPresent(payload, "sizeTags", request.sizeTags());
        addIfPresent(payload, "genderTags", request.genderTags());
        addIfPresent(payload, "budgetTier", request.budgetTier());
        return payload;
    }

    private void addIfPresent(Map<String, Object> payload, String key, Object value) {
        if (value == null) {
            return;
        }
        if (value instanceof String textValue && textValue.isBlank()) {
            return;
        }
        if (value instanceof List<?> listValue && listValue.isEmpty()) {
            return;
        }
        payload.put(key, value);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
