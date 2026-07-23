package com.aurafit.business.catalog.service.impl;

import com.aurafit.ai.enrichment.dto.request.CostumeMetadataUpsertRequest;
import com.aurafit.business.catalog.entity.Costume;
import com.aurafit.business.catalog.entity.CostumeMetadata;
import com.aurafit.business.catalog.repository.CostumeMetadataRepository;
import com.aurafit.business.catalog.service.CostumeMetadataService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class CostumeMetadataServiceImpl implements CostumeMetadataService {

    private final CostumeMetadataRepository costumeMetadataRepository;

    public CostumeMetadataServiceImpl(CostumeMetadataRepository costumeMetadataRepository) {
        this.costumeMetadataRepository = costumeMetadataRepository;
    }

    @Override
    public CostumeMetadata upsertMetadata(Costume costume, CostumeMetadataUpsertRequest request) {
        CostumeMetadata metadata = costume.getMetadata();
        if (metadata == null) {
            metadata = costumeMetadataRepository.findByCostumeId(costume.getId())
                    .orElseGet(CostumeMetadata::new);
            metadata.setCostume(costume);
            costume.setMetadata(metadata);
        }

        metadata.setStyle(normalize(request.style()));
        metadata.setOccasion(normalize(request.occasion()));
        metadata.setSeason(normalize(request.season()));
        metadata.setColor(normalize(request.color()));
        metadata.setTags(normalizeTags(request.tags()));
        metadata.setSkinTone(normalizeNullable(request.skinTone()));
        metadata.setBodyType(normalizeNullable(request.bodyType()));
        metadata.setGender(normalizeNullable(request.gender()));
        metadata.setSize(normalizeNullable(request.size()));
        metadata.setMaterial(normalizeNullable(request.material()));
        metadata.setFitNote(normalizeNullable(request.fitNote()));

        return costumeMetadataRepository.save(metadata);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> normalizeTags(List<String> tags) {
        return new ArrayList<>(tags.stream()
                .map(String::trim)
                .filter(tag -> !tag.isEmpty())
                .distinct()
                .toList());
    }
}
