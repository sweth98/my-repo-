import pytest

from numstats.stats import maximum, mean, median, minimum, summarize


def test_mean():
    assert mean([1, 2, 3, 4]) == 2.5
    assert mean([5]) == 5


def test_median_odd_count():
    assert median([3, 1, 2]) == 2


def test_median_even_count():
    assert median([1, 2, 3, 4]) == 2.5


def test_minimum():
    assert minimum([4, 1, 7, -2]) == -2


def test_maximum():
    assert maximum([4, 1, 7, -2]) == 7


def test_summarize():
    assert summarize([1, 2, 3, 4, 5]) == {
        "mean": 3,
        "median": 3,
        "min": 1,
        "max": 5,
    }


@pytest.mark.parametrize("func", [mean, median, minimum, maximum])
def test_empty_list_raises(func):
    with pytest.raises(ValueError):
        func([])
