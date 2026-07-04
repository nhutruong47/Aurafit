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
    public List<AdminCostumeDTO> getAllCostumes(String authenticatedEmail) {
        User actor = requireProductManager(authenticatedEmail);
        List<Costume> costumes = actor.getRole() == Role.ADMIN
                ? costumeRepository.findAllWithItems()
                : costumeRepository.findAllByOwnerIdWithItems(actor.getId());

        return costumes.stream()
                .map(AdminCostumeDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public AdminCostumeDTO createCostume(CostumeCreateRequest request, String authenticatedEmail) {
        User actor = requireProductManager(authenticatedEmail);
        Category category = requireLeafActiveCategory(request.categoryId());
        User owner = resolveOwnerForCreate(actor, request.ownerUserId());

        Costume costume = Costume.builder()
                .name(request.name())
                .description(request.description())
                .rentalPrice(request.rentalPrice())
                .depositPrice(request.depositPrice())
                .imageUrl(request.imageUrl())
                .status(CostumeStatus.ACTIVE)
                .category(category)
                .owner(owner)
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
        User actor = requireProductManager(authenticatedEmail);
        Costume costume = costumeRepository.findByIdWithItems(id)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", id));
        ensureCanManageCostume(actor, costume);

        if (request.name() != null) costume.setName(request.name());
        if (request.description() != null) costume.setDescription(request.description());
        if (request.rentalPrice() != null) costume.setRentalPrice(request.rentalPrice());
        if (request.depositPrice() != null) costume.setDepositPrice(request.depositPrice());
        if (request.imageUrl() != null) costume.setImageUrl(request.imageUrl());
        if (request.categoryId() != null) {
            Category category = requireLeafActiveCategory(request.categoryId());
            costume.setCategory(category);
        }
        if (request.ownerUserId() != null) {
            costume.setOwner(resolveOwnerForUpdate(actor, request.ownerUserId()));
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

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.SELLER) {
            throw new AccessDeniedException("Only admin or seller accounts can manage costumes.");
        }

        return actor;
    }

    private User resolveOwnerForCreate(User actor, Long ownerUserId) {
        if (actor.getRole() == Role.SELLER) {
            return actor;
        }

        if (ownerUserId == null) {
            throw new BadRequestException("Admin must select a SELLER account as costume owner.");
        }

        return requireSellerOwner(ownerUserId);
    }

    private User resolveOwnerForUpdate(User actor, Long ownerUserId) {
        if (actor.getRole() == Role.SELLER) {
            if (!actor.getId().equals(ownerUserId)) {
                throw new AccessDeniedException("Seller accounts cannot transfer costumes to another account.");
            }
            return actor;
        }

        return requireSellerOwner(ownerUserId);
    }

    private User requireSellerOwner(Long ownerUserId) {
        User owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", ownerUserId));

        if (owner.getRole() != Role.SELLER) {
            throw new BadRequestException("Costume owner must be a SELLER account.");
        }

        return owner;
    }

    private void ensureCanManageCostume(User actor, Costume costume) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }

        if (costume.getOwner() == null || costume.getOwner().getId() == null ||
                !costume.getOwner().getId().equals(actor.getId())) {
            throw new AccessDeniedException("Seller accounts can only manage their own costumes.");
        }
    }

    private Category requireLeafActiveCategory(Long categoryId) {
        Category category = categoryRepository.findByIdAndIsActiveTrue(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy danh mục đang hoạt động với id: " + categoryId));

        if (!categoryRepository.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(categoryId).isEmpty()) {
            throw new BadRequestException("Chỉ có thể gắn trang phục vào danh mục cấp cuối.");
        }

        return category;
    }
}
