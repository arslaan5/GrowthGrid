"""Lightweight in-memory TTL cache for async functions.

Designed for caching analytics results that don't change every second.
Each entry is keyed by an arbitrary hashable key and expires after *ttl* seconds.
"""

from __future__ import annotations

import time
from typing import Any


class TTLCache:
    """Simple dict-backed cache with per-entry expiration.

    Usage::

        _cache = TTLCache(ttl=60)

        async def get_data(user_id, db):
            key = ("heatmap", user_id, start, end)
            cached = _cache.get(key)
            if cached is not None:
                return cached
            result = await _expensive_query(...)
            _cache.set(key, result)
            return result

        # After a mutation (create/update/delete entry):
        _cache.invalidate_prefix(("heatmap", user_id))
    """

    def __init__(self, ttl: int = 60) -> None:
        self._ttl = ttl
        self._store: dict[tuple, tuple[float, Any]] = {}

    # ---------------------------------------------------------------- read

    def get(self, key: tuple) -> Any | None:
        """Return cached value or *None* if missing / expired."""
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    # ---------------------------------------------------------------- write

    def set(self, key: tuple, value: Any) -> None:
        """Store *value* under *key* with the configured TTL."""
        self._store[key] = (time.monotonic() + self._ttl, value)

    # ---------------------------------------------------------------- invalidate

    def invalidate(self, key: tuple) -> None:
        """Remove a single key."""
        self._store.pop(key, None)

    def invalidate_prefix(self, prefix: tuple) -> None:
        """Remove every key that starts with *prefix*.

        Useful to bust all cache entries for a given user, e.g.::

            cache.invalidate_prefix(("heatmap", user_id))
            cache.invalidate_prefix(("summary", user_id))
        """
        to_delete = [k for k in self._store if k[: len(prefix)] == prefix]
        for k in to_delete:
            del self._store[k]

    def invalidate_for_user(self, user_id: Any) -> None:
        """Remove *all* cached entries where the second key element is *user_id*."""
        to_delete = [k for k in self._store if len(k) >= 2 and k[1] == user_id]
        for k in to_delete:
            del self._store[k]

    def clear(self) -> None:
        """Drop everything."""
        self._store.clear()


# Shared instance — 60-second TTL is a good default for analytics.
analytics_cache = TTLCache(ttl=60)
