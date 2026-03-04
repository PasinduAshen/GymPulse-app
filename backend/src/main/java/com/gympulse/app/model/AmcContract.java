package com.gympulse.app.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "amc_contracts")
public class AmcContract {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Admin admin;

    private String companyName;
    private String machineName;
    private String brand;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "service_frequency")
    private String serviceFrequency;

    @Column(name = "contact_info")
    private String contactInfo;

    @Column(name = "pdf_filename")
    private String pdfFilename;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Admin getAdmin() { return admin; }
    public void setAdmin(Admin admin) { this.admin = admin; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getMachineName() { return machineName; }
    public void setMachineName(String machineName) { this.machineName = machineName; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public String getServiceFrequency() { return serviceFrequency; }
    public void setServiceFrequency(String serviceFrequency) { this.serviceFrequency = serviceFrequency; }

    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }

    public String getPdfFilename() { return pdfFilename; }
    public void setPdfFilename(String pdfFilename) { this.pdfFilename = pdfFilename; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
