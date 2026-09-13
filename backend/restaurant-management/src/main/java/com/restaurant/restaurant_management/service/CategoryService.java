package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.entity.Category;
import com.restaurant.restaurant_management.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    // Lấy tất cả danh mục
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Lấy danh mục theo ID
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy danh mục với id: " + id)
                );
    }

    // Thêm danh mục
    public Category createCategory(Category category) {

        String trimmedName = category.getName() != null ? category.getName().trim() : "";
        if (categoryRepository.existsByName(trimmedName)) {
            throw new RuntimeException("Tên danh mục đã tồn tại");
        }

        LocalDateTime now = LocalDateTime.now();

        category.setName(trimmedName);
        if (category.getStatus() == null || category.getStatus().isBlank()) {
            category.setStatus("ACTIVE");
        }
        category.setCreatedAt(now);
        category.setUpdatedAt(now);

        return categoryRepository.save(category);
    }

    // Cập nhật danh mục
    public Category updateCategory(Long id, Category categoryRequest) {

        Category category = getCategoryById(id);

        String trimmedName = categoryRequest.getName() != null ? categoryRequest.getName().trim() : "";

        // Kiểm tra nếu đổi tên và tên mới đã tồn tại
        if (!category.getName().equalsIgnoreCase(trimmedName)
                && categoryRepository.existsByName(trimmedName)) {

            throw new RuntimeException("Tên danh mục đã tồn tại");
        }

        category.setName(trimmedName);
        category.setDescription(categoryRequest.getDescription());

        if (categoryRequest.getStatus() != null) {
            category.setStatus(categoryRequest.getStatus());
        }

        category.setUpdatedAt(LocalDateTime.now());

        return categoryRepository.save(category);
    }

    // Xóa danh mục
    public void deleteCategory(Long id) {

        Category category = getCategoryById(id);

        categoryRepository.delete(category);
    }
}