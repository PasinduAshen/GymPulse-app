package com.gympulse.app.repository;

import com.gympulse.app.model.Machine;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MachineRepository extends JpaRepository<Machine, Long> {

    // Get all machines for admin
    List<Machine> findByAdminIdOrderByCreatedAtDesc(Long adminId);

    // ✅ Fix: MachineService.getAllMachines() uses this
    List<Machine> findByAdminId(Long adminId);

    // ✅ Fix: MachineService.getMachineById() uses this
    Optional<Machine> findByIdAndAdminId(Long id, Long adminId);

    // ✅ Fix: MachineService.countMachines() uses this
    long countByAdminId(Long adminId);
}