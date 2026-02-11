package com.yeager.coffee.event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent implements Serializable {
    private Long orderId;
    private String createdAt; // Sent as String for python compatibility
    private List<ItemDto> items;

    // Helper Constructor
    public OrderCreatedEvent(Long orderId, LocalDateTime createdAt, List<ItemDto> items){
        this.orderId = orderId;
        this.createdAt = createdAt.toString();
        this.items = items;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemDto implements Serializable{
        private Long beanId;
        private Integer quantityKg;
    }
}