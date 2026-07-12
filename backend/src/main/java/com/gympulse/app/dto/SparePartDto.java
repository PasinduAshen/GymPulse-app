package com.gympulse.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public class SparePartDto {

    private Long id;

    @NotBlank(message = "Spare part name is required")
    private String name;

    private String category;

    @Min(value = 0, message = "Quantity must be 0 or greater")
    private Integer quantity = 0;

    @Min(value = 0, message = "Reorder level must be 0 or greater")
    private Integer reorderLevel = 0;

    @Min(value = 0, message = "Unit price must be 0 or greater")
    private BigDecimal unitPrice = BigDecimal.ZERO;

    private boolean lowStock;

    // Image filename (e.g. "uuid.jpg") - served via /api/spare-parts/image/{imageUrl}
    private String imageUrl;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public boolean isLowStock() { return lowStock; }
    public void setLowStock(boolean lowStock) { this.lowStock = lowStock; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}