from datetime import datetime
from pydantic import BaseModel

class StringFilter(BaseModel):
    eq: str | None = None
    contains: str | None = None

    def matches(self, value: str) -> bool:
        if self.eq is not None and value != self.eq:
            return False
        if self.contains is not None and self.contains.lower() not in value.lower():
            return False
        return True

class NumberFilter(BaseModel):
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
    eq: datetime | None = None
    lt: datetime | None = None
    gt: datetime | None = None

    def matches(self, value: datetime) -> bool:
        if self.eq is not None and value != self.eq:
            return False
        if self.lt is not None and not value < self.lt:
            return False
        if self.gt is not None and not value > self.gt:
            return False
        return True

Filter = StringFilter | NumberFilter | DatetimeFilter

def filter_models[ModelType: BaseModel](
    models: list[ModelType],
    filters: dict[str, Filter]
) -> list[ModelType]:
    return [
        model for model in models
        if all(flt.matches(getattr(model, field_name)) for field_name, flt in filters.items())
    ]
