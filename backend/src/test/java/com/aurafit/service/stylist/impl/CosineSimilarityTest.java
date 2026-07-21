package com.aurafit.service.stylist.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class CosineSimilarityTest {

    @Test
    void calculate_shouldReturnOneForSameDirection() {
        double similarity = CosineSimilarity.calculate(
                new float[]{1F, 2F, 3F},
                new float[]{2F, 4F, 6F}
        );

        assertEquals(1D, similarity, 1.0E-9);
    }

    @Test
    void calculate_shouldReturnZeroForOrthogonalVectors() {
        double similarity = CosineSimilarity.calculate(
                new float[]{1F, 0F},
                new float[]{0F, 1F}
        );

        assertEquals(0D, similarity, 1.0E-9);
    }

    @Test
    void calculate_shouldReturnNegativeOneForOppositeDirections() {
        double similarity = CosineSimilarity.calculate(
                new float[]{1F, 0F},
                new float[]{-1F, 0F}
        );

        assertEquals(-1D, similarity, 1.0E-9);
    }

    @Test
    void calculate_shouldRejectMismatchedDimensionsAndZeroVectors() {
        assertThrows(
                IllegalArgumentException.class,
                () -> CosineSimilarity.calculate(new float[]{1F}, new float[]{1F, 2F})
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> CosineSimilarity.calculate(new float[]{0F, 0F}, new float[]{1F, 2F})
        );
        assertThrows(
                IllegalArgumentException.class,
                () -> CosineSimilarity.calculate(new float[]{Float.NaN}, new float[]{1F})
        );
    }
}
