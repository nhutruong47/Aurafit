package com.aurafit.integration.ai;

import com.aurafit.enums.AiErrorType;
import com.aurafit.exception.AiProviderException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GeminiClientTest {

    @Test
    void generateText_shouldMap429ToRateLimitExceeded() {
        GeminiClient client = clientReturning(
                HttpStatus.TOO_MANY_REQUESTS,
                "{\"error\":{\"message\":\"quota exhausted\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.RATE_LIMIT_EXCEEDED, exception.getErrorType());
        assertEquals(
                "Hệ thống đang được nhiều người sử dụng, vui lòng thử lại sau ít phút",
                exception.getUserFriendlyMessage()
        );
    }

    @Test
    void generateText_shouldMap401ToAuthErrorWithoutExposingProviderDetails() {
        GeminiClient client = clientReturning(
                HttpStatus.UNAUTHORIZED,
                "{\"error\":{\"message\":\"API key is invalid\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.AUTH_ERROR, exception.getErrorType());
        assertEquals(
                "Hệ thống tư vấn AI đang tạm thời gián đoạn, vui lòng thử lại sau",
                exception.getUserFriendlyMessage()
        );
    }

    @Test
    void generateText_shouldMap403ToAuthError() {
        GeminiClient client = clientReturning(
                HttpStatus.FORBIDDEN,
                "{\"error\":{\"message\":\"request is not authorized\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.AUTH_ERROR, exception.getErrorType());
    }

    @Test
    void generateText_shouldMapUnclassified4xxToUnknown() {
        GeminiClient client = clientReturning(
                HttpStatus.NOT_FOUND,
                "{\"error\":{\"message\":\"model not found\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.UNKNOWN, exception.getErrorType());
        assertEquals("Có lỗi xảy ra, vui lòng thử lại", exception.getUserFriendlyMessage());
    }

    @Test
    void generateText_shouldMapInvalidProviderRequestToInvalidResponse() {
        GeminiClient client = clientReturning(
                HttpStatus.BAD_REQUEST,
                "{\"error\":{\"message\":\"unexpected model name format\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.INVALID_RESPONSE, exception.getErrorType());
    }

    @Test
    void generateText_shouldMapProvider5xxToProviderUnavailable() {
        GeminiClient client = clientReturning(
                HttpStatus.SERVICE_UNAVAILABLE,
                "{\"error\":{\"message\":\"temporarily unavailable\"}}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.PROVIDER_UNAVAILABLE, exception.getErrorType());
    }

    @Test
    void generateText_shouldMapTimeoutToTimeout() {
        WebClient.Builder builder = WebClient.builder()
                .exchangeFunction(request -> Mono.never());
        GeminiClient client = new GeminiClient(
                builder,
                "test-key",
                "test-model",
                "https://gemini.test",
                10,
                0,
                new ObjectMapper()
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.TIMEOUT, exception.getErrorType());
        assertEquals(
                "Phản hồi hơi lâu, bạn thử gửi lại câu hỏi nhé",
                exception.getUserFriendlyMessage()
        );
    }

    @Test
    void generateText_shouldMapMalformedProviderJsonToInvalidResponse() {
        GeminiClient client = clientReturning(HttpStatus.OK, "not-json");

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.INVALID_RESPONSE, exception.getErrorType());
    }

    @Test
    void generateText_shouldMapConnectionFailureToProviderUnavailable() {
        WebClient.Builder builder = WebClient.builder()
                .exchangeFunction(request -> Mono.error(new WebClientRequestException(
                        new ConnectException("connection refused"),
                        request.method(),
                        request.url(),
                        request.headers()
                )));
        GeminiClient client = new GeminiClient(
                builder,
                "test-key",
                "test-model",
                "https://gemini.test",
                1_000,
                0,
                new ObjectMapper()
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.PROVIDER_UNAVAILABLE, exception.getErrorType());
    }

    @Test
    void generateText_shouldRejectTruncatedMaxTokensResponse() {
        GeminiClient client = clientReturning(
                HttpStatus.OK,
                "{\"candidates\":[{\"content\":{\"parts\":[{\"text\":\"partial\"}]},\"finishReason\":\"MAX_TOKENS\"}]}"
        );

        AiProviderException exception = assertThrows(
                AiProviderException.class,
                () -> client.generateText("system", "user")
        );

        assertEquals(AiErrorType.INVALID_RESPONSE, exception.getErrorType());
    }

    @Test
    @SuppressWarnings("unchecked")
    void buildRequestBody_shouldApplyConfiguredThinkingBudget() {
        GeminiClient client = clientReturning(HttpStatus.OK, "{}");

        Map<String, Object> requestBody = ReflectionTestUtils.invokeMethod(
                client,
                "buildRequestBody",
                "system",
                "user",
                true,
                300
        );
        Map<String, Object> generationConfig = (Map<String, Object>) requestBody.get("generationConfig");

        assertEquals(Map.of("thinkingBudget", 0), generationConfig.get("thinkingConfig"));
    }

    @Test
    void constructor_shouldRemoveWhitespaceFromModelName() {
        GeminiClient client = new GeminiClient(
                WebClient.builder(),
                "test-key",
                "gemini-3   .5-flash",
                "https://gemini.test",
                1_000,
                0,
                new ObjectMapper()
        );

        assertEquals("gemini-3.5-flash", ReflectionTestUtils.getField(client, "model"));
    }

    private GeminiClient clientReturning(HttpStatus status, String responseBody) {
        WebClient.Builder builder = WebClient.builder()
                .exchangeFunction(request -> Mono.just(ClientResponse.create(status)
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .body(responseBody)
                        .build()));

        return new GeminiClient(
                builder,
                "test-key",
                "test-model",
                "https://gemini.test",
                1_000,
                0,
                new ObjectMapper()
        );
    }
}
