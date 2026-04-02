package com.gympulse.app.repository;

import com.gympulse.app.model.AmcPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmcPaymentRepository extends JpaRepository<AmcPayment, Long> {
    @Query("SELECT p FROM AmcPayment p JOIN FETCH p.amcContract c WHERE c.admin.id = :adminId ORDER BY p.dueDate ASC")
    List<AmcPayment> findByAdminId(@Param("adminId") Long adminId);

    @Query("SELECT p FROM AmcPayment p JOIN FETCH p.amcContract c WHERE c.admin.id = :adminId AND c.id = :amcId ORDER BY p.dueDate DESC")
    List<AmcPayment> findByAdminIdAndAmcId(@Param("adminId") Long adminId, @Param("amcId") Long amcId);

    @Query("SELECT p FROM AmcPayment p JOIN FETCH p.amcContract c WHERE p.id = :paymentId AND c.admin.id = :adminId")
    Optional<AmcPayment> findOwnedPayment(@Param("paymentId") Long paymentId, @Param("adminId") Long adminId);

    boolean existsByInvoiceNumber(String invoiceNumber);
}
