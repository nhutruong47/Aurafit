package com.aurafit.business.catalog.enums;

/**
 * Controls whether a Costume product listing is visible to customers.
 * This is separate from ItemStatus, which tracks individual physical inventory units.
 */
public enum CostumeStatus {
    ACTIVE,
    INACTIVE,
    DISCONTINUED
}
