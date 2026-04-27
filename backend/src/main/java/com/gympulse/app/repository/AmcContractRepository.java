package com.gympulse.app.repository;

import com.gympulse.app.model.AmcContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AmcContractRepository extends JpaRepository<AmcContract, Long> {
    List<AmcContract> findByAdminId(Long adminId);
}
