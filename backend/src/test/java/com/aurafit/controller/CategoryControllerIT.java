package com.aurafit.controller;

import com.aurafit.dto.request.CategoryCreateRequest;
import com.aurafit.dto.request.CategoryUpdateRequest;
import com.aurafit.entity.Category;
import com.aurafit.entity.User;
import com.aurafit.enums.Role;
import com.aurafit.enums.UserStatus;
import com.aurafit.repository.CategoryRepository;
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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CategoryControllerIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

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
        // Create Admin with unique email
        adminUser = new User();
        adminUser.setEmail("test-admin-cat@aurafit.com");
        adminUser.setFullName("System Admin");
        adminUser.setPasswordHash(passwordEncoder.encode("password123"));
        adminUser.setRole(Role.ADMIN);
        adminUser.setStatus(UserStatus.ACTIVE);
        adminUser = userRepository.save(adminUser);
        adminToken = jwtTokenProvider.generateToken(adminUser.getEmail(), adminUser.getId(), Role.ADMIN.name());

        // Create Customer with unique email
        customerUser = new User();
        customerUser.setEmail("test-customer-cat@aurafit.com");
        customerUser.setFullName("Regular Customer");
        customerUser.setPasswordHash(passwordEncoder.encode("password123"));
        customerUser.setRole(Role.CUSTOMER);
        customerUser.setStatus(UserStatus.ACTIVE);
        customerUser = userRepository.save(customerUser);
        customerToken = jwtTokenProvider.generateToken(customerUser.getEmail(), customerUser.getId(), Role.CUSTOMER.name());
    }

    @Test
    void createCategory_AsAdmin_ShouldSucceed() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("Fitness Gymwear", "Gym and workout gears");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Fitness Gymwear")))
                .andExpect(jsonPath("$.data.description", is("Gym and workout gears")));
    }

    @Test
    void createCategory_AsCustomer_ShouldReturnForbidden() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("Forbidden Cat", "Desc");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createCategory_WithDuplicateName_ShouldReturnConflict() throws Exception {
        Category category = Category.builder()
                .name("Unique Anime Cosplay")
                .description("Cosplay description")
                .build();
        categoryRepository.saveAndFlush(category);

        CategoryCreateRequest request = new CategoryCreateRequest("Unique Anime Cosplay", "Another description");

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("Category name already exists")));
    }

    @Test
    void createCategory_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest("", "Too long description".repeat(100));

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.message", containsString("Validation failed")));
    }

    @Test
    void getCategories_ShouldSucceedWithoutAuth() throws Exception {
        Category category1 = Category.builder().name("Test Cat A").description("Desc A").build();
        Category category2 = Category.builder().name("Test Cat B").description("Desc B").build();
        categoryRepository.save(category1);
        categoryRepository.save(category2);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void searchCategories_ShouldSucceedWithPagingAndFiltering() throws Exception {
        Category category1 = Category.builder().name("Special Active Cosplay").description("Desc A").build();
        Category category2 = Category.builder().name("Special Traditional Wear").description("Desc B").build();
        categoryRepository.save(category1);
        categoryRepository.save(category2);

        mockMvc.perform(get("/api/categories/search")
                        .param("keyword", "Special Active Cosplay")
                        .param("pageNo", "0")
                        .param("pageSize", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].name", is("Special Active Cosplay")));
    }

    @Test
    void updateCategory_AsAdmin_ShouldSucceed() throws Exception {
        Category category = Category.builder().name("Old Cat Name").description("Old Desc").build();
        category = categoryRepository.save(category);

        CategoryUpdateRequest request = new CategoryUpdateRequest("New Cat Name", "New Desc");

        mockMvc.perform(put("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("New Cat Name")))
                .andExpect(jsonPath("$.data.description", is("New Desc")));
    }

    @Test
    void deleteCategory_AsAdmin_ShouldSucceed() throws Exception {
        Category category = Category.builder().name("Test Delete Me").description("Desc").build();
        category = categoryRepository.save(category);

        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("deleted successfully")));

        mockMvc.perform(get("/api/categories/" + category.getId()))
                .andExpect(status().isNotFound());
    }
}
