package com.aurafit.service.impl;

import com.aurafit.dto.request.CostumeCreateRequest;
import com.aurafit.dto.request.CostumeUpdateRequest;
import com.aurafit.dto.response.AdminCostumeDTO;
import com.aurafit.entity.Category;
import com.aurafit.entity.Costume;
import com.aurafit.entity.User;
import com.aurafit.enums.CostumeStatus;
import com.aurafit.enums.Role;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CategoryRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.AdminService;
import com.aurafit.service.CostumeMetadataService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private final CostumeRepository costumeRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final CostumeMetadataService costumeMetadataService;

    public AdminServiceImpl(CostumeRepository costumeRepository,
                            CategoryRepository categoryRepository,
                            UserRepository userRepository,
                            CostumeMetadataService costumeMetadataService) {
        this.costumeRepository = costumeRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.costumeMetadataService = costumeMetadataService;
    }

    @Override
    public com.aurafit.dto.response.PaginatedResponse<AdminCostumeDTO> getAllCostumes(String authenticatedEmail, int pageNo, int pageSize, String sortBy, String sortDir, String keyword, String statusStr, Long categoryId) {
        requireProductManager(authenticatedEmail);

        org.springframework.data.domain.Sort sort = sortDir.equalsIgnoreCase(org.springframework.data.domain.Sort.Direction.ASC.name())
                ? org.springframework.data.domain.Sort.by(sortBy).ascending()
                : org.springframework.data.domain.Sort.by(sortBy).descending();
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(pageNo, pageSize, sort);

        CostumeStatus status = null;
        if (statusStr != null && !statusStr.isBlank() && !statusStr.equalsIgnoreCase("all")) {
            try {
                status = CostumeStatus.valueOf(statusStr.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }

        String searchKeyword = (keyword != null && !keyword.isBlank()) ? keyword : null;

        org.springframework.data.domain.Page<Costume> page = costumeRepository.findAllForAdmin(status, categoryId, searchKeyword, pageable);

        List<AdminCostumeDTO> content = page.getContent().stream()
                .map(AdminCostumeDTO::fromEntity)
                .toList();

        return new com.aurafit.dto.response.PaginatedResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }

    @Override
    @Transactional
    public AdminCostumeDTO createCostume(CostumeCreateRequest request, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        Category category = requireLeafActiveCategory(request.categoryId());

        Costume costume = Costume.builder()
                .name(request.name())
                .slug(request.slug() != null && !request.slug().isBlank()
                        ? request.slug()
                        : generateSlug(request.name()))
                .description(request.description())
                .rentalPrice(request.rentalPrice())
                .depositPrice(request.depositPrice())
                .imageUrl(request.imageUrl())
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .build();

        Costume savedCostume = costumeRepository.save(costume);
        if (request.metadata() != null) {
            costumeMetadataService.upsertMetadata(savedCostume, request.metadata());
        }

        return AdminCostumeDTO.fromEntity(costumeRepository.findByIdWithItems(savedCostume.getId()).orElse(savedCostume));
    }

    @Override
    @Transactional
    public AdminCostumeDTO updateCostume(Long id, CostumeUpdateRequest request, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));

        if (request.name() != null) costume.setName(request.name());
        if (request.slug() != null) costume.setSlug(request.slug());
        if (request.description() != null) costume.setDescription(request.description());
        if (request.rentalPrice() != null) costume.setRentalPrice(request.rentalPrice());
        if (request.depositPrice() != null) costume.setDepositPrice(request.depositPrice());
        if (request.imageUrl() != null) costume.setImageUrl(request.imageUrl());
        if (request.categoryId() != null) {
            Category category = requireLeafActiveCategory(request.categoryId());
            costume.setCategory(category);
        }
        if (request.status() != null) {
            costume.setStatus(CostumeStatus.valueOf(request.status().toUpperCase()));
        }
        if (request.metadata() != null) {
            costumeMetadataService.upsertMetadata(costume, request.metadata());
        }

        return AdminCostumeDTO.fromEntity(costumeRepository.save(costume));
    }

    private User requireProductManager(String authenticatedEmail) {
        User actor = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new AccessDeniedException("Only admin or staff accounts can manage costumes.");
        }

        return actor;
    }

    private Category requireLeafActiveCategory(Long categoryId) {
        Category category = categoryRepository.findByIdAndIsActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục đang hoạt động với id: " + categoryId));

        if (!categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(categoryId).isEmpty()) {
            throw new BadRequestException("Chỉ có thể gắn trang phục vào danh mục cấp cuối.");
        }

        return category;
    }

    private String generateSlug(String name) {
        if (name == null || name.isBlank()) return "";
        return java.text.Normalizer.normalize(name, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("đ", "d").replaceAll("Đ", "D")
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .trim()
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
    }
}
