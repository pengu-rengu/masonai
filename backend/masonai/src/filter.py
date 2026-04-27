import re

from pydantic import BaseModel, ConfigDict

TIME_PATTERN = re.compile(r"^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$")


def validate_time_value(value: str) -> str:
    if not TIME_PATTERN.fullmatch(value):
        raise ValueError('time must be in "HH:MM AM/PM" format')
    return value


def time_sort_value(value: str) -> int:
    validated_value = validate_time_value(value)
    time_part, period = validated_value.split(" ")
    hour_part, minute_part = time_part.split(":")

    hour = int(hour_part) % 12
    if period == "PM":
        hour += 12

    minute = int(minute_part)
    return hour * 60 + minute

class StringFilter(BaseModel):
    model_config = ConfigDict(extra = "forbid")

    eq: str | None = None
    contains: str | None = None

    def matches(self, value: str) -> bool:
        if self.eq is not None and value != self.eq:
            return False
        if self.contains is not None and self.contains.lower() not in value.lower():
            return False
        return True

class NumberFilter(BaseModel):
    model_config = ConfigDict(extra = "forbid")

    eq: float | None = None
    lt: float | None = None
    gt: float | None = None

    def matches(self, value: float) -> bool:
        if self.eq is not None and value != self.eq:
            return False
        if self.lt is not None and not value < self.lt:
            return False
        if self.gt is not None and not value > self.gt:
            return False
        return True

class DatetimeFilter(BaseModel):
    model_config = ConfigDict(extra = "forbid")

    eq: str | None = None
    before: str | None = None
    after: str | None = None

    def __init__(self, **data):
        super().__init__(**data)
        if self.eq is not None:
            validate_time_value(self.eq)
        if self.before is not None:
            validate_time_value(self.before)
        if self.after is not None:
            validate_time_value(self.after)

    def matches(self, value: str) -> bool:
        value_sort = time_sort_value(value)

        if self.eq is not None and value != self.eq:
            return False
        if self.before is not None and not value_sort < time_sort_value(self.before):
            return False
        if self.after is not None and not value_sort > time_sort_value(self.after):
            return False
        return True

Filter = StringFilter | NumberFilter | DatetimeFilter

def filter_models[ModelType: BaseModel](
    models: list[ModelType],
    filters: dict[str, Filter]
) -> list[ModelType]:
    results = []
    for model in models:
        keep = True
        for field_name, flt in filters.items():
            if not flt.matches(getattr(model, field_name)):
                keep = False
                break
        if keep:
            results.append(model)
    return results
