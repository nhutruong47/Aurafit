package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record SePayWebhookRequest(
        String gateway,

        @JsonProperty("transfer_amount")
        BigDecimal transferAmount,

        // SePay sends "amount" in some webhooks
        BigDecimal amount,

        @NotBlank
        String content,

        @NotBlank
        String code,

        @JsonProperty("accountNumber")
        String accountNumber,

        @JsonProperty("id")
        Long sePayId,

        @JsonProperty("from_account")
        String fromAccount,

        @JsonProperty("from_bank")
        String fromBank,

        @JsonProperty("to_account")
        String toAccount,

        @JsonProperty("transaction_date")
        String transactionDate,

        String status
) {
        // Helper method to get transfer amount (check both fields)
        public BigDecimal getTransferAmount() {
                return transferAmount != null ? transferAmount : amount;
        }
}
