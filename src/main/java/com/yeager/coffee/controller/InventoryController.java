package com.yeager.coffee.controller;


import com.yeager.coffee.model.Bean;
import com.yeager.coffee.repository.BeanRepository;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.actuate.web.exchanges.HttpExchange;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beans")
@RequiredArgsConstructor
public class InventoryController {

    private final BeanRepository beanRepository;
    @GetMapping
    public ResponseEntity<List<Bean>> getAvailableBeans(){
        return ResponseEntity.ok(beanRepository.findByIsAvailableTrue());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Bean> createBean(@RequestBody Bean bean){
        return ResponseEntity.ok(beanRepository.save(bean));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Bean> addStock(@PathVariable Long id, @RequestParam @Positive Double amountKg){
        Bean bean = beanRepository.findById(id)
                .orElseThrow(()-> new IllegalArgumentException("Bean not found"));
        bean.setCurrentStockKg(bean.getCurrentStockKg() + amountKg);
        return ResponseEntity.ok(beanRepository.save(bean));
    }
}
