package com.aurafit.controller;

import com.aurafit.config.SecurityConfig;
import com.aurafit.dto.response.EventBannerResponse;
import com.aurafit.dto.response.EventResponse;
import com.aurafit.enums.EventStatus;
import com.aurafit.exception.GlobalExceptionHandler;
import com.aurafit.security.JwtAuthenticationFilter;
import com.aurafit.security.JwtTokenProvider;
import com.aurafit.service.EventService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(EventController.class)
@ContextConfiguration(classes = {
        EventController.class,
        GlobalExceptionHandler.class,
        SecurityConfig.class,
        JwtAuthenticationFilter.class
})
class EventControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EventService eventService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private UserDetailsService userDetailsService;

    @Test
    void getUpcomingAndActiveEvents_shouldBePublicAndReturnBannerShape() throws Exception {
        LocalDateTime startDate = LocalDateTime.of(2026, 7, 20, 8, 0);
        EventBannerResponse response = new EventBannerResponse(
                10L,
                "Mid-year Sale",
                "mid-year-sale",
                "https://cdn.example.com/event-wide.jpg",
                "https://cdn.example.com/event-side.jpg",
                new BigDecimal("20.00"),
                startDate,
                startDate.plusDays(7),
                EventStatus.ACTIVE,
                true
        );
        when(eventService.getUpcomingAndActiveEvents(2)).thenReturn(List.of(response));

        mockMvc.perform(get("/api/events/upcoming-and-active").param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id", is(10)))
                .andExpect(jsonPath("$.data[0].slug", is("mid-year-sale")))
                .andExpect(jsonPath("$.data[0].bannerImageUrl", is("https://cdn.example.com/event-wide.jpg")))
                .andExpect(jsonPath("$.data[0].sideBannerImageUrl", is("https://cdn.example.com/event-side.jpg")))
                .andExpect(jsonPath("$.data[0].status", is("ACTIVE")))
                .andExpect(jsonPath("$.data[0].isOngoing", is(true)));
    }

    @Test
    void getPublicEventBySlug_shouldBePublicAndReturnEventDetails() throws Exception {
        LocalDateTime startDate = LocalDateTime.of(2026, 7, 20, 8, 0);
        EventResponse response = new EventResponse(
                10L,
                "Mid-year Sale",
                "mid-year-sale",
                "Ưu đãi giữa năm",
                "https://cdn.example.com/event-wide.jpg",
                "https://cdn.example.com/event-side.jpg",
                new BigDecimal("20.00"),
                startDate,
                startDate.plusDays(7),
                EventStatus.ACTIVE,
                List.of(),
                startDate.minusDays(1),
                startDate.minusDays(1)
        );
        when(eventService.getPublicEventBySlug("mid-year-sale")).thenReturn(response);

        mockMvc.perform(get("/api/events/mid-year-sale"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.slug", is("mid-year-sale")))
                .andExpect(jsonPath("$.data.description", is("Ưu đãi giữa năm")))
                .andExpect(jsonPath("$.data.bannerImageUrl", is("https://cdn.example.com/event-wide.jpg")))
                .andExpect(jsonPath("$.data.costumes", hasSize(0)));
    }
}
