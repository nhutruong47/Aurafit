package com.aurafit.dto.request;

import lombok.Data;

@Data
public class TryOnResultRequest {

    private String generatedImageUrl;

    private String status;

    private String errorMessage;
}
