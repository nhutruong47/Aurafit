package com.aurafit.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
public class ReplicateTryOnClient {

    private static final Logger log = LoggerFactory.getLogger(ReplicateTryOnClient.class);
    private static final String PREDICTIONS_URL = "https://api.replicate.com/v1/predictions";
    private static final String MODEL_VERSION = "0513734a452173b8173e907e3a59d19a36266e55b48528559432bd21c7d7e985";

    private final Cloudinary cloudinary;
    private final RestTemplate restTemplate;

    @Value("${REPLICATE_API_TOKEN:}")
    private String replicateApiToken;

    public ReplicateTryOnClient(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
        this.restTemplate = new RestTemplate();
    }

    public boolean isConfigured() {
        return StringUtils.hasText(replicateApiToken);
    }

    public String generateTryOnImage(MultipartFile personImage, String garmentImageUrl, String productName, String categoryName) {
        if (!isConfigured()) {
            throw new IllegalStateException("Replicate API token is not configured.");
        }

        // 1. Upload person's image to Cloudinary to get a public URL for Replicate
        String personImageUrl;
        try {
            log.info("Uploading person image to Cloudinary for Replicate input...");
            Map<?, ?> uploadResult = cloudinary.uploader().upload(personImage.getBytes(), ObjectUtils.asMap(
                    "folder", "aurafit/tryon_temp",
                    "resource_type", "image"
            ));
            personImageUrl = (String) uploadResult.get("secure_url");
            log.info("Uploaded person image to Cloudinary: {}", personImageUrl);
        } catch (IOException e) {
            log.error("Failed to upload person image to Cloudinary", e);
            throw new RuntimeException("Không thể tải ảnh của bạn lên server để xử lý.", e);
        }

        // 2. Determine try-on category (upper_body, lower_body, dresses)
        String category = "upper_body";
        if (StringUtils.hasText(categoryName)) {
            String lower = categoryName.toLowerCase();
            if (lower.contains("váy") || lower.contains("đầm") || lower.contains("dress") || 
                lower.contains("áo dài") || lower.contains("ao-dai") || lower.contains("traditional") || lower.contains("cổ phục")) {
                category = "dresses";
            } else if (lower.contains("quần") || lower.contains("pant") || lower.contains("skirt") || lower.contains("lower")) {
                category = "lower_body";
            }
        }
        log.info("Mapped product category '{}' to VTON category '{}'", categoryName, category);

        // 3. Prepare payload for Replicate
        Map<String, Object> input = new HashMap<>();
        input.put("human_img", personImageUrl);
        input.put("garm_img", garmentImageUrl);
        input.put("garment_des", StringUtils.hasText(productName) ? productName : "garment");
        input.put("category", category);
        input.put("crop", true); // Auto-crop if not 3:4 aspect ratio

        Map<String, Object> payload = new HashMap<>();
        payload.put("version", MODEL_VERSION);
        payload.put("input", input);

        // 4. Send request to Replicate to initiate prediction
        log.info("Initiating Replicate prediction for model: cuuupid/idm-vton");
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Token " + replicateApiToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.postForEntity(PREDICTIONS_URL, requestEntity, JsonNode.class);
        } catch (org.springframework.web.client.HttpStatusCodeException e) {
            log.error("Replicate prediction error", e);
            if (e.getStatusCode().value() == 402) {
                throw new RuntimeException("Tài khoản Replicate của bạn hết số dư hoặc cần liên kết thẻ thanh toán (402 Payment Required). Vui lòng nạp tiền tại https://replicate.com/account/billing");
            }
            if (e.getStatusCode().value() == 401) {
                throw new RuntimeException("Token Replicate không hợp lệ hoặc đã hết hạn (401 Unauthorized). Vui lòng kiểm tra lại token.");
            }
            throw new RuntimeException("AI xử lý thất bại: " + e.getStatusText());
        } catch (Exception e) {
            log.error("Failed to start Replicate prediction", e);
            throw new RuntimeException("Không thể kết nối đến máy chủ AI (Replicate).", e);
        }

        JsonNode body = response.getBody();
        if (body == null) {
            throw new RuntimeException("Phản hồi từ Replicate trống.");
        }

        String predictionId = body.path("id").asText();
        String getUrl = PREDICTIONS_URL + "/" + predictionId;
        String status = body.path("status").asText();
        log.info("Replicate prediction started: id={}, initial status={}", predictionId, status);

        // 5. Poll the prediction status until it finishes (succeeded / failed / canceled)
        int maxAttempts = 40; // Max 80 seconds
        int attempt = 0;
        JsonNode predictionNode = body;

        try {
            while (attempt < maxAttempts && ("starting".equals(status) || "processing".equals(status))) {
                Thread.sleep(2000); // Wait 2 seconds between polls
                attempt++;
                log.info("Polling Replicate prediction status (attempt {}/{})...", attempt, maxAttempts);

                HttpHeaders getHeaders = new HttpHeaders();
                getHeaders.set("Authorization", "Token " + replicateApiToken);
                HttpEntity<Void> getEntity = new HttpEntity<>(getHeaders);

                ResponseEntity<JsonNode> getResponse = restTemplate.exchange(getUrl, HttpMethod.GET, getEntity, JsonNode.class);
                predictionNode = getResponse.getBody();
                if (predictionNode != null) {
                    status = predictionNode.path("status").asText();
                }
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Quá trình thử đồ bị gián đoạn.", e);
        }

        log.info("Replicate prediction finished with status: {}", status);

        if ("succeeded".equals(status) && predictionNode != null) {
            JsonNode outputNode = predictionNode.get("output");
            if (outputNode != null) {
                if (outputNode.isArray() && outputNode.size() > 0) {
                    return outputNode.get(0).asText();
                } else if (outputNode.isTextual()) {
                    return outputNode.asText();
                }
            }
            throw new RuntimeException("Replicate không trả về kết quả hình ảnh.");
        } else {
            String errorMsg = predictionNode != null ? predictionNode.path("error").asText() : "";
            log.error("Replicate prediction failed or timed out: status={}, error={}", status, errorMsg);
            throw new RuntimeException("AI xử lý thất bại hoặc hết thời gian chờ: " + 
                    (StringUtils.hasText(errorMsg) ? errorMsg : status));
        }
    }
}
