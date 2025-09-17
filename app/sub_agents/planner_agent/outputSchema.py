from __future__ import annotations

from typing import List, Optional, Union
import datetime as _dt

from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator

DATE_FMT = "%d.%m.%Y"

def _coerce_date_like(v) -> str:
    """
    Accepts: str | datetime.date | datetime.datetime
    Returns: 'dd.mm.yyyy' string (best effort). If parse fails but v is str, returns as-is (lenient).
    """
    if isinstance(v, _dt.date) and not isinstance(v, _dt.datetime):
        return v.strftime(DATE_FMT)
    if isinstance(v, _dt.datetime):
        return v.date().strftime(DATE_FMT)
    if isinstance(v, str):
        for fmt in (DATE_FMT, "%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y", "%m/%d/%Y"):
            try:
                return _dt.datetime.strptime(v, fmt).strftime(DATE_FMT)
            except Exception:
                pass
        return v
    raise TypeError("date must be str|datetime.date|datetime.datetime")

def _coerce_time(v: Union[int, str]) -> Union[int, str]:
    """
    Accepts:
      - int (unix seconds)
      - 'HH:MM' or 'HH:MM:SS'
      - numeric string like '1694949930' -> coerces to int
    """
    if isinstance(v, int):
        if v < 0:
            raise ValueError("time unix seconds must be ≥ 0")
        return v
    if isinstance(v, str):
        if v.isdigit():
            return int(v)
        parts = v.split(":")
        if len(parts) in (2, 3):
            try:
                fmt = "%H:%M" if len(parts) == 2 else "%H:%M:%S"
                _dt.datetime.strptime(v, fmt)
                return v
            except ValueError:
                pass
    return v

class Travel(BaseModel):
    model_config = ConfigDict(validate_assignment=True, extra="ignore")
    mode: Optional[str] = Field(default=None, description="Transport mode from previous stop")
    to_go: Optional[Union[str, int]] = Field(default=None)

class Place(BaseModel):
    model_config = ConfigDict(validate_assignment=True, extra="ignore")
    order: int = Field(..., ge=1, description="Visit sequence within the day (1 = first).")
    place_id: Union[int, str] = Field(..., description="Place identifier (int or str).")
    lat: float = Field(..., ge=-90, le=90, description="Latitude (WGS84).  STRICT NUMERIC.")
    lon: float = Field(..., ge=-180, le=180, description="Longitude (WGS84). STRICT NUMERIC.")
    name: str = Field(...)

    address: Optional[str] = None
    place_type: Optional[str] = None  # e.g., 'hotel','restaurant','museum','event', etc.

    travel: Travel = Field(default_factory=Travel)
    time: Union[int, str] = Field(...)

    @field_validator("lat", "lon", mode="before")
    @classmethod
    def _latlon_numeric_only(cls, v):
        if isinstance(v, (int, float)):
            return float(v)
        raise TypeError("lat/lon must be numeric (int/float)")

    @field_validator("time")
    @classmethod
    def _time_ok(cls, v):
        return _coerce_time(v)

class DayPlan(BaseModel):
    model_config = ConfigDict(validate_assignment=True, extra="ignore")

    order: int = Field(..., ge=1, description="Day index starting at 1.")
    date: Union[str, _dt.date, _dt.datetime] = Field(..., description="dd.mm.yyyy (lenient input)")
    places: List[Place] = Field(default_factory=list)
    summary: str = Field(...)

    @field_validator("date")
    @classmethod
    def _date_ok(cls, v):
        return _coerce_date_like(v)

    @model_validator(mode="after")
    def _check_places_order(self):
        if self.places:
            orders = [p.order for p in self.places]
            if min(orders) != 1 or sorted(orders) != list(range(1, len(orders) + 1)):
                raise ValueError("places.order must start at 1 and be consecutive")
        return self

class HotelInformation(BaseModel):
    model_config = ConfigDict(validate_assignment=True, extra="ignore")

    name: str
    place_id: Union[int, str]
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    address: Optional[str]

    check_in: Optional[Union[str, _dt.date, _dt.datetime]] = None
    check_out: Optional[Union[str, _dt.date, _dt.datetime]] = None
    nights: Optional[Union[int, str]] = Field(default=None, description="int or string label")

    price_per_night: Optional[Union[float, int, str]] = None
    total_price: Optional[Union[float, int, str]] = None
    currency: Optional[str] = None
    booking_link: Optional[str] = None

    @field_validator("check_in", "check_out")
    @classmethod
    def _dates_ok(cls, v):
        if v is None:
            return v
        return _coerce_date_like(v)

class ItineraryResponse(BaseModel):
    """
    Flexible summary object returned by planner_summary_agent.
    - Keys & structure match the agreed contract (hotel_information + day_plans).
    - Types are lenient except for lat/lon numeric + range check.
    - Unknown extra fields are ignored safely.
    """
    model_config = ConfigDict(validate_assignment=True, extra="ignore")
    hotel_information: HotelInformation
    day_plans: List[DayPlan]

    @model_validator(mode="after")
    def _check_day_orders(self):
        if self.day_plans:
            orders = [d.order for d in self.day_plans]
            if min(orders) != 1 or sorted(orders) != list(range(1, len(orders) + 1)):
                raise ValueError("day_plans.order must start at 1 and be consecutive")
        return self

 