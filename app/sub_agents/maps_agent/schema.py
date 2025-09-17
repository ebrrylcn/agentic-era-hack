from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Union
from enum import Enum

def remove_additional_properties(schema_dict):
    """Recursively remove additionalProperties from JSON schema for Gemini API compatibility"""
    if isinstance(schema_dict, dict):
        # Remove additionalProperties key if present
        if 'additionalProperties' in schema_dict:
            del schema_dict['additionalProperties']
        # Recursively process all nested objects
        for key, value in schema_dict.items():
            remove_additional_properties(value)
    elif isinstance(schema_dict, list):
        # Process each item in lists
        for item in schema_dict:
            remove_additional_properties(item)
    return schema_dict

# Enums for action types and parameters
class ActionType(str, Enum):
    CLEAR_MAP = "clear_map"
    CENTER_MAP = "center_map"
    GET_SPECIFIC_PLACES = "get_specific_places"
    SHOW_SINGLE_ROUTE = "show_single_route"
    SHOW_MULTIPLE_ROUTES = "show_multiple_routes"

class TravelMode(str, Enum):
    DRIVING = "DRIVING"
    WALKING = "WALKING"
    BICYCLING = "BICYCLING"
    TRANSIT = "TRANSIT"

# Parameter schemas for different actions
class LocationParams(BaseModel):
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")

class ClearMapParams(BaseModel):
    type: Optional[str] = Field("all", description="Type of content to clear: 'places', 'routes', or 'all'")

class CenterMapParams(BaseModel):
    location: LocationParams = Field(..., description="Location to center on (coordinates or address)")
    zoom: Optional[int] = Field(15, description="Zoom level", ge=1, le=21)

class CoordinatePlace(BaseModel):
    lat: float = Field(..., description="Latitude")
    lng: float = Field(..., description="Longitude") 
    name: str = Field(..., description="Name/label for this location")

class SinglePlace(BaseModel):
    """Single place object structure for display"""
    place_id: Optional[str] = Field(None, description="Google Places API place ID")
    name: str = Field(..., description="Place name")
    address: Optional[str] = Field(None, description="Formatted address")
    location: Optional[LocationParams] = Field(None, description="Geographic coordinates")
    types: Optional[List[str]] = Field(None, description="Place types")

class GetSpecificPlacesParams(BaseModel):
    placeIds: Optional[List[str]] = Field(None, description="List of Google Places API place IDs")
    coordinates: Optional[List[CoordinatePlace]] = Field(None, description="List of coordinate locations with names")

class RouteParams(BaseModel):
    origin: Union[str, LocationParams] = Field(..., description="Starting point (address or coordinates)")
    destination: Union[str, LocationParams] = Field(..., description="End point (address or coordinates)")
    waypoints: Optional[List[str]] = Field(None, description="Optional intermediate stops")
    travel_mode: Optional[TravelMode] = Field(TravelMode.DRIVING, description="Mode of transportation")

class ShowSingleRouteParams(BaseModel):
    origin: Union[str, LocationParams] = Field(..., description="Starting point (address or coordinates)")
    destination: Union[str, LocationParams] = Field(..., description="End point (address or coordinates)")
    travel_mode: Optional[TravelMode] = Field(TravelMode.DRIVING, description="Mode of transportation")

class ShowMultipleRoutesParams(BaseModel):
    routes: List[RouteParams] = Field(..., description="List of routes to display", min_items=1)

# Main action schema
class AIAction(BaseModel):
    model_config = ConfigDict(extra='ignore')
    
    action: ActionType = Field(..., description="Type of action to perform")
    params: Union[
        ClearMapParams,
        CenterMapParams,
        GetSpecificPlacesParams,
        ShowSingleRouteParams,
        ShowMultipleRoutesParams
    ] = Field(..., description="Parameters specific to the action")
    
    @classmethod
    def model_json_schema(cls, by_alias: bool = True, ref_template: str = '#/$defs/{model}') -> dict:
        """Generate JSON schema without additionalProperties for Gemini API compatibility"""
        # Generate the standard schema first
        schema = super().model_json_schema(by_alias=by_alias, ref_template=ref_template)
        # Remove all additionalProperties for Gemini API compatibility
        return remove_additional_properties(schema)

# Response schemas
class PlaceInfo(BaseModel):
    place_id: str = Field(..., description="Google Places API place ID")
    name: str = Field(..., description="Place name")
    address: str = Field(..., description="Formatted address")
    location: LocationParams = Field(..., description="Geographic coordinates")
    rating: Optional[float] = Field(None, description="User rating (1-5 stars)")
    price_level: Optional[int] = Field(None, description="Price level (0-4)")
    types: List[str] = Field(default_factory=list, description="Place types")
    photo_url: Optional[str] = Field(None, description="Photo URL if available")

class RouteInfo(BaseModel):
    distance: str = Field(..., description="Total distance (e.g., '5.2 km')")
    duration: str = Field(..., description="Estimated duration (e.g., '12 mins')")
    origin: str = Field(..., description="Starting address")
    destination: str = Field(..., description="Destination address")
    travel_mode: TravelMode = Field(..., description="Mode of transportation")

class AIResponse(BaseModel):
    success: bool = Field(..., description="Whether the action was successful")
    action: ActionType = Field(..., description="The action that was performed")
    message: str = Field(..., description="Human-readable message about the result")
    data: Optional[Union[List[PlaceInfo], RouteInfo, PlaceInfo]] = Field(None, description="Action-specific result data")
    error: Optional[str] = Field(None, description="Error message if action failed")
    timestamp: str = Field(..., description="ISO timestamp of the response")

# Multi-action request for batch operations
class AIRequest(BaseModel):
    actions: List[AIAction] = Field(..., description="List of actions to perform", min_items=1)
    request_id: Optional[str] = Field(None, description="Optional request ID for tracking")

# Batch response for multiple actions
class AIBatchResponse(BaseModel):
    success: bool = Field(..., description="Whether all actions were successful")
    responses: List[AIResponse] = Field(..., description="Individual responses for each action")
    request_id: Optional[str] = Field(None, description="Request ID if provided")
    timestamp: str = Field(..., description="ISO timestamp of the batch response")

# Main output schema for the AI agent
class MapsOutput(BaseModel):
    """Main output schema for AI agent responses to the frontend"""
    model_config = ConfigDict(extra='ignore')
    
    request: Union[AIAction, AIRequest] = Field(..., description="The AI's intended action(s) for the frontend")
    reasoning: Optional[str] = Field(None, description="AI's reasoning for the chosen action(s)")
    confidence: Optional[float] = Field(None, description="Confidence level (0-1) in the response", ge=0, le=1)
    
    @classmethod
    def model_json_schema(cls, by_alias: bool = True, ref_template: str = '#/$defs/{model}') -> dict:
        """Generate JSON schema without additionalProperties for Gemini API compatibility"""
        # Generate the standard schema first
        schema = super().model_json_schema(by_alias=by_alias, ref_template=ref_template)
        # Remove all additionalProperties for Gemini API compatibility
        return remove_additional_properties(schema)

# Utility schemas for common data structures
class BoundingBox(BaseModel):
    """Geographic bounding box"""
    north: float = Field(..., description="Northern latitude boundary")
    south: float = Field(..., description="Southern latitude boundary") 
    east: float = Field(..., description="Eastern longitude boundary")
    west: float = Field(..., description="Western longitude boundary")

class OpeningHours(BaseModel):
    """Place opening hours information"""
    open_now: Optional[bool] = Field(None, description="Whether the place is currently open")
    periods: Optional[List[str]] = Field(None, description="Opening periods (e.g., 'Mon: 9:00 AM - 5:00 PM')")

class PlacePhoto(BaseModel):
    """Place photo information"""
    photo_reference: str = Field(..., description="Google Places photo reference")
    width: int = Field(..., description="Photo width in pixels")
    height: int = Field(..., description="Photo height in pixels")
    html_attributions: List[str] = Field(default_factory=list, description="Required attributions")

# Extended place info with more details
class DetailedPlaceInfo(PlaceInfo):
    """Extended place information with additional details"""
    phone_number: Optional[str] = Field(None, description="International phone number")
    website: Optional[str] = Field(None, description="Website URL")
    opening_hours: Optional[OpeningHours] = Field(None, description="Opening hours information")
    photos: List[PlacePhoto] = Field(default_factory=list, description="Available photos")
    reviews_count: Optional[int] = Field(None, description="Number of reviews")
    vicinity: Optional[str] = Field(None, description="Simplified address for display")

# Error schemas
class ValidationError(BaseModel):
    """Validation error details"""
    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Error message")
    value: Optional[str] = Field(None, description="Invalid value that was provided")

class ErrorResponse(BaseModel):
    """Error response structure"""
    success: bool = Field(False, description="Always false for error responses")
    error_type: str = Field(..., description="Type of error (validation, api, network, etc.)")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[List[ValidationError]] = Field(None, description="Detailed validation errors")
    timestamp: str = Field(..., description="ISO timestamp of the error")

# Example usage and validation helpers
def create_get_places_action(placeIds: List[str] = None, coordinates: List[dict] = None) -> AIAction:
    """Helper function to create a get specific places action"""
    coords = [CoordinatePlace(**coord) for coord in coordinates] if coordinates else None
    params = GetSpecificPlacesParams(
        placeIds=placeIds,
        coordinates=coords
    )
    return AIAction(action=ActionType.GET_SPECIFIC_PLACES, params=params)

def create_single_route_action(origin: str, destination: str, travel_mode: TravelMode = TravelMode.DRIVING) -> AIAction:
    """Helper function to create a single route action"""
    params = ShowSingleRouteParams(
        origin=origin,
        destination=destination,
        travel_mode=travel_mode
    )
    return AIAction(action=ActionType.SHOW_SINGLE_ROUTE, params=params)

def create_clear_map_action(clear_type: str = "all") -> AIAction:
    """Helper function to create a clear map action"""
    params = ClearMapParams(type=clear_type)
    return AIAction(action=ActionType.CLEAR_MAP, params=params)

def create_center_map_action(location: Union[dict, str], zoom: int = 15) -> AIAction:
    """Helper function to create a center map action"""
    if isinstance(location, dict):
        location = LocationParams(**location)
    params = CenterMapParams(location=location, zoom=zoom)
    return AIAction(action=ActionType.CENTER_MAP, params=params)

def create_maps_output(action: AIAction, reasoning: str = None, confidence: float = None) -> MapsOutput:
    """Helper function to create a MapsOutput response"""
    return MapsOutput(
        request=action,
        reasoning=reasoning,
        confidence=confidence
    )

# Schema validation utilities
def validate_coordinates(lat: float, lng: float) -> bool:
    """Validate latitude and longitude coordinates"""
    return -90 <= lat <= 90 and -180 <= lng <= 180

def validate_search_radius(radius: int) -> bool:
    """Validate search radius is within acceptable bounds"""
    return 100 <= radius <= 50000  # 100m to 50km
    