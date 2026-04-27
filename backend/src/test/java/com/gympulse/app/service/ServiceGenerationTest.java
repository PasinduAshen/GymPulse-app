package com.gympulse.app.service;

import com.gympulse.app.dto.AmcContractDto;
import com.gympulse.app.model.Admin;
import com.gympulse.app.model.AmcContract;
import com.gympulse.app.model.ServiceSchedule;
import com.gympulse.app.model.ServiceStatus;
import com.gympulse.app.repository.AdminRepository;
import com.gympulse.app.repository.AmcContractRepository;
import com.gympulse.app.repository.ServiceScheduleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class ServiceGenerationTest {

    @Mock
    private AmcContractRepository amcContractRepository;

    @Mock
    private ServiceScheduleRepository serviceScheduleRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private AmcService amcService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testGenerateSchedules_NormalCase() {
        // Arrange
        Long amcId = 1L;
        AmcContract contract = new AmcContract();
        contract.setId(amcId);
        contract.setStartDate(LocalDate.of(2026, 1, 1));
        contract.setEndDate(LocalDate.of(2027, 1, 1));
        contract.setServiceFrequency("3 months");

        when(amcContractRepository.findById(amcId)).thenReturn(Optional.of(contract));
        when(amcContractRepository.save(any(AmcContract.class))).thenReturn(contract);

        AmcContractDto dto = new AmcContractDto();
        dto.setStartDate(contract.getStartDate());
        dto.setEndDate(contract.getEndDate());
        dto.setServiceFrequency(contract.getServiceFrequency());
        dto.setMachineName("Treadmill");
        dto.setCompanyName("GymCorp");

        // Act
        amcService.updateAmc(amcId, dto);

        // Assert
        // Frequency is 3 months, contract is 12 months.
        // nextDate starts at StartDate + 3 months = 2026-04-01
        // Loop runs for 2026-04-01, 2026-07-01, 2026-10-01, 2027-01-01 (4 times)
        verify(serviceScheduleRepository, times(4)).save(any(ServiceSchedule.class));
    }

    @Test
    public void testGenerateSchedules_ShortContract() {
        // Arrange
        Long amcId = 2L;
        AmcContract contract = new AmcContract();
        contract.setId(amcId);
        contract.setStartDate(LocalDate.of(2026, 1, 1));
        contract.setEndDate(LocalDate.of(2026, 2, 1)); // 1 month contract
        contract.setServiceFrequency("3 months"); // 3 months frequency

        when(amcContractRepository.findById(amcId)).thenReturn(Optional.of(contract));
        when(amcContractRepository.save(any(AmcContract.class))).thenReturn(contract);

        AmcContractDto dto = new AmcContractDto();
        dto.setStartDate(contract.getStartDate());
        dto.setEndDate(contract.getEndDate());
        dto.setServiceFrequency(contract.getServiceFrequency());

        // Act
        amcService.updateAmc(amcId, dto);

        // Assert
        // nextDate = 2026-04-01. nextDate.isBefore(2026-02-01) is false.
        // Zero schedules should be generated.
        verify(serviceScheduleRepository, never()).save(any(ServiceSchedule.class));
    }
}
