import os
import math
import requests
from typing import Dict, Any, List, Optional, Tuple, Literal
from datetime import datetime, timedelta

from env_utils import ensure_env_loaded
from tourgent.sub_agents.maps_agent.tools import (
    google_places_text_search,
    google_places_nearby_search,
    google_places_place_details,
)

ensure_env_loaded()
SERPAPI_ENDPOINT = "https://serpapi.com/search.json"


# ====================================================
# Helpers
# ====================================================
def _validate_dates(check_in: str, check_out: str) -> Tuple[str, str]:
    try:
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d")
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d")
        today = datetime.now()
        if check_in_date <= today:
            check_in_date = today + timedelta(days=7)
            check_out_date = check_in_date + timedelta(days=5)
        elif check_out_date <= check_in_date:
            check_out_date = check_in_date + timedelta(days=1)
        return check_in_date.strftime("%Y-%m-%d"), check_out_date.strftime("%Y-%m-%d")
    except Exception:
        default_check_in = datetime.now() + timedelta(days=7)
        default_check_out = default_check_in + timedelta(days=5)
        return default_check_in.strftime("%Y-%m-%d"), default_check_out.strftime("%Y-%m-%d")


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0088
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return r * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def _normalize_place_data(place: Dict[str, Any], source: str = "Google Places API") -> Dict[str, Any]:
    location = place.get("location", {})
    lat = location.get("latitude") or location.get("lat")
    lng = location.get("longitude") or location.get("lng")
    display_name = place.get("displayName")
    if isinstance(display_name, dict):
        name = display_name.get("text")
    else:
        name = display_name or place.get("name")
    return {
        "place_id": place.get("id") or place.get("place_id"),
        "name": name,
        "address": place.get("formattedAddress") or place.get("address"),
        "coordinates": {"latitude": lat, "longitude": lng} if lat and lng else None,
        "rating": place.get("rating"),
        "user_ratings_total": place.get("userRatingCount") or place.get("user_rating_count"),
        "price_level": place.get("priceLevel") or place.get("price_level"),
        "types": place.get("types", []),
        "phone": place.get("internationalPhoneNumber") or place.get("phone"),
        "website": place.get("websiteUri") or place.get("website"),
        "opening_hours": place.get("currentOpeningHours") or place.get("opening_hours"),
        "photos": place.get("photos", []),
        "source": source,
    }


def _calculate_name_similarity(name1: Optional[str], name2: Optional[str]) -> float:
    if not name1 or not name2:
        return 0.0
    n1, n2 = name1.lower().strip(), name2.lower().strip()
    if n1 == n2:
        return 1.0
    if n1 in n2 or n2 in n1:
        return 0.8
    words1 = set(n1.split())
    words2 = set(n2.split())
    common = {"hotel", "inn", "resort", "lodge", "suites", "palace", "grand"}
    words1 -= common
    words2 -= common
    if not words1 or not words2:
        return 0.0
    jaccard = len(words1 & words2) / len(words1 | words2)
    if len(words1 & words2) >= 2:
        jaccard += 0.2
    return min(jaccard, 1.0)


# ====================================================
# 1. HOTELS SEARCH (by location OR nearby)
# ====================================================
def hotels_search(
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    min_rating: Optional[float] = None,
    max_results: Optional[int] = None,
    price_levels: Optional[List[str]] = None,
    open_now: Optional[bool] = None,
    include_amenities: Optional[bool] = None,
    radius: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Unified search tool:
    - If `location` is given -> behaves as search_hotels_by_location
    - If `latitude` & `longitude` given -> behaves as search_hotels_nearby
    """
    try:
        min_rating = min_rating if min_rating is not None else 0.0
        max_results = max_results if max_results is not None else 20
        radius = radius if radius is not None else 2000.0
        include_amenities = include_amenities if include_amenities is not None else True

        # ortak field_mask (amenities ve accessibilityOptions yok!)
        field_mask = (
            "places.id,places.displayName,places.formattedAddress,"
            "places.location,places.rating,places.userRatingCount,"
            "places.priceLevel,places.types,places.websiteUri,"
            "places.internationalPhoneNumber,places.currentOpeningHours"
        )

        # === LOCATION SEARCH ===
        if location is not None:
            response = google_places_text_search(
                text_query=f"hotels lodging in {location}",
                field_mask=field_mask,
                included_type="lodging",
                min_rating=min_rating if min_rating > 0 else None,
                price_levels=price_levels,
                open_now=open_now,
                page_size=min(max_results, 20),
                language_code="en"
            )

            if "error" in response:
                return {"status": "error", "error": f"Search failed: {response['error']}", "results": []}

            places = response.get("places", [])
            results = []

            for place in places:
                normalized = _normalize_place_data(place)
                # amenities field burada yok → sadece details call ile alınabilir
                if normalized["coordinates"] and normalized["coordinates"]["latitude"] is not None:
                    results.append(normalized)

            return {
                "status": "success",
                "results": results,
                "total_found": len(results),
                "search_location": location,
                "filters_applied": {
                    "min_rating": min_rating,
                    "price_levels": price_levels,
                    "open_now": open_now
                }
            }

        # === NEARBY SEARCH ===
        elif latitude is not None and longitude is not None:
            response = google_places_nearby_search(
                latitude=latitude,
                longitude=longitude,
                radius=radius,
                field_mask=field_mask,
                included_types=["lodging"],
                max_result_count=min(max_results, 20),
                language_code="en"
            )

            if "error" in response:
                return {"status": "error", "error": f"Nearby search failed: {response['error']}", "results": []}

            places = response.get("places", [])
            results = []

            for place in places:
                normalized = _normalize_place_data(place)

                if normalized["coordinates"] and normalized["coordinates"]["latitude"] is not None:
                    place_lat = normalized["coordinates"]["latitude"]
                    place_lng = normalized["coordinates"]["longitude"]
                    distance_km = _haversine_km(latitude, longitude, place_lat, place_lng)
                    normalized["distance_from_center"] = {
                        "km": round(distance_km, 3),
                        "meters": round(distance_km * 1000)
                    }

                    rating = normalized.get("rating")
                    if rating is None or rating >= min_rating:
                        results.append(normalized)

            results.sort(key=lambda x: x["distance_from_center"]["km"])

            return {
                "status": "success",
                "results": results,
                "total_found": len(results),
                "search_center": {"latitude": latitude, "longitude": longitude},
                "search_radius_km": radius / 1000,
                "filters_applied": {"min_rating": min_rating}
            }

        else:
            return {"status": "error", "error": "Either `location` or (`latitude` & `longitude`) must be provided", "results": []}

    except Exception as e:
        return {"status": "error", "error": f"Search operation failed: {str(e)}", "results": []}

# ====================================================
# 2. HOTEL DETAILS + PRICES
# ====================================================
def hotel_details_and_prices(
    place_id: Optional[str] = None,
    include_photos: Optional[bool] = None,
    include_reviews: Optional[bool] = None,
    location_for_price: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    hotel_name: Optional[str] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
    currency: Optional[str] = None,
    adults: Optional[int] = None,
    max_distance_km: Optional[float] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort_by: Optional[int] = None,
) -> Dict[str, Any]:
    details_ret, prices_ret = None, None
    if place_id:
        try:
            include_photos = include_photos if include_photos is not None else True
            include_reviews = include_reviews if include_reviews is not None else True
            field_mask = (
                "id,displayName,formattedAddress,location,rating,userRatingCount,"
                "priceLevel,types,websiteUri,internationalPhoneNumber,"
                "currentOpeningHours,regularOpeningHours,accessibilityOptions"
            )
            if include_photos: field_mask += ",photos"
            if include_reviews: field_mask += ",reviews"
            response = google_places_place_details(place_id=place_id, field_mask=field_mask, language_code="en")
            if "error" in response:
                details_ret = {"status": "error", "error": f"Details fetch failed: {response['error']}", "result": None}
            else:
                normalized = _normalize_place_data(response)
                if include_photos: normalized["photos"] = response.get("photos", [])
                if include_reviews: normalized["reviews"] = response.get("reviews", [])
                details_ret = {"status": "success", "result": normalized}
        except Exception as e:
            details_ret = {"status": "error", "error": str(e), "result": None}
    if check_in and check_out:
        check_in, check_out = _validate_dates(check_in, check_out)
        api_key = os.getenv("SERPAPI_KEY")
        if not api_key:
            prices_ret = {"status": "error", "error": "SERPAPI_KEY missing in .env", "results": []}
        else:
            params = {
                "engine": "google_hotels",
                "api_key": api_key,
                "q": f"{hotel_name} {location_for_price}" if hotel_name else location_for_price,
                "check_in_date": check_in,
                "check_out_date": check_out,
                "currency": currency or "EUR",
                "adults": adults or 2,
                "sort_by": sort_by or 3,
            }
            if min_price: params["min_price"] = min_price
            if max_price: params["max_price"] = max_price
            try:
                r = requests.get(SERPAPI_ENDPOINT, params=params, timeout=30)
                r.raise_for_status()
                data = r.json()
                if "error" in data:
                    prices_ret = {"status": "error", "error": data["error"], "results": []}
                else:
                    prices_ret = {"status": "success", "results": data.get("properties", [])}
            except Exception as e:
                prices_ret = {"status": "error", "error": str(e), "results": []}
    status = "success" if ((not details_ret or details_ret["status"] == "success") and (not prices_ret or prices_ret["status"] == "success")) else "partial"
    return {"status": status, "details": details_ret, "prices": prices_ret}


# ====================================================
# 3. HOTELS ANALYZE
# ====================================================
def hotels_analyze(
    mode: Literal["location", "route", "comprehensive"],
    hotel_name: Optional[str] = None,
    city: Optional[str] = None,
    origin: Optional[Dict[str, float]] = None,
    destination: Optional[Dict[str, float]] = None,
    location: Optional[str] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
) -> Dict[str, Any]:
    if mode == "location":
        try:
            response = google_places_text_search(
                text_query=f"{hotel_name} {city} lodging",
                field_mask="places.id,places.displayName,places.location,places.formattedAddress",
                included_type="lodging",
                page_size=1
            )
            if "error" in response or not response.get("places"):
                return {"status": "error", "error": "Hotel not found", "results": []}
            hotel_place = response["places"][0]
            return {"status": "success", "hotel": _normalize_place_data(hotel_place)}
        except Exception as e:
            return {"status": "error", "error": str(e), "results": []}
    elif mode == "route":
        try:
            mid_lat = (origin["latitude"] + destination["latitude"]) / 2
            mid_lng = (origin["longitude"] + destination["longitude"]) / 2
            response = google_places_nearby_search(
                latitude=mid_lat,
                longitude=mid_lng,
                radius=5000,
                included_types=["lodging"],
                field_mask="places.id,places.displayName,places.formattedAddress,places.location,places.rating"
            )
            if "error" in response:
                return {"status": "error", "error": response["error"], "results": []}
            return {"status": "success", "results": [_normalize_place_data(p) for p in response.get("places", [])]}
        except Exception as e:
            return {"status": "error", "error": str(e), "results": []}
    elif mode == "comprehensive":
        base = hotels_search(location=location, max_results=5)
        return {"status": "success", "comprehensive_results": base.get("results", [])}
    return {"status": "error", "error": "Invalid mode", "results": []}
