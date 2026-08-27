package com.aurafit.business.advertisement.service;

import com.aurafit.business.advertisement.dto.AdvertisementDto;
import com.aurafit.business.advertisement.dto.AdvertisementRequest;
import com.aurafit.business.advertisement.entity.AdPosition;
import com.aurafit.business.advertisement.entity.Advertisement;
import com.aurafit.business.advertisement.repository.AdvertisementRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AdvertisementService {

    private final AdvertisementRepository repository;

    public AdvertisementService(AdvertisementRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AdvertisementDto> getAllAds() {
        return repository.findAll().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdvertisementDto> getActiveAds() {
        return repository.findByIsActiveTrueOrderByDisplayOrderAsc().stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public AdvertisementDto createAd(AdvertisementRequest request) {
        Advertisement ad = new Advertisement();
        mapToEntity(request, ad);
        ad = repository.save(ad);
        return mapToDto(ad);
    }

    public AdvertisementDto updateAd(Long id, AdvertisementRequest request) {
        Advertisement ad = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ad not found"));
        mapToEntity(request, ad);
        return mapToDto(repository.save(ad));
    }

    public void deleteAd(Long id) {
        repository.deleteById(id);
    }

    private void mapToEntity(AdvertisementRequest request, Advertisement ad) {
        ad.setName(request.getName());
        ad.setDescription(request.getDescription());
        ad.setImageUrl(request.getImageUrl());
        ad.setTargetUrl(request.getTargetUrl());
        ad.setPosition(request.getPosition());
        if (request.getIsActive() != null) {
            ad.setIsActive(request.getIsActive());
        }
        if (request.getDisplayOrder() != null) {
            ad.setDisplayOrder(request.getDisplayOrder());
        }
    }

    private AdvertisementDto mapToDto(Advertisement ad) {
        AdvertisementDto dto = new AdvertisementDto();
        dto.setId(ad.getId());
        dto.setName(ad.getName());
        dto.setDescription(ad.getDescription());
        dto.setImageUrl(ad.getImageUrl());
        dto.setTargetUrl(ad.getTargetUrl());
        dto.setPosition(ad.getPosition());
        dto.setIsActive(ad.getIsActive());
        dto.setDisplayOrder(ad.getDisplayOrder());
        dto.setCreatedAt(ad.getCreatedAt());
        return dto;
    }
}
