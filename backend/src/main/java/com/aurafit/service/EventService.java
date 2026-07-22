package com.aurafit.service;

import com.aurafit.dto.request.EventCostumeAssignRequest;
import com.aurafit.dto.request.EventCreateRequest;
import com.aurafit.dto.request.EventUpdateRequest;
import com.aurafit.dto.response.EventBannerResponse;
import com.aurafit.dto.response.EventResponse;

import java.util.List;

public interface EventService {

    List<EventResponse> getAdminEvents(String status);

    List<EventResponse> getActiveEvents();

    List<EventBannerResponse> getUpcomingAndActiveEvents(int limit);

    EventResponse createEvent(EventCreateRequest request);

    EventResponse updateEvent(Long id, EventUpdateRequest request);

    void deleteEvent(Long id);

    EventResponse assignCostumes(Long eventId, List<EventCostumeAssignRequest> requests);

    void removeCostume(Long eventId, Long costumeId);
}
