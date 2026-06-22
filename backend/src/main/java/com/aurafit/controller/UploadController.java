package com.aurafit.controller;

import com.aurafit.dto.response.UploadAssetResponse;
import com.aurafit.entity.User;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.UploadService;
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
    private final UserRepository userRepository;

    public UploadController(UploadService uploadService, UserRepository userRepository) {
        this.uploadService = uploadService;
        this.userRepository = userRepository;
    }

    @PostMapping(value = "/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'CUSTOMER')")
    @Operation(
            summary = "Upload an image to Cloudinary",
            description = "Accepts jpg, jpeg, png, or webp image files and stores their metadata in the database.",
            requestBody = @RequestBody(content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
    )
    public ResponseEntity<UploadAssetResponse> uploadImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file
    ) {
        Long userId = extractUserId(authentication);
        UploadAssetResponse response = uploadService.uploadImage(userId, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private Long extractUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return user.getId();
    }
}
