from __future__ import annotations

from typing import List, Optional
from datetime import date, datetime, timedelta

from pydantic import (
    BaseModel,
    Field,
    ConfigDict,
    field_validator,
    model_validator,
    AliasChoices,
    field_serializer,
)

DATE_FMT = "%d.%m.%Y"

def _to_date(v) -> date:
    if v is None:
        return None
    if isinstance(v, date):
        return v
    if isinstance(v, str):
        return datetime.strptime(v, DATE_FMT).date()
    raise TypeError("Expected date or 'dd.mm.yyyy' string")


class DateRange(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)

    start_date: date = Field(
        default_factory=date.today,
        description="Start date (dd.mm.yyyy). Defaults to today.",
    )
    end_date: Optional[date] = Field(
        default=None,
        description="End date (dd.mm.yyyy). Defaults to start_date + number_of_days.",
    )
    number_of_days: int = Field(
        default=3,
        ge=1,
        description="Trip length in days (≥1). Used to compute end_date if omitted.",
    )

    @field_validator("start_date", mode="before")
    @classmethod
    def _parse_start(cls, v):
        return _to_date(v)

    @field_validator("end_date", mode="before")
    @classmethod
    def _parse_end(cls, v):
        return _to_date(v)

    @model_validator(mode="after")
    def _set_or_check_end(self):
        if self.end_date is None:
            self.end_date = self.start_date + timedelta(days=self.number_of_days)
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self

    @field_serializer("start_date", "end_date")
    def _ser_dates(self, v: Optional[date], _info):
        return None if v is None else v.strftime(DATE_FMT)


class People(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)

    number_of_people: int = Field(
        default=1, ge=1, description="Total travelers (≥1)."
    )
    people_details: Optional[str] = Field(
        default=None, description="Notes about travelers (ages, mobility, etc.)."
    )


class Preferences(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)

    events: Optional[List[str]] = Field(
        default=None, description="Preferred event types."
    )

    cuisines: Optional[List[str]] = Field(
        default=None,
        validation_alias=AliasChoices("cousines", "cuisines"),
        serialization_alias="cousines",
        description="Preferred cuisines. Serialized as 'cousines' for compatibility.",
    )

    places: Optional[List[str]] = Field(
        default=None, description="Preferred places/POIs."
    )
    budget_amount: Optional[float] = Field(
        default=None,
        description='Budget; numeric amount of budget.',
    )
    currency: str = Field(
        default="USD", description="Currency code or symbol; uppercased on normalize."
    )
    general_notes: Optional[str] = Field(
        default=None, description="Additional planning notes."
    )

    @field_validator("currency", mode="before")
    @classmethod
    def _upper_currency(cls, v):
        return v.upper() if isinstance(v, str) else v

    @field_validator("budget_amount", mode="before")
    @classmethod
    def _coerce_budget(cls, v):
        if isinstance(v, str):
            try:
                return float(v)
            except ValueError:
                return v
        return v


class Dislikes(BaseModel):
    model_config = ConfigDict(extra="forbid", validate_assignment=True)

    events: Optional[List[str]] = Field(
        default=None, description="Event types to avoid."
    )
    cuisines: Optional[List[str]] = Field(
        default=None,
        validation_alias=AliasChoices("cousines", "cuisines"),
        serialization_alias="cousines",
        description="Cuisines to avoid. Serialized as 'cousines' for compatibility.",
    )
    places: Optional[List[str]] = Field(
        default=None, description="Places/POIs to avoid."
    )
    general_note: Optional[str] = Field(
        default=None, description="General note on dislikes."
    )


class ItineraryRequest(BaseModel):
    model_config = ConfigDict(
        extra="forbid", populate_by_name=True, validate_assignment=True
    )

    city: str = Field(..., description="Target city (e.g., 'Istanbul').")
    country: str = Field(..., description="Country (name or ISO code).")
    date: DateRange = Field(default_factory=DateRange)
    people: People = Field(default_factory=People)
    preferences: Preferences = Field(default_factory=Preferences)
    dislikes: Dislikes = Field(default_factory=Dislikes)


