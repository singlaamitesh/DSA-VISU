"""
Algorhythm FastAPI server for DigitalOcean deployment.
Reuses the LangGraph pipeline from generate_visualization.py.
"""

import os
import urllib.request
import urllib.error
import json
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

# Import the graph from the serverless module
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from importlib import import_module

gv = import_module("generate-visualization")
visualization_graph = gv.visualization_graph

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
POCKETBASE_URL = os.environ.get("POCKETBASE_URL", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


def verify_pocketbase_token(token: str) -> Optional[dict]:
    if not POCKETBASE_URL:
        return {"id": "anonymous"}
    if not token:
        return None
    try:
        req = urllib.request.Request(
            f"{POCKETBASE_URL.rstrip('/')}/api/collections/users/auth-refresh",
            method="POST",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status == 200:
                data = json.loads(resp.read())
                return data.get("record")
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None
    return None


app = FastAPI(title="Algorhythm API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class GenerateRequest(BaseModel):
    prompt: str
    language: str = "javascript"

    @field_validator("prompt")
    @classmethod
    def non_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Prompt cannot be empty")
        if len(v) > 2000:
            raise ValueError("Prompt too long (max 2000 chars)")
        return v


@app.get("/api/health")
async def health():
    return {"status": "ok", "model": OPENROUTER_MODEL}


@app.post("/api/generate-visualization")
async def generate(body: GenerateRequest, request: Request):
    auth_header = request.headers.get("authorization", "")
    token = auth_header[7:] if auth_header.startswith("Bearer ") else ""
    user = verify_pocketbase_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Authentication required")

    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter not configured")

    result = visualization_graph.invoke({
        "prompt": body.prompt,
        "language": body.language,
        "messages": [],
        "html": "",
        "error": None,
    })

    if result.get("error"):
        raise HTTPException(status_code=502, detail="AI generation failed")
    if not result.get("html"):
        raise HTTPException(status_code=502, detail="Empty response from AI")

    return {"html": result["html"]}
