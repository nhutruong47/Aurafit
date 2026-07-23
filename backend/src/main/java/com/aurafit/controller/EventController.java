package com.aurafit.controller;

import com.aurafit.dto.request.EventCostumeAssignRequest;
import com.aurafit.dto.request.EventCreateRequest;
import com.aurafit.dto.request.EventUpdateRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.EventBannerResponse;
import com.aurafit.dto.response.EventResponse;
import com.aurafit.service.EventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api")
@Tag(name = "Event", description = "Event and discount management endpoints")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/admin/events")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy danh sách event quản trị")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getAdminEvents(
            @RequestParam(required = false) String status
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách sự kiện thành công.",
                eventService.getAdminEvents(status)
        ));
    }

    @PostMapping("/admin/events")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo event mới")
    public ResponseEntity<ApiResponse<EventResponse>> createEvent(
            @Valid @RequestBody EventCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                "Tạo sự kiện thành công.",
                eventService.createEvent(request),
                HttpStatus.CREATED
        ));
    }

    @PutMapping("/admin/events/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật event")
    public ResponseEntity<ApiResponse<EventResponse>> updateEvent(
            @PathVariable Long id,
            @Valid @RequestBody EventUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật sự kiện thành công.",
                eventService.updateEvent(id, request)
        ));
    }

    @DeleteMapping("/admin/events/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa event")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sự kiện thành công.", HttpStatus.OK));
    }

    @PostMapping("/admin/events/{id}/costumes")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gán hoặc cập nhật costume trong event")
    public ResponseEntity<ApiResponse<EventResponse>> assignCostumes(
            @PathVariable Long id,
            @NotEmpty(message = "Danh sách costume không được để trống")
            @RequestBody List<@Valid EventCostumeAssignRequest> requests
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật costume của sự kiện thành công.",
                eventService.assignCostumes(id, requests)
        ));
    }

    @DeleteMapping("/admin/events/{id}/costumes/{costumeId}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gỡ costume khỏi event")
    public ResponseEntity<ApiResponse<Void>> removeCostume(
            @PathVariable Long id,
            @PathVariable Long costumeId
    ) {
        eventService.removeCostume(id, costumeId);
        return ResponseEntity.ok(ApiResponse.success(
                "Đã gỡ costume khỏi sự kiện.",
                HttpStatus.OK
        ));
    }

    @GetMapping("/events/active")
    @Operation(summary = "Lấy các event đang hoạt động")
    public ResponseEntity<ApiResponse<List<EventResponse>>> getActiveEvents() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách sự kiện đang hoạt động thành công.",
                eventService.getActiveEvents()
        ));
    }

    @GetMapping("/events/upcoming-and-active")
    @Operation(summary = "Lấy event đang diễn ra và sắp diễn ra cho banner public")
    public ResponseEntity<ApiResponse<List<EventBannerResponse>>> getUpcomingAndActiveEvents(
            @RequestParam(defaultValue = "2")
            @Positive(message = "Limit phải lớn hơn 0") int limit
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách sự kiện nổi bật thành công.",
                eventService.getUpcomingAndActiveEvents(limit)
        ));
    }

    @GetMapping("/events/{slug}")
    @Operation(summary = "Lấy chi tiết event public theo slug")
    public ResponseEntity<ApiResponse<EventResponse>> getPublicEventBySlug(
            @PathVariable String slug
    ) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy chi tiết chương trình thành công.",
                eventService.getPublicEventBySlug(slug)
        ));
    }
}
