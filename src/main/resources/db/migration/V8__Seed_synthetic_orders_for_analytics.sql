-- Seed recent synthetic order and prediction data so admin analytics
-- surfaces realistic non-zero demand and restock values in development.

INSERT INTO users (first_name, last_name, email, password_hash, role, created_at, update_at)
SELECT
    'Synthetic',
    'Customer',
    'synthetic-orders@example.com',
    '$2a$10$SByQQzoGj0kHyCA80JXoFeP4k.teeLh7hFXCsQje03g1oOXH8zNSO',
    'CUSTOMER',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'synthetic-orders@example.com'
);

INSERT INTO orders (user_id, total_amount, status, location, created_at)
SELECT
    seed.user_id,
    seed.total_amount,
    seed.status,
    seed.location,
    seed.created_at
FROM (
    SELECT
        u.id AS user_id,
        CAST(80.00 AS DECIMAL(10, 2)) AS total_amount,
        'COMPLETED' AS status,
        'NORTH' AS location,
        CURRENT_TIMESTAMP - INTERVAL '28 days' + INTERVAL '09 hours' AS created_at
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(77.50 AS DECIMAL(10, 2)),
        'COMPLETED',
        'SOUTH',
        CURRENT_TIMESTAMP - INTERVAL '24 days' + INTERVAL '11 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(75.00 AS DECIMAL(10, 2)),
        'COMPLETED',
        'ONLINE',
        CURRENT_TIMESTAMP - INTERVAL '21 days' + INTERVAL '14 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(105.00 AS DECIMAL(10, 2)),
        'COMPLETED',
        'EAST',
        CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '10 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(92.50 AS DECIMAL(10, 2)),
        'COMPLETED',
        'WEST',
        CURRENT_TIMESTAMP - INTERVAL '15 days' + INTERVAL '16 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(162.50 AS DECIMAL(10, 2)),
        'COMPLETED',
        'NORTH',
        CURRENT_TIMESTAMP - INTERVAL '11 days' + INTERVAL '08 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(140.50 AS DECIMAL(10, 2)),
        'COMPLETED',
        'ONLINE',
        CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '13 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(137.00 AS DECIMAL(10, 2)),
        'COMPLETED',
        'SOUTH',
        CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '15 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(182.50 AS DECIMAL(10, 2)),
        'COMPLETED',
        'WEST',
        CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '09 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'

    UNION ALL

    SELECT
        u.id,
        CAST(245.00 AS DECIMAL(10, 2)),
        'COMPLETED',
        'NORTH',
        CURRENT_TIMESTAMP - INTERVAL '1 days' + INTERVAL '12 hours'
    FROM users u
    WHERE u.email = 'synthetic-orders@example.com'
) seed
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.user_id = seed.user_id
      AND o.location = seed.location
      AND o.created_at = seed.created_at
);

WITH synthetic_orders AS (
    SELECT o.id, o.location, o.created_at
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE u.email = 'synthetic-orders@example.com'
),
synthetic_items AS (
    SELECT so.id AS order_id, b.id AS bean_id, 4 AS quantity, b.base_price_per_kg AS price_at_purchase
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'NORTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '28 days' + INTERVAL '09 hours'

    UNION ALL

    SELECT so.id, b.id, 5, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Robusta'
    WHERE so.location = 'SOUTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '24 days' + INTERVAL '11 hours'

    UNION ALL

    SELECT so.id, b.id, 3, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Liberica'
    WHERE so.location = 'ONLINE'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '21 days' + INTERVAL '14 hours'

    UNION ALL

    SELECT so.id, b.id, 3, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'EAST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '10 hours'

    UNION ALL

    SELECT so.id, b.id, 3, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Liberica'
    WHERE so.location = 'EAST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '18 days' + INTERVAL '10 hours'

    UNION ALL

    SELECT so.id, b.id, 1, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'WEST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '15 days' + INTERVAL '16 hours'

    UNION ALL

    SELECT so.id, b.id, 3, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Robusta'
    WHERE so.location = 'WEST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '15 days' + INTERVAL '16 hours'

    UNION ALL

    SELECT so.id, b.id, 4, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'NORTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '11 days' + INTERVAL '08 hours'

    UNION ALL

    SELECT so.id, b.id, 2, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Liberica'
    WHERE so.location = 'NORTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '11 days' + INTERVAL '08 hours'

    UNION ALL

    SELECT so.id, b.id, 6, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'ONLINE'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '13 hours'

    UNION ALL

    SELECT so.id, b.id, 1, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Robusta'
    WHERE so.location = 'ONLINE'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '8 days' + INTERVAL '13 hours'

    UNION ALL

    SELECT so.id, b.id, 6, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Robusta'
    WHERE so.location = 'SOUTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '15 hours'

    UNION ALL

    SELECT so.id, b.id, 1, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Liberica'
    WHERE so.location = 'SOUTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '5 days' + INTERVAL '15 hours'

    UNION ALL

    SELECT so.id, b.id, 4, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'WEST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '09 hours'

    UNION ALL

    SELECT so.id, b.id, 5, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Liberica'
    WHERE so.location = 'WEST'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '3 days' + INTERVAL '09 hours'

    UNION ALL

    SELECT so.id, b.id, 8, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Arabica'
    WHERE so.location = 'NORTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '1 days' + INTERVAL '12 hours'

    UNION ALL

    SELECT so.id, b.id, 4, b.base_price_per_kg
    FROM synthetic_orders so
    JOIN beans b ON b.name = 'Robusta'
    WHERE so.location = 'NORTH'
      AND so.created_at = CURRENT_TIMESTAMP - INTERVAL '1 days' + INTERVAL '12 hours'
)
INSERT INTO order_items (order_id, bean_id, quantity, price_at_purchase)
SELECT si.order_id, si.bean_id, si.quantity, si.price_at_purchase
FROM synthetic_items si
WHERE NOT EXISTS (
    SELECT 1
    FROM order_items oi
    WHERE oi.order_id = si.order_id
      AND oi.bean_id = si.bean_id
      AND oi.quantity = si.quantity
);

WITH synthetic_order_rows AS (
    SELECT o.id AS order_id, o.location, o.created_at
    FROM orders o
    JOIN users u ON u.id = o.user_id
    WHERE u.email = 'synthetic-orders@example.com'
)
INSERT INTO analytics_events (
    order_id,
    bean_id,
    bean_name,
    location,
    quantity_kg,
    unit_price,
    order_month,
    order_day_of_week,
    order_hour,
    recorded_at
)
SELECT
    sor.order_id,
    b.id,
    b.name,
    sor.location,
    oi.quantity,
    oi.price_at_purchase,
    EXTRACT(MONTH FROM sor.created_at)::INTEGER,
    EXTRACT(ISODOW FROM sor.created_at)::INTEGER,
    EXTRACT(HOUR FROM sor.created_at)::INTEGER,
    sor.created_at
FROM synthetic_order_rows sor
JOIN order_items oi ON oi.order_id = sor.order_id
JOIN beans b ON b.id = oi.bean_id
WHERE NOT EXISTS (
    SELECT 1
    FROM analytics_events ae
    WHERE ae.order_id = sor.order_id
      AND ae.bean_id = oi.bean_id
);

INSERT INTO stock_predictions (
    bean_id,
    bean_name,
    location,
    predicted_date,
    recommended_restock_amount,
    restock_needed
)
SELECT b.id, b.name, p.location, CURRENT_DATE, p.recommended_restock_amount, p.restock_needed
FROM beans b
JOIN (
    VALUES
        ('Arabica', 'NORTH', 42.50, TRUE),
        ('Arabica', 'ONLINE', 18.00, TRUE),
        ('Arabica', 'WEST', 6.50, TRUE),
        ('Robusta', 'SOUTH', 12.00, TRUE),
        ('Robusta', 'NORTH', 0.00, FALSE),
        ('Liberica', 'ONLINE', 9.50, TRUE),
        ('Liberica', 'WEST', 14.00, TRUE),
        ('Liberica', 'EAST', 0.00, FALSE)
) AS p(bean_name, location, recommended_restock_amount, restock_needed)
    ON b.name = p.bean_name
ON CONFLICT (bean_id, location, predicted_date)
DO UPDATE SET
    bean_name = EXCLUDED.bean_name,
    recommended_restock_amount = EXCLUDED.recommended_restock_amount,
    restock_needed = EXCLUDED.restock_needed;
