package com.aurafit.controller;

import com.aurafit.dto.CreateLessorApplicationRequest;
import com.aurafit.dto.LessorApplicationResponse;
import com.aurafit.dto.ReviewLessorApplicationRequest;
import com.aurafit.service.LessorApplicationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/lessor-applications")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class LessorApplicationController {

    private final LessorApplicationService lessorApplicationService;

    @GetMapping
    public List<LessorApplicationResponse> getApplications(@RequestParam(required = false) String status) {
        return lessorApplicationService.getApplications(status);
    }

    @GetMapping("/user/{userId}")
    public List<LessorApplicationResponse> getApplicationsByUser(@PathVariable Long userId) {
        return lessorApplicationService.getApplicationsByUser(userId);
    }

    @PostMapping
    public LessorApplicationResponse createApplication(@Valid @RequestBody CreateLessorApplicationRequest request) {
        return lessorApplicationService.createApplication(request);
    }

    @PostMapping("/{id}/approve")
    public LessorApplicationResponse approveApplication(
            @PathVariable Long id,
            @RequestBody ReviewLessorApplicationRequest request
    ) {
        return lessorApplicationService.approveApplication(id, request);
    }

    @PostMapping("/{id}/reject")
    public LessorApplicationResponse rejectApplication(
            @PathVariable Long id,
            @RequestBody ReviewLessorApplicationRequest request
    ) {
        return lessorApplicationService.rejectApplication(id, request);
    }
}
