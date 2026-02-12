package com.yeager.coffee.controller;

import com.yeager.coffee.model.StockPrediction;
import com.yeager.coffee.repository.StockPredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')") // Secures the whole class
public class AdminDashboardController {

    private final StockPredictionRepository predictionRepository;

    @GetMapping("/predictions")
    public ResponseEntity<List<StockPrediction>> getLatestPredictions() {
        // Fetch predictions where 'restockNeeded' is TRUE
        return ResponseEntity.ok(predictionRepository.findByRestockNeededTrue());
    }
}