package com.aurafit.entity;

import com.aurafit.enums.AiBehaviorEventType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_behavior_events")
public class UserBehaviorEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "costume_id")
    private Costume costume;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private RentalOrder rentalOrder;

    @Column(name = "session_id")
    private String sessionId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AiBehaviorEventType eventType;

    @Column(name = "query_text", columnDefinition = "TEXT")
    private String queryText;

    @Lob
    @Column(name = "filter_payload", columnDefinition = "TEXT")
    private String filterPayload;

    @Lob
    @Column(name = "event_payload", columnDefinition = "TEXT")
    private String eventPayload;

    @Column(name = "source_page")
    private String sourcePage;

    @Column(name = "source_module")
    private String sourceModule;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;
}
