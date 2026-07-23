package com.aurafit.interaction.service.impl;

import com.aurafit.interaction.dto.request.TrackInteractionRequest;
import com.aurafit.interaction.entity.UserInteractionEvent;
import com.aurafit.interaction.enums.InteractionEventType;
import com.aurafit.interaction.enums.InteractionTargetType;
import com.aurafit.interaction.repository.UserInteractionEventRepository;
import com.aurafit.business.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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

    private UserInteractionServiceImpl userInteractionService;

    @BeforeEach
    void setUp() {
        userInteractionService = new UserInteractionServiceImpl(
                userInteractionEventRepository,
                userRepository
        );
    }

    @Test
    void track_ShouldPersistProductViewEventMetadata() {
        TrackInteractionRequest request = new TrackInteractionRequest(
                "interaction-001",
                InteractionEventType.VIEW_PRODUCT,
                InteractionTargetType.COSTUME,
                "7",
                null,
                "/products/7",
                "{\"source\":\"product_detail\"}"
        );

        userInteractionService.track(request, null);

        ArgumentCaptor<UserInteractionEvent> eventCaptor = ArgumentCaptor.forClass(UserInteractionEvent.class);
        verify(userInteractionEventRepository).save(eventCaptor.capture());

        UserInteractionEvent savedEvent = eventCaptor.getValue();
        assertEquals("interaction-001", savedEvent.getSessionId());
        assertEquals(InteractionEventType.VIEW_PRODUCT, savedEvent.getEventType());
        assertEquals(InteractionTargetType.COSTUME, savedEvent.getTargetType());
        assertEquals("7", savedEvent.getTargetId());
        assertEquals("/products/7", savedEvent.getPagePath());
        assertEquals("{\"source\":\"product_detail\"}", savedEvent.getMetadataJson());
        assertNull(savedEvent.getUser());
    }
}
