package com.aurafit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "student_card_url")
    private String studentCardUrl;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "review_note")
    private String reviewNote;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
    }
}
