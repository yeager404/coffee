"""
model.py — Demand forecasting model.

Pipeline:
  1. Feature engineering (bean_id, location, month, day_of_week, hour, price)
  2. XGBoost regressor — predicts quantity_kg for a future (bean, location, date) triple
  3. Serialize / deserialize with pickle

The model is trained on `analytics_events` rows and predicts per-bean,
per-location demand for the next N days so the inventory team knows
how much to restock and where.
"""
import logging
import os
import pickle
from datetime import date, timedelta
from typing import List, Dict, Any

import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor

import config

log = logging.getLogger(__name__)


# ── Feature helpers ──────────────────────────────────────────────────────────

FEATURE_COLS = [
    "bean_id",
    "location_enc",
    "order_month",
    "order_day_of_week",
    "order_hour",
    "unit_price",
]


def _build_label_encoder(df: pd.DataFrame) -> LabelEncoder:
    le = LabelEncoder()
    le.fit(df["location"].str.upper().fillna("UNKNOWN"))
    return le


def _encode_features(df: pd.DataFrame, le: LabelEncoder) -> pd.DataFrame:
    df = df.copy()
    df["location"] = df["location"].str.upper().fillna("UNKNOWN")

    # Safe transform — unknown locations map to -1 (treated as a new category)
    known = set(le.classes_)
    df["location_enc"] = df["location"].apply(
        lambda v: le.transform([v])[0] if v in known else -1
    )
    return df


# ── Training ─────────────────────────────────────────────────────────────────

class DemandModel:
    """Wraps an XGBRegressor with encoding state."""

    def __init__(self):
        self.model: XGBRegressor | None = None
        self.label_encoder: LabelEncoder | None = None
        self.is_trained: bool = False

    def train(self, df: pd.DataFrame) -> Dict[str, float]:
        """
        Train on analytics_events data.
        Returns evaluation metrics.
        """
        if len(df) < config.MIN_TRAIN_ROWS:
            log.warning(
                "Only %d rows — need at least %d to train. Skipping.",
                len(df), config.MIN_TRAIN_ROWS,
            )
            return {"skipped": True, "rows": len(df)}

        self.label_encoder = _build_label_encoder(df)
        df = _encode_features(df, self.label_encoder)

        # Target: quantity sold in each order-item
        X = df[FEATURE_COLS]
        y = df["quantity_kg"]

        X_train, X_val, y_train, y_val = train_test_split(
            X, y, test_size=0.15, random_state=42
        )

        self.model = XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
        )
        self.model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            verbose=False,
        )

        val_preds = self.model.predict(X_val)
        mae = mean_absolute_error(y_val, val_preds)
        self.is_trained = True

        log.info("Model trained — MAE=%.3f kg | train_rows=%d", mae, len(X_train))
        return {"mae": mae, "train_rows": len(X_train), "val_rows": len(X_val)}

    def predict_demand(
        self,
        bean_id: int,
        bean_name: str,
        location: str,
        unit_price: float,
        forecast_days: int = config.FORECAST_DAYS,
    ) -> List[Dict[str, Any]]:
        """
        Forecast daily demand for a (bean, location) pair for the next `forecast_days`.
        Returns a list of {date, predicted_qty} dicts.
        """
        if not self.is_trained:
            raise RuntimeError("Model has not been trained yet.")

        today = date.today()
        rows = []
        for offset in range(1, forecast_days + 1):
            target_date = today + timedelta(days=offset)
            rows.append({
                "bean_id":         bean_id,
                "location":        location,
                "order_month":     target_date.month,
                "order_day_of_week": target_date.weekday() + 1,  # 1=Mon..7=Sun
                "order_hour":      12,   # forecast mid-day demand
                "unit_price":      unit_price,
            })

        future_df = pd.DataFrame(rows)
        future_df = _encode_features(future_df, self.label_encoder)
        preds = self.model.predict(future_df[FEATURE_COLS])
        preds = np.clip(preds, 0, None)  # demand can't be negative

        return [
            {"date": (today + timedelta(days=i + 1)), "qty": float(q)}
            for i, q in enumerate(preds)
        ]

    # ── Serialization ──────────────────────────────────────────────────────

    def save(self, path: str = config.MODEL_PATH) -> None:
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "le": self.label_encoder}, f)
        log.info("Model saved to %s", path)

    @classmethod
    def load(cls, path: str = config.MODEL_PATH) -> "DemandModel":
        with open(path, "rb") as f:
            data = pickle.load(f)
        instance = cls()
        instance.model         = data["model"]
        instance.label_encoder = data["le"]
        instance.is_trained    = True
        log.info("Model loaded from %s", path)
        return instance
