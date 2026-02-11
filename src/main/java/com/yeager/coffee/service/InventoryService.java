package com.yeager.coffee.service;

import com.yeager.coffee.model.Bean;
import com.yeager.coffee.repository.BeanRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InventoryService {
    private final BeanRepository beanRepository;

    @Transactional
    public void reduceStock(Long beanId, Integer quantityKg){
        Bean bean = beanRepository.findById(beanId)
                .orElseThrow(()-> new IllegalArgumentException("Bean not found"));
        if(bean.getCurrentStockKg() < quantityKg){
            throw new IllegalStateException("Insufficient stock for " + bean.getName());
        }

        bean.setCurrentStockKg(bean.getCurrentStockKg() - quantityKg);
        beanRepository.save(bean);
    }

    public boolean checkAvailability(Long beanId, Double quantityKg){
        return beanRepository.findById(beanId)
                .map(bean->bean.getCurrentStockKg() >= quantityKg)
                .orElse(false);
    }
}