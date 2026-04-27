package com.gympulse.app.dto;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public class MachineDto {

    private Long id;

    @NotBlank(message = "Machine name is required")
    private String name;

    @NotBlank(message = "Brand is required")
    private String brand;

    private String model;

    private String serialNumber;

    // ✅ Added
    private String category;

    // ✅ Added
    private LocalDate purchaseDate;

    private String status;

    private String imageUrl;

    // Getters & Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public LocalDate getPurchaseDate() { return purchaseDate; }
    public void setPurchaseDate(LocalDate purchaseDate) { this.purchaseDate = purchaseDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
}