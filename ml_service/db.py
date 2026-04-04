"""
db.py — Database access for the ML service.

Responsibilities:
  - Provide a shared SQLAlchemy engine.
  - Load training data from analytics_events.
  - Upsert predictions into stock_predictions.
"""
import logging
from datetime import date, datetime, timedelta
from typing import List, Dict, Any

import pandas as pd
from sqlalchemy import create_engine, text

import config

log = logging.getLogger(__name__)

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(config.DB_URL, pool_pre_ping=True)
    return _engine


def load_training_data(lookback_days: int = 365) -> pd.DataFrame:
    """
    Pull analytics_events rows for the past `lookback_days` days.
    Returns a DataFrame with one row per order-item, including time features.
    """
    cutoff = datetime.now() - timedelta(days=lookback_days)
    sql = text("""
        SELECT
            ae.bean_id,
            ae.bean_name,
            ae.location,
            ae.quantity_kg,
            ae.unit_price,
            ae.order_month,
            ae.order_day_of_week,
            ae.order_hour,
            ae.recorded_at
        FROM analytics_events ae
        WHERE ae.recorded_at >= :cutoff
        ORDER BY ae.recorded_at
    """)
    with get_engine().connect() as conn:
        df = pd.read_sql(sql, conn, params={"cutoff": cutoff})

    log.info("Loaded %d training rows (lookback=%d days)", len(df), lookback_days)
    return df


def load_beans() -> pd.DataFrame:
    """Return all beans (id, name, current_stock_kg, base_price_per_kg)."""
    sql = text("SELECT id, name, current_stock_kg, base_price_per_kg FROM beans WHERE is_available = TRUE")
    with get_engine().connect() as conn:
        return pd.read_sql(sql, conn)


def upsert_predictions(predictions: List[Dict[str, Any]]) -> None:
    """
    Upsert stock_predictions for the current prediction date.

    Schema of each dict:
        bean_id, bean_name, location, predicted_date, recommended_restock_amount, restock_needed
    """
    if not predictions:
        log.warning("upsert_predictions called with empty list — skipping")
        return

    with get_engine().begin() as conn:
        conn.execute(
            text("""
                INSERT INTO stock_predictions
                    (bean_id, bean_name, location, predicted_date, recommended_restock_amount, restock_needed)
                VALUES
                    (:bean_id, :bean_name, :location, :predicted_date, :recommended_restock_amount, :restock_needed)
                ON CONFLICT (bean_id, location, predicted_date)
                DO UPDATE SET
                    bean_name = EXCLUDED.bean_name,
                    recommended_restock_amount = EXCLUDED.recommended_restock_amount,
                    restock_needed = EXCLUDED.restock_needed
            """),
            predictions,
        )
    log.info("Upserted %d predictions into stock_predictions", len(predictions))
