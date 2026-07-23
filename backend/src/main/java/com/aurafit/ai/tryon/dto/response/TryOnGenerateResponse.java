package com.aurafit.ai.tryon.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TryOnGenerateResponse {

    private String resultUrl;
    private Long historyId;
}
