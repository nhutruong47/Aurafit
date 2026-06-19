package com.aurafit.repository;

import com.aurafit.entity.Cart;
import com.aurafit.enums.CartStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {

    /**
     * Finds the user's cart with a specific status.
     * Eagerly fetches cart items and their associated costume items + parent costumes
     * in a single query to prevent N+1 when building the CartDTO.
     */
    @Query("""
            SELECT c FROM Cart c
            LEFT JOIN FETCH c.items ci
            LEFT JOIN FETCH ci.costumeItem csi
            LEFT JOIN FETCH csi.costume cos
            WHERE c.user.id = :userId AND c.status = :status
            """)
    Optional<Cart> findByUserIdAndStatusWithItems(
            @Param("userId") Long userId,
            @Param("status") CartStatus status
    );

    Optional<Cart> findByUserIdAndStatus(Long userId, CartStatus status);
}
