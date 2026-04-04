ALTER TABLE orders
ADD COLUMN location VARCHAR(100) DEFAULT 'UNKNOWN' NOT NULL;

CREATE INDEX idx_orders_location ON orders(location);
CREATE INDEX idx_orders_created_at ON orders(created_at);
