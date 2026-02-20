-- 1. Create Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- 2. Create Beans (Inventory) Table
CREATE TABLE beans (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    base_price_per_kg DECIMAL(10, 2) NOT NULL,
    current_stock_kg DOUBLE PRECISION NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    version BIGINT DEFAULT 0 -- ⚠️ Required for Optimistic Locking
);

-- 3. Create Orders Table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create Order Items Table
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id),
    bean_id BIGINT NOT NULL REFERENCES beans(id),
    quantity INTEGER NOT NULL,
    price_at_purchase DECIMAL(10, 2) NOT NULL
);

-- 5. Create Stock Predictions Table (For Python ML Service)
CREATE TABLE stock_predictions (
    id BIGSERIAL PRIMARY KEY,
    bean_id BIGINT NOT NULL,
    bean_name VARCHAR(255) NOT NULL,
    predicted_date DATE NOT NULL,
    recommended_restock_amount DOUBLE PRECISION,
    restock_needed BOOLEAN
);

-- 6. Seed Initial Data (So the menu isn't empty)
INSERT INTO beans (name, base_price_per_kg, current_stock_kg, is_available, version) VALUES
('Arabica', 20.00, 100.0, true, 0),
('Robusta', 15.50, 200.0, true, 0),
('Liberica', 25.00, 50.0, true, 0);