package com.aurafit.review.controller;

import com.aurafit.business.review.controller.ReviewController;
import com.aurafit.config.SecurityConfig;
import com.aurafit.business.review.dto.request.ReviewRequest;
import com.aurafit.business.review.dto.response.ReviewResponse;
import com.aurafit.business.review.dto.response.ReviewSummaryResponse;
import com.aurafit.business.review.enums.ReviewStatus;
import com.aurafit.common.exception.GlobalExceptionHandler;
import com.aurafit.security.JwtAuthenticationFilter;
import com.aurafit.security.JwtTokenProvider;
import com.aurafit.business.review.service.ReviewService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReviewController.class)
@ContextConfiguration(classes = {
        ReviewController.class,
        GlobalExceptionHandler.class,
        SecurityConfig.class,
        JwtAuthenticationFilter.class
})
class ReviewControllerTest {

    private static final String USER_EMAIL = "customer@aurafit.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReviewService reviewService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void createReview_shouldReturnUnauthorizedWithoutAuthentication() throws Exception {
        ReviewRequest request = new ReviewRequest(30L, 5, "Great costume", List.of());

        mockMvc.perform(post("/api/costumes/20/reviews")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createReview_shouldReturnForbiddenWhenCustomerIsNotEligible() throws Exception {
        ReviewRequest request = new ReviewRequest(30L, 5, "Great costume", List.of());
        when(reviewService.createReview(eq(USER_EMAIL), eq(20L), any(ReviewRequest.class)))
                .thenThrow(new AccessDeniedException("Not eligible"));

        mockMvc.perform(post("/api/costumes/20/reviews")
                        .with(user(USER_EMAIL).roles("CUSTOMER"))
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    void getReviews_shouldReturnPagedApiResponseShape() throws Exception {
        ReviewResponse review = new ReviewResponse(
                40L,
                10L,
                "Review Owner",
                5,
                "Great costume",
                ReviewStatus.VISIBLE,
                LocalDateTime.of(2026, 7, 19, 9, 30),
                List.of("https://example.com/review.jpg")
        );
        when(reviewService.getReviewsByCostume(eq(20L), any(), eq(null)))
                .thenReturn(new PageImpl<>(List.of(review), PageRequest.of(0, 10), 1));

        mockMvc.perform(get("/api/costumes/20/reviews")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].id", is(40)))
                .andExpect(jsonPath("$.data.content[0].userFullName", is("Review Owner")))
                .andExpect(jsonPath("$.data.content[0].imageUrls", hasSize(1)))
                .andExpect(jsonPath("$.data.totalElements", is(1)));
    }

    @Test
    void getReviewSummary_shouldReturnApiResponseShape() throws Exception {
        LinkedHashMap<Integer, Long> distribution = new LinkedHashMap<>();
        distribution.put(1, 0L);
        distribution.put(2, 0L);
        distribution.put(3, 1L);
        distribution.put(4, 1L);
        distribution.put(5, 2L);
        when(reviewService.getReviewSummary(20L))
                .thenReturn(new ReviewSummaryResponse(4.3, 4L, distribution));

        mockMvc.perform(get("/api/costumes/20/reviews/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.status", is(200)))
                .andExpect(jsonPath("$.data.averageRating", is(4.3)))
                .andExpect(jsonPath("$.data.totalCount", is(4)))
                .andExpect(jsonPath("$.data.ratingDistribution['5']", is(2)));
    }
}
