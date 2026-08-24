package com.restaurant.restaurant_management.controller;

import com.restaurant.restaurant_management.entity.Category;
import com.restaurant.restaurant_management.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    // Lấy tất cả danh mục
    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {

        return ResponseEntity.ok(
                categoryService.getAllCategories()
        );
    }

    // Lấy danh mục theo ID
    @GetMapping("/{id}")
    public ResponseEntity<Category> getCategoryById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                categoryService.getCategoryById(id)
        );
    }

    // Thêm danh mục
    @PostMapping
    public ResponseEntity<Category> createCategory(
            @RequestBody Category category) {

        Category createdCategory =
                categoryService.createCategory(category);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdCategory);
    }

    // Cập nhật danh mục
    @PutMapping("/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable Long id,
            @RequestBody Category category) {

        Category updatedCategory =
                categoryService.updateCategory(id, category);

        return ResponseEntity.ok(updatedCategory);
    }

    // Xóa danh mục
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @PathVariable Long id) {

        categoryService.deleteCategory(id);

        return ResponseEntity.noContent().build();
    }
}