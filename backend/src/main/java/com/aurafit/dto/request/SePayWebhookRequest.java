package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SePayWebhookRequest(
        @NotBlank
        String gateway,

        @NotNull
        @JsonProperty("transfer_amount")
        BigDecimal transferAmount,

        @NotBlank
        String content,

        @NotBlank
        String code
) {}
