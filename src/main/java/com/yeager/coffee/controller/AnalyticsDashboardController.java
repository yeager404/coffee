package com.yeager.coffee.controller;

import com.yeager.coffee.dto.response.DemandSummaryDto;
import com.yeager.coffee.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * REST endpoints for the analytics / demand-forecasting subsystem.
 *
 * All routes are ADMIN-only.
 *
 * Predictions are written by the Python ML service into the stock_predictions
 * table; this controller just reads them and exposes demand summaries.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AnalyticsDashboardController {

    private final AnalyticsService analyticsService;

    /**
     * GET /api/analytics/demand
     *
     * Returns aggregated demand (total kg sold) per bean per location.
     *
     * Query params:
     *   from  – ISO datetime (default: 30 days ago)
     *   to    – ISO datetime (default: now)
     *
     * Example:
     *   GET /api/analytics/demand?from=2024-01-01T00:00:00&to=2024-02-01T00:00:00
     */
    @GetMapping("/demand")
    public ResponseEntity<List<DemandSummaryDto>> getDemandSummary(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        LocalDateTime effectiveFrom = (from != null) ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo   = (to   != null) ? to   : LocalDateTime.now();

        return ResponseEntity.ok(analyticsService.getDemandSummary(effectiveFrom, effectiveTo));
    }

    /**
     * GET /api/analytics/demand/{location}
     *
     * Demand summary filtered to a single location (case-insensitive).
     */
    @GetMapping("/demand/{location}")
    public ResponseEntity<List<DemandSummaryDto>> getDemandByLocation(
            @PathVariable String location,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {

        LocalDateTime effectiveFrom = (from != null) ? from : LocalDateTime.now().minusDays(30);
        LocalDateTime effectiveTo   = (to   != null) ? to   : LocalDateTime.now();

        return ResponseEntity.ok(analyticsService.getDemandByLocation(
                location.toUpperCase(), effectiveFrom, effectiveTo));
    }

    /**
     * GET /api/analytics/predictions
     *
     * Returns the latest ML predictions (written by the Python service).
     * Alias for /api/admin/predictions with richer response.
     */
    @GetMapping("/predictions")
    public ResponseEntity<List<com.yeager.coffee.model.StockPrediction>> getLatestPredictions() {
        return ResponseEntity.ok(analyticsService.getLatestPredictions());
    }

    /**
     * GET /api/analytics/predictions/{beanId}
     *
     * Prediction history for a specific bean.
     */
    @GetMapping("/predictions/{beanId}")
    public ResponseEntity<List<com.yeager.coffee.model.StockPrediction>> getPredictionHistory(
            @PathVariable Long beanId,
            @RequestParam(required = false) String location) {
        if (location == null || location.isBlank()) {
            return ResponseEntity.ok(analyticsService.getPredictionHistory(beanId));
        }
        return ResponseEntity.ok(analyticsService.getPredictionHistory(beanId, location.trim().toUpperCase()));
    }
}
