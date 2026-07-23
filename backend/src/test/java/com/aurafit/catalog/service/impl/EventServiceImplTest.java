package com.aurafit.catalog.service.impl;

import com.aurafit.business.catalog.dto.request.EventCostumeAssignRequest;
import com.aurafit.business.catalog.dto.request.EventCreateRequest;
import com.aurafit.business.catalog.dto.request.EventUpdateRequest;
import com.aurafit.business.catalog.dto.response.EventBannerResponse;
import com.aurafit.business.catalog.dto.response.EventResponse;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.Event;
import com.aurafit.business.catalog.entity.EventCostume;
import com.aurafit.business.catalog.enums.CostumeStatus;
import com.aurafit.business.catalog.enums.EventStatus;
import com.aurafit.business.catalog.service.impl.EventServiceImpl;
import com.aurafit.common.exception.BadRequestException;
import com.aurafit.common.exception.ResourceNotFoundException;
import com.aurafit.business.catalog.repository.CostumeRepository;
import com.aurafit.business.catalog.repository.EventCostumeRepository;
import com.aurafit.business.catalog.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private EventCostumeRepository eventCostumeRepository;

    @Mock
    private CostumeRepository costumeRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    @Test
    void createEvent_shouldRejectInvalidDateRange() {
        LocalDateTime startDate = LocalDateTime.now().plusDays(2);
        EventCreateRequest request = createRequest(startDate, startDate);

        assertThrows(BadRequestException.class, () -> eventService.createEvent(request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createEvent_shouldRejectMissingDiscount() {
        LocalDateTime startDate = LocalDateTime.now().plusDays(2);
        EventCreateRequest request = new EventCreateRequest(
                "Summer Sale",
                null,
                null,
                null,
                null,
                null,
                startDate,
                startDate.plusDays(7),
                null
        );

        assertThrows(BadRequestException.class, () -> eventService.createEvent(request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createEvent_shouldNormalizeSlugAndDefaultStatus() {
        LocalDateTime startDate = LocalDateTime.now().plusDays(2);
        EventCreateRequest request = createRequest(startDate, startDate.plusDays(7));
        when(eventRepository.findBySlug("summer-sale-2026")).thenReturn(Optional.empty());
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event event = invocation.getArgument(0);
            event.setId(12L);
            return event;
        });

        EventResponse response = eventService.createEvent(request);

        ArgumentCaptor<Event> eventCaptor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(eventCaptor.capture());
        assertEquals("Summer Sale 2026", eventCaptor.getValue().getName());
        assertEquals("summer-sale-2026", eventCaptor.getValue().getSlug());
        assertEquals("https://cdn.example.com/event-wide.jpg", eventCaptor.getValue().getBannerImageUrl());
        assertEquals("https://cdn.example.com/event-side.jpg", eventCaptor.getValue().getSideBannerImageUrl());
        assertEquals(EventStatus.DRAFT, eventCaptor.getValue().getStatus());
        assertEquals(12L, response.id());
        assertEquals("https://cdn.example.com/event-wide.jpg", response.bannerImageUrl());
        assertEquals("https://cdn.example.com/event-side.jpg", response.sideBannerImageUrl());
    }

    @Test
    void createEvent_shouldRejectPastStartDate() {
        LocalDateTime startDate = LocalDateTime.now().minusDays(1);
        EventCreateRequest request = createRequest(startDate, startDate.plusDays(7));

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> eventService.createEvent(request)
        );

        assertEquals("Thời gian bắt đầu không được nằm trong quá khứ.", exception.getMessage());
        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void updateEvent_shouldRejectChangedPastStartDate() {
        LocalDateTime referenceTime = LocalDateTime.now();
        Event event = Event.builder()
                .id(10L)
                .name("Upcoming Sale")
                .slug("upcoming-sale")
                .discountPercent(new BigDecimal("20"))
                .startDate(referenceTime.plusDays(2))
                .endDate(referenceTime.plusDays(5))
                .status(EventStatus.DRAFT)
                .build();
        EventUpdateRequest request = new EventUpdateRequest(
                null,
                null,
                null,
                null,
                null,
                null,
                referenceTime.minusDays(1),
                null,
                null
        );
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        assertThrows(BadRequestException.class, () -> eventService.updateEvent(10L, request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void updateEvent_shouldAllowKeepingOriginalPastStartDate() {
        LocalDateTime referenceTime = LocalDateTime.now();
        Event event = Event.builder()
                .id(10L)
                .name("Ongoing Sale")
                .slug("ongoing-sale")
                .discountPercent(new BigDecimal("20"))
                .startDate(referenceTime.minusDays(1).withSecond(37))
                .endDate(referenceTime.plusDays(1).withSecond(42))
                .status(EventStatus.ACTIVE)
                .build();
        EventUpdateRequest request = new EventUpdateRequest(
                "Ongoing Sale Updated",
                null,
                null,
                null,
                null,
                null,
                event.getStartDate().truncatedTo(ChronoUnit.MINUTES),
                event.getEndDate().truncatedTo(ChronoUnit.MINUTES),
                null
        );
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventCostumeRepository.findAllByEventIdWithCostumes(10L)).thenReturn(List.of());

        EventResponse response = eventService.updateEvent(10L, request);

        assertEquals("Ongoing Sale Updated", response.name());
        verify(eventRepository).save(event);
    }

    @Test
    void getUpcomingAndActiveEvents_shouldReturnOngoingFlagAndApplyLimit() {
        LocalDateTime referenceTime = LocalDateTime.now();
        Event ongoingEvent = Event.builder()
                .id(1L)
                .name("Đang diễn ra")
                .slug("dang-dien-ra")
                .bannerImageUrl("https://cdn.example.com/ongoing-wide.jpg")
                .sideBannerImageUrl("https://cdn.example.com/ongoing-side.jpg")
                .discountPercent(new BigDecimal("20"))
                .startDate(referenceTime.minusDays(1))
                .endDate(referenceTime.plusDays(1))
                .status(EventStatus.ACTIVE)
                .build();
        Event upcomingEvent = Event.builder()
                .id(2L)
                .name("Sắp diễn ra")
                .slug("sap-dien-ra")
                .discountPercent(new BigDecimal("15"))
                .startDate(referenceTime.plusDays(2))
                .endDate(referenceTime.plusDays(5))
                .status(EventStatus.ACTIVE)
                .build();

        when(eventRepository.findUpcomingAndActiveEvents(
                eq(EventStatus.ACTIVE),
                any(LocalDateTime.class),
                eq(PageRequest.of(0, 2))
        )).thenReturn(List.of(ongoingEvent, upcomingEvent));

        List<EventBannerResponse> responses = eventService.getUpcomingAndActiveEvents(2);

        assertEquals(List.of(1L, 2L), responses.stream().map(EventBannerResponse::id).toList());
        assertEquals("https://cdn.example.com/ongoing-wide.jpg", responses.get(0).bannerImageUrl());
        assertEquals("https://cdn.example.com/ongoing-side.jpg", responses.get(0).sideBannerImageUrl());
        assertTrue(responses.get(0).isOngoing());
        assertFalse(responses.get(1).isOngoing());
    }

    @Test
    void getPublicEventBySlug_shouldReturnOnlyActiveCostumesWithCalculatedPrice() {
        LocalDateTime referenceTime = LocalDateTime.now();
        Event event = Event.builder()
                .id(10L)
                .name("Mid-year Sale")
                .slug("mid-year-sale")
                .discountPercent(new BigDecimal("20"))
                .startDate(referenceTime.minusDays(1))
                .endDate(referenceTime.plusDays(1))
                .status(EventStatus.ACTIVE)
                .build();
        Costume activeCostume = Costume.builder()
                .id(21L)
                .name("Evening Dress")
                .slug("evening-dress")
                .imageUrl("https://cdn.example.com/dress.jpg")
                .rentalPrice(new BigDecimal("500000"))
                .status(CostumeStatus.ACTIVE)
                .build();
        Costume inactiveCostume = Costume.builder()
                .id(22L)
                .name("Archived Dress")
                .rentalPrice(new BigDecimal("400000"))
                .status(CostumeStatus.INACTIVE)
                .build();
        EventCostume activeAssignment = EventCostume.builder()
                .id(31L)
                .event(event)
                .costume(activeCostume)
                .discountPercentOverride(new BigDecimal("25"))
                .build();
        EventCostume inactiveAssignment = EventCostume.builder()
                .id(32L)
                .event(event)
                .costume(inactiveCostume)
                .build();

        when(eventRepository.findBySlug("mid-year-sale")).thenReturn(Optional.of(event));
        when(eventCostumeRepository.findAllByEventIdWithCostumes(10L))
                .thenReturn(List.of(activeAssignment, inactiveAssignment));

        EventResponse response = eventService.getPublicEventBySlug("mid-year-sale");

        assertEquals(1, response.costumes().size());
        EventResponse.AssignedCostume costume = response.costumes().get(0);
        assertEquals(21L, costume.costumeId());
        assertEquals("https://cdn.example.com/dress.jpg", costume.imageUrl());
        assertEquals(new BigDecimal("25"), costume.appliedDiscountPercent());
        assertEquals(new BigDecimal("375000"), costume.finalPrice());
    }

    @Test
    void getPublicEventBySlug_shouldHideDraftEvent() {
        LocalDateTime referenceTime = LocalDateTime.now();
        Event draftEvent = Event.builder()
                .id(10L)
                .name("Draft Sale")
                .slug("draft-sale")
                .discountPercent(new BigDecimal("20"))
                .startDate(referenceTime.plusDays(1))
                .endDate(referenceTime.plusDays(5))
                .status(EventStatus.DRAFT)
                .build();
        when(eventRepository.findBySlug("draft-sale")).thenReturn(Optional.of(draftEvent));

        assertThrows(
                ResourceNotFoundException.class,
                () -> eventService.getPublicEventBySlug("draft-sale")
        );
        verify(eventCostumeRepository, never()).findAllByEventIdWithCostumes(any());
    }

    @Test
    void assignCostumes_shouldUpdateExistingAndCreateMissingAssignments() {
        Event event = Event.builder().id(7L).name("Summer Sale").build();
        Costume firstCostume = Costume.builder().id(21L).name("Áo dài đỏ").build();
        Costume secondCostume = Costume.builder().id(22L).name("Váy dạ hội").build();
        EventCostume existingAssignment = EventCostume.builder()
                .id(31L)
                .event(event)
                .costume(firstCostume)
                .discountPercentOverride(new BigDecimal("5"))
                .build();

        when(eventRepository.findById(7L)).thenReturn(Optional.of(event));
        when(costumeRepository.findAllById(List.of(21L, 22L)))
                .thenReturn(List.of(firstCostume, secondCostume));
        when(eventCostumeRepository.findAllByEventIdWithCostumes(7L))
                .thenReturn(List.of(existingAssignment))
                .thenReturn(List.of(existingAssignment));

        eventService.assignCostumes(7L, List.of(
                new EventCostumeAssignRequest(21L, new BigDecimal("15")),
                new EventCostumeAssignRequest(22L, null)
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<EventCostume>> assignmentsCaptor = ArgumentCaptor.forClass(List.class);
        verify(eventCostumeRepository).saveAll(assignmentsCaptor.capture());
        List<EventCostume> savedAssignments = assignmentsCaptor.getValue();
        assertEquals(2, savedAssignments.size());
        assertEquals(new BigDecimal("15"), savedAssignments.get(0).getDiscountPercentOverride());
        assertEquals(31L, savedAssignments.get(0).getId());
        assertEquals(22L, savedAssignments.get(1).getCostume().getId());
    }

    @Test
    void assignCostumes_shouldRejectInvalidOverride() {
        Event event = Event.builder().id(7L).name("Summer Sale").build();
        when(eventRepository.findById(7L)).thenReturn(Optional.of(event));

        assertThrows(
                BadRequestException.class,
                () -> eventService.assignCostumes(
                        7L,
                        List.of(new EventCostumeAssignRequest(21L, new BigDecimal("100.01")))
                )
        );

        verify(costumeRepository, never()).findAllById(any());
        verify(eventCostumeRepository, never()).saveAll(any());
    }

    private EventCreateRequest createRequest(LocalDateTime startDate, LocalDateTime endDate) {
        return new EventCreateRequest(
                " Summer Sale 2026 ",
                null,
                "Ưu đãi mùa hè",
                "https://cdn.example.com/event-wide.jpg",
                "https://cdn.example.com/event-side.jpg",
                new BigDecimal("20"),
                startDate,
                endDate,
                null
        );
    }
}
