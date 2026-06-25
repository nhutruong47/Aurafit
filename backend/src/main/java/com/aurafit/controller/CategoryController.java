package com.aurafit.controller;

import com.aurafit.dto.response.ApiResponse;
import com.aurafit.dto.response.CategoryDTO;
import com.aurafit.service.CostumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category", description = "Category endpoints")
public class CategoryController {

    private final CostumeService costumeService;

    public CategoryController(CostumeService costumeService) {
        this.costumeService = costumeService;
    }

    @GetMapping
    @Operation(summary = "Get all categories", description = "Returns all costume categories")
    public ResponseEntity<ApiResponse<List<CategoryDTO>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved successfully.", costumeService.getAllCategories()));
    }
}
