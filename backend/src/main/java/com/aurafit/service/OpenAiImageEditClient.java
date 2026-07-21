package com.aurafit.service;

import com.aurafit.config.OpenAiProperties;
import com.aurafit.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

@Component
public class OpenAiImageEditClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiImageEditClient.class);
    private static final String EDITS_URL = "https://api.openai.com/v1/images/edits";
    private static final String STRICT_RULES = """
            STRICT RULES:
            Replace ONLY the clothing with the provided garment.
            Do NOT modify: face, eyes, nose, lips, skin tone, hairstyle, body shape, body proportions, age, gender, pose, camera angle, lighting, shadows, image composition, crop, background, furniture, accessories.
            Preserve pixel-level consistency wherever clothing is not present.
            The output must appear as if the original photograph was taken while wearing the new clothing.
            Do NOT regenerate the person. Do NOT beautify. Do NOT retouch. Do NOT enhance the face.
            Only replace the clothing. Everything else must remain identical.
            OUTPUT DIMENSIONS: The output image MUST have the exact same dimensions (width × height in pixels), aspect ratio, framing, and crop as the original input photo. Do NOT zoom in. Do NOT zoom out. Do NOT reframe. Do NOT change the canvas size. Do NOT add or remove padding. The composition must be a 1:1 pixel-perfect match of the original frame.
            """;

    private final OpenAiProperties openAiProperties;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;
    private final HttpClient httpClient;

    public OpenAiImageEditClient(OpenAiProperties openAiProperties, ObjectMapper objectMapper) {
        this.openAiProperties = openAiProperties;
        this.objectMapper = objectMapper;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(openAiProperties.getConnectTimeoutMs());
        factory.setReadTimeout(openAiProperties.getReadTimeoutMs());
        this.restTemplate = new RestTemplate(factory);

        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(openAiProperties.getConnectTimeoutMs()))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public String generateTryOnImage(MultipartFile personImage, String garmentImageUrl, String productName) {
        String apiKey = openAiProperties.getApiKey();
        if (!StringUtils.hasText(apiKey)) {
            throw new BadRequestException("OpenAI API key chưa được cấu hình (OPENAI_API_KEY).");
        }
        if (personImage == null || personImage.isEmpty()) {
            throw new BadRequestException("Thiếu ảnh của bạn");
        }



        Optional<NamedImage> garmentImage = fetchGarmentImage(garmentImageUrl);
        String garmentDesc = StringUtils.hasText(productName)
                ? "the clothing item named \"" + productName + "\""
                : "the clothing item";

        String prompt = garmentImage.isPresent()
                ? "Virtual clothing replacement only. Replace ONLY the clothing on the person in the first image with the garment shown in the second image.\n" + STRICT_RULES
                : "Virtual clothing replacement only. Replace ONLY the clothing on the person in the image with " + garmentDesc + ".\n" + STRICT_RULES;

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("model", openAiProperties.getImageModel());
            body.add("prompt", prompt);
            body.add("n", "1");
            body.add("size", openAiProperties.getImageSize());

            body.add(garmentImage.isPresent() ? "image[]" : "image", toNamedResource(personImage.getBytes(), "person.jpg", personImage.getContentType()));
            garmentImage.ifPresent(image -> body.add("image[]", toNamedResource(image.bytes(), image.filename(), image.contentType())));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(openAiProperties.getApiKey());

            ResponseEntity<String> response = restTemplate.postForEntity(
                    EDITS_URL,
                    new HttpEntity<>(body, headers),
                    String.class
            );

            return extractResultUrl(response.getBody());
        } catch (HttpStatusCodeException ex) {
            String errText = ex.getResponseBodyAsString();
            log.error("OpenAI Images Edit failed: status={} body={}", ex.getStatusCode(), errText);
            throw new BadRequestException(mapOpenAiError(errText));
        } catch (IOException ex) {
            throw new BadRequestException("Không đọc được ảnh tải lên.");
        } catch (Exception ex) {
            log.error("OpenAI Images Edit unexpected error", ex);
            throw new BadRequestException("AI xử lý thất bại. Vui lòng thử lại.");
        }
    }

    private Optional<NamedImage> fetchGarmentImage(String garmentImageUrl) {
        if (!StringUtils.hasText(garmentImageUrl)) {
            return Optional.empty();
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(garmentImageUrl.trim()))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", "Mozilla/5.0 (compatible; VirtualTryOn/1.0)")
                    .header("Accept", "image/*, */*")
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Garment fetch failed: status={} url={}", response.statusCode(), garmentImageUrl);
                return Optional.empty();
            }

            String contentType = response.headers().firstValue("content-type").orElse("image/jpeg");
            if (!contentType.startsWith("image/")) {
                log.warn("Garment non-image content-type: {}", contentType);
                return Optional.empty();
            }

            return Optional.of(new NamedImage(response.body(), "garment.jpg", contentType));
        } catch (Exception ex) {
            log.warn("Garment fetch error (fallback to prompt-only): {}", ex.getMessage());
            return Optional.empty();
        }
    }

    private ByteArrayResource toNamedResource(byte[] bytes, String filename, String contentType) {
        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return filename;
            }
        };
    }

    private String extractResultUrl(String responseBody) throws IOException {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode first = root.path("data").path(0);
        String url = first.path("url").asText(null);
        String b64 = first.path("b64_json").asText(null);

        if (StringUtils.hasText(url)) {
            return url;
        }
        if (StringUtils.hasText(b64)) {
            return "data:image/png;base64," + b64;
        }
        throw new BadRequestException("AI không trả về kết quả");
    }

    private String mapOpenAiError(String errText) {
        try {
            JsonNode errJson = objectMapper.readTree(errText);
            String code = errJson.path("error").path("code").asText("");
            if ("content_policy_violation".equals(code)) {
                return "Ảnh không phù hợp với chính sách AI. Vui lòng dùng ảnh khác.";
            }
            if ("billing_hard_limit_reached".equals(code)) {
                return "Tài khoản AI đã hết hạn mức. Vui lòng liên hệ hỗ trợ.";
            }
        } catch (Exception ignored) {
            // fall through
        }
        return "AI xử lý thất bại. Vui lòng thử lại.";
    }

    private record NamedImage(byte[] bytes, String filename, String contentType) {
    }
}
