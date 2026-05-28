package com.aurafit.service;

import com.aurafit.repository.CostumeRepository;
import com.aurafit.repository.CostumeSetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CostumeService {

    private final CostumeRepository costumeRepository;
    private final CostumeSetRepository costumeSetRepository;
}
