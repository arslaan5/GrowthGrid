"""Structured logging configuration for GrowthGrid."""

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Configure root logger with a structured format."""
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root = logging.getLogger("app")
    root.setLevel(level)
    root.addHandler(handler)
    root.propagate = False


def get_logger(name: str) -> logging.Logger:
    """Return a child logger under the 'app' namespace."""
    return logging.getLogger(f"app.{name}")
