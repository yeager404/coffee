package com.yeager.coffee.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Denormalised record written when an order is processed.
 * The Python ML service consumes rows from this table periodically
 * (or via RabbitMQ) to retrain the demand forecasting model.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "analytics_events")
public class AnalyticsEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Long beanId;

    @Column
    private String beanName;

    /** Geographic region — matches Order.location */
    @Column(nullable = false, length = 100)
    private String location;

    @Column(nullable = false)
    private Integer quantityKg;

    @Column(precision = 10, scale = 2)
    private BigDecimal unitPrice;

    /** Derived from order timestamp for easy feature access */
    @Column(nullable = false)
    private Integer orderMonth;

    @Column(nullable = false)
    private Integer orderDayOfWeek;

    @Column(nullable = false)
    private Integer orderHour;

    @Column
    private LocalDateTime recordedAt;
}
