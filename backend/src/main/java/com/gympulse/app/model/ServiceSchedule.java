package com.gympulse.app.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "service_schedules")
public class ServiceSchedule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "amc_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private AmcContract amcContract;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    private String notes;

    @Enumerated(EnumType.STRING)
    private ServiceStatus status = ServiceStatus.PENDING;

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

    public AmcContract getAmcContract() { return amcContract; }
    public void setAmcContract(AmcContract amcContract) { this.amcContract = amcContract; }

    public LocalDate getScheduledDate() { return scheduledDate; }
    public void setScheduledDate(LocalDate scheduledDate) { this.scheduledDate = scheduledDate; }

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public ServiceStatus getStatus() { return status; }
    public void setStatus(ServiceStatus status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
