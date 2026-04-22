"""
Algorhythm FastAPI server.
Self-contained: LangGraph + LangChain pipeline that calls OpenRouter to generate
interactive algorithm visualizations as HTML.

Deployment: runs on DigitalOcean droplet behind Nginx reverse proxy.
Auth: verifies PocketBase session tokens.
"""

import json
import os
import re
import urllib.error
import urllib.request
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from typing_extensions import TypedDict

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, START, END


# ── Config ───────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "16000"))
POCKETBASE_URL = os.environ.get("POCKETBASE_URL", "")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")


# ── Auth ─────────────────────────────────────────────────────────────

def verify_pocketbase_token(token: str) -> Optional[dict]:
    """
    Verify a PocketBase auth token via auth-refresh.
    Returns the user record on success, None on failure.
    Dev mode: if POCKETBASE_URL is unset, returns an anonymous user (skip auth).
    """
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


# ── System Prompt ────────────────────────────────────────────────────
# Loaded from a sibling file so the logic stays readable.

_PROMPT_PATH = os.path.join(os.path.dirname(__file__), "prompt.txt")
with open(_PROMPT_PATH, "r", encoding="utf-8") as _f:
    SYSTEM_PROMPT = _f.read()


# ── LangGraph Pipeline ───────────────────────────────────────────────

class GraphState(TypedDict):
    prompt: str
    language: str
    messages: list[BaseMessage]
    html: str
    error: Optional[str]


def build_messages(state: GraphState) -> dict:
    language = state.get("language", "javascript")
    user_message = (
        f"Create a single HTML file to visualize: **{state['prompt']}**\n"
        f"Solution should be in this language: {language}"
    )
    return {
        "messages": [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=user_message),
        ]
    }


def call_llm(state: GraphState) -> dict:
    llm = ChatOpenAI(
        model=OPENROUTER_MODEL,
        api_key=OPENROUTER_API_KEY,
        base_url="https://openrouter.ai/api/v1",
        max_tokens=MAX_TOKENS,
        default_headers={
            "HTTP-Referer": "https://algorhythm.app",
            "X-Title": "Algorhythm Visualizer",
        },
    )
    try:
        response = llm.invoke(state["messages"])
        html = extract_html(str(response.content))
        return {"html": html}
    except Exception as e:
        return {"error": str(e)}


def extract_html(text: str) -> str:
    """Extract HTML from LLM output — handles raw HTML, markdown fences, or JSON wrapper."""
    text = text.strip()

    # JSON wrapper: { "html_code": "..." }
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "html_code" in parsed:
            return parsed["html_code"].strip()
    except (json.JSONDecodeError, TypeError):
        pass

    # JSON inside markdown fences
    json_match = re.search(r"```(?:json)?\s*\n?(\{.*?\})\s*\n?```", text, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group(1))
            if isinstance(parsed, dict) and "html_code" in parsed:
                return parsed["html_code"].strip()
        except (json.JSONDecodeError, TypeError):
            pass

    # Strip html markdown fences
    text = re.sub(r"^```(?:html)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("build_messages", build_messages)
    graph.add_node("call_llm", call_llm)
    graph.add_edge(START, "build_messages")
    graph.add_edge("build_messages", "call_llm")
    graph.add_edge("call_llm", END)
    return graph.compile()


visualization_graph = build_graph()


# ── FastAPI App ──────────────────────────────────────────────────────

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
