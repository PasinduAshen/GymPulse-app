package com.gympulse.app.repository;

import com.gympulse.app.model.SparePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface SparePartRepository extends JpaRepository<SparePart, Long> {
    List<SparePart> findByAdminId(Long adminId);
    Optional<SparePart> findByIdAndAdminId(Long id, Long adminId);
    long countByAdminId(Long adminId);

    @Query("SELECT s FROM SparePart s WHERE s.admin.id = :adminId AND s.quantity < s.reorderLevel")
    List<SparePart> findLowStockByAdminId(@Param("adminId") Long adminId);
}
