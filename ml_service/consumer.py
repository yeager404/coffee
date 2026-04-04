"""
consumer.py — RabbitMQ consumer for the ML service.

Two consumption modes:

  ml.ingestion.queue  → Accumulates messages; the scheduler triggers a retrain
                        every RETRAIN_INTERVAL_H hours.
  ml.analytics.queue  → On every message, run a lightweight prediction refresh
                        using the already-trained model (no retrain).

The consumer runs in a background thread; the main thread runs the scheduler.
"""
import json
import logging
import threading
import time
from typing import Callable

import pika
import pika.exceptions

import config

log = logging.getLogger(__name__)


def _connect() -> pika.BlockingConnection:
    """Create a RabbitMQ connection with retry logic."""
    credentials = pika.PlainCredentials(config.RABBIT_USER, config.RABBIT_PASSWORD)
    params = pika.ConnectionParameters(
        host=config.RABBIT_HOST,
        port=config.RABBIT_PORT,
        virtual_host=config.RABBIT_VHOST,
        credentials=credentials,
        heartbeat=600,
        blocked_connection_timeout=300,
    )
    retries = 0
    while True:
        try:
            conn = pika.BlockingConnection(params)
            log.info("Connected to RabbitMQ at %s:%d", config.RABBIT_HOST, config.RABBIT_PORT)
            return conn
        except pika.exceptions.AMQPConnectionError as e:
            retries += 1
            wait = min(30, 2 ** retries)
            log.warning("RabbitMQ not ready (%s) — retry in %ds", e, wait)
            time.sleep(wait)


class OrderEventConsumer(threading.Thread):
    """
    Background thread that consumes from ONE queue and calls `on_message`
    for each delivery.
    """

    def __init__(self, queue: str, on_message: Callable[[dict], None]):
        super().__init__(daemon=True, name=f"consumer-{queue}")
        self.queue      = queue
        self.on_message = on_message
        self._stop_event = threading.Event()

    def run(self):
        while not self._stop_event.is_set():
            try:
                conn    = _connect()
                channel = conn.channel()
                channel.basic_qos(prefetch_count=10)
                channel.basic_consume(
                    queue=self.queue,
                    on_message_callback=self._handle,
                    auto_ack=False,
                )
                log.info("Consuming from %s …", self.queue)
                channel.start_consuming()
            except pika.exceptions.AMQPConnectionError as e:
                log.error("Consumer connection lost (%s) — reconnecting …", e)
                time.sleep(5)
            except Exception as e:
                log.exception("Unexpected consumer error: %s", e)
                time.sleep(5)

    def _handle(self, channel, method, _properties, body):
        try:
            payload = json.loads(body.decode())
            self.on_message(payload)
            channel.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            log.error("Failed to process message: %s — nacking", e)
            channel.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    def stop(self):
        self._stop_event.set()


def parse_event(payload: dict) -> dict:
    """
    Normalise the OrderCreatedEvent JSON produced by Spring Boot.
    Returns a flat dict ready for logging / feature extraction.
    """
    return {
        "order_id":   payload.get("orderId"),
        "created_at": payload.get("createdAt"),
        "location":   (payload.get("location") or "UNKNOWN").upper(),
        "items":      payload.get("items", []),
    }
