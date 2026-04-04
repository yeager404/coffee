# Coffee Platform API Documentation

## Purpose
This document is the implementation reference for a frontend team or coding agent building the UI for the coffee platform.

It covers:
- Authentication flows
- Inventory and ordering flows
- Analytics and forecasting flows
- Real request and response shapes
- Role-based access rules
- Frontend UX guidance
- A dedicated agent instruction section for building the frontend from this API alone

## Runtime Defaults
- Base API URL: `http://localhost:8080/api`
- Content type: `application/json`
- Auth mechanism: JWT bearer token
- Default local verification setup:
  - Spring Boot on `localhost:8080`
  - PostgreSQL exposed on a high local port chosen by the verification script, typically `55432`
  - RabbitMQ exposed on high local ports chosen by the verification script, typically `55672` and `55675`

## Roles
- `CUSTOMER`
  - Can register
  - Can log in
  - Can browse beans
  - Can place orders
  - Can view own orders
  - Cannot access analytics endpoints
- `ADMIN`
  - Can do everything a customer can
  - Can create beans
  - Can add stock
  - Can access analytics and admin prediction endpoints

## Authentication
Send the JWT in the `Authorization` header:

```http
Authorization: Bearer <token>
```

The token is returned by both register and login endpoints.

## Common Frontend Rules
- Treat `401` and `403` as authentication or authorization failures.
- Persist the JWT client-side in the app auth store.
- Decode role from app state only if you explicitly choose to do so. The backend remains the source of truth.
- For protected pages, redirect unauthenticated users to login.
- For admin-only pages, show an access denied state if the current user is not an admin.
- Dates are returned as ISO strings.
- `GET /analytics/predictions` can validly return an empty array before the ML service has written predictions.

## Error Handling
There is no custom global error envelope in the current backend. Frontends should be prepared for standard Spring error responses.

Typical failure cases:
- Validation failure: `400`
- Invalid credentials: `403` from login
- Unauthorized or missing token: `401` or `403`
- Forbidden by role: `403`
- Business errors such as insufficient stock: typically `500` or propagated exception unless handled upstream

Frontend recommendation:
- Show a generic API error fallback if the response shape is not standardized.
- For order failures, show the raw backend message when available.

---

## 1. Auth API

### Register
- Method: `POST`
- Path: `/auth/register`
- Auth required: No

Request:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

Validation:
- `firstName`: required
- `lastName`: required
- `email`: required, must be valid email
- `password`: required, minimum 6 characters

Response `200`:

```json
{
  "token": "jwt_token_string",
  "firstName": "John"
}
```

Frontend use:
- Registration should immediately authenticate the user.
- After success, store the token and route to the customer area.

### Login
- Method: `POST`
- Path: `/auth/login`
- Auth required: No

Request:

```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

Response `200`:

```json
{
  "token": "jwt_token_string",
  "firstName": "John"
}
```

Frontend use:
- On success, store token and fetch protected data.
- For admin login, the same endpoint is used.

---

## 2. Inventory API

### Get Available Beans
- Method: `GET`
- Path: `/beans`
- Auth required: No

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Arabica",
    "description": "Floral and citrus notes",
    "currentStockKg": 100.0,
    "basePricePerKg": 20.00,
    "isAvailable": true,
    "version": 0
  }
]
```

Notes:
- This is the product catalog endpoint.
- `currentStockKg` is useful for admin inventory pages and optionally for low-stock hints.
- `version` exists because the entity uses optimistic locking, but the frontend does not need it for current flows.

Frontend use:
- Public landing page product listing
- Customer order form product picker
- Admin inventory table

### Create Bean
- Method: `POST`
- Path: `/beans`
- Auth required: Yes
- Role: `ADMIN`

Request:

```json
{
  "name": "Colombian Supremo",
  "description": "Balanced and nutty",
  "currentStockKg": 100.0,
  "basePricePerKg": 20.00,
  "isAvailable": true
}
```

Response `200`:

```json
{
  "id": 4,
  "name": "Colombian Supremo",
  "description": "Balanced and nutty",
  "currentStockKg": 100.0,
  "basePricePerKg": 20.00,
  "isAvailable": true,
  "version": 0
}
```

Frontend use:
- Admin inventory management page
- Form should allow description to be optional

### Add Stock
- Method: `PATCH`
- Path: `/beans/{id}/stock`
- Auth required: Yes
- Role: `ADMIN`

Query parameters:
- `amountKg`: required positive number

Example:

```http
PATCH /api/beans/1/stock?amountKg=25
Authorization: Bearer <admin-token>
```

Response `200`:

```json
{
  "id": 1,
  "name": "Arabica",
  "description": "Floral and citrus notes",
  "currentStockKg": 125.0,
  "basePricePerKg": 20.00,
  "isAvailable": true,
  "version": 1
}
```

Frontend use:
- Admin quick restock action
- Prefer a numeric input and submit button per row or within a drawer/modal

---

## 3. Orders API

### Place Order
- Method: `POST`
- Path: `/orders`
- Auth required: Yes
- Roles: `CUSTOMER`, `ADMIN`

Request:

```json
{
  "location": "NORTH",
  "items": [
    {
      "beanId": 1,
      "quantity": 2
    }
  ]
}
```

Validation:
- `items`: required, must contain at least one item
- `items[].beanId`: required
- `items[].quantity`: required, minimum `1`
- `location`: optional, max length `100`

Behavior:
- If `location` is missing or blank, backend normalizes it to `UNKNOWN`
- Backend uppercases and trims the location
- Backend reduces stock immediately
- Backend stores analytics events for each order item
- Backend publishes an order-created event to RabbitMQ

Response `201`:

```json
123
```

Meaning:
- The response body is just the numeric order ID, not an object

Recommended frontend locations:
- `NORTH`
- `SOUTH`
- `EAST`
- `WEST`
- `ONLINE`
- `UNKNOWN`

Frontend use:
- Customer checkout flow
- Admin test ordering flow if needed

Important UX note:
- Because analytics depends on location, do not hide the location field in checkout.
- Use a controlled select instead of a free-text field unless your business wants arbitrary regions.

### Get My Orders
- Method: `GET`
- Path: `/orders`
- Auth required: Yes
- Roles: `CUSTOMER`, `ADMIN`

Query parameters:
- `page`: zero-based page index
- `size`: page size
- `sort`: Spring pageable sort format

Example:

```http
GET /api/orders?page=0&size=10&sort=createdAt,desc
Authorization: Bearer <token>
```

Response `200`:

```json
{
  "content": [
    {
      "orderId": 123,
      "placedAt": "2026-04-04T17:18:00",
      "status": "PENDING",
      "totalAmount": 40.00,
      "items": null
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10
  },
  "totalPages": 1,
  "totalElements": 1,
  "last": true,
  "first": true,
  "number": 0,
  "size": 10,
  "numberOfElements": 1,
  "empty": false
}
```

Notes:
- Current list mapping does not populate `items`; treat this endpoint as an order summary endpoint.
- If you need order item detail in the frontend, you would need a new dedicated order-detail endpoint.

Frontend use:
- Customer order history page
- Order list table

---

## 4. Analytics API

These endpoints are for admins only.

### Get Demand Summary
- Method: `GET`
- Path: `/analytics/demand`
- Auth required: Yes
- Role: `ADMIN`

Query parameters:
- `from`: optional ISO datetime
- `to`: optional ISO datetime

Defaults:
- `from = now - 30 days`
- `to = now`

Example:

```http
GET /api/analytics/demand?from=2026-03-01T00:00:00&to=2026-04-01T00:00:00
Authorization: Bearer <admin-token>
```

Response `200`:

```json
[
  {
    "beanId": 1,
    "beanName": "Arabica",
    "location": "NORTH",
    "totalQuantityKg": 12.0
  },
  {
    "beanId": 2,
    "beanName": "Robusta",
    "location": "ONLINE",
    "totalQuantityKg": 8.0
  }
]
```

Meaning:
- Each row is aggregated demand for one `(bean, location)` pair in the selected time range.

Frontend use:
- Analytics dashboard cards
- Demand table
- Bar chart by bean and location
- Filterable reporting view

### Get Demand Summary for One Location
- Method: `GET`
- Path: `/analytics/demand/{location}`
- Auth required: Yes
- Role: `ADMIN`

Query parameters:
- `from`: optional ISO datetime
- `to`: optional ISO datetime

Example:

```http
GET /api/analytics/demand/NORTH?from=2026-03-01T00:00:00&to=2026-04-01T00:00:00
Authorization: Bearer <admin-token>
```

Response `200`:

```json
[
  {
    "beanId": 1,
    "beanName": "Arabica",
    "location": "NORTH",
    "totalQuantityKg": 12.0
  }
]
```

Frontend use:
- Location drill-down page
- Region tabs
- Filter panel driven charts

### Get Latest Predictions
- Method: `GET`
- Path: `/analytics/predictions`
- Auth required: Yes
- Role: `ADMIN`

Response `200`:

```json
[
  {
    "id": 1,
    "beanId": 1,
    "beanName": "Arabica",
    "location": "NORTH",
    "predictedDate": "2026-04-04",
    "recommendedRestockAmount": 5.75,
    "restockNeeded": true
  }
]
```

Notes:
- This endpoint returns predictions from the latest prediction date in the database.
- It can return `[]` if the ML service has not yet written predictions.
- Prediction rows are generated per `(bean, location)`.

Frontend use:
- Main analytics forecast table
- Restock recommendation panel
- Region-aware forecasting page

Recommended UI columns:
- Bean
- Location
- Prediction date
- Recommended restock amount
- Restock needed

### Get Prediction History for a Bean
- Method: `GET`
- Path: `/analytics/predictions/{beanId}`
- Auth required: Yes
- Role: `ADMIN`

Query parameters:
- `location`: optional

Examples:

```http
GET /api/analytics/predictions/1
Authorization: Bearer <admin-token>
```

```http
GET /api/analytics/predictions/1?location=NORTH
Authorization: Bearer <admin-token>
```

Response `200`:

```json
[
  {
    "id": 14,
    "beanId": 1,
    "beanName": "Arabica",
    "location": "NORTH",
    "predictedDate": "2026-04-04",
    "recommendedRestockAmount": 5.75,
    "restockNeeded": true
  }
]
```

Frontend use:
- History drawer for a bean
- Forecast trend detail view
- Compare one bean across regions or drill into one region

---

## 5. Admin Predictions API

### Get Latest Restock Alerts
- Method: `GET`
- Path: `/admin/predictions`
- Auth required: Yes
- Role: `ADMIN`

Response `200`:

```json
[
  {
    "id": 22,
    "beanId": 1,
    "beanName": "Arabica",
    "location": "NORTH",
    "predictedDate": "2026-04-04",
    "recommendedRestockAmount": 5.75,
    "restockNeeded": true
  }
]
```

Meaning:
- This endpoint returns only the latest predictions where `restockNeeded = true`.
- Use this when you want a compact admin alert surface instead of the full analytics prediction list.

Frontend use:
- Admin alert badge
- Urgent restock list
- Sidebar notifications

---

## 6. Analytics Domain Model for Frontend

### What the analytics system actually does
The backend analytics pipeline uses these demand signals:
- `location`
- `beanId`
- `beanName`
- `unitPrice`
- `orderMonth`
- `orderDayOfWeek`
- `orderHour`
- `quantityKg`

Operational flow:
1. A user places an order with a location.
2. The Spring app writes one analytics event row per order item.
3. The Spring app publishes an order-created event to RabbitMQ.
4. The Python ML service consumes or reacts to those events.
5. The ML service retrains periodically and refreshes predictions.
6. Predictions are written into `stock_predictions`.
7. Admin analytics endpoints expose those results.

### What the frontend should assume
- Predictions are not generated synchronously as part of order placement.
- There can be a short lag between new orders and prediction availability.
- An empty predictions screen is a valid state.
- Location is a first-class analytics dimension and should always be visible in analytics UI.

---

## 7. Frontend UX Guidance

### Recommended route structure
- `/login`
- `/register`
- `/beans`
- `/orders`
- `/admin/inventory`
- `/admin/analytics`
- `/admin/analytics/demand`
- `/admin/analytics/predictions`

### Minimum frontend state model
- Auth state
  - token
  - firstName
  - role if you choose to infer/store it
- Catalog state
  - beans list
- Order state
  - cart items
  - selected location
  - order history
- Analytics state
  - demand summary
  - selected date range
  - selected location
  - latest predictions
  - bean prediction history

### Recommended analytics page structure
- Top summary strip
  - selected date range
  - total demand records
  - count of locations in view
  - count of active restock alerts
- Demand section
  - date filters
  - optional location filter
  - demand table or chart
- Prediction section
  - latest prediction table
  - filter by bean
  - filter by location
  - highlight `restockNeeded`
- History section
  - click bean row to open prediction history

### Empty states to design
- No predictions yet
  - Message: “Predictions are not available yet. The analytics service may still be training on recent order data.”
- No demand in selected date range
  - Message: “No demand records found for this period.”
- Non-admin user on analytics route
  - Message: “You do not have access to analytics.”

---

## 8. Copy for an Analytics Help Page

This section is intended for frontend implementation as a user guidance page or inline help panel.

### Suggested page title
`How Analytics Works`

### Suggested copy
Use the analytics area to understand coffee demand and stock recommendations across locations.

The demand section shows how much of each bean was sold in a selected time window. You can use it to compare locations such as `NORTH`, `SOUTH`, `EAST`, `WEST`, and `ONLINE`.

The predictions section shows model-generated stock guidance. Each prediction is tied to a specific bean and location. If `restockNeeded` is true, the platform believes current stock may not cover expected demand.

To use analytics effectively:
- Start with the demand view to identify high-volume beans and regions.
- Narrow the date range to inspect recent shifts.
- Switch to predictions to see recommended restock amounts.
- Review prediction history for a bean to understand how recommendations are changing over time.
- Pay attention to location because demand can vary significantly by region.

Important:
- Predictions may be empty if the analytics service has not processed enough recent data yet.
- Predictions are advisory, not guaranteed outcomes.
- Orders must include a location for region-level forecasting to be useful.

### Suggested quick tips block
- Use recent date ranges for operational decisions.
- Compare the same bean across multiple locations.
- Treat `recommendedRestockAmount` as a planning input for procurement.
- Use `/admin/predictions` data for urgent alert views.

---

## 9. Agent Instructions for Building the Frontend

This section is intended for an engineering agent or frontend developer.

### Goal
Build a frontend for the coffee platform using this API document as the source of truth for backend integration.

### Required product areas
- Public catalog page
- Auth pages
- Customer order placement
- Customer order history
- Admin inventory management
- Admin analytics dashboard
- Analytics help/instructions page based on the copy above

### Non-negotiable implementation requirements
- Use the exact endpoint paths documented here.
- Use JWT bearer auth.
- Do not assume custom error envelopes.
- Treat analytics predictions as eventually consistent.
- Keep `location` visible in order and analytics flows.
- Design admin routes separately from customer routes.
- Use an empty state for predictions rather than treating empty arrays as errors.

### Recommended build order
1. Implement auth store and login/register pages.
2. Implement public beans listing.
3. Implement order placement with a required location selector in the UI.
4. Implement customer order history.
5. Implement admin inventory management.
6. Implement admin analytics demand views.
7. Implement admin prediction and history views.
8. Add analytics help page using the copy in this document.

### Recommended API client surface
- `register(payload)`
- `login(payload)`
- `getBeans()`
- `createBean(payload)`
- `addStock(beanId, amountKg)`
- `placeOrder(payload)`
- `getOrders(params)`
- `getDemandSummary(params)`
- `getDemandByLocation(location, params)`
- `getLatestPredictions()`
- `getPredictionHistory(beanId, location?)`
- `getAdminPredictionAlerts()`

### Routing and guards
- Public routes:
  - `/login`
  - `/register`
  - `/beans`
- Authenticated customer routes:
  - `/orders`
  - `/checkout`
- Admin-only routes:
  - `/admin/inventory`
  - `/admin/analytics`
  - `/admin/analytics/help`

### UI behavior requirements
- After register or login, store token and route based on role if available.
- If role is not explicitly available client-side, route to a safe default page and rely on backend-protected fetches.
- Show loading states for every network call.
- Keep filters reflected in URL query params on analytics pages if possible.
- Provide CSV export later only if explicitly requested; it is not part of the current API.

### Data caveats
- `GET /orders` currently returns summary rows and does not populate item detail.
- `GET /analytics/predictions` can return `[]` before ML output exists.
- `GET /admin/predictions` returns only urgent restock alerts.

### Suggested frontend stack behavior
- Use a typed API layer
- Centralize auth header injection
- Normalize date formatting in the presentation layer
- Separate customer and admin layouts
- Cache beans and analytics queries thoughtfully, but allow manual refresh on analytics pages

---

## 10. Verified End-to-End Notes

The backend has been verified end to end with the project verification script.

Confirmed working flow:
1. Register customer
2. Login admin
3. Fetch beans
4. Place orders with location
5. Persist analytics events
6. Publish order events to RabbitMQ
7. Build and start ML service
8. Generate stock predictions by bean and location
9. Read analytics demand endpoints
10. Read analytics prediction endpoints

### Verification command
Run from project root:

```bash
bash test_coffee_analytics.sh
```

This script:
- Chooses free local ports for PostgreSQL and RabbitMQ
- Starts Docker services
- Starts Spring Boot with matching env vars
- Seeds and verifies auth
- Places sample orders across multiple locations
- Verifies analytics tables
- Starts ML service if needed
- Verifies prediction generation

---

## 11. Summary for Frontend Teams

If you only read one section, this is the minimum you need:
- Use `/auth/register` and `/auth/login` for JWT auth
- Use `/beans` for the catalog
- Use `/orders` to place and list orders
- Always collect a `location` when placing an order
- Build admin analytics around:
  - `/analytics/demand`
  - `/analytics/demand/{location}`
  - `/analytics/predictions`
  - `/analytics/predictions/{beanId}?location=...`
  - `/admin/predictions`
- Expect predictions to lag behind order placement
- Build good empty states for analytics
- Use the “How Analytics Works” copy in this document as the frontend instruction/help page
