"""
main.py — Entry point for the Coffee Shop ML Analytics Service.

Startup sequence:
  1. Load (or skip) an existing saved model.
  2. Run an initial training cycle from the DB.
  3. Start two RabbitMQ consumer threads.
  4. Run the scheduler loop in the main thread.

Scheduler jobs:
  - Every RETRAIN_INTERVAL_H hours  → retrain model + regenerate predictions.
  - Every 30 minutes                → prediction refresh (no retrain).
"""
import logging
import os
import signal
import sys
import time
from threading import Event

import schedule

import config
import db
from consumer import OrderEventConsumer, parse_event
from model import DemandModel
from predictor import run_prediction_cycle

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger("main")

# ── Shared state ─────────────────────────────────────────────────────────────
_shutdown = Event()
_model    = DemandModel()


# ── Training ─────────────────────────────────────────────────────────────────

def retrain_and_predict():
    """Full cycle: reload data from DB → retrain → write predictions."""
    log.info("=== Starting retrain cycle ===")
    try:
        df = db.load_training_data(lookback_days=365)
        metrics = _model.train(df)
        if metrics.get("skipped"):
            log.warning("Retrain skipped — insufficient data (%d rows)", metrics.get("rows", 0))
            return
        _model.save()
        run_prediction_cycle(_model)
        log.info("=== Retrain cycle complete: %s ===", metrics)
    except Exception:
        log.exception("Retrain cycle failed")


def prediction_refresh():
    """Lightweight refresh — reuse existing model, regenerate predictions only."""
    log.info("Running prediction refresh (no retrain) …")
    try:
        run_prediction_cycle(_model)
    except Exception:
        log.exception("Prediction refresh failed")


# ── RabbitMQ message handlers ─────────────────────────────────────────────

def on_ingestion_message(payload: dict):
    """
    ml.ingestion.queue handler.
    Just log receipt — the scheduler handles batch retraining.
    In a production setup you could buffer these to a local queue
    and trigger a retrain when the buffer hits a threshold.
    """
    event = parse_event(payload)
    log.debug(
        "Ingestion event received — order=%s location=%s items=%d",
        event["order_id"], event["location"], len(event["items"]),
    )


def on_analytics_message(payload: dict):
    """
    ml.analytics.queue handler.
    Triggered on every new order — run a prediction refresh so the
    admin dashboard always shows up-to-date restock recommendations.
    """
    event = parse_event(payload)
    log.info(
        "Analytics event — order=%s location=%s → triggering prediction refresh",
        event["order_id"], event["location"],
    )
    prediction_refresh()


# ── Graceful shutdown ─────────────────────────────────────────────────────

def _handle_signal(sig, _frame):
    log.info("Received signal %s — shutting down …", sig)
    _shutdown.set()


signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ── Main ──────────────────────────────────────────────────────────────────

def main():
    log.info("Coffee ML Service starting …")
    log.info("Config: DB=%s RABBIT=%s:%d", config.DB_URL.split("@")[-1],
             config.RABBIT_HOST, config.RABBIT_PORT)

    # 1. Try to load a pre-existing model
    if os.path.exists(config.MODEL_PATH):
        try:
            global _model
            _model = DemandModel.load(config.MODEL_PATH)
            log.info("Loaded existing model from %s", config.MODEL_PATH)
        except Exception as e:
            log.warning("Could not load saved model (%s) — will train from scratch", e)

    # 2. Initial training cycle (blocks until done)
    retrain_and_predict()

    # 3. Start RabbitMQ consumer threads
    ingestion_consumer = OrderEventConsumer(
        queue=config.ML_INGESTION_QUEUE,
        on_message=on_ingestion_message,
    )
    analytics_consumer = OrderEventConsumer(
        queue=config.ML_ANALYTICS_QUEUE,
        on_message=on_analytics_message,
    )
    ingestion_consumer.start()
    analytics_consumer.start()
    log.info("Consumer threads started.")

    # 4. Schedule periodic jobs
    schedule.every(config.RETRAIN_INTERVAL_H).hours.do(retrain_and_predict)
    schedule.every(30).minutes.do(prediction_refresh)
    log.info(
        "Scheduler: retrain every %dh, refresh every 30min",
        config.RETRAIN_INTERVAL_H,
    )

    # 5. Scheduler loop
    log.info("ML Service is running. Press Ctrl+C to stop.")
    while not _shutdown.is_set():
        schedule.run_pending()
        time.sleep(10)

    log.info("ML Service stopped.")


if __name__ == "__main__":
    main()
