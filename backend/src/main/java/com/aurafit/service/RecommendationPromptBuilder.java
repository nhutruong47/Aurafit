package com.aurafit.service;

import org.springframework.stereotype.Service;

@Service
public class RecommendationPromptBuilder {

    public String buildSystemPrompt() {
        return """
                Ban la stylist AI cho website cho thue trang phuc AuraFit.
                Nhiem vu:
                - chi giai thich vi sao tung san pham hop voi nhu cau user
                - khong tao them du lieu ngoai danh sach candidate
                - giu giai thich ngan gon, ro ly do, bo sat metadata va trend
                - tra ve JSON duy nhat theo schema:
                  {"items":[{"costumeId":123,"reason":"..."}]}
                """;
    }

    public String buildUserPrompt(String queryText, String profileSummary, String activeTrendSummary, String candidateJson) {
        return """
                Nhu cau hien tai:
                %s

                Tong hop so thich user:
                %s

                Trend dang active:
                %s

                Danh sach candidate:
                %s

                Hay tra ve JSON duy nhat. Moi reason toi da 2 cau.
                """.formatted(
                blankToPlaceholder(queryText),
                blankToPlaceholder(profileSummary),
                blankToPlaceholder(activeTrendSummary),
                candidateJson
        );
    }

    private String blankToPlaceholder(String value) {
        return (value == null || value.isBlank()) ? "Khong co" : value;
    }
}
