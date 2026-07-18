package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record SePayWebhookRequest(
        // SePay sends various field names, accept both
        String gateway,

        @JsonProperty("transfer_amount")
        BigDecimal transferAmount,

        // SePay also sends "amount" in some webhooks
        BigDecimal amount,

        // Content field - might be empty for test webhooks
        String content,

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
        public BigDecimal getTransferAmount() {
                if (transferAmount != null) return transferAmount;
                if (amount != null) return amount;
                // Default for test webhooks
                return BigDecimal.ZERO;
        }

        public String getContent() {
                return content != null ? content : "";
        }

        public String getCode() {
                return code != null ? code : "";
        }
}
