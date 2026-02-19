// src/test/java/com/yeager/coffee/service/OrderServiceTest.java
package com.yeager.coffee.service;

import com.yeager.coffee.dto.request.PlaceOrderRequest;
import com.yeager.coffee.event.publisher.OrderEventPublisher;
import com.yeager.coffee.model.Bean;
import com.yeager.coffee.model.Order;
import com.yeager.coffee.model.User;
import com.yeager.coffee.repository.BeanRepository;
import com.yeager.coffee.repository.OrderRepository;
import com.yeager.coffee.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock private OrderRepository orderRepository;
    @Mock private UserRepository userRepository;
    @Mock private BeanRepository beanRepository;
    @Mock private InventoryService inventoryService;
    @Mock private OrderEventPublisher eventPublisher;

    @InjectMocks private OrderService orderService;

    @Test
    void shouldPlaceOrderSuccessfully() {
        // Arrange
        Long userId = 1L;
        Long beanId = 100L;
        PlaceOrderRequest request = new PlaceOrderRequest();
        request.setItems(List.of(new PlaceOrderRequest.ItemRequest(beanId, 2)));

        User user = User.builder().id(userId).email("test@test.com").build();
        Bean bean = Bean.builder().id(beanId).basePricePerKg(BigDecimal.valueOf(10)).build();
        Order savedOrder = Order.builder()
                                .id(555L)
                                .createdAt(java.time.LocalDateTime.now())
                                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(beanRepository.findById(beanId)).thenReturn(Optional.of(bean));
        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        // Act
        Long orderId = orderService.placeOrder(userId, request);

        // Assert
        assertNotNull(orderId);
        verify(inventoryService).reduceStock(beanId, 2); // Verify interaction
        verify(eventPublisher).publishOrderCreated(any()); // Verify event
    }
}
