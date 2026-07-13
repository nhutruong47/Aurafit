package com.aurafit.service.impl;

import com.aurafit.dto.request.TrackInteractionRequest;
import com.aurafit.entity.UserInteractionEvent;
import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import com.aurafit.repository.UserInteractionEventRepository;
import com.aurafit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.cache.CacheManager;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserInteractionServiceImplTest {

    @Mock
    private UserInteractionEventRepository userInteractionEventRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CacheManager cacheManager;

    private UserInteractionServiceImpl userInteractionService;

    @BeforeEach
    void setUp() {
        userInteractionService = new UserInteractionServiceImpl(
                userInteractionEventRepository,
                userRepository,
                cacheManager
        );
    }

    @Test
    void track_ShouldPersistAiStylistAssistantMessageEventMetadata() {
        TrackInteractionRequest request = new TrackInteractionRequest(
                "interaction-001",
                InteractionEventType.AI_CHAT_ASSISTANT_MESSAGE,
                InteractionTargetType.CHAT,
                "42",
                null,
                "/chat",
                "{\"source\":\"AI_STYLIST\",\"aiStylistSessionId\":42,\"aiStylistMessageId\":99,\"recommendedCostumeIds\":[7,8]}"
        );

        userInteractionService.track(request, null);

        ArgumentCaptor<UserInteractionEvent> eventCaptor = ArgumentCaptor.forClass(UserInteractionEvent.class);
        verify(userInteractionEventRepository).save(eventCaptor.capture());

        UserInteractionEvent savedEvent = eventCaptor.getValue();
        assertEquals("interaction-001", savedEvent.getSessionId());
        assertEquals(InteractionEventType.AI_CHAT_ASSISTANT_MESSAGE, savedEvent.getEventType());
        assertEquals(InteractionTargetType.CHAT, savedEvent.getTargetType());
        assertEquals("42", savedEvent.getTargetId());
        assertEquals("/chat", savedEvent.getPagePath());
        assertEquals(
                "{\"source\":\"AI_STYLIST\",\"aiStylistSessionId\":42,\"aiStylistMessageId\":99,\"recommendedCostumeIds\":[7,8]}",
                savedEvent.getMetadataJson()
        );
        assertNull(savedEvent.getUser());
    }
}
