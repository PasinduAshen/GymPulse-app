package com.gympulse.app.repository;

import com.gympulse.app.model.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MachineRepository extends JpaRepository<Machine, Long> {
    List<Machine> findByAdminIdOrderByCreatedAtDesc(Long adminId);
}