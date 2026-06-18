package com.aurafit.service;

import com.aurafit.dto.CreateInteractionLogRequest;
import com.aurafit.entity.InteractionLog;
import com.aurafit.entity.User;
import com.aurafit.repository.InteractionLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InteractionLogService {

    private final InteractionLogRepository interactionLogRepository;
    private final UserService userService;

    public void log(CreateInteractionLogRequest request) {
        User user = userService.getUserById(request.userId());

        InteractionLog interactionLog = InteractionLog.builder()
                .user(user)
                .actionType(request.actionType().trim().toUpperCase())
                .targetType(request.targetType().trim().toUpperCase())
                .targetId(request.targetId())
                .searchQuery(request.searchQuery())
                .metadata(request.metadata())
                .build();

        interactionLogRepository.save(interactionLog);
    }
}
