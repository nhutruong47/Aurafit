package com.aurafit.ai.stylist.service.impl;

public final class CosineSimilarity {

    private CosineSimilarity() {
    }

    public static double calculate(float[] left, float[] right) {
        if (left == null || right == null || left.length == 0 || left.length != right.length) {
            throw new IllegalArgumentException("Embedding vectors must be non-empty and have equal dimensions.");
        }

        double dotProduct = 0D;
        double leftMagnitudeSquared = 0D;
        double rightMagnitudeSquared = 0D;
        for (int index = 0; index < left.length; index++) {
            if (!Float.isFinite(left[index]) || !Float.isFinite(right[index])) {
                throw new IllegalArgumentException("Embedding vectors must contain only finite values.");
            }
            dotProduct += (double) left[index] * right[index];
            leftMagnitudeSquared += (double) left[index] * left[index];
            rightMagnitudeSquared += (double) right[index] * right[index];
        }

        if (leftMagnitudeSquared == 0D || rightMagnitudeSquared == 0D) {
            throw new IllegalArgumentException("Cosine similarity is undefined for a zero vector.");
        }
        return dotProduct / (Math.sqrt(leftMagnitudeSquared) * Math.sqrt(rightMagnitudeSquared));
    }
}
