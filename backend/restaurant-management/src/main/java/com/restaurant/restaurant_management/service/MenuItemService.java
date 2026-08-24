package com.restaurant.restaurant_management.service;

import com.restaurant.restaurant_management.dto.MenuItemRequest;
import com.restaurant.restaurant_management.dto.MenuItemResponse;
import com.restaurant.restaurant_management.entity.Category;
import com.restaurant.restaurant_management.entity.MenuItem;
import com.restaurant.restaurant_management.repository.CategoryRepository;
import com.restaurant.restaurant_management.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MenuItemService {

    private final MenuItemRepository menuItemRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorageService fileStorageService;

    // Lấy danh sách món ăn (có hỗ trợ lọc theo category, tìm kiếm tên/mô tả, lọc status)
    public List<MenuItemResponse> getAllMenuItems(Long categoryId, String search, String status) {
        List<MenuItem> items;
        if (categoryId != null || search != null || status != null) {
            String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
            items = menuItemRepository.searchMenuItems(categoryId, status, trimmedSearch);
        } else {
            items = menuItemRepository.findAll();
        }

        // Lấy danh mục để map tên danh mục vào response
        Map<Long, String> categoryMap = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Category::getName, (existing, replacement) -> existing));

        return items.stream()
                .map(item -> mapToResponse(item, categoryMap.get(item.getCategoryId())))
                .collect(Collectors.toList());
    }

    // Lấy chi tiết món ăn theo ID
    public MenuItemResponse getMenuItemById(Long id) {
        MenuItem menuItem = findEntityById(id);
        String categoryName = categoryRepository.findById(menuItem.getCategoryId())
                .map(Category::getName)
                .orElse(null);
        return mapToResponse(menuItem, categoryName);
    }

    // Thêm món ăn mới kèm tải lên hình ảnh
    @Transactional
    public MenuItemResponse createMenuItem(MenuItemRequest request) {
        // Kiểm tra danh mục có tồn tại không
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại với id: " + request.getCategoryId()));

        // Kiểm tra tên món ăn có bị trùng không
        if (menuItemRepository.existsByName(request.getName().trim())) {
            throw new RuntimeException("Tên món ăn đã tồn tại");
        }

        // Lưu ảnh nếu có
        String imageUrl = null;
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            imageUrl = fileStorageService.storeFile(request.getImage());
        }

        LocalDateTime now = LocalDateTime.now();
        MenuItem menuItem = new MenuItem();
        menuItem.setName(request.getName().trim());
        menuItem.setDescription(request.getDescription());
        menuItem.setMainIngredients(request.getMainIngredients());
        menuItem.setPrice(request.getPrice());
        menuItem.setImage(imageUrl);
        menuItem.setStatus(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus() : "ACTIVE");
        menuItem.setCategoryId(category.getId());
        menuItem.setCreatedAt(now);
        menuItem.setUpdatedAt(now);

        MenuItem savedItem = menuItemRepository.save(menuItem);
        return mapToResponse(savedItem, category.getName());
    }

    // Cập nhật thông tin món ăn (có thể đổi ảnh mới hoặc giữ ảnh cũ)
    @Transactional
    public MenuItemResponse updateMenuItem(Long id, MenuItemRequest request) {
        MenuItem menuItem = findEntityById(id);

        // Kiểm tra danh mục
        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Danh mục không tồn tại với id: " + request.getCategoryId()));

        // Kiểm tra trùng tên với món khác
        if (!menuItem.getName().equalsIgnoreCase(request.getName().trim()) &&
                menuItemRepository.existsByNameAndIdNot(request.getName().trim(), id)) {
            throw new RuntimeException("Tên món ăn đã tồn tại");
        }

        // Nếu có tải ảnh mới lên
        if (request.getImage() != null && !request.getImage().isEmpty()) {
            // Xóa ảnh cũ trên ổ đĩa nếu có
            if (menuItem.getImage() != null) {
                fileStorageService.deleteFile(menuItem.getImage());
            }
            // Lưu ảnh mới
            String newImageUrl = fileStorageService.storeFile(request.getImage());
            menuItem.setImage(newImageUrl);
        }

        menuItem.setName(request.getName().trim());
        menuItem.setDescription(request.getDescription());
        menuItem.setMainIngredients(request.getMainIngredients());
        menuItem.setPrice(request.getPrice());
        menuItem.setCategoryId(category.getId());
        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            menuItem.setStatus(request.getStatus());
        }
        menuItem.setUpdatedAt(LocalDateTime.now());

        MenuItem updatedItem = menuItemRepository.save(menuItem);
        return mapToResponse(updatedItem, category.getName());
    }

    // Cập nhật trạng thái món ăn (ACTIVE, INACTIVE, OUT_OF_STOCK)
    @Transactional
    public MenuItemResponse updateStatus(Long id, String status) {
        MenuItem menuItem = findEntityById(id);
        menuItem.setStatus(status);
        menuItem.setUpdatedAt(LocalDateTime.now());

        MenuItem updatedItem = menuItemRepository.save(menuItem);
        String categoryName = categoryRepository.findById(updatedItem.getCategoryId())
                .map(Category::getName)
                .orElse(null);
        return mapToResponse(updatedItem, categoryName);
    }

    // Xóa món ăn và xóa file ảnh đi kèm
    @Transactional
    public void deleteMenuItem(Long id) {
        MenuItem menuItem = findEntityById(id);

        // Xóa file ảnh lưu trữ nếu có
        if (menuItem.getImage() != null) {
            fileStorageService.deleteFile(menuItem.getImage());
        }

        menuItemRepository.delete(menuItem);
    }

    private MenuItem findEntityById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn với id: " + id));
    }

    private MenuItemResponse mapToResponse(MenuItem item, String categoryName) {
        return MenuItemResponse.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .mainIngredients(item.getMainIngredients())
                .price(item.getPrice())
                .image(item.getImage())
                .status(item.getStatus())
                .categoryId(item.getCategoryId())
                .categoryName(categoryName)
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
