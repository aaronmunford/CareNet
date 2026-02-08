"""
CareNet Backend API

FastAPI server providing healthcare provider data for the CareNet web app.

To run:
    cd backend
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload

Endpoints:
    GET / - Health check
    GET /providers - List all providers with insurance matching
    GET /providers/{id} - Get single provider by ID
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
from pathlib import Path
from typing import Optional
import math

app = FastAPI(title="CareNet API", version="1.0.0")

# CORS middleware - allow frontend on localhost:3000 (Next.js) and localhost:5173 (Vite backup)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in miles between two coordinates using Haversine formula"""
    R = 3959  # Earth's radius in miles
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)

    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return round(R * c, 1)


def transform_provider(provider: dict, insurance_provider: Optional[str] = None,
                       user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> dict:
    """
    Transform raw provider data to frontend Hospital format.

    Calculates:
    - insuranceConfidence based on network match
    - costEstimateMin/Max from copay data
    - distanceMiles from user location
    """
    networks = provider.get("networks", {})

    # Determine insurance confidence, network status, and cost
    insurance_confidence = "unknown"
    network_status = "unknown"
    cost_min = None
    cost_max = None
    cost_confidence = "low"
    estimated_copay = None

    if insurance_provider and insurance_provider in networks:
        network_info = networks[insurance_provider]
        cost_min = network_info.get("copay_min")
        cost_max = network_info.get("copay_max")
        if network_info.get("in_network"):
            insurance_confidence = "verified"
            network_status = "in_network"
            cost_confidence = "high"
            if cost_min is not None and cost_max is not None:
                estimated_copay = {"min": cost_min, "max": cost_max}
        else:
            # Out of network - still show the cost estimates
            insurance_confidence = "out_of_network"
            network_status = "out_of_network"
            cost_confidence = "medium"
            if cost_min is not None and cost_max is not None:
                estimated_copay = {"min": cost_min, "max": cost_max}
    elif insurance_provider:
        # Provider specified but not in our data - likely in network
        insurance_confidence = "likely"
        network_status = "unknown"
        cost_confidence = "medium"

    # Calculate distance if user location provided
    distance_miles = None
    eta_minutes = None
    if user_lat is not None and user_lng is not None:
        distance_miles = calculate_distance(
            user_lat, user_lng,
            provider["lat"], provider["lng"]
        )
        # Rough ETA: assume 15 mph average speed in Manhattan
        eta_minutes = round(distance_miles * 4)

    return {
        "id": str(provider["id"]),
        "name": provider["name"],
        "address": provider["address"],
        "lat": provider["lat"],
        "lng": provider["lng"],
        "distanceMiles": distance_miles,
        "etaMinutes": eta_minutes,
        "capabilities": provider.get("capabilities", []),
        "insuranceConfidence": insurance_confidence,
        "costEstimateMin": cost_min,
        "costEstimateMax": cost_max,
        "costConfidence": cost_confidence,
        "phone": provider.get("phone", ""),
        "website": provider.get("website", ""),
        "type": provider.get("type", ""),
        "hours": provider.get("hours", ""),
        "networkStatus": network_status,
        "estimatedCopay": estimated_copay,
        "logo": provider.get("logo"),
        "doctors": provider.get("doctors", [])
    }


@app.get("/")
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


@app.get("/providers")
def get_providers(
    provider: Optional[str] = Query(None, description="Insurance carrier (aetna, anthem, cigna, united, medicare, medicaid)"),
    type: Optional[str] = Query(None, description="Provider type (urgent_care, hospital_er, specialist, primary_care, dentist, physical_therapist)"),
    lat: Optional[float] = Query(None, description="User latitude for distance calculation"),
    lng: Optional[float] = Query(None, description="User longitude for distance calculation"),
    in_network_only: bool = Query(False, description="Only return in-network providers")
):
    """
    Get healthcare providers with insurance matching.

    Query params:
        provider: Insurance carrier ID (e.g., 'anthem', 'aetna')
        type: Filter by provider type
        lat/lng: User location for distance calculation
        in_network_only: If true, only return in-network providers

    Returns:
        List of Hospital objects matching frontend schema
    """
    if provider:
        provider = provider.strip().lower()

    providers_file = Path(__file__).parent / "data" / "providers.json"

    with open(providers_file, "r") as f:
        raw_providers = json.load(f)

    # Filter by type if specified
    if type:
        raw_providers = [p for p in raw_providers if p.get("type") == type]

    # Transform to frontend format
    providers = [
        transform_provider(p, provider, lat, lng)
        for p in raw_providers
    ]

    # Filter to in-network only if requested
    if in_network_only and provider:
        providers = [p for p in providers if p["insuranceConfidence"] == "verified"]

    # Sort by distance if location provided, otherwise by name
    if lat is not None and lng is not None:
        providers.sort(key=lambda p: p["distanceMiles"] or float('inf'))
    else:
        providers.sort(key=lambda p: p["name"])

    return providers


@app.get("/providers/{provider_id}")
def get_provider(
    provider_id: str,
    insurance: Optional[str] = Query(None, description="Insurance carrier for cost calculation"),
    lat: Optional[float] = Query(None, description="User latitude"),
    lng: Optional[float] = Query(None, description="User longitude")
):
    """
    Get a single provider by ID.

    Args:
        provider_id: The provider's unique ID
        insurance: Optional insurance carrier for cost calculation
        lat/lng: Optional user location for distance

    Returns:
        Hospital object

    Raises:
        404: Provider not found
    """
    if insurance:
        insurance = insurance.strip().lower()

    providers_file = Path(__file__).parent / "data" / "providers.json"

    with open(providers_file, "r") as f:
        providers = json.load(f)

    # Find provider by ID
    raw_provider = next((p for p in providers if str(p["id"]) == provider_id), None)

    if not raw_provider:
        raise HTTPException(status_code=404, detail=f"Provider '{provider_id}' not found")

    return transform_provider(raw_provider, insurance, lat, lng)


# --- Calendar & Appointment Integration ---

from pydantic import BaseModel

class Appointment(BaseModel):
    id: str
    hospitalId: str
    hospitalName: str
    date: str  # ISO string YYYY-MM-DDTHH:MM:SS
    status: str = "confirmed"
    notes: Optional[str] = None
    transcript: Optional[str] = None
    audioUrl: Optional[str] = None


def get_appointments_file() -> Path:
    return Path(__file__).parent / "data" / "appointments.json"


def load_appointments() -> list:
    file_path = get_appointments_file()
    if not file_path.exists():
        return []
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []


def save_appointments(appointments: list):
    file_path = get_appointments_file()
    with open(file_path, "w") as f:
        json.dump(appointments, f, indent=2)


@app.get("/appointments")
def get_appointments():
    """Get all saved appointments."""
    return load_appointments()


@app.post("/appointments")
def create_appointment(appointment: Appointment):
    """Manually create an appointment (or from frontend)."""
    appointments = load_appointments()
    # Check if exists
    if any(a["id"] == appointment.id for a in appointments):
        raise HTTPException(status_code=400, detail="Appointment ID already exists")
    
    appointments.append(appointment.dict())
    save_appointments(appointments)
    return appointment


@app.post("/webhook/elevenlabs")
async def elevenlabs_webhook(request: dict):
    """
    Webhook to receive call analysis from ElevenLabs.
    We expect the agent to send analysis data here after the call.
    """
    # Note: Structure depends on how the ElevenLabs agent is configured to send data.
    # This is a generic handler that attempts to extract relevant info.
    print(f"Received webhook data: {json.dumps(request, indent=2)}")
    
    # Example extraction - adapt based on actual payload
    # For now, we'll just save the raw payload to inspection, and try to create an appointment if data looks right
    
    try:
        # Check if this is a "success" call
        analysis = request.get("analysis", {})
        transcript = request.get("transcript", "")
        
        # In a real scenario, you'd parse the date/time from the analysis or transcript
        # For this prototype, we might just assume it's "confirmed" 
        
        # Try to extract hospital ID/Name if passed in custom variables
        conversation_initiation_metadata = request.get("conversation_initiation_metadata", {})
        custom_vars = conversation_initiation_metadata.get("dynamic_variables", {})
        
        hospital_name = custom_vars.get("hospital_name", "Unknown Hospital")
        
        # Create a new appointment entry
        import uuid
        from datetime import datetime, timedelta
        
        # Fake a time for the prototype if not found (e.g., tomorrow at 10am)
        tomorrow = datetime.now() + timedelta(days=1)
        appointment_date = tomorrow.replace(hour=10, minute=0, second=0).isoformat()
        
        new_appt = {
            "id": str(uuid.uuid4()),
            "hospitalId": "unknown", # We'd need to pass this through
            "hospitalName": hospital_name,
            "date": appointment_date,
            "status": "confirmed",
            "notes": "Booked via ElevenLabs Agent",
            "transcript": str(transcript)[:500] if transcript else None,
            "audioUrl": request.get("recording_url")
        }
        
        appointments = load_appointments()
        appointments.append(new_appt)
        save_appointments(appointments)
        
        return {"status": "processed", "appointmentId": new_appt["id"]}
        
    except Exception as e:
        print(f"Error processing webhook: {e}")
        return {"status": "error", "detail": str(e)}
