#!/bin/bash
# Backend startup script
cd backend
. venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
