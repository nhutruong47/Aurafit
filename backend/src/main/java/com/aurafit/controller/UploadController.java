package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.UploadAssetResponse;

import com.aurafit.service.UploadService;
import com.aurafit.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@Tag(name = "Uploads", description = "Authenticated image upload endpoints")
@SecurityRequirement(name = "bearerAuth")
public class UploadController {

    private final UploadService uploadService;
    private final UserService userService;

    public UploadController(UploadService uploadService, UserService userService) {
        this.uploadService = uploadService;
        this.userService = userService;
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @Operation(
            summary = "Upload an image to Cloudinary",
            description = "Accepts jpg, jpeg, png, or webp image files and stores their metadata in the database.",
            requestBody = @RequestBody(content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
    )
    public ResponseEntity<ApiResponse<UploadAssetResponse>> uploadImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        Long userId = extractUserId(authentication);
        UploadAssetResponse response = uploadService.uploadImage(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Image uploaded successfully.", response, HttpStatus.CREATED));
    }

    private Long extractUserId(Authentication authentication) {
        return userService.getUserIdByEmail(authentication.getName());
    }
}
