package com.gympulse.app.model;

import jakarta.persistence.*;

@Entity
@Table(name = "admins")
public class Admin {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;
    private String name;
    private String username;
    private String password;
    private String role = "ADMIN";

    @Column(name = "reset_code")
    private String resetCode;

    @Column(name = "reset_code_expires")
    private java.time.LocalDateTime resetCodeExpires;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = java.time.LocalDateTime.now();
    }

    // Getters

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public String getUsername() {
        return username;
    }

    public String getPassword() {
        return password;
    }

    public String getRole() {
        return role;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public String getResetCode() {
        return resetCode;
    }

    public void setResetCode(String resetCode) {
        this.resetCode = resetCode;
    }

    public java.time.LocalDateTime getResetCodeExpires() {
        return resetCodeExpires;
    }

    public void setResetCodeExpires(java.time.LocalDateTime resetCodeExpires) {
        this.resetCodeExpires = resetCodeExpires;
    }

    // Setters

    public void setEmail(String email) {
        this.email = email;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
