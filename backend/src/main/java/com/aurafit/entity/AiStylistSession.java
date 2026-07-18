package com.aurafit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_stylist_sessions", indexes = {
        @Index(name = "idx_ai_stylist_session_user_created", columnList = "user_id, created_at"),
        @Index(name = "idx_ai_stylist_session_guest_created", columnList = "guest_session_id, created_at"),
        @Index(name = "idx_ai_stylist_sessions_user_id_updated_at_id", columnList = "user_id, updated_at, id")
})
public class AiStylistSession extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    private String guestSessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "context_costume_id")
    private Costume contextCostume;

    @JsonIgnore
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @jakarta.persistence.OrderBy("createdAt ASC, id ASC")
    private List<AiStylistMessage> messages = new ArrayList<>();
}
