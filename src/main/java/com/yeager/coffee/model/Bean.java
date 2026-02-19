package com.yeager.coffee.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity // This class is now managed by JPA
@Table(name = "beans")
public class Bean {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double currentStockKg;

    @Column(nullable = false)
    private BigDecimal basePricePerKg;

    @Column(nullable = false)
    private Boolean isAvailable;

    /**
     * Optimistic Locking
     * Prevents race condition. If two threads try to update
     * simultaneously, the one with the old version number fails
     */

    @Version
    private Long version;
}