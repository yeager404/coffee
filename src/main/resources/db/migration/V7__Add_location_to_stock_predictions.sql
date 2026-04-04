ALTER TABLE stock_predictions
ADD COLUMN location VARCHAR(100) DEFAULT 'UNKNOWN' NOT NULL;

UPDATE stock_predictions
SET location = 'UNKNOWN'
WHERE location IS NULL;

ALTER TABLE stock_predictions
ADD CONSTRAINT uk_stock_predictions_bean_location_date
UNIQUE (bean_id, location, predicted_date);

CREATE INDEX idx_stock_predictions_predicted_date ON stock_predictions(predicted_date);
CREATE INDEX idx_stock_predictions_location ON stock_predictions(location);
