package com.yeager.coffee.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DemandSummaryDto {
    private Long beanId;
    private String beanName;
    private String location;
    private Double totalQuantityKg;
}
