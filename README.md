# numstats

A small command-line tool that takes a list of numbers and prints basic
descriptive statistics: mean, median, min, and max.

This project exists as a sandbox for practicing the Claude Code workflow —
it's intentionally small and simple.

## Installation

Requires Python 3.9+. From the repository root, create a virtual environment
and install the package in editable mode along with its test dependency:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e . pytest
```

The `numstats` package itself has no runtime dependencies — only the
standard library. `pytest` is only needed to run the test suite (see
`requirements.txt`).

## Running Locally

Once installed, use the `numstats` console script:

```bash
numstats 4 8 15 16 23 42
```

```
count:  6
mean:   18.0
median: 15.5
min:    4.0
max:    42.0
```

You can also run it without installing, as a module:

```bash
python -m numstats.cli 4 8 15 16 23 42
```

## Running Tests

```bash
pytest
```

## Project Structure

```
numstats/
    __init__.py     # package marker
    stats.py         # mean / median / min / max functions
    cli.py           # argument parsing and CLI entry point (numstats.cli:main)
tests/
    test_stats.py    # unit tests for numstats/stats.py
pyproject.toml       # package metadata and the `numstats` console script
requirements.txt     # test dependency (pytest); package itself is stdlib-only
```
