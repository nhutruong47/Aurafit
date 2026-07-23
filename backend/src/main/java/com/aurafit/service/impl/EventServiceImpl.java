package com.aurafit.service.impl;

import com.aurafit.dto.request.EventCostumeAssignRequest;
import com.aurafit.dto.request.EventCreateRequest;
import com.aurafit.dto.request.EventUpdateRequest;
import com.aurafit.dto.response.EventBannerResponse;
import com.aurafit.dto.response.EventResponse;
import com.aurafit.entity.Costume;
import com.aurafit.entity.Event;
import com.aurafit.entity.EventCostume;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.EventStatus;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ConflictException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.EventCostumeRepository;
import com.aurafit.repository.EventRepository;
import com.aurafit.service.EventService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private static final BigDecimal MAX_DISCOUNT_PERCENT = new BigDecimal("100");

    private final EventRepository eventRepository;
    private final EventCostumeRepository eventCostumeRepository;
    private final CostumeRepository costumeRepository;

    public EventServiceImpl(
            EventRepository eventRepository,
            EventCostumeRepository eventCostumeRepository,
            CostumeRepository costumeRepository
    ) {
        this.eventRepository = eventRepository;
        this.eventCostumeRepository = eventCostumeRepository;
        this.costumeRepository = costumeRepository;
    }

    @Override
    public List<EventResponse> getAdminEvents(String status) {
        EventStatus resolvedStatus = parseOptionalStatus(status);
        List<Event> events = resolvedStatus == null
                ? eventRepository.findAllByOrderByCreatedAtDesc()
                : eventRepository.findByStatusOrderByCreatedAtDesc(resolvedStatus);
        return toResponses(events);
    }

    @Override
    public List<EventResponse> getActiveEvents() {
        return toResponses(eventRepository.findActiveEvents(EventStatus.ACTIVE, LocalDateTime.now()));
    }

    @Override
    public List<EventBannerResponse> getUpcomingAndActiveEvents(int limit) {
        LocalDateTime now = LocalDateTime.now();
        return eventRepository.findUpcomingAndActiveEvents(
                        EventStatus.ACTIVE,
                        now,
                        PageRequest.of(0, limit)
                )
                .stream()
                .map(event -> EventBannerResponse.fromEntity(event, now))
                .toList();
    }

    @Override
    public EventResponse getPublicEventBySlug(String slug) {
        LocalDateTime now = LocalDateTime.now();
        Event event = eventRepository.findBySlug(slug)
                .filter(candidate -> candidate.getStatus() == EventStatus.ACTIVE)
                .filter(candidate -> !candidate.getEndDate().isBefore(now))
                .orElseThrow(() -> new ResourceNotFoundException("Event", "slug", slug));

        List<EventCostume> publicAssignments = eventCostumeRepository
                .findAllByEventIdWithCostumes(event.getId())
                .stream()
                .filter(assignment -> assignment.getCostume().getStatus() == CostumeStatus.ACTIVE)
                .toList();
        return EventResponse.fromEntity(event, publicAssignments);
    }

    @Override
    @Transactional
    public EventResponse createEvent(EventCreateRequest request) {
        validateDateRange(request.startDate(), request.endDate());
        validateNewEventStartDate(request.startDate());
        if (request.discountPercent() == null) {
            throw new BadRequestException("Phần trăm giảm giá là bắt buộc.");
        }
        validateDiscountPercent(request.discountPercent(), "Phần trăm giảm giá");

        String name = requireName(request.name());
        String slug = resolveSlug(request.slug(), name);
        validateUniqueSlug(slug, null);

        Event event = Event.builder()
                .name(name)
                .slug(slug)
                .description(normalizeNullable(request.description()))
                .bannerImageUrl(normalizeNullable(request.bannerImageUrl()))
                .sideBannerImageUrl(normalizeNullable(request.sideBannerImageUrl()))
                .discountPercent(request.discountPercent())
                .startDate(request.startDate())
                .endDate(request.endDate())
                .status(parseStatusOrDefault(request.status()))
                .build();

        return EventResponse.fromEntity(eventRepository.save(event), List.of());
    }

    @Override
    @Transactional
    public EventResponse updateEvent(Long id, EventUpdateRequest request) {
        Event event = requireEvent(id);
        validateUpdatedEventDates(event, request);

        if (request.name() != null) {
            event.setName(requireName(request.name()));
        }
        if (request.slug() != null) {
            String slug = resolveSlug(request.slug(), event.getName());
            validateUniqueSlug(slug, event.getId());
            event.setSlug(slug);
        }
        if (request.description() != null) {
            event.setDescription(normalizeNullable(request.description()));
        }
        if (request.bannerImageUrl() != null) {
            event.setBannerImageUrl(normalizeNullable(request.bannerImageUrl()));
        }
        if (request.sideBannerImageUrl() != null) {
            event.setSideBannerImageUrl(normalizeNullable(request.sideBannerImageUrl()));
        }
        if (request.discountPercent() != null) {
            validateDiscountPercent(request.discountPercent(), "Phần trăm giảm giá");
            event.setDiscountPercent(request.discountPercent());
        }
        if (request.startDate() != null) {
            event.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            event.setEndDate(request.endDate());
        }
        if (request.status() != null) {
            event.setStatus(parseRequiredStatus(request.status()));
        }

        validateDateRange(event.getStartDate(), event.getEndDate());
        Event savedEvent = eventRepository.save(event);
        return EventResponse.fromEntity(
                savedEvent,
                eventCostumeRepository.findAllByEventIdWithCostumes(savedEvent.getId())
        );
    }

    @Override
    @Transactional
    public void deleteEvent(Long id) {
        eventRepository.delete(requireEvent(id));
    }

    @Override
    @Transactional
    public EventResponse assignCostumes(Long eventId, List<EventCostumeAssignRequest> requests) {
        Event event = requireEvent(eventId);
        if (requests == null || requests.isEmpty()) {
            throw new BadRequestException("Danh sách costume gán vào sự kiện không được để trống.");
        }

        Map<Long, EventCostumeAssignRequest> requestsByCostumeId = new LinkedHashMap<>();
        for (EventCostumeAssignRequest request : requests) {
            if (request == null || request.costumeId() == null) {
                throw new BadRequestException("Costume ID là bắt buộc.");
            }
            validateDiscountPercent(request.discountPercentOverride(), "Phần trăm giảm riêng");
            requestsByCostumeId.put(request.costumeId(), request);
        }

        List<Long> costumeIds = List.copyOf(requestsByCostumeId.keySet());
        Map<Long, Costume> costumesById = costumeRepository.findAllById(costumeIds).stream()
                .collect(Collectors.toMap(Costume::getId, costume -> costume));
        List<Long> missingCostumeIds = costumeIds.stream()
                .filter(costumeId -> !costumesById.containsKey(costumeId))
                .toList();
        if (!missingCostumeIds.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy costume với id: " + missingCostumeIds);
        }

        Map<Long, EventCostume> existingAssignments = eventCostumeRepository
                .findAllByEventIdWithCostumes(eventId)
                .stream()
                .collect(Collectors.toMap(
                        assignment -> assignment.getCostume().getId(),
                        assignment -> assignment
                ));

        List<EventCostume> assignmentsToSave = new ArrayList<>();
        requestsByCostumeId.forEach((costumeId, request) -> {
            EventCostume assignment = existingAssignments.getOrDefault(
                    costumeId,
                    EventCostume.builder()
                            .event(event)
                            .costume(costumesById.get(costumeId))
                            .build()
            );
            assignment.setDiscountPercentOverride(request.discountPercentOverride());
            assignmentsToSave.add(assignment);
        });
        eventCostumeRepository.saveAll(assignmentsToSave);

        return EventResponse.fromEntity(event, eventCostumeRepository.findAllByEventIdWithCostumes(eventId));
    }

    @Override
    @Transactional
    public void removeCostume(Long eventId, Long costumeId) {
        requireEvent(eventId);
        long deletedCount = eventCostumeRepository.deleteByEventIdAndCostumeId(eventId, costumeId);
        if (deletedCount == 0) {
            throw new ResourceNotFoundException(
                    "Costume " + costumeId + " chưa được gán vào event " + eventId + "."
            );
        }
    }

    private List<EventResponse> toResponses(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return List.of();
        }

        List<Long> eventIds = events.stream().map(Event::getId).toList();
        Map<Long, List<EventCostume>> assignmentsByEventId = eventCostumeRepository
                .findAllByEventIdsWithCostumes(eventIds)
                .stream()
                .collect(Collectors.groupingBy(
                        assignment -> assignment.getEvent().getId(),
                        LinkedHashMap::new,
                        Collectors.toList()
                ));

        return events.stream()
                .map(event -> EventResponse.fromEntity(
                        event,
                        assignmentsByEventId.getOrDefault(event.getId(), List.of())
                ))
                .toList();
    }

    private Event requireEvent(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event", "id", id));
    }

    private void validateUniqueSlug(String slug, Long currentEventId) {
        eventRepository.findBySlug(slug)
                .filter(existing -> !Objects.equals(existing.getId(), currentEventId))
                .ifPresent(existing -> {
                    throw new ConflictException("Slug sự kiện đã tồn tại: " + slug);
                });
    }

    private String requireName(String name) {
        if (!StringUtils.hasText(name)) {
            throw new BadRequestException("Tên sự kiện không được để trống.");
        }
        return name.trim();
    }

    private String resolveSlug(String requestedSlug, String name) {
        String source = StringUtils.hasText(requestedSlug) ? requestedSlug : name;
        String slug = Normalizer.normalize(
                        source.replace('Đ', 'D').replace('đ', 'd'),
                        Normalizer.Form.NFD
                )
                .replaceAll("\\p{M}", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "")
                .toLowerCase(Locale.ROOT);
        if (!StringUtils.hasText(slug)) {
            throw new BadRequestException("Slug sự kiện không hợp lệ.");
        }
        return slug;
    }

    private EventStatus parseOptionalStatus(String status) {
        if (!StringUtils.hasText(status) || "all".equalsIgnoreCase(status.trim())) {
            return null;
        }
        return parseRequiredStatus(status);
    }

    private EventStatus parseStatusOrDefault(String status) {
        return StringUtils.hasText(status) ? parseRequiredStatus(status) : EventStatus.DRAFT;
    }

    private EventStatus parseRequiredStatus(String status) {
        try {
            return EventStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Trạng thái sự kiện không hợp lệ: " + status);
        }
    }

    private void validateDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        if (startDate == null || endDate == null || !startDate.isBefore(endDate)) {
            throw new BadRequestException("Thời gian bắt đầu phải trước thời gian kết thúc.");
        }
    }

    private void validateNewEventStartDate(LocalDateTime startDate) {
        LocalDateTime currentMinute = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        if (startDate.isBefore(currentMinute)) {
            throw new BadRequestException("Thời gian bắt đầu không được nằm trong quá khứ.");
        }
    }

    private void validateUpdatedEventDates(Event event, EventUpdateRequest request) {
        LocalDateTime resolvedStartDate = request.startDate() != null
                ? request.startDate()
                : event.getStartDate();
        LocalDateTime resolvedEndDate = request.endDate() != null
                ? request.endDate()
                : event.getEndDate();
        validateDateRange(resolvedStartDate, resolvedEndDate);

        LocalDateTime currentMinute = LocalDateTime.now().truncatedTo(ChronoUnit.MINUTES);
        if (request.startDate() != null
                && request.startDate().isBefore(currentMinute)
                && !isSameMinute(request.startDate(), event.getStartDate())) {
            throw new BadRequestException(
                    "Không thể đổi thời gian bắt đầu sang một thời điểm trong quá khứ."
            );
        }
        if (request.endDate() != null
                && request.endDate().isBefore(currentMinute)
                && !isSameMinute(request.endDate(), event.getEndDate())) {
            throw new BadRequestException(
                    "Không thể đổi thời gian kết thúc sang một thời điểm trong quá khứ."
            );
        }
    }

    private boolean isSameMinute(LocalDateTime left, LocalDateTime right) {
        return left != null
                && right != null
                && left.truncatedTo(ChronoUnit.MINUTES)
                        .equals(right.truncatedTo(ChronoUnit.MINUTES));
    }

    private void validateDiscountPercent(BigDecimal discountPercent, String fieldLabel) {
        if (discountPercent == null) {
            return;
        }
        if (discountPercent.compareTo(BigDecimal.ZERO) <= 0
                || discountPercent.compareTo(MAX_DISCOUNT_PERCENT) > 0) {
            throw new BadRequestException(fieldLabel + " phải nằm trong khoảng (0, 100].");
        }
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
