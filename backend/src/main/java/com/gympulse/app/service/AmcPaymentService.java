package com.gympulse.app.service;

import com.gympulse.app.dto.AmcPaymentDto;
import com.gympulse.app.dto.CreatePaymentInvoiceRequest;
import com.gympulse.app.dto.RecordPaymentRequest;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.AmcContract;
import com.gympulse.app.model.AmcPayment;
import com.gympulse.app.model.PaymentStatus;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.AmcContractRepository;
import com.gympulse.app.repository.AmcPaymentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AmcPaymentService {
    private final AmcPaymentRepository amcPaymentRepository;
    private final AmcContractRepository amcContractRepository;
    private final AdminRepository adminRepository;

    public AmcPaymentService(AmcPaymentRepository amcPaymentRepository,
                             AmcContractRepository amcContractRepository,
                             AdminRepository adminRepository) {
        this.amcPaymentRepository = amcPaymentRepository;
        this.amcContractRepository = amcContractRepository;
        this.adminRepository = adminRepository;
    }

    @Transactional
    public AmcPaymentDto createInvoice(Long amcId, CreatePaymentInvoiceRequest request, String userEmail) {
        Admin admin = findAdmin(userEmail);
        AmcContract contract = amcContractRepository.findById(amcId)
                .orElseThrow(() -> new RuntimeException("AMC contract not found."));

        if (!contract.getAdmin().getId().equals(admin.getId())) {
            throw new RuntimeException("Unauthorized access to this AMC contract.");
        }

        if (request.getAmountDue() == null || request.getAmountDue().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("amountDue must be greater than 0.");
        }
        if (request.getDueDate() == null) {
            throw new RuntimeException("dueDate is required.");
        }

        String invoiceNumber = request.getInvoiceNumber();
        if (invoiceNumber == null || invoiceNumber.isBlank()) {
            invoiceNumber = "INV-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        }
        if (amcPaymentRepository.existsByInvoiceNumber(invoiceNumber)) {
            throw new RuntimeException("Invoice number already exists.");
        }

        AmcPayment payment = new AmcPayment();
        payment.setAmcContract(contract);
        payment.setInvoiceNumber(invoiceNumber);
        payment.setInvoiceDate(request.getInvoiceDate() != null ? request.getInvoiceDate() : LocalDate.now());
        payment.setDueDate(request.getDueDate());
        payment.setAmountDue(request.getAmountDue());
        payment.setAmountPaid(BigDecimal.ZERO);
        payment.setNotes(request.getNotes());
        payment.setStatus(calculateStatus(request.getAmountDue(), BigDecimal.ZERO, request.getDueDate()));

        return toDto(amcPaymentRepository.save(payment));
    }

    @Transactional
    public AmcPaymentDto recordPayment(Long paymentId, RecordPaymentRequest request, String userEmail) {
        Admin admin = findAdmin(userEmail);
        AmcPayment payment = amcPaymentRepository.findOwnedPayment(paymentId, admin.getId())
                .orElseThrow(() -> new RuntimeException("Payment record not found."));

        if (request.getAmountReceived() == null || request.getAmountReceived().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RuntimeException("amountReceived must be greater than 0.");
        }

        BigDecimal updatedPaid = payment.getAmountPaid().add(request.getAmountReceived());
        payment.setAmountPaid(updatedPaid);
        payment.setPaidDate(request.getPaidDate() != null ? request.getPaidDate() : LocalDate.now());

        if (request.getPaymentMethod() != null && !request.getPaymentMethod().isBlank()) {
            payment.setPaymentMethod(request.getPaymentMethod());
        }

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String current = payment.getNotes() == null ? "" : payment.getNotes() + "\n";
            payment.setNotes(current + request.getNotes());
        }

        payment.setStatus(calculateStatus(payment.getAmountDue(), payment.getAmountPaid(), payment.getDueDate()));
        return toDto(amcPaymentRepository.save(payment));
    }

    @Transactional
    public List<AmcPaymentDto> getPayments(String userEmail,
                                           PaymentStatus status,
                                           String machineName,
                                           String brand,
                                           LocalDate dueFrom,
                                           LocalDate dueTo,
                                           boolean outstandingOnly) {
        Admin admin = findAdmin(userEmail);

        return amcPaymentRepository.findByAdminId(admin.getId()).stream()
                .peek(this::refreshStatusIfNeeded)
                .filter(p -> status == null || p.getStatus() == status)
                .filter(p -> !outstandingOnly || p.getStatus() != PaymentStatus.PAID)
                .filter(p -> machineName == null || machineName.isBlank() ||
                        (p.getAmcContract().getMachineName() != null &&
                                p.getAmcContract().getMachineName().toLowerCase(Locale.ROOT)
                                        .contains(machineName.toLowerCase(Locale.ROOT))))
                .filter(p -> brand == null || brand.isBlank() ||
                        (p.getAmcContract().getBrand() != null &&
                                p.getAmcContract().getBrand().toLowerCase(Locale.ROOT)
                                        .contains(brand.toLowerCase(Locale.ROOT))))
                .filter(p -> dueFrom == null || !p.getDueDate().isBefore(dueFrom))
                .filter(p -> dueTo == null || !p.getDueDate().isAfter(dueTo))
                .sorted(Comparator.comparing(AmcPayment::getDueDate).reversed())
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<AmcPaymentDto> getOutstandingPayments(String userEmail) {
        return getPayments(userEmail, null, null, null, null, null, true);
    }

    @Transactional
    public List<AmcPaymentDto> getPaymentsByAmc(Long amcId, String userEmail) {
        Admin admin = findAdmin(userEmail);

        return amcPaymentRepository.findByAdminIdAndAmcId(admin.getId(), amcId).stream()
                .peek(this::refreshStatusIfNeeded)
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private Admin findAdmin(String userEmail) {
        return adminRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Admin account not found."));
    }

    private PaymentStatus calculateStatus(BigDecimal amountDue, BigDecimal amountPaid, LocalDate dueDate) {
        if (amountPaid.compareTo(amountDue) >= 0) {
            return PaymentStatus.PAID;
        }
        if (amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            return PaymentStatus.PARTIALLY_PAID;
        }
        if (dueDate != null && dueDate.isBefore(LocalDate.now())) {
            return PaymentStatus.OVERDUE;
        }
        return PaymentStatus.UNPAID;
    }

    private void refreshStatusIfNeeded(AmcPayment payment) {
        PaymentStatus recalculated = calculateStatus(payment.getAmountDue(), payment.getAmountPaid(), payment.getDueDate());
        if (payment.getStatus() != recalculated) {
            payment.setStatus(recalculated);
            amcPaymentRepository.save(payment);
        }
    }

    private AmcPaymentDto toDto(AmcPayment payment) {
        AmcPaymentDto dto = new AmcPaymentDto();
        dto.setId(payment.getId());
        dto.setAmcId(payment.getAmcContract().getId());
        dto.setMachineName(payment.getAmcContract().getMachineName());
        dto.setBrand(payment.getAmcContract().getBrand());
        dto.setCompanyName(payment.getAmcContract().getCompanyName());
        dto.setInvoiceNumber(payment.getInvoiceNumber());
        dto.setInvoiceDate(payment.getInvoiceDate());
        dto.setDueDate(payment.getDueDate());
        dto.setAmountDue(payment.getAmountDue());
        dto.setAmountPaid(payment.getAmountPaid());
        dto.setOutstandingAmount(payment.getAmountDue().subtract(payment.getAmountPaid()).max(BigDecimal.ZERO));
        dto.setPaidDate(payment.getPaidDate());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setNotes(payment.getNotes());
        dto.setStatus(payment.getStatus());
        return dto;
    }
}
