package com.yeager.coffee.repository;

import com.yeager.coffee.model.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {

    List<AnalyticsEvent> findByBeanIdAndRecordedAtBetween(
            Long beanId, LocalDateTime from, LocalDateTime to);

    List<AnalyticsEvent> findByLocationAndRecordedAtBetween(
            String location, LocalDateTime from, LocalDateTime to);

    /**
     * Aggregate total quantity sold per bean per location within a time window.
     * Used by the analytics dashboard to show demand trends.
     */
    @Query("""
           SELECT ae.beanId, ae.beanName, ae.location,
                  SUM(ae.quantityKg) AS totalQty
           FROM AnalyticsEvent ae
           WHERE ae.recordedAt BETWEEN :from AND :to
           GROUP BY ae.beanId, ae.beanName, ae.location
           ORDER BY totalQty DESC
           """)
    List<Object[]> aggregateDemandByBeanAndLocation(
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);
}
