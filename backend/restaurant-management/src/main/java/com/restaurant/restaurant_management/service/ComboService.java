package com.restaurant.restaurant_management.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.restaurant.restaurant_management.dto.ComboItemRequest;
import com.restaurant.restaurant_management.dto.ComboItemResponse;
import com.restaurant.restaurant_management.dto.ComboRequest;
import com.restaurant.restaurant_management.dto.ComboResponse;
import com.restaurant.restaurant_management.entity.Combo;
import com.restaurant.restaurant_management.entity.ComboItem;
import com.restaurant.restaurant_management.entity.MenuItem;
import com.restaurant.restaurant_management.repository.ComboItemRepository;
import com.restaurant.restaurant_management.repository.ComboRepository;
import com.restaurant.restaurant_management.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComboService {

    private final ComboRepository comboRepository;
    private final ComboItemRepository comboItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final FileStorageService fileStorageService;

    public List<ComboResponse> getAllCombos() {
        return comboRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ComboResponse getComboById(Long id) {
        return mapToResponse(findEntityById(id));
    }

    @Transactional
    public ComboResponse createCombo(ComboRequest request) {

        if (comboRepository.existsByName(request.getName().trim())) {
            throw new RuntimeException("Tên combo đã tồn tại");
        }

        String imageUrl = null;

        if (request.getImage() != null && !request.getImage().isEmpty()) {
            imageUrl = fileStorageService.storeFile(request.getImage());
        }

        LocalDateTime now = LocalDateTime.now();

        Combo combo = new Combo();
        combo.setName(request.getName().trim());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());
        combo.setImage(imageUrl);
        combo.setStatus(
                request.getStatus() != null && !request.getStatus().isBlank()
                        ? request.getStatus()
                        : "ACTIVE"
        );
        combo.setCreatedAt(now);
        combo.setUpdatedAt(now);

        Combo savedCombo = comboRepository.save(combo);

        List<ComboItemRequest> itemRequests = parseComboItems(request);
        if (!itemRequests.isEmpty()) {
            setComboItems(savedCombo.getId(), itemRequests);
        }

        return mapToResponse(savedCombo);
    }

    @Transactional
    public ComboResponse updateCombo(Long id, ComboRequest request) {

        Combo combo = findEntityById(id);

        if (!combo.getName().equalsIgnoreCase(request.getName().trim())
                && comboRepository.existsByName(request.getName().trim())) {
            throw new RuntimeException("Tên combo đã tồn tại");
        }

        // Cập nhật ảnh mới
        if (request.getImage() != null && !request.getImage().isEmpty()) {

            if (combo.getImage() != null) {
                fileStorageService.deleteFile(combo.getImage());
            }

            String imageUrl = fileStorageService.storeFile(request.getImage());
            combo.setImage(imageUrl);
        }

        combo.setName(request.getName().trim());
        combo.setDescription(request.getDescription());
        combo.setPrice(request.getPrice());

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            combo.setStatus(request.getStatus());
        }

        combo.setUpdatedAt(LocalDateTime.now());

        Combo savedCombo = comboRepository.save(combo);

        if (request.getItemsJson() != null || (request.getItems() != null && !request.getItems().isEmpty())) {
            List<ComboItemRequest> itemRequests = parseComboItems(request);
            setComboItems(savedCombo.getId(), itemRequests);
        }

        return mapToResponse(savedCombo);
    }

    @Transactional
    public void deleteCombo(Long id) {

        Combo combo = findEntityById(id);

        if (combo.getImage() != null) {
            fileStorageService.deleteFile(combo.getImage());
        }

        combo.setStatus("INACTIVE");
        combo.setUpdatedAt(LocalDateTime.now());

        comboRepository.save(combo);
    }

    // --- COMBO ITEMS API METHODS ---

    public List<ComboItemResponse> getComboItems(Long comboId) {
        findEntityById(comboId); // Validate combo exists
        List<ComboItem> comboItems = comboItemRepository.findByComboId(comboId);
        return comboItems.stream()
                .map(this::mapItemToResponse)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .collect(Collectors.toList());
    }

    @Transactional
    public ComboItemResponse addComboItem(Long comboId, ComboItemRequest request) {
        findEntityById(comboId);

        MenuItem menuItem = menuItemRepository.findById(request.getMenuItemId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy món ăn với ID: " + request.getMenuItemId()));

        Optional<ComboItem> existingItemOpt = comboItemRepository.findByComboIdAndMenuItemId(comboId, request.getMenuItemId());
        ComboItem comboItem;
        if (existingItemOpt.isPresent()) {
            comboItem = existingItemOpt.get();
            int newQty = comboItem.getQuantity() + (request.getQuantity() != null ? request.getQuantity() : 1);
            comboItem.setQuantity(newQty);
        } else {
            comboItem = new ComboItem(comboId, menuItem.getId(), request.getQuantity() != null ? request.getQuantity() : 1);
        }

        ComboItem saved = comboItemRepository.save(comboItem);
        return mapItemToResponse(saved).orElseThrow(() -> new RuntimeException("Lỗi khi thêm món vào combo"));
    }

    @Transactional
    public ComboItemResponse updateComboItemQuantity(Long comboId, Long menuItemId, Integer quantity) {
        findEntityById(comboId);
        ComboItem comboItem = comboItemRepository.findByComboIdAndMenuItemId(comboId, menuItemId)
                .orElseThrow(() -> new RuntimeException("Món ăn không tồn tại trong combo này"));

        if (quantity == null || quantity <= 0) {
            comboItemRepository.deleteByComboIdAndMenuItemId(comboId, menuItemId);
            return null;
        }

        comboItem.setQuantity(quantity);
        ComboItem saved = comboItemRepository.save(comboItem);
        return mapItemToResponse(saved).orElseThrow(() -> new RuntimeException("Lỗi khi cập nhật số lượng"));
    }

    @Transactional
    public void removeComboItem(Long comboId, Long menuItemId) {
        findEntityById(comboId);
        comboItemRepository.deleteByComboIdAndMenuItemId(comboId, menuItemId);
    }

    @Transactional
    public List<ComboItemResponse> setComboItems(Long comboId, List<ComboItemRequest> itemRequests) {
        findEntityById(comboId);
        comboItemRepository.deleteByComboId(comboId);

        if (itemRequests == null || itemRequests.isEmpty()) {
            return new ArrayList<>();
        }

        List<ComboItem> newItems = new ArrayList<>();
        for (ComboItemRequest req : itemRequests) {
            if (req.getMenuItemId() != null && menuItemRepository.existsById(req.getMenuItemId())) {
                int qty = (req.getQuantity() != null && req.getQuantity() > 0) ? req.getQuantity() : 1;
                newItems.add(new ComboItem(comboId, req.getMenuItemId(), qty));
            }
        }

        if (!newItems.isEmpty()) {
            comboItemRepository.saveAll(newItems);
        }

        return getComboItems(comboId);
    }

    // --- HELPER METHODS ---

    private Combo findEntityById(Long id) {
        return comboRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy combo với id: " + id));
    }

    private List<ComboItemRequest> parseComboItems(ComboRequest request) {
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            return request.getItems();
        }
        if (request.getItemsJson() != null && !request.getItemsJson().isBlank()) {
            try {
                ObjectMapper objectMapper = new ObjectMapper();
                return objectMapper.readValue(request.getItemsJson(), new TypeReference<List<ComboItemRequest>>() {});
            } catch (Exception e) {
                // Log or ignore parse error
            }
        }
        return new ArrayList<>();
    }

    private ComboResponse mapToResponse(Combo combo) {
        ComboResponse response = new ComboResponse();
        response.setId(combo.getId());
        response.setName(combo.getName());
        response.setDescription(combo.getDescription());
        response.setPrice(combo.getPrice());
        response.setImage(combo.getImage());
        response.setStatus(combo.getStatus());
        response.setCreatedAt(combo.getCreatedAt());
        response.setUpdatedAt(combo.getUpdatedAt());
        response.setItems(getComboItems(combo.getId()));
        return response;
    }

    private Optional<ComboItemResponse> mapItemToResponse(ComboItem item) {
        Optional<MenuItem> menuItemOpt = menuItemRepository.findById(item.getMenuItemId());
        if (menuItemOpt.isEmpty()) {
            return Optional.empty();
        }
        MenuItem menuItem = menuItemOpt.get();

        ComboItemResponse res = new ComboItemResponse();
        res.setId(item.getId());
        res.setComboId(item.getComboId());
        res.setMenuItemId(menuItem.getId());
        res.setMenuItemName(menuItem.getName());
        res.setMenuItemPrice(menuItem.getPrice());
        res.setMenuItemImage(menuItem.getImage());
        res.setQuantity(item.getQuantity());

        return Optional.of(res);
    }
}