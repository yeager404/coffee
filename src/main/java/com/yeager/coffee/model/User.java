package com.yeager.coffee.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data       // Generates Setter Getters from lombok to reduce boilerplate code
@Builder    // To use User.build() later in creating of entries in the DB table
@NoArgsConstructor  // Required by JPA
@AllArgsConstructor // Required for testing
@Entity             // JPA now manages the object of this class and inserts them as rows in the DB table
@Table(name = "users", indexes = {
        @Index(name="idx_user_email", columnList = "email") // Create B tree base on email
})
@EntityListeners(AuditingEntityListener.class)  // Auto manages the createdAt, updatedAt
// Registers this class as a subscriber to lifecycle events of this entity
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private Role role;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updateAt;

    public enum Role{
        CUSTOMER,
        ADMIN
    }
}
