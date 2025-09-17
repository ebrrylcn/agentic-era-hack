import requests
import os 
from typing import Optional, List, Dict

def google_places_nearby_search(
    latitude: float,
    longitude: float, 
    radius: float,
    field_mask: str = "*",
    included_types: Optional[List[str]] = None,
    excluded_types: Optional[List[str]] = None,
    included_primary_types: Optional[List[str]] = None,
    excluded_primary_types: Optional[List[str]] = None,
    max_result_count: int = 20,
    rank_preference: str = "POPULARITY",
    language_code: str = "en",
    region_code: Optional[str] = None,
    
    api_key: Optional[str] = None
):
    """
    Comprehensive Google Places Nearby Search function with all available parameters.
    
    Args:
        latitude (float): Latitude of search center
        longitude (float): Longitude of search center
        radius (float): Search radius in meters (0.0 - 50000.0)
        field_mask (str): Comma-separated list of fields to return (default: "*")
        
        included_types (list): List of place types to include from Table A
        excluded_types (list): List of place types to exclude from Table A
        included_primary_types (list): List of primary place types to include
        excluded_primary_types (list): List of primary place types to exclude
        
        max_result_count (int): Maximum number of results (1-20, default: 20)
        rank_preference (str): "POPULARITY" (default) or "DISTANCE"
        language_code (str): Language for results (default: "en")
        region_code (str): Two-character CLDR region code
        
        api_key (str): Google Maps API key (if None, uses environment variable)
    
    Returns:
        dict: API response with places data
    """
    
    if api_key is None:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        raise ValueError("API key is required. Set GOOGLE_MAPS_API_KEY environment variable or pass api_key parameter.")
    
    if not (0.0 <= radius <= 50000.0):
        raise ValueError("Radius must be between 0.0 and 50000.0 meters")
    
    if not (1 <= max_result_count <= 20):
        raise ValueError("max_result_count must be between 1 and 20")
    
    if rank_preference not in ["POPULARITY", "DISTANCE"]:
        raise ValueError("rank_preference must be 'POPULARITY' or 'DISTANCE'")
    
    data = {
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "radius": radius
            }
        },
        "maxResultCount": max_result_count,
        "rankPreference": rank_preference,
        "languageCode": language_code
    }
    
    if included_types:
        data["includedTypes"] = included_types if isinstance(included_types, list) else [included_types]
    
    if excluded_types:
        data["excludedTypes"] = excluded_types if isinstance(excluded_types, list) else [excluded_types]
    
    if included_primary_types:
        data["includedPrimaryTypes"] = included_primary_types if isinstance(included_primary_types, list) else [included_primary_types]
    
    if excluded_primary_types:
        data["excludedPrimaryTypes"] = excluded_primary_types if isinstance(excluded_primary_types, list) else [excluded_primary_types]
    
    if region_code:
        data["regionCode"] = region_code
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': field_mask
    }
    
    url = "https://places.googleapis.com/v1/places:searchNearby"
    
    try:
        response = requests.post(url=url, json=data, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_info = {
                "status_code": response.status_code,
                "error": response.text,
                "request_data": data,
                "headers": {k: v if k != 'X-Goog-Api-Key' else 'HIDDEN' for k, v in headers.items()}
            }
            return {"error": error_info}
            
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

def google_places_place_details(
    place_id: str,
    field_mask: str = "*",
    language_code: str = "en",
    region_code: Optional[str] = None,
    session_token: Optional[str] = None,
    api_key: Optional[str] = None
):
    """
    Comprehensive Google Places Place Details function with all available parameters.
    
    Args:
        place_id (str): The place ID to get details for (required)
        field_mask (str): Comma-separated list of fields to return (default: "*")
        
        language_code (str): Language for results (default: "en")
        region_code (str): Two-character CLDR region code
        session_token (str): Session token for billing grouping (from Autocomplete)
        
        api_key (str): Google Maps API key (if None, uses environment variable)
    
    Available Fields by SKU:
        Place Details Essentials IDs Only SKU:
            - attributions, id, name, photos
        
        Place Details Essentials SKU:
            - addressComponents, addressDescriptor, adrFormatAddress, formattedAddress,
              location, plusCode, postalAddress, shortFormattedAddress, types, viewport
        
        Place Details Pro SKU:
            - accessibilityOptions, businessStatus, containingPlaces, displayName,
              googleMapsLinks, googleMapsUri, iconBackgroundColor, iconMaskBaseUri,
              primaryType, primaryTypeDisplayName, pureServiceAreaBusiness, subDestinations,
              utcOffsetMinutes
        
        Place Details Enterprise SKU:
            - currentOpeningHours, currentSecondaryOpeningHours, internationalPhoneNumber,
              nationalPhoneNumber, priceLevel, priceRange, rating, regularOpeningHours,
              regularSecondaryOpeningHours, userRatingCount, websiteUri
        
        Place Details Enterprise + Atmosphere SKU:
            - allowsDogs, curbsidePickup, delivery, dineIn, editorialSummary,
              evChargeAmenitySummary, evChargeOptions, fuelOptions, generativeSummary,
              goodForChildren, goodForGroups, goodForWatchingSports, liveMusic,
              menuForChildren, neighborhoodSummary, parkingOptions, paymentOptions,
              outdoorSeating, reservable, restroom, reviews, reviewSummary,
              routingSummaries, servesBeer, servesBreakfast, servesBrunch, servesCocktails,
              servesCoffee, servesDessert, servesDinner, servesLunch, servesVegetarianFood,
              servesWine, takeout
    
    Returns:
        dict: API response with place details
    """

    if api_key is None:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        raise ValueError("API key is required. Set GOOGLE_MAPS_API_KEY environment variable or pass api_key parameter.")
    
    if not place_id or not isinstance(place_id, str):
        raise ValueError("place_id is required and must be a string")
    
    if not field_mask:
        raise ValueError("field_mask is required (cannot be empty)")
    
    if place_id.startswith("places/"):
        place_id = place_id[7:]
    
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    params = {}
    
    if language_code:
        params["languageCode"] = language_code
    
    if region_code:
        params["regionCode"] = region_code
    
    if session_token:
        params["sessionToken"] = session_token
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': field_mask
    }
    
    try:
        response = requests.get(url=url, params=params, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_info = {
                "status_code": response.status_code,
                "error": response.text,
                "request_url": response.url,
                "headers": {k: v if k != 'X-Goog-Api-Key' else 'HIDDEN' for k, v in headers.items()}
            }
            return {"error": error_info}
            
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}

def google_places_text_search(
    text_query: str,
    field_mask: str = "*",
    
    encoded_polyline: Optional[str] = None,  # string - encoded polyline for route search
    
    routing_origin: Optional[Dict[str, float]] = None,  # dict with lat/lng for routing calculations and/or polyline origin override
    travel_mode: Optional[str] = None,  # "DRIVE", "BICYCLE", "WALK", "TWO_WHEELER"
    routing_preference: Optional[str] = None,  # "TRAFFIC_UNAWARE", "TRAFFIC_AWARE", "TRAFFIC_AWARE_OPTIMAL"
    route_modifiers: Optional[Dict[str, bool]] = None,  # dict with avoid options

    location_bias: Optional[Dict[str, float]] = None,  # dict with circle or rectangle
    location_restriction: Optional[Dict[str, float]] = None,  # dict with rectangle only

    included_type: Optional[str] = None,  # single type string
    strict_type_filtering: bool = False,
    
    min_rating: Optional[float] = None,  # float 0.0-5.0 in increments of 0.5
    open_now: Optional[bool] = None,  # bool
    price_levels: Optional[List[str]] = None,  # list of price level strings
    rank_preference: Optional[str] = None,  # "RELEVANCE" or "DISTANCE"
    
    include_pure_service_area_businesses: Optional[bool] = None,  # bool
    
    ev_connector_types: Optional[List[str]] = None,  # list of connector type strings
    ev_minimum_charging_rate_kw: Optional[float] = None,  # float
    
    page_size: int = 20,  # int 1-20
    page_token: Optional[str] = None,  # string for next page
    
    language_code: str = "en",
    region_code: Optional[str] = None,
    
    api_key: Optional[str] = None
):
    """
    Comprehensive Google Places Text Search function with all available parameters.
    Now includes Search Along Route functionality when encoded_polyline is provided.
    
    Args:
        text_query (str): The text string to search for (required)
        field_mask (str): Comma-separated list of fields to return (default: "*")
        
        encoded_polyline (str): Encoded polyline from Routes API for route-based search (optional)
        
        routing_origin (dict): Origin point for routing calculations and/or polyline origin override
            Format: {"latitude": float, "longitude": float}
            - For regular search: Calculates travel time/distance to each place
            - For route search: Overrides the polyline origin point
            - Must be provided to get routingSummaries in response
        
        travel_mode (str): Mode of transportation for routing calculations
            Options: "DRIVE" (default), "BICYCLE", "WALK", "TWO_WHEELER"
            
        routing_preference (str): Routing calculation preference
            Options: "TRAFFIC_UNAWARE" (default), "TRAFFIC_AWARE", "TRAFFIC_AWARE_OPTIMAL"
            
        route_modifiers (dict): Route features to avoid
            Format: {"avoidTolls": bool, "avoidHighways": bool, "avoidFerries": bool, "avoidIndoor": bool}
        
        location_bias (dict): Area to bias search results toward
            Circle: {"circle": {"center": {"latitude": float, "longitude": float}, "radius": float}}
            Rectangle: {"rectangle": {"low": {"latitude": float, "longitude": float}, 
                                    "high": {"latitude": float, "longitude": float}}}
        location_restriction (dict): Area to restrict search results to (rectangle only)
        
        included_type (str): Single place type to bias results toward
        strict_type_filtering (bool): Whether to strictly filter by included_type
        
        min_rating (float): Minimum average rating (0.0-5.0 in 0.5 increments)
        open_now (bool): Filter to only places open now
        price_levels (list): List of price levels ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE", etc.]
        rank_preference (str): "RELEVANCE" (default) or "DISTANCE"
        
        include_pure_service_area_businesses (bool): Include businesses without physical locations
        
        ev_connector_types (list): EV connector types to filter by
        ev_minimum_charging_rate_kw (float): Minimum EV charging rate in kW
        
        page_size (int): Number of results per page (1-20, default: 20)
        page_token (str): Token for next page of results
        
        language_code (str): Language for results (default: "en")
        region_code (str): Two-character CLDR region code
        
        api_key (str): Google Maps API key (if None, uses environment variable)
    
    Usage Examples:
        # Regular text search
        result = google_places_text_search("restaurants in New York")
        
        # Search along a route
        result = google_places_text_search(
            text_query="gas station",
            encoded_polyline="your_route_polyline_here"
        )
        
        # Search along route from current position
        result = google_places_text_search(
            text_query="restaurant",
            encoded_polyline="your_route_polyline_here",
            routing_origin={"latitude": 37.7749, "longitude": -122.4194},
            open_now=True,
            min_rating=4.0
        )
        
        # Get routing summaries (travel time/distance to each place)
        result = google_places_text_search(
            text_query="restaurants in Sydney",
            routing_origin={"latitude": -33.8688, "longitude": 151.1957362},
            travel_mode="DRIVE",
            routing_preference="TRAFFIC_AWARE",
            route_modifiers={"avoidHighways": True},
            field_mask="places.displayName,places.formattedAddress,routingSummaries"
        )
    
    Returns:
        dict: API response with places data
    """
    
    if api_key is None:
        api_key = os.getenv("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        raise ValueError("API key is required. Set GOOGLE_MAPS_API_KEY environment variable or pass api_key parameter.")
    
    if not text_query or not isinstance(text_query, str):
        raise ValueError("text_query is required and must be a string")
    
    if encoded_polyline is not None and not isinstance(encoded_polyline, str):
        raise ValueError("encoded_polyline must be a string")
    
    if not (1 <= page_size <= 20):
        raise ValueError("page_size must be between 1 and 20")
    
    if min_rating is not None:
        if not (0.0 <= min_rating <= 5.0):
            raise ValueError("min_rating must be between 0.0 and 5.0")
        min_rating = round(min_rating * 2) / 2
    
    if rank_preference and rank_preference not in ["RELEVANCE", "DISTANCE"]:
        raise ValueError("rank_preference must be 'RELEVANCE' or 'DISTANCE'")
    
    if location_bias and location_restriction:
        raise ValueError("Cannot specify both location_bias and location_restriction")
    
    if routing_origin and not encoded_polyline:
        if not isinstance(routing_origin, dict) or "latitude" not in routing_origin or "longitude" not in routing_origin:
            raise ValueError("routing_origin must be a dict with 'latitude' and 'longitude' keys")
    
    if encoded_polyline is not None and not isinstance(encoded_polyline, str):
        raise ValueError("encoded_polyline must be a string")
    
    if travel_mode and travel_mode not in ["DRIVE", "BICYCLE", "WALK", "TWO_WHEELER"]:
        raise ValueError("travel_mode must be one of: DRIVE, BICYCLE, WALK, TWO_WHEELER")
    
    if routing_preference and routing_preference not in ["TRAFFIC_UNAWARE", "TRAFFIC_AWARE", "TRAFFIC_AWARE_OPTIMAL"]:
        raise ValueError("routing_preference must be one of: TRAFFIC_UNAWARE, TRAFFIC_AWARE, TRAFFIC_AWARE_OPTIMAL")
    
    if route_modifiers and not isinstance(route_modifiers, dict):
        raise ValueError("route_modifiers must be a dict with avoid options")
    
    data = {
        "textQuery": text_query,
        "pageSize": page_size,
        "languageCode": language_code
    }
    
    if encoded_polyline:
        data["searchAlongRouteParameters"] = {
            "polyline": {
                "encodedPolyline": encoded_polyline
            }
        }
    
    if routing_origin or travel_mode or routing_preference or route_modifiers:
        routing_params = {}
        
        if routing_origin:
            if "latitude" not in routing_origin or "longitude" not in routing_origin:
                raise ValueError("routing_origin must contain 'latitude' and 'longitude' keys")
            routing_params["origin"] = routing_origin
        
        if travel_mode:
            routing_params["travelMode"] = travel_mode
        
        if routing_preference:
            routing_params["routingPreference"] = routing_preference
        
        if route_modifiers:
            valid_modifiers = {"avoidTolls", "avoidHighways", "avoidFerries", "avoidIndoor"}
            invalid_keys = set(route_modifiers.keys()) - valid_modifiers
            if invalid_keys:
                raise ValueError(f"Invalid route modifier keys: {invalid_keys}. Valid keys: {valid_modifiers}")
            routing_params["routeModifiers"] = route_modifiers
        
        data["routingParameters"] = routing_params
    
    if location_bias:
        data["locationBias"] = location_bias
    
    if location_restriction:
        data["locationRestriction"] = location_restriction
    
    if included_type:
        data["includedType"] = included_type
    
    if strict_type_filtering:
        data["strictTypeFiltering"] = strict_type_filtering
    
    if min_rating is not None:
        data["minRating"] = min_rating
    
    if open_now is not None:
        data["openNow"] = open_now
    
    if price_levels:
        data["priceLevels"] = price_levels if isinstance(price_levels, list) else [price_levels]
    
    if rank_preference:
        data["rankPreference"] = rank_preference
    
    if include_pure_service_area_businesses is not None:
        data["includePureServiceAreaBusinesses"] = include_pure_service_area_businesses
    
    if ev_connector_types or ev_minimum_charging_rate_kw:
        ev_options = {}
        if ev_connector_types:
            ev_options["connectorTypes"] = ev_connector_types if isinstance(ev_connector_types, list) else [ev_connector_types]
        if ev_minimum_charging_rate_kw:
            ev_options["minimumChargingRateKw"] = ev_minimum_charging_rate_kw
        data["evOptions"] = ev_options
    
    if page_token:
        data["pageToken"] = page_token
    
    if region_code:
        data["regionCode"] = region_code
    
    headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': api_key,
        'X-Goog-FieldMask': field_mask
    }
    
    url = "https://places.googleapis.com/v1/places:searchText"
    
    try:
        response = requests.post(url=url, json=data, headers=headers)
        
        if response.status_code == 200:
            return response.json()
        else:
            error_info = {
                "status_code": response.status_code,
                "error": response.text,
                "request_data": data,
                "headers": {k: v if k != 'X-Goog-Api-Key' else 'HIDDEN' for k, v in headers.items()}
            }
            return {"error": error_info}
            
    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}
    

def extract_places_from_text_search(text_search_response: dict , include_routing: bool = True) -> Dict[str, str]:
    """
    Helper function to extract place information from a text search response.
    Works for regular text search, search along route, and routing summaries.
    
    Args:
        text_search_response (dict): Response from google_places_text_search() 
            - Can be a dictionary (parsed JSON response) or a JSON string
        include_routing (bool): Whether to include routing summary data if available
        
    Returns:
        dict: Extracted place information with key details
    """
    if isinstance(text_search_response, str):
        try:
            import json
            text_search_response = json.loads(text_search_response)
        except (json.JSONDecodeError, TypeError) as e:
            return {"error": f"Invalid JSON response: {str(e)}", "raw_response": text_search_response}
    
    if not isinstance(text_search_response, dict):
        return {"error": f"Invalid response type: {type(text_search_response)}", "raw_response": str(text_search_response)}
    
    if "error" in text_search_response:
        return {"error": "Cannot extract places due to API error", "api_error": text_search_response["error"]}
    
    places = text_search_response.get("places", [])
    routing_summaries = text_search_response.get("routingSummaries", [])
    
    if not places:
        return {"message": "No places found"}
    
    extracted_places = []
    for i, place in enumerate(places):
        place_info = {
            "place_id": place.get("id"),
            "name": place.get("displayName", {}).get("text"),
            "address": place.get("formattedAddress"),
            "location": place.get("location"),
            "types": place.get("types", []),
            "rating": place.get("rating"),
            "user_rating_count": place.get("userRatingCount"),
            "price_level": place.get("priceLevel"),
            "open_now": None
        }
        
        current_hours = place.get("currentOpeningHours")
        if current_hours:
            place_info["open_now"] = current_hours.get("openNow")
        
        phone = place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber")
        if phone:
            place_info["phone_number"] = phone
        
        website = place.get("websiteUri")
        if website:
            place_info["website"] = website
        
        if include_routing and i < len(routing_summaries) and routing_summaries[i]:
            routing_summary = routing_summaries[i]
            legs = routing_summary.get("legs", [])
            
            if legs:
                leg = legs[0]
                place_info["routing"] = {
                    "duration": leg.get("duration"),  # in seconds as string (e.g., "597s")
                    "distance_meters": leg.get("distanceMeters"),  # in meters as int
                    "directions_uri": routing_summary.get("directionsUri")  # Preview feature
                }
                duration_str = leg.get("duration", "")
                if duration_str.endswith("s"):
                    try:
                        seconds = int(duration_str[:-1])
                        minutes = seconds // 60
                        remaining_seconds = seconds % 60
                        place_info["routing"]["duration_formatted"] = f"{minutes}m {remaining_seconds}s"
                    except ValueError:
                        pass
        
        extracted_places.append(place_info)
    
    result = {
        "place_count": len(extracted_places),
        "places": extracted_places,
        "next_page_token": text_search_response.get("nextPageToken")
    }
    
    if routing_summaries:
        result["has_routing_summaries"] = True
        result["routing_summaries_count"] = len(routing_summaries)
    
    return result