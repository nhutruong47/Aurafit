package com.aurafit.controller;

import com.aurafit.dto.request.TryOnRequest;
import com.aurafit.dto.request.TryOnResultRequest;
import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.TryOnGenerateResponse;
import com.aurafit.dto.response.TryOnResponse;
import com.aurafit.service.TryOnService;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/try-on")
@Tag(name = "Virtual Try-On", description = "AI virtual try-on and history")
public class TryOnController {

    private final TryOnService tryOnService;
    private final UserService userService;

    public TryOnController(TryOnService tryOnService, UserService userService) {
        this.tryOnService = tryOnService;
        this.userService = userService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Generate virtual try-on result via OpenAI Images Edit")
    public ResponseEntity<ApiResponse<TryOnGenerateResponse>> generate(
            Authentication authentication,
            @RequestParam("personImage") MultipartFile personImage,
            @RequestParam(value = "garmentImageUrl", required = false) String garmentImageUrl,
            @RequestParam(value = "productId", required = false) Long productId,
            @RequestParam(value = "productName", required = false) String productName
    ) {
        Long userId = resolveOptionalUserId(authentication);
        TryOnGenerateResponse response = tryOnService.generate(
                userId,
                personImage,
                garmentImageUrl,
                productId,
                productName
        );
        return ResponseEntity.ok(ApiResponse.success("Đã tạo kết quả thử đồ", response));
    }

    @PostMapping("/history")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a PENDING try-on history record")
    public ResponseEntity<ApiResponse<TryOnResponse>> createHistory(
            Authentication authentication,
            @Valid @RequestBody TryOnRequest request
    ) {
        Long userId = resolveRequiredUserId(authentication);
        TryOnResponse response = tryOnService.createRequest(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo yêu cầu thử đồ", response));
    }

    @PatchMapping("/history/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update try-on history with result")
    public ResponseEntity<ApiResponse<TryOnResponse>> updateResult(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody TryOnResultRequest request
    ) {
        Long userId = resolveRequiredUserId(authentication);
        TryOnResponse response = tryOnService.updateResult(userId, id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật kết quả thử đồ", response));
    }

    @GetMapping("/history")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get paginated try-on history for current user")
    public ResponseEntity<ApiResponse<Page<TryOnResponse>>> getHistory(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Long userId = resolveRequiredUserId(authentication);
        Page<TryOnResponse> history = tryOnService.getHistory(userId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lịch sử thử đồ", history));
    }

    @DeleteMapping("/history/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a try-on history record")
    public ResponseEntity<ApiResponse<Void>> deleteHistory(
            Authentication authentication,
            @PathVariable Long id
    ) {
        Long userId = resolveRequiredUserId(authentication);
        tryOnService.deleteHistory(userId, id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lịch sử thử đồ", null, HttpStatus.OK));
    }

    private Long resolveOptionalUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        return userService.getUserIdByEmail(authentication.getName());
    }

    private Long resolveRequiredUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }
}
