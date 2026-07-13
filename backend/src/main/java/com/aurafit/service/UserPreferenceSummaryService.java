package com.aurafit.service;

public interface UserPreferenceSummaryService {

    String CACHE_NAME = "user_preference_summaries";

    String summarize(String userId, String guestSessionId);
}
