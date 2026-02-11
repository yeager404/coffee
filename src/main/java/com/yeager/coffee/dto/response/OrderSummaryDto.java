package com.yeager.coffee.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderSummaryDto {
    private Long orderId;
    private LocalDateTime placedAt;
    private String status;
    private BigDecimal totalAmount;
    private List<OrderItemDto> items;

    @Data
    @Builder
    public static class OrderItemDto{
        private String beanName;
        private Integer quantity;
        private BigDecimal price;
    }
}
