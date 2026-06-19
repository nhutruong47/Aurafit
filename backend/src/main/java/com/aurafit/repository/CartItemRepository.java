package com.aurafit.repository;

import com.aurafit.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /** Checks if a specific CostumeItem is already in any ACTIVE cart. */
    boolean existsByCartIdAndCostumeItemId(Long cartId, Long costumeItemId);
}
