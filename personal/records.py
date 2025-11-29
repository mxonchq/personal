"""Helpers for computing personal sport records."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import Iterable, Optional

from .models import Exercise, WorkoutBlock


SPORT_CHANNEL = "Спорт"


@dataclass(frozen=True)
class WorkoutEntry:
    """Concrete workout instance bound to a channel and date."""

    channel: str
    day: date
    workout: WorkoutBlock


@dataclass
class PersonalRecords:
    """Container for peak sport achievements."""

    best_weight: Optional[Exercise] = None
    best_reps: Optional[Exercise] = None
    best_distance_km: float = 0.0
    best_speed_kmh: float = 0.0

    def as_dict(self) -> dict:
        """Return serializable representation for widgets."""

        def exercise_snapshot(exercise: Optional[Exercise]) -> Optional[dict]:
            if not exercise:
                return None
            return {
                "name": exercise.name,
                "sets": exercise.sets,
                "reps": exercise.reps,
                "weight": exercise.weight,
                "total_reps": exercise.total_reps(),
            }

        return {
            "best_weight": exercise_snapshot(self.best_weight),
            "best_reps": exercise_snapshot(self.best_reps),
            "best_distance_km": self.best_distance_km,
            "best_speed_kmh": self.best_speed_kmh,
        }


def compute_sport_records(entries: Iterable[WorkoutEntry]) -> PersonalRecords:
    """Aggregate personal bests for the sport channel."""

    records = PersonalRecords()

    for entry in entries:
        if entry.channel != SPORT_CHANNEL:
            continue

        block = entry.workout
        if block.distance_km > records.best_distance_km:
            records.best_distance_km = block.distance_km

        speed = block.speed_kmh()
        if speed > records.best_speed_kmh:
            records.best_speed_kmh = speed

        for exercise in block.exercises:
            if not records.best_weight or exercise.weight > records.best_weight.weight:
                records.best_weight = exercise

            total_reps = exercise.total_reps()
            if not records.best_reps or total_reps > records.best_reps.total_reps():
                records.best_reps = exercise

    return records
