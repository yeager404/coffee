"""
config.py — Centralised config loaded from .env or environment variables.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# ── PostgreSQL ──────────────────────────────────────────────────────────────
DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = int(os.getenv("DB_PORT", "5432"))
DB_NAME     = os.getenv("DB_NAME",     "coffee_db")
DB_USER     = os.getenv("DB_USER",     "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")

DB_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ── RabbitMQ ────────────────────────────────────────────────────────────────
RABBIT_HOST     = os.getenv("RABBIT_HOST",     "localhost")
RABBIT_PORT     = int(os.getenv("RABBIT_PORT", "5672"))
RABBIT_USER     = os.getenv("RABBIT_USER",     "guest")
RABBIT_PASSWORD = os.getenv("RABBIT_PASSWORD", "guest")
RABBIT_VHOST    = os.getenv("RABBIT_VHOST",    "/")

ML_INGESTION_QUEUE  = "ml.ingestion.queue"
ML_ANALYTICS_QUEUE  = "ml.analytics.queue"

# ── Model ───────────────────────────────────────────────────────────────────
MODEL_PATH          = os.getenv("MODEL_PATH", "models/demand_model.pkl")
RETRAIN_INTERVAL_H  = int(os.getenv("RETRAIN_INTERVAL_H", "6"))   # hours between retrains
MIN_TRAIN_ROWS      = int(os.getenv("MIN_TRAIN_ROWS",      "50"))  # skip retrain if fewer rows

# Forecasting horizon
FORECAST_DAYS = int(os.getenv("FORECAST_DAYS", "14"))
