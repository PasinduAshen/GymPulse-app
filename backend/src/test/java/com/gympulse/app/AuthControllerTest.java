package com.gympulse.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gympulse.app.dto.LoginRequest;
import com.gympulse.app.dto.RegistrationRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void shouldRegisterAndThenLogin() throws Exception {
        // 1. Register
        RegistrationRequest regRequest = new RegistrationRequest();
        regRequest.setName("Test User");
        regRequest.setUsername("testuser_" + System.currentTimeMillis());
        regRequest.setEmail("test_" + System.currentTimeMillis() + "@example.com");
        regRequest.setPassword("Password123!");

        mockMvc.perform(post("/api/admin/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(regRequest)))
                .andExpect(status().isCreated());

        // 2. Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(regRequest.getEmail());
        loginRequest.setPassword(regRequest.getPassword());

        mockMvc.perform(post("/api/admin/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk());
    }

    @Test
    void shouldDenyAccessToProtectedRouteWithoutToken() throws Exception {
        mockMvc.perform(get("/api/amc/list"))
                .andExpect(status().isForbidden());
    }
}
