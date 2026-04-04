package com.yeager.coffee.repository;

import com.yeager.coffee.model.StockPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StockPredictionRepository extends JpaRepository<StockPrediction, Long> {

    List<StockPrediction> findByBeanIdOrderByPredictedDateDesc(Long beanId);

    List<StockPrediction> findByBeanIdAndLocationOrderByPredictedDateDesc(Long beanId, String location);

    @Query("""
           SELECT sp
           FROM StockPrediction sp
           WHERE sp.predictedDate = (
               SELECT MAX(innerSp.predictedDate)
               FROM StockPrediction innerSp
           )
           AND sp.restockNeeded = true
           ORDER BY sp.recommendedRestockAmount DESC, sp.beanName ASC, sp.location ASC
           """)
    List<StockPrediction> findLatestRestockAlerts();

    @Query("""
           SELECT sp
           FROM StockPrediction sp
           WHERE sp.predictedDate = (
               SELECT MAX(innerSp.predictedDate)
               FROM StockPrediction innerSp
           )
           ORDER BY sp.recommendedRestockAmount DESC, sp.beanName ASC, sp.location ASC
           """)
    List<StockPrediction> findLatestPredictions();

    @Query("SELECT MAX(sp.predictedDate) FROM StockPrediction sp")
    LocalDate findLatestPredictionDate();
}
