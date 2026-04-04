package com.yeager.coffee.service;

import com.yeager.coffee.dto.request.PlaceOrderRequest;
import com.yeager.coffee.event.dto.OrderCreatedEvent;
import com.yeager.coffee.event.publisher.OrderEventPublisher;
import com.yeager.coffee.model.*;
import com.yeager.coffee.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final BeanRepository beanRepository;
    private final InventoryService inventoryService;
    private final AnalyticsEventRepository analyticsEventRepository;
    private final OrderEventPublisher eventPublisher;

    @Transactional
    public Long placeOrder(Long userId, PlaceOrderRequest request) {

        // 1. Fetch user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String location = normalizeLocation(request.getLocation());

        // 2. Build order
        Order order = Order.builder()
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .location(location)
                .build();

        BigDecimal total = BigDecimal.ZERO;
        List<OrderCreatedEvent.ItemDto> eventItems = new ArrayList<>();
        List<AnalyticsEvent> analyticsEvents = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        // 3. Process items
        for (PlaceOrderRequest.ItemRequest itemReq : request.getItems()) {
            Bean bean = beanRepository.findById(itemReq.getBeanId())
                    .orElseThrow(() -> new IllegalArgumentException("Bean not found"));

            inventoryService.reduceStock(bean.getId(), itemReq.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .bean(bean)
                    .quantity(itemReq.getQuantity())
                    .priceAtPurchase(bean.getBasePricePerKg())
                    .build();

            order.addOrderItem(orderItem);

            BigDecimal itemTotal = bean.getBasePricePerKg().multiply(BigDecimal.valueOf(itemReq.getQuantity()));
            total = total.add(itemTotal);

            // Build denormalised analytics record (written to DB for Python batch jobs)
            analyticsEvents.add(AnalyticsEvent.builder()
                    .orderId(order.getId()) // will be set after save below — patched in step 4
                    .beanId(bean.getId())
                    .beanName(bean.getName())
                    .location(location)
                    .quantityKg(itemReq.getQuantity())
                    .unitPrice(bean.getBasePricePerKg())
                    .orderMonth(now.getMonthValue())
                    .orderDayOfWeek(now.getDayOfWeek().getValue())
                    .orderHour(now.getHour())
                    .recordedAt(now)
                    .build());

            // Build event payload (streamed to RabbitMQ → Python real-time consumer)
            eventItems.add(new OrderCreatedEvent.ItemDto(
                    bean.getId(),
                    bean.getName(),
                    itemReq.getQuantity(),
                    bean.getBasePricePerKg()
            ));
        }

        order.setTotalAmount(total);
        Order savedOrder = orderRepository.save(order);

        // 4. Patch orderId now that we have the generated PK, then persist analytics rows
        analyticsEvents.forEach(e -> e.setOrderId(savedOrder.getId()));
        analyticsEventRepository.saveAll(analyticsEvents);

        // 5. Publish event to RabbitMQ
        OrderCreatedEvent event = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCreatedAt(),
                location,
                eventItems
        );
        eventPublisher.publishOrderCreated(event);

        return savedOrder.getId();
    }

    private String normalizeLocation(String location) {
        if (location == null || location.isBlank()) {
            return "UNKNOWN";
        }
        return location.trim().toUpperCase();
    }
}
