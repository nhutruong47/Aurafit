package com.aurafit.entity;

import com.aurafit.enums.InteractionEventType;
import com.aurafit.enums.InteractionTargetType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_interaction_events", indexes = {
        @Index(name = "idx_interaction_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_interaction_session_created", columnList = "session_id, created_at"),
        @Index(name = "idx_interaction_event_created", columnList = "event_type, created_at")
})
public class UserInteractionEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "session_id", nullable = false, length = 120)
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private InteractionEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 40)
    private InteractionTargetType targetType;

    @Column(name = "target_id", length = 120)
    private String targetId;

    @Column(name = "query_text", columnDefinition = "TEXT")
    private String queryText;

    @Column(name = "page_path", length = 255)
    private String pagePath;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;
}
