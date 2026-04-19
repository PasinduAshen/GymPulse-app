package com.gympulse.app.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class RecordPaymentRequest {
    private BigDecimal amountReceived;
    private LocalDate paidDate;
    private String paymentMethod;
    private String notes;

    public BigDecimal getAmountReceived() { return amountReceived; }
    public void setAmountReceived(BigDecimal amountReceived) { this.amountReceived = amountReceived; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
