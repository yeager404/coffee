package com.yeager.coffee.service;

import com.yeager.coffee.dto.response.DemandSummaryDto;
import com.yeager.coffee.model.StockPrediction;
import com.yeager.coffee.repository.AnalyticsEventRepository;
import com.yeager.coffee.repository.StockPredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final AnalyticsEventRepository analyticsEventRepository;
    private final StockPredictionRepository stockPredictionRepository;

    public List<DemandSummaryDto> getDemandSummary(LocalDateTime from, LocalDateTime to) {
        return analyticsEventRepository
                .aggregateDemandByBeanAndLocation(from, to)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<DemandSummaryDto> getDemandByLocation(String location, LocalDateTime from, LocalDateTime to) {
        return analyticsEventRepository
                .findByLocationAndRecordedAtBetween(location, from, to)
                .stream()
                .collect(Collectors.groupingBy(
                        e -> e.getBeanId() + "|" + e.getBeanName() + "|" + e.getLocation(),
                        Collectors.summingInt(e -> e.getQuantityKg())
                ))
                .entrySet().stream()
                .map(entry -> {
                    String[] parts = entry.getKey().split("\\|");
                    return DemandSummaryDto.builder()
                            .beanId(Long.parseLong(parts[0]))
                            .beanName(parts[1])
                            .location(parts[2])
                            .totalQuantityKg(entry.getValue().doubleValue())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<StockPrediction> getLatestPredictions() {
        return stockPredictionRepository.findLatestPredictions();
    }

    public List<StockPrediction> getPredictionHistory(Long beanId) {
        return stockPredictionRepository.findByBeanIdOrderByPredictedDateDesc(beanId);
    }

    public List<StockPrediction> getPredictionHistory(Long beanId, String location) {
        return stockPredictionRepository.findByBeanIdAndLocationOrderByPredictedDateDesc(beanId, location);
    }

    // Maps raw JPQL projection (Object[]) → DTO
    private DemandSummaryDto mapToDto(Object[] row) {
        return DemandSummaryDto.builder()
                .beanId(((Number) row[0]).longValue())
                .beanName((String) row[1])
                .location((String) row[2])
                .totalQuantityKg(((Number) row[3]).doubleValue())
                .build();
    }
}
