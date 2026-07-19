package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SePayWebhookRequest(
        @JsonProperty("id")
        Long sePayId,

        String gateway,

        @JsonProperty("transactionDate")
        String transactionDate,

        @JsonProperty("accountNumber")
        String accountNumber,

        String subAccount,

        // code có thể null - dùng wrapper type
        @JsonProperty("code")
        String code,

        String content,

        @JsonProperty("transferType")
        String transferType,

        String description,

        // transferAmount - SePay gửi camelCase
        @JsonProperty("transferAmount")
        BigDecimal transferAmount,

        @JsonProperty("amount")
        BigDecimal amount,

        @JsonProperty("accumulated")
        BigDecimal accumulated,

        @JsonProperty("referenceCode")
        String referenceCode,

        // Legacy fields (không bắt buộc)
        @JsonProperty("from_account")
        String fromAccount,

        @JsonProperty("from_bank")
        String fromBank,

        @JsonProperty("to_account")
        String toAccount,

        String status
) {
        public BigDecimal getTransferAmount() {
                if (transferAmount != null) return transferAmount;
                if (amount != null) return amount;
                return BigDecimal.ZERO;
        }

        public String getContent() {
                return content != null ? content : "";
        }

        public String getCode() {
                return code != null ? code : "";
        }
}
