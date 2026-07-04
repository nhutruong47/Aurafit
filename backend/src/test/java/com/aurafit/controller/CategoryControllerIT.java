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
        CategoryCreateRequest request = new CategoryCreateRequest(
                "Fitness Gymwear",
                null,
                "Gym and workout gears",
                null,
                0,
                true
        );

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
        CategoryCreateRequest request = new CategoryCreateRequest(
                "Forbidden Cat",
                null,
                "Desc",
                null,
                0,
                true
        );

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    void createCategory_WithDuplicateName_ShouldReturnConflict() throws Exception {
        categoryRepository.saveAndFlush(buildCategory("Unique Anime Cosplay", "unique-anime-cosplay", "Cosplay description"));

        CategoryCreateRequest request = new CategoryCreateRequest(
                "Unique Anime Cosplay",
                null,
                "Another description",
                null,
                0,
                true
        );

        mockMvc.perform(post("/api/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.message", containsString("Đường dẫn danh mục đã tồn tại")));
    }

    @Test
    void createCategory_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        CategoryCreateRequest request = new CategoryCreateRequest(
                "",
                null,
                "Too long description".repeat(100),
                null,
                0,
                true
        );

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
        Category category1 = buildCategory("Test Cat A", "test-cat-a", "Desc A");
        Category category2 = buildCategory("Test Cat B", "test-cat-b", "Desc B");
        categoryRepository.save(category1);
        categoryRepository.save(category2);

        mockMvc.perform(get("/api/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
    }

    @Test
    void searchCategories_ShouldSucceedWithPagingAndFiltering() throws Exception {
        Category category1 = buildCategory("Special Active Cosplay", "special-active-cosplay", "Desc A");
        Category category2 = buildCategory("Special Traditional Wear", "special-traditional-wear", "Desc B");
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
        Category category = buildCategory("Old Cat Name", "old-cat-name", "Old Desc");
        category = categoryRepository.save(category);

        CategoryUpdateRequest request = new CategoryUpdateRequest(
                "New Cat Name",
                null,
                "New Desc",
                null,
                null,
                null
        );

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
        Category category = buildCategory("Test Delete Me", "test-delete-me", "Desc");
        category = categoryRepository.save(category);

        mockMvc.perform(delete("/api/categories/" + category.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.message", containsString("deleted successfully")));

        Category deletedCategory = categoryRepository.findById(category.getId()).orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(Boolean.TRUE.equals(deletedCategory.getIsActive()));
    }

    private Category buildCategory(String name, String slug, String description) {
        return Category.builder()
                .name(name)
                .slug(slug)
                .path(slug)
                .description(description)
                .sortOrder(0)
                .isActive(true)
                .build();
    }
}
