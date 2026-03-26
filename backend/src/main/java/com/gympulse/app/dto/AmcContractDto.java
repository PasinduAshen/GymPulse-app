package com.gympulse.app.dto;

import java.time.LocalDate;

public class AmcContractDto {
    private Long id;
    private String companyName;
    private String machineName;
    private String brand;
    private LocalDate startDate;
    private LocalDate endDate;
    private String serviceFrequency;
    private String contactInfo;
    private String pdfFilename;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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
}
