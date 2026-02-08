from fastapi import FastAPI
from backend.main import app

# Vercel needs a variable named 'app' to be the entry point
# We import the existing app from backend.main
