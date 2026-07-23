package com.aurafit.common.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> {

    private boolean success;
    private int status;
    private String message;
    private T data;
    private LocalDateTime timestamp;

    public static <T> ApiResponse<T> success(String message, T data) {
        return success(message, data, HttpStatus.OK);
    }

    public static ApiResponse<Void> success(String message, HttpStatus status) {
        return success(message, null, status);
    }

    public static <T> ApiResponse<T> success(String message, T data, HttpStatus status) {
        return ApiResponse.<T>builder()
                .success(true)
                .status(status.value())
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    public static ApiResponse<Void> error(String message, HttpStatus status) {
        return error(message, null, status);
    }

    public static <T> ApiResponse<T> error(String message, T data, HttpStatus status) {
        return ApiResponse.<T>builder()
                .success(false)
                .status(status.value())
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
}
