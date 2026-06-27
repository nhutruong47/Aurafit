package com.aurafit.service.impl;

import com.aurafit.dto.response.CostumeItemDTO;
import com.aurafit.enums.ItemStatus;
import com.aurafit.repository.CostumeItemRepository;
import com.aurafit.service.CostumeItemService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class CostumeItemServiceImpl implements CostumeItemService {

    private final CostumeItemRepository costumeItemRepository;

    public CostumeItemServiceImpl(CostumeItemRepository costumeItemRepository) {
        this.costumeItemRepository = costumeItemRepository;
    }

    @Override
    public List<CostumeItemDTO> getAvailableItemsByCostumeId(Long costumeId, ItemStatus status) {
        return costumeItemRepository.findByCostumeIdAndStatus(costumeId, status)
                .stream()
                .map(CostumeItemDTO::fromEntity)
                .toList();
    }
}
