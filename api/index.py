from fastapi import FastAPI
import sys
import os

# Add the project root to sys.path so we can import backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app

# Vercel needs a variable named 'app' to be the entry point
# We import the existing app from backend.main
