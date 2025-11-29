"""Widgets that summarize sport activity."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, Optional

from .records import SPORT_CHANNEL, PersonalRecords, WorkoutEntry, compute_sport_records


@dataclass
class SportStats:
    """Aggregated sport statistics for a period."""

    from_date: date
    to_date: date
    total_calories: float
    total_distance_km: float
    records: PersonalRecords

    def as_dict(self) -> dict:
        return {
            "from": self.from_date.isoformat(),
            "to": self.to_date.isoformat(),
            "total_calories": self.total_calories,
            "total_distance_km": self.total_distance_km,
            "records": self.records.as_dict(),
        }


def build_sport_stats(entries: Iterable[WorkoutEntry], *, start: Optional[date] = None, end: Optional[date] = None) -> SportStats:
    """Build a statistics widget for the sport page."""

    filtered_entries = []
    total_calories = 0.0
    total_distance_km = 0.0

    for entry in entries:
        if entry.channel != SPORT_CHANNEL:
            continue

        if start and entry.day < start:
            continue
        if end and entry.day > end:
            continue

        filtered_entries.append(entry)
        total_calories += entry.workout.calories
        total_distance_km += entry.workout.distance_km

    records = compute_sport_records(filtered_entries)
    period_start = start or min((entry.day for entry in filtered_entries), default=date.today())
    period_end = end or max((entry.day for entry in filtered_entries), default=period_start)

    return SportStats(
        from_date=period_start,
        to_date=period_end,
        total_calories=total_calories,
        total_distance_km=total_distance_km,
        records=records,
    )
