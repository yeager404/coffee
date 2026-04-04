package com.yeager.coffee.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Event published to RabbitMQ when an order is placed.
 * The Python ML service consumes this to build the training dataset.
 *
 * Fields are deliberately flat / primitive so the JSON schema
 * stays stable and the Python consumer needs no complex deserialization.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent implements Serializable {

    private Long orderId;

    /** ISO-8601 string for Python compatibility (LocalDateTime → String). */
    private String createdAt;

    /** Geographic region where the order was placed. */
    private String location;

    private List<ItemDto> items;

    public OrderCreatedEvent(Long orderId, LocalDateTime createdAt, String location, List<ItemDto> items) {
        this.orderId   = orderId;
        this.createdAt = createdAt.toString();
        this.location  = location;
        this.items     = items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto implements Serializable {
        private Long beanId;
        private String beanName;
        private Integer quantityKg;
        /** Price snapshotted at purchase time — important feature for the model. */
        private BigDecimal unitPrice;
    }
}
