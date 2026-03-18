package com.gympulse.app.repository;

import com.gympulse.app.model.ServiceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceScheduleRepository extends JpaRepository<ServiceSchedule, Long> {
    List<ServiceSchedule> findByAmcContractId(Long amcId);
    void deleteByAmcContractId(Long amcId);
}
