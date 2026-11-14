"""The one function every count of a source passes before the pipeline uses it."""


class SourceError(Exception):
    """A source the pipeline cannot use as it is. The message names the place."""


def count(value: object, figure: str, where: str) -> int:
    """Return `value` if it is a whole number from zero; otherwise stop and name the place.

    A missing value, a fraction, a number given as text and a truth value are all refused:
    nothing is replaced by zero, rounded or converted.
    """
    if type(value) is int and value >= 0:
        return value
    raise SourceError(f"{where}: {figure} is {value!r}, not a whole number from zero")
