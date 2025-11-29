"""Domain models for sport tracking blocks and exercises."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Exercise:
    """Single exercise entry in a workout."""

    name: str
    sets: int
    reps: int
    weight: float

    def total_reps(self) -> int:
        """Return the total number of repetitions performed."""

        return self.sets * self.reps


@dataclass
class MetricsBlock:
    """Generic block with common sport metrics."""

    duration_min: float = 0.0
    distance_km: float = 0.0
    calories: float = 0.0
    pace: Optional[float] = None  # minutes per kilometer

    def speed_kmh(self) -> float:
        """Compute speed in km/h using duration and distance when available."""

        if self.pace and self.pace > 0:
            return 60 / self.pace

        if self.duration_min <= 0 or self.distance_km <= 0:
            return 0.0
        return self.distance_km / (self.duration_min / 60)

    def derive_pace(self) -> Optional[float]:
        """Return pace in minutes per kilometer if it can be derived."""

        if self.pace:
            return self.pace
        if self.distance_km <= 0 or self.duration_min <= 0:
            return None
        return self.duration_min / self.distance_km


@dataclass
class WorkoutBlock(MetricsBlock):
    """Preset block that wraps metrics with exercise details."""

    exercises: List[Exercise] = field(default_factory=list)

    def add_exercise(self, exercise: Exercise) -> None:
        """Add an exercise to the workout."""

        self.exercises.append(exercise)
