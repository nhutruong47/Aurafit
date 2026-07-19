


//
package com.aurafit.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

    @PostMapping("/sepay-webhooks")
    @Operation(summary = "Receive SePay Webhook")
    public ResponseEntity<WebhookResponse> handleSePayWebhook(
            @RequestHeader("X-SePay-Auth-Token") String token,
            @Valid @RequestBody SePayWebhookRequest body
    ) {
        paymentService.processSePayWebhook(body, token);
        return ResponseEntity.ok(new WebhookResponse(200, "Success"));
    }

        public String getContent() {
                return content != null ? content : "";
        }

        public String getCode() {
                return code != null ? code : "";
        }
}
