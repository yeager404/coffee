package com.yeager.coffee.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.yeager.coffee.config.ApplicationConfig;
import com.yeager.coffee.config.SecurityConfig;
import com.yeager.coffee.dto.request.PlaceOrderRequest;
import com.yeager.coffee.model.User;
import com.yeager.coffee.repository.OrderRepository;
import com.yeager.coffee.repository.UserRepository;
import com.yeager.coffee.security.JwtUtils;
import com.yeager.coffee.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import({ SecurityConfig.class, ApplicationConfig.class }) // 👈 TELLS TEST TO LOAD SECURITY
public class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // --- ALL CONTROLLER & SECURITY DEPENDENCIES MOCKED ---
    @MockBean
    private OrderService orderService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private OrderRepository orderRepository;

    // --- ALL SECURITY DEPENDENCIES MOCKED ---
    @MockBean
    private com.yeager.coffee.security.JwtUtils jwtUtils;

    @MockBean
    private com.yeager.coffee.security.CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "testuser@example.com", authorities = "CUSTOMER")
    void placeOrder_ShouldReturnCreated() throws Exception {
        // 1. Arrange - Setup the Request Body
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setItems(List.of(new PlaceOrderRequest.ItemRequest(1L, 1)));

        // 2. Arrange - Mock the User Lookup
        User mockUser = User.builder().id(99L).email("testuser@example.com").build();
        when(userRepository.findByEmail("testuser@example.com")).thenReturn(Optional.of(mockUser));

        // 3. Arrange - Mock the Service Call
        when(orderService.placeOrder(any(), any())).thenReturn(123L);

        // 4. Act & Assert
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin@example.com", authorities = "ADMIN")
    void placeOrder_AsAdmin_ShouldReturnCreated() throws Exception {
        // 1. Arrange - Setup the Request Body
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setItems(List.of(new PlaceOrderRequest.ItemRequest(1L, 1)));

        // 2. Arrange - Mock the User Lookup (Needed for Admin too)
        User mockUser = User.builder().id(100L).email("admin@example.com").role(User.Role.ADMIN).build();
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(mockUser));

        // 3. Arrange - Mock Order Service
        when(orderService.placeOrder(any(), any())).thenReturn(124L);

        // 4. Act & Assert
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request))
                .with(csrf()))
                .andExpect(status().isCreated());
    }
}