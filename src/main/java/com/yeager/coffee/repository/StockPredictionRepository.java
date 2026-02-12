package com.yeager.coffee.repository;

import com.yeager.coffee.model.StockPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StockPredictionRepository extends JpaRepository<StockPrediction, Long> {

    // Find alerts
    List<StockPrediction> findByRestockNeededTrue();

    // Find history for specific bean
    List<StockPrediction> findByBeanIdOrderByPredictedDateDesc(Long beanId);
}