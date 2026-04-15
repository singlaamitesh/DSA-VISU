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

SYSTEM_PROMPT = """# Interactive Algorithm Visualizer Generator

You are an expert full-stack developer and UI/UX designer, specializing in creating beautiful, interactive, and educational tools like VisuAlgo.net. Your task is to generate a single, self-contained, and visually appealing HTML file to visualize a Data Structures and Algorithm problem.

## OUTPUT
Return ONLY the raw HTML code. No markdown fences, no explanation, no JSON wrapper — just the HTML starting with <!DOCTYPE html> or <html>.

## LAYOUT
```html
<body>
    <!-- Problem Statement -->
    <header>
        <h1>Problem Title</h1>
        <p>Problem description and examples</p>
    </header>

    <!-- Solution Code -->
    <section class="solution">
        <h2>Solution</h2>
        <pre><code>def solution(...):</code></pre>
    </section>

    <!-- Main Visualizer -->
    <main class="visualizer">
        <!-- Left: Animation (70%) -->
        <div class="animation-area">
            <canvas id="canvas" width="900" height="500"></canvas>
            <div class="controls">
                <button id="play">Play</button>
                <button id="step">Step</button>
                <button id="reset">Reset</button>
            </div>
        </div>

        <!-- Right: Info (30%) -->
        <div class="info-area">
            <div class="explanation">Step explanation here</div>
            <div class="pseudocode">
                <div class="line current">1. Start algorithm</div>
                <div class="line">2. Process data</div>
            </div>
            <div class="state">Variables: i=0, j=1</div>
        </div>
    </main>
</body>
```

## CSS - Simple & Responsive
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial; background: #1a1a2e; color: white; }

header { padding: 20px; text-align: center; }
.solution { padding: 20px; background: #16213e; }

.visualizer {
    display: flex;
    height: 70vh;
    gap: 20px;
    padding: 20px;
}

.animation-area { flex: 70%; }
.info-area {
    flex: 30%;
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.explanation {
    background: #21262d;
    padding: 15px;
    border-radius: 8px;
    min-height: 100px;
}

.pseudocode {
    background: #21262d;
    padding: 15px;
    border-radius: 8px;
    flex: 1;
    overflow-y: auto;
}

.line {
    padding: 5px;
    margin: 2px 0;
    border-radius: 4px;
}
.line.current { background: #fbbf24; color: black; }

.state {
    background: #21262d;
    padding: 15px;
    border-radius: 8px;
    height: 80px;
}

.controls {
    margin-top: 10px;
    text-align: center;
}
button {
    padding: 10px 20px;
    margin: 0 5px;
    background: #22d3ee;
    border: none;
    border-radius: 5px;
    cursor: pointer;
}

/* Mobile */
@media (max-width: 768px) {
    .visualizer { flex-direction: column; height: auto; }
    .animation-area { height: 400px; }
}
```

## JAVASCRIPT - Core Logic
```javascript
class Visualizer {
    constructor() {
        this.steps = [];
        this.currentStep = 0;
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // Generate all steps at once
    generateSteps(input) {
        // Create step objects: {line: 1, explanation: "...", data: [...]}
    }

    // Update everything together
    showStep(stepIndex) {
        const step = this.steps[stepIndex];

        // Update visualization
        this.drawCanvas(step.data);

        // Update pseudocode highlight
        document.querySelectorAll('.line').forEach((el, i) => {
            el.classList.toggle('current', i === step.line);
        });

        // Update explanation
        document.querySelector('.explanation').textContent = step.explanation;

        // Update variables
        document.querySelector('.state').textContent = step.variables;
    }

    // Canvas drawing
    drawCanvas(data) {
        this.ctx.clearRect(0, 0, 900, 500);
        // Draw array/tree/graph based on algorithm
    }
}

// Initialize
const viz = new Visualizer();
document.getElementById('play').onclick = () => viz.play();
document.getElementById('step').onclick = () => viz.step();
document.getElementById('reset').onclick = () => viz.reset();
```

## REQUIREMENTS
1. **Sync**: Visualization + pseudocode highlight + explanation update together
2. **Smooth**: 60fps canvas animations, no jerky movements
3. **Responsive**: Works on mobile (stacked layout)
4. **Clean**: No overlapping panels, proper spacing
5. **Simple**: Easy to understand and modify

Keep it simple and functional."""


# ── LangGraph Pipeline ───────────────────────────────────────────────

class GraphState(TypedDict):
    prompt: str
    language: str
    messages: list[BaseMessage]
    html: str
    error: Optional[str]


def build_messages(state: GraphState) -> dict:
    """Build system + user messages from the prompt."""
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
        html = extract_html(response.content)
        return {"html": html}
    except Exception as e:
        return {"error": str(e)}


def extract_html(text: str) -> str:
    """Extract HTML from LLM output — handles raw HTML, markdown fences, or JSON wrapper."""
    text = text.strip()

    # Try JSON wrapper: { "html_code": "<html>...</html>" }
    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict) and "html_code" in parsed:
            return parsed["html_code"].strip()
    except (json.JSONDecodeError, TypeError):
        pass

    # Try JSON inside markdown fences: ```json { "html_code": "..." } ```
    json_match = re.search(r"```(?:json)?\s*\n?(\{.*?\})\s*\n?```", text, re.DOTALL)
    if json_match:
        try:
            parsed = json.loads(json_match.group(1))
            if isinstance(parsed, dict) and "html_code" in parsed:
                return parsed["html_code"].strip()
        except (json.JSONDecodeError, TypeError):
            pass

    # Strip markdown html fences
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
            language = data.get("language", "javascript").strip()
            if not prompt:
                self._send_json(400, {"error": "Missing prompt"})
                return

            if not OPENROUTER_API_KEY:
                self._send_json(500, {"error": "OpenRouter not configured"})
                return

            # Run LangGraph pipeline
            result = visualization_graph.invoke({
                "prompt": prompt,
                "language": language,
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
