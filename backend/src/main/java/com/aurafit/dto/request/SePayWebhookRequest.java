package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record SePayWebhookRequest(
        // SePay sends various field names, accept both
        String gateway,

        @JsonProperty("transfer_amount")
        BigDecimal transferAmount,

        // SePay also sends "amount" in some webhooks
        BigDecimal amount,

        @NotBlank
        String content,

        @NotBlank
        @JsonProperty("code")
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
        public BigDecimal resolvedTransferAmount() {
                return transferAmount != null ? transferAmount : amount;
        }
}
