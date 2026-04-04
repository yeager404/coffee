CREATE TABLE analytics_events (
    id            BIGSERIAL PRIMARY KEY,
    order_id      BIGINT NOT NULL,
    bean_id       BIGINT NOT NULL,
    bean_name     VARCHAR(255),
    location      VARCHAR(100) NOT NULL,
    quantity_kg   INTEGER NOT NULL,
    unit_price    DECIMAL(10, 2),
    order_month   INTEGER NOT NULL,
    order_day_of_week INTEGER NOT NULL,
    order_hour    INTEGER NOT NULL,
    recorded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_bean_id   ON analytics_events(bean_id);
CREATE INDEX idx_analytics_location  ON analytics_events(location);
CREATE INDEX idx_analytics_recorded  ON analytics_events(recorded_at);
