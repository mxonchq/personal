from datetime import date

from personal.models import Exercise, WorkoutBlock
from personal.records import SPORT_CHANNEL, WorkoutEntry, compute_sport_records
from personal.widgets import build_sport_stats


def sample_entries():
    workout1 = WorkoutBlock(duration_min=30, distance_km=5, calories=350)
    workout1.add_exercise(Exercise(name="Bench Press", sets=3, reps=10, weight=60))

    workout2 = WorkoutBlock(duration_min=45, distance_km=8, calories=550)
    workout2.add_exercise(Exercise(name="Squat", sets=5, reps=5, weight=100))
    workout2.add_exercise(Exercise(name="Pull-up", sets=4, reps=8, weight=0))

    return [
        WorkoutEntry(channel=SPORT_CHANNEL, day=date(2024, 1, 10), workout=workout1),
        WorkoutEntry(channel=SPORT_CHANNEL, day=date(2024, 1, 20), workout=workout2),
        WorkoutEntry(channel="Музыка", day=date(2024, 1, 25), workout=workout1),
    ]


def test_compute_sport_records():
    records = compute_sport_records(sample_entries())

    assert records.best_distance_km == 8
    assert round(records.best_speed_kmh, 2) == 10.67
    assert records.best_weight.name == "Squat"
    assert records.best_weight.weight == 100
    assert records.best_reps.name == "Bench Press"
    assert records.best_reps.total_reps() == 30


def test_build_sport_stats_filters_period():
    entries = sample_entries()
    stats = build_sport_stats(entries, start=date(2024, 1, 15), end=date(2024, 1, 31))

    assert stats.total_distance_km == 8
    assert stats.total_calories == 550
    assert stats.records.best_distance_km == 8
    assert stats.records.best_speed_kmh > 0
    assert stats.from_date == date(2024, 1, 15)
    assert stats.to_date == date(2024, 1, 31)


def test_widget_as_dict_structure():
    stats = build_sport_stats(sample_entries())
    payload = stats.as_dict()

    assert set(payload.keys()) == {"from", "to", "total_calories", "total_distance_km", "records"}
    assert payload["records"]["best_distance_km"] == 8
    assert payload["records"]["best_weight"]["name"] == "Squat"
