"""Basic descriptive statistics functions."""

from __future__ import annotations


def mean(numbers: list[float]) -> float:
    if not numbers:
        raise ValueError("mean() requires at least one number")
    return sum(numbers) / len(numbers)


def median(numbers: list[float]) -> float:
    if not numbers:
        raise ValueError("median() requires at least one number")
    ordered = sorted(numbers)
    n = len(ordered)
    mid = n // 2
    if n % 2 == 1:
        return ordered[mid]
    return (ordered[mid - 1] + ordered[mid]) / 2


def minimum(numbers: list[float]) -> float:
    if not numbers:
        raise ValueError("minimum() requires at least one number")
    return min(numbers)


def maximum(numbers: list[float]) -> float:
    if not numbers:
        raise ValueError("maximum() requires at least one number")
    return max(numbers)


def summarize(numbers: list[float]) -> dict[str, float]:
    """Return mean, median, min, and max for a list of numbers."""
    return {
        "mean": mean(numbers),
        "median": median(numbers),
        "min": minimum(numbers),
        "max": maximum(numbers),
    }
