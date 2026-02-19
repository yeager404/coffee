# Coffee Shop API Documentation

## Overview
Base URL: `http://localhost:8080/api`

## Authentication

### Register
**Endpoint:** `POST /auth/register`
**Public Access:** Yes

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response Body:**
```json
{
  "token": "jwt_token_string",
  "firstName": "John"
}
```

### Login
**Endpoint:** `POST /auth/login`
**Public Access:** Yes

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response Body:**
```json
{
  "token": "jwt_token_string",
  "firstName": "John"
}
```

---

## Inventory (Beans)

### Get Available Beans
**Endpoint:** `GET /beans`
**Public Access:** Yes

**Response Body:**
```json
[
  {
    "id": 1,
    "name": "Ethiopian Yirgacheffe",
    "description": "Floral and citrus notes...",
    "currentStockKg": 50.0,
    "basePricePerKg": 25.00,
    "isAvailable": true,
    "version": 1
  }
]
```

### Create Bean
**Endpoint:** `POST /beans`
**Permissions:** `ADMIN`

**Request Body:**
```json
{
  "name": "Colombian Supremo",
  "description": "Balanced and nutty...",
  "currentStockKg": 100.0,
  "basePricePerKg": 20.00,
  "isAvailable": true
}
```

**Response Body:** Returns the created [Bean](file:///home/yeager404/Workspace/SpringBoot/coffee/src/main/java/com/yeager/coffee/model/Bean.java#11-46) object (same structure as above).

### Add Stock
**Endpoint:** `PATCH /beans/{id}/stock`
**Permissions:** `ADMIN`

**Parameters:**
- [id](file:///home/yeager404/Workspace/SpringBoot/coffee/src/main/java/com/yeager/coffee/config/SecurityConfig.java#46-53) (Path Variable): ID of the bean to update
- `amountKg` (Query Param): Amount of stock to add (must be positive)

**Response Body:** Returns the updated [Bean](file:///home/yeager404/Workspace/SpringBoot/coffee/src/main/java/com/yeager/coffee/model/Bean.java#11-46) object.

---

## Orders

### Place Order
**Endpoint:** `POST /orders`
**Permissions:** `CUSTOMER`, `ADMIN`

**Request Body:**
```json
{
  "items": [
    {
      "beanId": 1,
      "quantity": 2
    }
  ]
}
```

**Response Body:**
`123` (The ID of the created order)

### Get My Orders
**Endpoint:** `GET /orders`
**Permissions:** `CUSTOMER`, `ADMIN`

**Parameters:**
- `page` (Query Param): Page number (0-indexed)
- `size` (Query Param): Page size
- `sort` (Query Param): Sorting criteria

**Response Body:**
```json
{
  "content": [
    {
      "orderId": 123,
      "placedAt": "2023-10-27T10:00:00",
      "status": "PENDING",
      "totalAmount": 50.00,
      "items": [
        {
          "beanName": "Ethiopian Yirgacheffe",
          "quantity": 2,
          "price": 25.00
        }
      ]
    }
  ],
  "pageable": { ... },
  "totalPages": 1,
  "totalElements": 1
}
```

---

## Admin Dashboard

### Get Stock Predictions
**Endpoint:** `GET /admin/predictions`
**Permissions:** `ADMIN`

**Response Body:**
```json
[
  {
    "id": 1,
    "beanId": 1,
    "beanName": "Ethiopian Yirgacheffe",
    "predictedDate": "2023-11-01",
    "recommendedRestockAmount": 10.0,
    "restockNeeded": true
  }
]
```
