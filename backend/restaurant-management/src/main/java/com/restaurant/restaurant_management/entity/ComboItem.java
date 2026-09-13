package com.restaurant.restaurant_management.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "combo_items", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"combo_id", "menu_item_id"})
})
public class ComboItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "combo_id", nullable = false)
    private Long comboId;

    @Column(name = "menu_item_id", nullable = false)
    private Long menuItemId;

    @Column(nullable = false)
    private Integer quantity = 1;

    public ComboItem() {
    }

    public ComboItem(Long comboId, Long menuItemId, Integer quantity) {
        this.comboId = comboId;
        this.menuItemId = menuItemId;
        this.quantity = quantity != null ? quantity : 1;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getComboId() {
        return comboId;
    }

    public void setComboId(Long comboId) {
        this.comboId = comboId;
    }

    public Long getMenuItemId() {
        return menuItemId;
    }

    public void setMenuItemId(Long menuItemId) {
        this.menuItemId = menuItemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
