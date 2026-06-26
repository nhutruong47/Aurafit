package com.aurafit.controller;

import com.aurafit.dto.request.ClubCreateRequest;
import com.aurafit.dto.request.ClubUpdateRequest;
import com.aurafit.entity.Club;
import com.aurafit.entity.User;
import com.aurafit.enums.ClubStatus;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.repository.ClubRepository;
import com.aurafit.repository.UserRepository;
import com.aurafit.security.JwtTokenProvider;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class ClubControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ClubRepository clubRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User adminUser;
    private User customerUser;
    private String adminToken;
    private String customerToken;

    @BeforeEach
    void setUp() {
        clubRepository.deleteAll();

        // Create Admin with unique email
        adminUser = new User();
        adminUser.setEmail("test-admin-club@aurafit.com");
        adminUser.setFullName("System Admin");
        adminUser.setPasswordHash(passwordEncoder.encode("password123"));
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateToken(adminUser.getEmail(), adminUser.getId(), Role.ADMIN.name());

        // Create Customer with unique email
        customerUser = new User();
        customerUser.setEmail("test-customer-club@aurafit.com");
        customerUser.setFullName("Regular Customer");
        customerUser.setPasswordHash(passwordEncoder.encode("password123"));
        customerUser.setRole(Role.CUSTOMER);
        customerUser.setStatus(UserStatus.ACTIVE);
        customerUser = userRepository.save(customerUser);
        customerToken = jwtTokenProvider.generateToken(customerUser.getEmail(), customerUser.getId(), Role.CUSTOMER.name());
    }

    @Test
    void createClub_AsAdmin_ShouldSucceed() throws Exception {
        ClubCreateRequest request = new ClubCreateRequest(
                "VIP Platinum Club",
                "Exclusive benefits",
                new BigDecimal("500000"),
                0.2,
                ClubStatus.ACTIVE
        );

        mockMvc.perform(post("/api/clubs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("VIP Platinum Club")))
                .andExpect(jsonPath("$.data.discountRate", is(0.2)))
                .andExpect(jsonPath("$.data.status", is("ACTIVE")));
    }

    @Test
    void createClub_AsCustomer_ShouldReturnForbidden() throws Exception {
        ClubCreateRequest request = new ClubCreateRequest(
                "Customer Club VIP",
                "Desc",
                BigDecimal.ZERO,
                0.05,
                ClubStatus.ACTIVE
        );

        mockMvc.perform(post("/api/clubs")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createClub_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        ClubCreateRequest request = new ClubCreateRequest(
                "",
                "Desc",
                new BigDecimal("-50"), // Invalid negative fee
                1.5,                  // Invalid discount rate > 1.0
                null
        );

        mockMvc.perform(post("/api/clubs")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void getClubs_ShouldSucceedWithoutAuthAndSupportFilters() throws Exception {
        Club club1 = Club.builder()
                .name("VIP Diamond Club")
                .description("Top level")
                .membershipFee(new BigDecimal("1000000"))
                .discountRate(0.3)
                .status(ClubStatus.ACTIVE)
                .build();

        Club club2 = Club.builder()
                .name("Gold Club Member")
                .description("Mid level")
                .membershipFee(new BigDecimal("300000"))
                .discountRate(0.15)
                .status(ClubStatus.INACTIVE)
                .build();

        clubRepository.save(club1);
        clubRepository.save(club2);

        // Filter by ACTIVE status
        mockMvc.perform(get("/api/clubs")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("VIP Diamond Club")));

        // Filter by keyword
        mockMvc.perform(get("/api/clubs")
                        .param("keyword", "Gold"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Gold Club Member")));

        // Filter by discount rate
        mockMvc.perform(get("/api/clubs")
                        .param("minDiscountRate", "0.2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("VIP Diamond Club")));
    }

    @Test
    void updateClub_AsAdmin_ShouldSucceed() throws Exception {
        Club club = Club.builder()
                .name("Old Club Title")
                .description("Old Desc")
                .membershipFee(new BigDecimal("100000"))
                .discountRate(0.1)
                .status(ClubStatus.ACTIVE)
                .build();
        club = clubRepository.save(club);

        ClubUpdateRequest request = new ClubUpdateRequest(
                "New Club Name Title",
                "New Description",
                null,
                0.12,
                ClubStatus.INACTIVE
        );

        mockMvc.perform(put("/api/clubs/" + club.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("New Club Name Title")))
                .andExpect(jsonPath("$.data.description", is("New Description")))
                .andExpect(jsonPath("$.data.discountRate", is(0.12)))
                .andExpect(jsonPath("$.data.status", is("INACTIVE")));
    }

    @Test
    void deleteClub_AsAdmin_ShouldSucceed() throws Exception {
        Club club = Club.builder()
                .name("Delete Club Spec")
                .description("To be deleted")
                .membershipFee(new BigDecimal("10000"))
                .discountRate(0.05)
                .status(ClubStatus.ACTIVE)
                .build();
        club = clubRepository.save(club);

        mockMvc.perform(delete("/api/clubs/" + club.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("deleted successfully")));

        mockMvc.perform(get("/api/clubs/" + club.getId()))
                .andExpect(status().isNotFound());
    }
}
