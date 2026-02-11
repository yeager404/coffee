package com.yeager.coffee.service;

import com.yeager.coffee.dto.request.PlaceOrderRequest;
import com.yeager.coffee.event.dto.OrderCreatedEvent;
import com.yeager.coffee.event.publisher.OrderEventPublisher;
import com.yeager.coffee.model.Bean;
import com.yeager.coffee.model.Order;
import com.yeager.coffee.model.OrderItem;
import com.yeager.coffee.model.User;
import com.yeager.coffee.repository.BeanRepository;
import com.yeager.coffee.repository.OrderRepository;
import com.yeager.coffee.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BeanRepository beanRepository;
    private final InventoryService inventoryService;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    public Long placeOrder(Long userId, PlaceOrderRequest request){
        // 1. Fetch User
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 2. Build Order Object
        Order order = Order.builder()
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();

        // 3. Process Items & Reduce stock
        BigDecimal total = BigDecimal.ZERO;
        List<OrderCreatedEvent.ItemDto> eventItems = new ArrayList<>();

        for(PlaceOrderRequest.ItemRequest itemReq: request.getItems()){
            Bean bean = beanRepository.findById(itemReq.getBeanId())
                    .orElseThrow(() -> new IllegalArgumentException("Bean not found"));

            //Check & Reduce Inventory
            inventoryService.reduceStock(bean.getId(), itemReq.getQuantity());

            // Create Order Item (Snapshotting Price)
            OrderItem orderItem = OrderItem.builder()
                    .bean(bean)
                    .quantity(itemReq.getQuantity()) // Assumes Quantity is Int, if Double logic changes slighlty
                    .priceAtPurchase(bean.getBasePricePerKg())
                    .build();

            order.addOrderItem(orderItem);

            //Calculate Totals
            BigDecimal itemTotal = bean.getBasePricePerKg().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(itemTotal);

            // Add to Event Data
            eventItems.add(new OrderCreatedEvent.ItemDto(bean.getId(), itemReq.getQuantity()));
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // 4. Fire Event to RabbitMQ
        OrderCreatedEvent event = new OrderCreatedEvent(savedOrder.getId(), savedOrder.getCreatedAt(), eventItems);
        eventPublisher.publishOrderCreated(event);

        return savedOrder.getId();
    }
}