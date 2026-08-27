package com.aurafit.business.advertisement.controller;

import com.aurafit.business.advertisement.dto.AdvertisementDto;
import com.aurafit.business.advertisement.service.AdvertisementService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/advertisements")
public class PublicAdvertisementController {

    private final AdvertisementService service;

    public PublicAdvertisementController(AdvertisementService service) {
        this.service = service;
    }

    @GetMapping("/active")
    public ResponseEntity<List<AdvertisementDto>> getActiveAds() {
        return ResponseEntity.ok(service.getActiveAds());
    }
}
