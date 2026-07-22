package com.aurafit.service.impl;

import com.aurafit.dto.request.EventCostumeAssignRequest;
import com.aurafit.dto.request.EventCreateRequest;
import com.aurafit.dto.response.EventResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.Event;
import com.aurafit.entity.EventCostume;
import com.aurafit.enums.EventStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.EventCostumeRepository;
import com.aurafit.repository.EventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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
        LocalDateTime startDate = LocalDateTime.of(2026, 8, 10, 8, 0);
        EventCreateRequest request = createRequest(startDate, startDate);

        assertThrows(BadRequestException.class, () -> eventService.createEvent(request));

        verify(eventRepository, never()).save(any(Event.class));
    }

    @Test
    void createEvent_shouldRejectMissingDiscount() {
        LocalDateTime startDate = LocalDateTime.of(2026, 8, 10, 8, 0);
        EventCreateRequest request = new EventCreateRequest(
                "Summer Sale",
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
        LocalDateTime startDate = LocalDateTime.of(2026, 8, 10, 8, 0);
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
        assertEquals(EventStatus.DRAFT, eventCaptor.getValue().getStatus());
        assertEquals(12L, response.id());
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
                null,
                new BigDecimal("20"),
                startDate,
                endDate,
                null
        );
    }
}
