package com.aurafit.service;

import com.aurafit.entity.UserPreferenceProfile;

public interface UserPreferenceProfileService {

    UserPreferenceProfile getOrRecomputeProfile(Long userId);
}
