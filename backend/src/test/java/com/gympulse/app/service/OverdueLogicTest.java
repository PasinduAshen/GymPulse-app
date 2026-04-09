package com.gympulse.app.service;

import com.gympulse.app.model.AmcContract;
import com.gympulse.app.model.ServiceSchedule;
import com.gympulse.app.model.ServiceStatus;
import com.gympulse.app.repository.AmcContractRepository;
import com.gympulse.app.repository.ServiceScheduleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

public class OverdueLogicTest {

    @Mock
    private ServiceScheduleRepository serviceScheduleRepository;

    @Mock
    private AmcContractRepository amcContractRepository;

    @InjectMocks
    private AmcService amcService;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    public void testDetectOverdueServices() {
        // Arrange
        LocalDate today = LocalDate.now();
        ServiceSchedule overdueSchedule = new ServiceSchedule();
        overdueSchedule.setId(1L);
        overdueSchedule.setScheduledDate(today.minusDays(1));
        overdueSchedule.setStatus(ServiceStatus.PENDING);

        ServiceSchedule pendingSchedule = new ServiceSchedule();
        pendingSchedule.setId(2L);
        pendingSchedule.setScheduledDate(today.plusDays(1));
        pendingSchedule.setStatus(ServiceStatus.PENDING);

        when(serviceScheduleRepository.findOverdueSchedules(today))
                .thenReturn(Arrays.asList(overdueSchedule));
        when(amcContractRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        amcService.runDailyMaintenance();

        // Assert
        assertEquals(ServiceStatus.OVERDUE, overdueSchedule.getStatus());
        verify(serviceScheduleRepository, times(1)).save(overdueSchedule);
    }

    @Test
    public void testExcludeCompletedServicesFromOverdue() {
        // Arrange
        LocalDate today = LocalDate.now();
        ServiceSchedule completedSchedule = new ServiceSchedule();
        completedSchedule.setId(1L);
        completedSchedule.setScheduledDate(today.minusDays(1));
        completedSchedule.setStatus(ServiceStatus.COMPLETED);

        // findOverdueSchedules should only return PENDING ones based on repository query, 
        // but we test the service logic safeguard too.
        when(serviceScheduleRepository.findOverdueSchedules(today))
                .thenReturn(Arrays.asList(completedSchedule));
        when(amcContractRepository.findAll()).thenReturn(Arrays.asList());

        // Act
        amcService.runDailyMaintenance();

        // Assert - should remain COMPLETED
        assertEquals(ServiceStatus.COMPLETED, completedSchedule.getStatus());
        verify(serviceScheduleRepository, never()).save(completedSchedule);
    }
}
