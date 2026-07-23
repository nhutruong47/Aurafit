package com.aurafit.ai.enrichment.dto.response;

import java.util.List;

public record EnrichmentBatchResponse(
        int totalCostumes,
        int processedCount,
        int successCount,
        int failureCount,
        List<Long> failedCostumeIds,
        long durationMillis
) {
}
