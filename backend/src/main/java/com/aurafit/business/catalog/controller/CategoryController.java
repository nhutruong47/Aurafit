package com.aurafit.business.catalog.controller;

import com.aurafit.business.catalog.dto.request.CategoryCreateRequest;
import com.aurafit.business.catalog.dto.request.CategoryUpdateRequest;
import com.aurafit.common.dto.response.ApiResponse;
import com.aurafit.business.catalog.dto.response.CategoryResponse;
import com.aurafit.business.catalog.dto.response.CategoryTreeResponse;
import com.aurafit.common.dto.response.PaginatedResponse;
import com.aurafit.business.catalog.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Category", description = "Category endpoints")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Lấy tất cả danh mục", description = "Trả về danh sách danh mục đang hoạt động")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách danh mục thành công.", categoryService.getAllCategories()));
    }

    @GetMapping("/tree")
    @Operation(summary = "Lấy cây danh mục", description = "Trả về cây danh mục để hiển thị menu hoặc sidebar")
    public ResponseEntity<ApiResponse<List<CategoryTreeResponse>>> getCategoryTree() {
        return ResponseEntity.ok(ApiResponse.success("Lấy cây danh mục thành công.", categoryService.getCategoryTree()));
    }

    @GetMapping("/root")
    @Operation(summary = "Lấy danh mục gốc", description = "Trả về danh sách danh mục cấp gốc")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getRootCategories() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục gốc thành công.", categoryService.getRootCategories()));
    }

    @GetMapping("/by-path")
    @Operation(summary = "Lấy danh mục theo đường dẫn", description = "Trả về danh mục theo path duy nhất")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryByPath(@RequestParam String path) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục theo đường dẫn thành công.", categoryService.getCategoryByPath(path)));
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm danh mục", description = "Trả về danh sách danh mục phân trang theo từ khóa")
    public ResponseEntity<ApiResponse<PaginatedResponse<CategoryResponse>>> searchCategories(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int pageNo,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PaginatedResponse<CategoryResponse> response = categoryService.searchCategories(keyword, pageNo, pageSize, sortBy, sortDir);
        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm danh mục thành công.", response));
    }

    @GetMapping("/{id}/children")
    @Operation(summary = "Lấy danh mục con", description = "Trả về danh sách danh mục con trực tiếp của một danh mục")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getChildrenByCategoryId(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục con thành công.", categoryService.getChildrenByCategoryId(id)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết danh mục", description = "Trả về chi tiết một danh mục theo id")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategoryById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết danh mục thành công.", categoryService.getCategoryById(id)));
    }

    @PostMapping
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo danh mục mới (Admin)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(@Valid @RequestBody CategoryCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo danh mục thành công.", categoryService.createCategory(request), HttpStatus.CREATED));
    }

    @PutMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật danh mục (Admin)")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công.", categoryService.updateCategory(id, request)));
    }

    @PatchMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật một phần danh mục (Admin)")
    public ResponseEntity<ApiResponse<CategoryResponse>> patchCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật danh mục thành công.", categoryService.updateCategory(id, request)));
    }

    @DeleteMapping("/{id}")
    @SecurityRequirement(name = "bearerAuth")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Ẩn danh mục (Admin)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.success("Ẩn danh mục thành công.", HttpStatus.OK));
    }
}
