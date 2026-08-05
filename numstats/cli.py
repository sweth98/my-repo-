"""Command-line entry point for numstats."""

from __future__ import annotations

import argparse
import sys

from numstats.stats import summarize


def parse_numbers(raw_values: list[str]) -> list[float]:
    numbers = []
    for raw in raw_values:
        try:
            numbers.append(float(raw))
        except ValueError:
            raise ValueError(f"'{raw}' is not a valid number")
    return numbers


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="numstats",
        description="Print basic statistics (mean, median, min, max) for a list of numbers.",
    )
    parser.add_argument(
        "numbers", nargs="+", help="A list of numbers, e.g. 1 2 3 4.5 10"
    )
    args = parser.parse_args(argv)

    try:
        numbers = parse_numbers(args.numbers)
        results = summarize(numbers)
    except ValueError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(f"count:  {len(numbers)}")
    print(f"mean:   {results['mean']}")
    print(f"median: {results['median']}")
    print(f"min:    {results['min']}")
    print(f"max:    {results['max']}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
