package com.aurafit.ai.tryon.service;

import com.aurafit.ai.tryon.dto.request.TryOnRequest;
import com.aurafit.ai.tryon.dto.request.TryOnResultRequest;
import com.aurafit.ai.tryon.dto.response.TryOnGenerateResponse;
import com.aurafit.ai.tryon.dto.response.TryOnResponse;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface TryOnService {

    TryOnGenerateResponse generate(
            Long userId,
            MultipartFile personImage,
            String garmentImageUrl,
            Long productId,
            String productName
    );

    TryOnResponse createRequest(Long userId, TryOnRequest request);

    TryOnResponse updateResult(Long userId, Long historyId, TryOnResultRequest request);

    Page<TryOnResponse> getHistory(Long userId, int page, int size);

    void deleteHistory(Long userId, Long historyId);
}
