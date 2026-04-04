"""
predictor.py — Turns model forecasts into stock_predictions DB rows.

Logic:
  For each (bean, location) pair:
    1. Forecast daily demand for the next FORECAST_DAYS days.
    2. Sum to get total expected demand.
    3. Compare against current stock.
    4. If stock < expected demand → restock_needed=True,
       recommended_restock_amount = expected_demand - current_stock.
"""
import logging
from datetime import date
from typing import List, Dict, Any

import pandas as pd

import config
import db
from model import DemandModel

log = logging.getLogger(__name__)


def build_predictions(demand_model: DemandModel) -> List[Dict[str, Any]]:
    """
    Generate one prediction row per (bean, location) combination.
    """
    beans_df = db.load_beans()
    if beans_df.empty:
        log.warning("No beans found — skipping prediction generation.")
        return []

    # Derive all (bean, location) combos seen in recent analytics events
    training_df = db.load_training_data(lookback_days=90)
    if training_df.empty:
        log.warning("No analytics events found — predictions will use UNKNOWN location only.")
        locations = ["UNKNOWN"]
    else:
        locations = training_df["location"].str.upper().unique().tolist()

    predictions: List[Dict[str, Any]] = []

    for _, bean in beans_df.iterrows():
        for location in locations:
            try:
                daily_forecasts = demand_model.predict_demand(
                    bean_id=int(bean["id"]),
                    bean_name=bean["name"],
                    location=location,
                    unit_price=float(bean["base_price_per_kg"]),
                    forecast_days=config.FORECAST_DAYS,
                )
            except Exception as exc:
                log.error(
                    "Prediction failed for bean=%s location=%s: %s",
                    bean["name"], location, exc,
                )
                continue

            total_expected = sum(f["qty"] for f in daily_forecasts)
            current_stock  = float(bean["current_stock_kg"])
            shortage       = total_expected - current_stock
            restock_needed = shortage > 0
            restock_amount = round(shortage, 2) if restock_needed else 0.0

            predictions.append({
                "bean_id":                    int(bean["id"]),
                "bean_name":                  bean["name"],
                "location":                   location,
                "predicted_date":             date.today(),
                "recommended_restock_amount": restock_amount,
                "restock_needed":             restock_needed,
            })

            log.debug(
                "Bean=%-15s location=%-10s stock=%.1f expected=%.1f restock=%s amount=%.1f",
                bean["name"], location, current_stock, total_expected,
                restock_needed, restock_amount,
            )

    log.info("Generated %d prediction rows for %d beans × %d locations",
             len(predictions), len(beans_df), len(locations))
    return predictions


def run_prediction_cycle(demand_model: DemandModel) -> None:
    """End-to-end: generate predictions and write to DB."""
    if not demand_model.is_trained:
        log.warning("Model not trained — skipping prediction cycle.")
        return

    predictions = build_predictions(demand_model)
    if predictions:
        db.upsert_predictions(predictions)
