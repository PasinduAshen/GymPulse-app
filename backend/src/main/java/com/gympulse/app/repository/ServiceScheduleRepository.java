package com.gympulse.app.repository;

import com.gympulse.app.model.ServiceSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceScheduleRepository extends JpaRepository<ServiceSchedule, Long> {
    List<ServiceSchedule> findByAmcContractId(Long amcId);
    void deleteByAmcContractId(Long amcId);
    
    @Query("SELECT s FROM ServiceSchedule s JOIN s.amcContract a WHERE a.admin.id = :adminId ORDER BY s.scheduledDate ASC")
    List<ServiceSchedule> findByAdminId(@Param("adminId") Long adminId);
}
