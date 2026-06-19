package com.aurafit.enums;

/**
 * Tracks the lifecycle of a shopping cart.
 * ACTIVE: User is currently shopping.
 * CHECKED_OUT: Cart has been converted to a RentalOrder.
 * ABANDONED: Cart was left idle beyond the expiry window.
 */
public enum CartStatus {
    ACTIVE,
    CHECKED_OUT,
    ABANDONED
}
