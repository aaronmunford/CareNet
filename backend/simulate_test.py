import requests
import json
import uuid
from datetime import datetime, timedelta

def simulate_elevenlabs_webhook():
    url = "http://localhost:8000/webhook/elevenlabs"
    
    # Payload simulating what ElevenLabs might send
    # This structure is based on the logic we implemented in main.py
    payload = {
        "analysis": {
            "evaluation_criteria_results": {},
            "transcript_summary": "The patient scheduled an appointment."
        },
        "transcript": "Agent: Hello. User: Hi, I'd like to book an appointment. Agent: Sure, how about tomorrow at 10am? User: That works. Agent: Great, confirmed.",
        "conversation_initiation_metadata": {
            "dynamic_variables": {
                "hospital_name": "Mount Sinai Hospital",
                "hospital_phone": "555-0123"
            }
        },
        "recording_url": "https://api.elevenlabs.io/v1/history/123/audio"
    }

    try:
        print(f"Sending webhook request to {url}...")
        response = requests.post(url, json=payload)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Webhook simulation successful!")
            return True
        else:
            print("\n❌ Webhook simulation failed.")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"\n❌ Could not connect to {url}. Is the backend server running?")
        print("Run: uvicorn main:app --reload --port 8000")
        return False

if __name__ == "__main__":
    simulate_elevenlabs_webhook()
