package com.gympulse.app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.gympulse.app.model.Admin;
import java.util.Optional;

public interface AdminRepository extends JpaRepository<Admin, Long> {
    Optional<Admin> findByUsername(String username);

    Optional<Admin> findByEmail(String email);

    long countByRoleIgnoreCase(String role);
}