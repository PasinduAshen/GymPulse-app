package com.gympulse.app.repository;

import com.gympulse.app.model.ServiceSchedule;
import com.gympulse.app.model.ServiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ServiceScheduleRepository extends JpaRepository<ServiceSchedule, Long> {
    List<ServiceSchedule> findByAmcContractId(Long amcId);
    
    @Query("SELECT s FROM ServiceSchedule s WHERE s.amcContract.id = :amcId ORDER BY s.scheduledDate DESC")
    List<ServiceSchedule> findHistoryByAmcId(@Param("amcId") Long amcId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    void deleteByAmcContractId(Long amcId);
    
    @Query("SELECT s FROM ServiceSchedule s JOIN FETCH s.amcContract a WHERE a.admin.id = :adminId ORDER BY s.scheduledDate ASC")
    List<ServiceSchedule> findByAdminId(@Param("adminId") Long adminId);

    @Query("SELECT s FROM ServiceSchedule s JOIN FETCH s.amcContract a ORDER BY s.scheduledDate ASC")
    List<ServiceSchedule> findAllWithContract();

    @Query("SELECT s FROM ServiceSchedule s JOIN FETCH s.amcContract a WHERE a.admin.id = :adminId " +
           "AND (:status IS NULL OR s.status = :status) " +
           "AND (:machineName IS NULL OR LOWER(a.machineName) LIKE LOWER(CONCAT('%', :machineName, '%'))) " +
           "AND (:brand IS NULL OR LOWER(a.brand) LIKE LOWER(CONCAT('%', :brand, '%'))) " +
           "AND (:startDate IS NULL OR s.scheduledDate >= :startDate) " +
           "AND (:endDate IS NULL OR s.scheduledDate <= :endDate) " +
           "ORDER BY s.scheduledDate ASC")
    List<ServiceSchedule> filterSchedules(
            @Param("adminId") Long adminId,
            @Param("status") ServiceStatus status,
            @Param("machineName") String machineName,
            @Param("brand") String brand,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT s FROM ServiceSchedule s WHERE s.status = com.gympulse.app.model.ServiceStatus.PENDING AND s.scheduledDate < :today")
    List<ServiceSchedule> findOverdueSchedules(@Param("today") LocalDate today);
}
