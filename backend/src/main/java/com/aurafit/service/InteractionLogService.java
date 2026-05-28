package com.aurafit.service;

import com.aurafit.repository.InteractionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InteractionLogService {

    private final InteractionLogRepository interactionLogRepository;
}
