package com.gympulse.app.dto;

import jakarta.validation.constraints.Min;

public class StockRequest {
    @Min(value = 1, message = "Quantity must be at least 1")
    private Integer quantity;
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer q) { this.quantity = q; }
}