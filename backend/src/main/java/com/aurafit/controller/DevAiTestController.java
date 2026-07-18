package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.service.stylist.GeminiClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev")
public class DevAiTestController {

    private final GeminiClient geminiClient;

    public DevAiTestController(GeminiClient geminiClient) {
        this.geminiClient = geminiClient;
    }

    // TODO: remove after Phase 0 verification
    @GetMapping("/ai-ping")
    public ResponseEntity<ApiResponse<String>> pingGemini() {
        String response = geminiClient.generateText("", "Say hello in Vietnamese");
        return ResponseEntity.ok(ApiResponse.success("Gemini connection verified.", response));
    }
}
