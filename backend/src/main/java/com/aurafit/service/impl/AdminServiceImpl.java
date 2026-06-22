package com.aurafit.service.impl;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.ItemStatus;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.service.AdminService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;

    public AdminServiceImpl(CostumeRepository costumeRepository,
                            CategoryRepository categoryRepository) {
        this.costumeRepository = costumeRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<AdminCostumeDTO> getAllCostumes() {
        return costumeRepository.findAllWithItems().stream()
                .map(AdminCostumeDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public AdminCostumeDTO createCostume(CostumeCreateRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));

        Costume costume = Costume.builder()
                .name(request.name())
                .description(request.description())
                .rentalPrice(request.rentalPrice())
                .depositPrice(request.depositPrice())
                .imageUrl(request.imageUrl())
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .build();

        return AdminCostumeDTO.fromEntity(costumeRepository.save(costume));
    }

    @Override
    @Transactional
    public AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request) {
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));

        if (request.name() != null) costume.setName(request.name());
        if (request.description() != null) costume.setDescription(request.description());
        if (request.rentalPrice() != null) costume.setRentalPrice(request.rentalPrice());
        if (request.depositPrice() != null) costume.setDepositPrice(request.depositPrice());
        if (request.imageUrl() != null) costume.setImageUrl(request.imageUrl());
        if (request.categoryId() != null) {
            Category category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.categoryId()));
            costume.setCategory(category);
        }
        if (request.status() != null) {
            costume.setStatus(CostumeStatus.valueOf(request.status().toUpperCase()));
        }

        return AdminCostumeDTO.fromEntity(costumeRepository.save(costume));
    }
}
