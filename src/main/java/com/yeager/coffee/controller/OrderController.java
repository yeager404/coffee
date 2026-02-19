package com.yeager.coffee.controller;

import com.yeager.coffee.dto.request.PlaceOrderRequest;
import com.yeager.coffee.dto.response.OrderSummaryDto;
import com.yeager.coffee.model.User;
import com.yeager.coffee.service.OrderService;
import com.yeager.coffee.repository.UserRepository;
import com.yeager.coffee.repository.OrderRepository;
import com.yeager.coffee.model.Order;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @PostMapping
    @PreAuthorize("hasAnyAuthority('CUSTOMER', 'ADMIN')")
    public ResponseEntity<Long> placeOrder(@Valid @RequestBody PlaceOrderRequest request, Principal principal) {
        // 1. Get the User ID from the Security Context (JWT)
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // 2. Place Order
        Long orderId = orderService.placeOrder(user.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(orderId);
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('CUSTOMER', 'ADMIN')")
    public ResponseEntity<Page<OrderSummaryDto>> getMyOrders(Principal principal, Pageable pageable) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow();

        // Fetch Orders & Map to DTO
        // Note: In a real app, move this mapping logic to the Service layer
        Page<OrderSummaryDto> orders = orderRepository.findAllByUserId(user.getId(), pageable)
                .map(this::mapToDto);

        return ResponseEntity.ok(orders);
    }

    // Helper Mapper (or use MapStruct)
    private OrderSummaryDto mapToDto(Order order) {
        return OrderSummaryDto.builder()
                .orderId(order.getId())
                .placedAt(order.getCreatedAt())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                // .items(...) - Omitted for brevity in list view
                .build();
    }
}