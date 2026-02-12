package com.yeager.coffee.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "stock_predictions")
public class StockPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long beanId; // Keeping it simple (ID only) to avoid eager loading issues

    @Column(nullable = false)
    private String beanName;

    @Column(nullable = false)
    private LocalDate predictedDate; // The day the prediction was made

    private Double recommendedRestockAmount;

    private Boolean restockNeeded;
}