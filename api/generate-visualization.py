"""
Vercel Python Serverless Function — AI Visualization Generator
Uses LangGraph + LangChain to call OpenRouter (Gemini 2.5 Flash by default)
"""

import json
import os
import re
from http.server import BaseHTTPRequestHandler
from typing import Optional

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage, BaseMessage
from langgraph.graph import StateGraph, START, END
from typing_extensions import TypedDict


# ── Config ───────────────────────────────────────────────────────────

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "16000"))

SYSTEM_PROMPT = """You are an expert algorithm visualization generator. When given a description of an algorithm or data structure concept, generate a complete, self-contained HTML file that creates an interactive visualization.

Requirements:
- Single HTML file with all CSS and JS inline
- Dark theme matching: background #0f172a, text #e2e8f0, accents blue-500 (#3b82f6) and green-500 (#22c55e)
- Include play/pause/step animation controls
- Show the algorithm's code with current line highlighted
- Include step-by-step explanation text
- Use smooth CSS animations/transitions
- Must be mobile-responsive
- Include a title and complexity information
- Clean, modern design with rounded corners and subtle shadows

Return ONLY the HTML content, no markdown fences, no explanation."""


# ── LangGraph Pipeline ───────────────────────────────────────────────

class GraphState(TypedDict):
    prompt: str
    messages: list[BaseMessage]
    html: str
    error: Optional[str]


def build_messages(state: GraphState) -> dict:
    """Build system + user messages from the prompt."""
    return {
        "messages": [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=state["prompt"]),
        ]
    }


def call_llm(state: GraphState) -> dict:
    """Call OpenRouter via LangChain's ChatOpenAI."""
    llm = ChatOpenAI(
        model=OPENROUTER_MODEL,
        openai_api_key=OPENROUTER_API_KEY,
        openai_api_base="https://openrouter.ai/api/v1",
        max_tokens=MAX_TOKENS,
        default_headers={
            "HTTP-Referer": "https://algorhythm.vercel.app",
            "X-Title": "Algorhythm Visualizer",
        },
    )
    try:
        response = llm.invoke(state["messages"])
        html = strip_markdown_fences(response.content)
        return {"html": html}
    except Exception as e:
        return {"error": str(e)}


def strip_markdown_fences(text: str) -> str:
    """Remove accidental markdown code fences from LLM output."""
    text = text.strip()
    text = re.sub(r"^```(?:html)?\s*\n?", "", text)
    text = re.sub(r"\n?```\s*$", "", text)
    return text.strip()


def build_graph():
    """Build the 2-node LangGraph pipeline."""
    graph = StateGraph(GraphState)
    graph.add_node("build_messages", build_messages)
    graph.add_node("call_llm", call_llm)
    graph.add_edge(START, "build_messages")
    graph.add_edge("build_messages", "call_llm")
    graph.add_edge("call_llm", END)
    return graph.compile()


visualization_graph = build_graph()


# ── Vercel Handler ───────────────────────────────────────────────────

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_POST(self):
        try:
            # Read request body
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}

            prompt = data.get("prompt", "").strip()
            if not prompt:
                self._send_json(400, {"error": "Missing prompt"})
                return

            if not OPENROUTER_API_KEY:
                self._send_json(500, {"error": "OpenRouter not configured"})
                return

            # Run LangGraph pipeline
            result = visualization_graph.invoke({
                "prompt": prompt,
                "messages": [],
                "html": "",
                "error": None,
            })

            if result.get("error"):
                self._send_json(502, {"error": "AI generation failed"})
                return

            if not result.get("html"):
                self._send_json(502, {"error": "Empty response from AI"})
                return

            self._send_json(200, {"html": result["html"]})

        except json.JSONDecodeError:
            self._send_json(400, {"error": "Invalid JSON"})
        except Exception as e:
            print(f"Function error: {e}")
            self._send_json(500, {"error": "Internal error"})

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
