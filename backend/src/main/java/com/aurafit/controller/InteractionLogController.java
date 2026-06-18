package com.aurafit.controller;

import com.aurafit.dto.CreateInteractionLogRequest;
import com.aurafit.service.InteractionLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interactions")
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
@RequiredArgsConstructor
public class InteractionLogController {

    private final InteractionLogService interactionLogService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void logInteraction(@Valid @RequestBody CreateInteractionLogRequest request) {
        interactionLogService.log(request);
    }
}
