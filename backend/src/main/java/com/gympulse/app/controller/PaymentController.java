package com.gympulse.app.controller;

import com.gympulse.app.dto.AmcPaymentDto;
import com.gympulse.app.dto.CreatePaymentInvoiceRequest;
import com.gympulse.app.dto.RecordPaymentRequest;
import com.gympulse.app.model.PaymentStatus;
import com.gympulse.app.service.AmcPaymentService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/amc")
public class PaymentController {

    private final AmcPaymentService amcPaymentService;

    public PaymentController(AmcPaymentService amcPaymentService) {
        this.amcPaymentService = amcPaymentService;
    }

    @PostMapping("/{amcId}/payments/invoice")
    public ResponseEntity<?> createPaymentInvoice(@PathVariable Long amcId, @RequestBody CreatePaymentInvoiceRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            AmcPaymentDto created = amcPaymentService.createInvoice(amcId, request, userEmail);
            return new ResponseEntity<>(created, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/payments/{paymentId}/receive")
    public ResponseEntity<?> recordReceivedPayment(@PathVariable Long paymentId, @RequestBody RecordPaymentRequest request) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String userEmail = auth.getName();
            AmcPaymentDto updated = amcPaymentService.recordPayment(paymentId, request, userEmail);
            return new ResponseEntity<>(updated, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/payments")
    public ResponseEntity<List<AmcPaymentDto>> getPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(required = false) String machineName,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dueTo,
            @RequestParam(defaultValue = "false") boolean outstandingOnly
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        return new ResponseEntity<>(
                amcPaymentService.getPayments(userEmail, status, machineName, brand, dueFrom, dueTo, outstandingOnly),
                HttpStatus.OK
        );
    }

    @GetMapping("/payments/outstanding")
    public ResponseEntity<List<AmcPaymentDto>> getOutstandingPayments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        return new ResponseEntity<>(amcPaymentService.getOutstandingPayments(userEmail), HttpStatus.OK);
    }

    @GetMapping("/{amcId}/payments")
    public ResponseEntity<List<AmcPaymentDto>> getAmcPayments(@PathVariable Long amcId) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userEmail = auth.getName();
        return new ResponseEntity<>(amcPaymentService.getPaymentsByAmc(amcId, userEmail), HttpStatus.OK);
    }
}
