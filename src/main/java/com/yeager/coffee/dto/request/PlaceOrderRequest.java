package com.yeager.coffee.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PlaceOrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    private List<ItemRequest> items;

    /**
     * Geographic region of the order (e.g. "NORTH", "SOUTH", "EAST", "WEST", "ONLINE").
     * Defaults to "UNKNOWN" if omitted. Used for regional demand forecasting.
     */
    @Size(max = 100, message = "Location must be 100 characters or fewer")
    private String location = "UNKNOWN";

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotNull(message = "Bean Id is required")
        private Long beanId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;
    }
}
