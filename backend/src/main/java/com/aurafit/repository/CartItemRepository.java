package com.aurafit.repository;

import com.aurafit.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    /** Checks if a specific CostumeItem is already in any ACTIVE cart. */
    boolean existsByCartIdAndCostumeItemId(Long cartId, Long costumeItemId);

    /** Counts how many physical items of a specific variant are in a cart */
    @Query("SELECT COUNT(ci) FROM CartItem ci WHERE ci.cart.id = :cartId AND ci.costumeItem.costume.id = :costumeId AND ci.costumeItem.size = :size AND ci.costumeItem.color = :color")
    long countVariantInCart(@Param("cartId") Long cartId, @Param("costumeId") Long costumeId, @Param("size") String size, @Param("color") String color);
}
