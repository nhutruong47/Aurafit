package com.aurafit.business.user.entity;

import com.aurafit.common.entity.BaseEntity;
import com.aurafit.business.user.enums.Role;
import com.aurafit.business.user.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "\"User\"", indexes = {
        @Index(name = "idx_user_role_id", columnList = "role, id")
})
@Data
@EqualsAndHashCode(callSuper = true)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name")
    private String fullName;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "email_verified")
    private Boolean emailVerified = false;

    private String phone;

    @Column(name = "phone_verified")
    private Boolean phoneVerified = false;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;

    private String address;

    @Column(name = "bank_name")
    private String bankName;

    @Column(name = "bank_account_number")
    private String bankAccountNumber;

    @Column(name = "bank_account_name")
    private String bankAccountName;

    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "consecutive_cancel_count")
    private Integer consecutiveCancelCount = 0;

    public Integer getConsecutiveCancelCount() {
        return consecutiveCancelCount != null ? consecutiveCancelCount : 0;
    }
}
