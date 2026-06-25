package com.aurafit.service;

import com.aurafit.dto.request.TrackUserBehaviorRequest;
import com.aurafit.dto.response.UserBehaviorTrackResponse;
import com.aurafit.entity.RentalOrder;
import com.aurafit.entity.User;

public interface BehaviorTrackingService {

    UserBehaviorTrackResponse trackEvent(Long authenticatedUserId, TrackUserBehaviorRequest request);

    void recordAddToCart(User user, Long costumeId, String sourceModule);

    void recordCompletedRental(User user, RentalOrder order);
}
