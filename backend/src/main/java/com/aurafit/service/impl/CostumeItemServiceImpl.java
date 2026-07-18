package com.aurafit.service.impl;

import com.aurafit.dto.request.CostumeItemCreateRequest;
import com.aurafit.dto.request.CostumeItemUpdateRequest;
import com.aurafit.dto.response.CostumeItemDTO;
import com.aurafit.entity.Costume;
import com.aurafit.entity.CostumeItem;
import com.aurafit.entity.User;
import com.aurafit.enums.ItemStatus;
import com.aurafit.enums.Role;
import com.aurafit.exception.BadRequestException;
import com.aurafit.exception.ResourceNotFoundException;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.service.CostumeItemService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CostumeItemServiceImpl implements CostumeItemService {

    private final CostumeItemRepository costumeItemRepository;
    private final CostumeRepository costumeRepository;
    private final UserRepository userRepository;

    public CostumeItemServiceImpl(CostumeItemRepository costumeItemRepository,
                                  CostumeRepository costumeRepository,
                                  UserRepository userRepository) {
        this.costumeItemRepository = costumeItemRepository;
        this.costumeRepository = costumeRepository;
        this.userRepository = userRepository;
    }

    @Override
    public List<CostumeItemDTO> getAvailableItemsByCostumeId(Long costumeId, ItemStatus status) {
        return costumeItemRepository.findByCostumeIdAndStatus(costumeId, status)
                .stream()
                .map(CostumeItemDTO::fromEntity)
                .toList();
    }

    @Override
    public List<CostumeItemDTO> getItemsByCostumeId(Long costumeId, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        // Verify costume exists
        costumeRepository.findById(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));

        return costumeItemRepository.findByCostumeId(costumeId)
                .stream()
                .map(CostumeItemDTO::fromEntity)
                .toList();
    }

    @Override
    @Transactional
    public CostumeItemDTO createCostumeItem(Long costumeId, CostumeItemCreateRequest request,
                                            String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        Costume costume = costumeRepository.findById(costumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Costume", "id", costumeId));

        // Validate SKU uniqueness
        if (costumeItemRepository.findBySku(request.sku()).isPresent()) {
            throw new BadRequestException("SKU '" + request.sku() + "' đã tồn tại trong hệ thống.");
        }

        ItemStatus status = ItemStatus.AVAILABLE;
        if (request.status() != null && !request.status().isBlank()) {
            try {
                status = ItemStatus.valueOf(request.status().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + request.status());
            }
        }

        CostumeItem item = CostumeItem.builder()
                .sku(request.sku())
                .size(request.size())
                .color(request.color())
                .status(status)
                .costume(costume)
                .build();

        return CostumeItemDTO.fromEntity(costumeItemRepository.save(item));
    }

    @Override
    @Transactional
    public CostumeItemDTO updateCostumeItem(Long costumeId, Long itemId, CostumeItemUpdateRequest request,
                                            String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        CostumeItem item = costumeItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "id", itemId));

        if (!item.getCostume().getId().equals(costumeId)) {
            throw new BadRequestException("Item #" + itemId + " không thuộc costume #" + costumeId);
        }

        if (request.sku() != null && !request.sku().isBlank()) {
            // Check uniqueness if SKU changed
            if (!request.sku().equals(item.getSku())) {
                costumeItemRepository.findBySku(request.sku()).ifPresent(existing -> {
                    throw new BadRequestException("SKU '" + request.sku() + "' đã tồn tại trong hệ thống.");
                });
            }
            item.setSku(request.sku());
        }
        if (request.size() != null) item.setSize(request.size());
        if (request.color() != null) item.setColor(request.color());
        if (request.status() != null && !request.status().isBlank()) {
            try {
                item.setStatus(ItemStatus.valueOf(request.status().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + request.status());
            }
        }

        return CostumeItemDTO.fromEntity(costumeItemRepository.save(item));
    }

    @Override
    @Transactional
    public void deleteCostumeItem(Long costumeId, Long itemId, String authenticatedEmail) {
        requireProductManager(authenticatedEmail);
        CostumeItem item = costumeItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("CostumeItem", "id", itemId));

        if (!item.getCostume().getId().equals(costumeId)) {
            throw new BadRequestException("Item #" + itemId + " không thuộc costume #" + costumeId);
        }

        if (item.getStatus() == ItemStatus.RENTED) {
            throw new BadRequestException("Không thể xóa item đang trong trạng thái RENTED.");
        }

        costumeItemRepository.delete(item);
    }

    private User requireProductManager(String authenticatedEmail) {
        User actor = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", authenticatedEmail));

        if (actor.getRole() != Role.ADMIN && actor.getRole() != Role.STAFF) {
            throw new AccessDeniedException("Only admin or staff accounts can manage costumes.");
        }

        return actor;
    }
}
