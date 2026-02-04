package com.yeager.coffee.repository;

import com.yeager.coffee.model.Bean;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BeanRepository extends JpaRepository<Bean, Long> {
    Optional <Bean> findByName(String name);
    List<Bean> findByIsAvailableTrue();
}