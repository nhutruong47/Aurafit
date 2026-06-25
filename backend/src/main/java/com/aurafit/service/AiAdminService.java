package com.aurafit.service;

import com.aurafit.dto.request.FashionTrendUpsertRequest;
import com.aurafit.dto.request.UpsertProductAiMetadataRequest;
import com.aurafit.dto.response.FashionTrendResponse;
import com.aurafit.dto.response.ProductAiMetadataResponse;

import java.util.List;

public interface AiAdminService {

    ProductAiMetadataResponse getProductMetadata(Long costumeId);

    ProductAiMetadataResponse upsertProductMetadata(Long costumeId, UpsertProductAiMetadataRequest request, String actorEmail);

    List<FashionTrendResponse> getFashionTrends();

    FashionTrendResponse createFashionTrend(FashionTrendUpsertRequest request, String actorEmail);

    FashionTrendResponse updateFashionTrend(Long trendId, FashionTrendUpsertRequest request, String actorEmail);
}
