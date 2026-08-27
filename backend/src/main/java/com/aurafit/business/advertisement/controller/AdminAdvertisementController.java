package com.aurafit.business.advertisement.controller;

import com.aurafit.business.advertisement.dto.AdvertisementDto;
import com.aurafit.business.advertisement.dto.AdvertisementRequest;
import com.aurafit.business.advertisement.service.AdvertisementService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/advertisements")
public class AdminAdvertisementController {

    private final AdvertisementService service;

    public AdminAdvertisementController(AdvertisementService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AdvertisementDto>> getAllAds() {
        return ResponseEntity.ok(service.getAllAds());
    }

    @PostMapping
    public ResponseEntity<AdvertisementDto> createAd(@Valid @RequestBody AdvertisementRequest request) {
        return ResponseEntity.ok(service.createAd(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdvertisementDto> updateAd(@PathVariable Long id, @Valid @RequestBody AdvertisementRequest request) {
        return ResponseEntity.ok(service.updateAd(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAd(@PathVariable Long id) {
        service.deleteAd(id);
        return ResponseEntity.noContent().build();
    }
}
