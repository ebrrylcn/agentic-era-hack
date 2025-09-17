import json
import os
from datetime import datetime
from typing import Dict, Any
from pathlib import Path

def validate_and_save_itinerary(itinerary_json: str) -> Dict[str, str]:
    """
    Validates and saves the travel itinerary JSON to files with UTF-8 encoding.
    Saves to both /output directory and /frontend/output.json
    
    Args:
        itinerary_json: The complete itinerary JSON as a string
        
    Returns:
        Dict with status, message and file_paths
    """
    try:
        # Parse JSON to validate format
        itinerary_data = json.loads(itinerary_json)
        
        # Validate required structure
        if "hotel_information" not in itinerary_data:
            return {
                "status": "error",
                "message": "Missing hotel_information in JSON",
                "file_path": "none"
            }
        
        if "day_plans" not in itinerary_data:
            return {
                "status": "error", 
                "message": "Missing day_plans in JSON",
                "file_path": "none"
            }
        
        # Get project root directory (4 levels up from this file)
        project_root = Path(__file__).parent.parent.parent.parent
        
        # 1. Save to output directory (for archival)
        output_dir = project_root / "output"
        output_dir.mkdir(exist_ok=True)
        
        # Generate timestamped filename for archive
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        hotel_name = itinerary_data.get("hotel_information", {}).get("name", "unknown_hotel")
        safe_hotel_name = "".join(c for c in hotel_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_hotel_name = safe_hotel_name.replace(' ', '_')
        
        archive_filename = f"itinerary_{safe_hotel_name}_{timestamp}.json"
        archive_path = output_dir / archive_filename
        
        # 2. Save to frontend directory (for live updates)
        frontend_dir = project_root / "frontend"
        frontend_path = frontend_dir / "output.json"
        
        # Save to both locations with UTF-8 encoding
        for file_path in [archive_path, frontend_path]:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(itinerary_data, f, indent=2, ensure_ascii=False)
        
        return {
            "status": "success",
            "message": f"Itinerary saved to archive ({archive_filename}) and frontend (output.json)",
            "file_path": f"archive: {archive_path}, frontend: {frontend_path}"
        }
        
    except json.JSONDecodeError as e:
        return {
            "status": "error",
            "message": f"Invalid JSON format: {str(e)}",
            "file_path": "none"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Error saving itinerary: {str(e)}",
            "file_path": "none"
        }