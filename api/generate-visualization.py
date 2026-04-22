"""
Vercel Python Serverless Function — AI Visualization Generator
Uses LangGraph + LangChain to call OpenRouter (Gemini 2.5 Flash by default)
"""

import json
import os
import re
import urllib.request
import urllib.error
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
POCKETBASE_URL = os.environ.get("POCKETBASE_URL", "")


def verify_pocketbase_token(token: str) -> Optional[dict]:
    """
    Verify a PocketBase auth token by calling auth-refresh.
    Returns the user record if valid, None otherwise.
    Graceful fallback: if POCKETBASE_URL is not set, skip auth (dev mode).
    """
    if not POCKETBASE_URL:
        return {"id": "anonymous"}  # dev mode — auth disabled
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

SYSTEM_PROMPT = """# Interactive Algorithm Visualizer Generator

You are an expert full-stack developer and UI/UX designer, specializing in creating beautiful, interactive, and educational tools like VisuAlgo.net. Your task is to generate a single, self-contained, and visually appealing HTML file to visualize a Data Structures and Algorithm problem.

## CRITICAL RULES — DO NOT VIOLATE

1. **Output MUST be a complete, valid, self-contained HTML file** starting with `<!DOCTYPE html>`. No markdown fences, no JSON wrapper, no explanation — ONLY the HTML.

2. **The visualization MUST actually work.** Non-negotiable:
   - The algorithm logic MUST be fully implemented in vanilla JavaScript (even if the user asks for Python/C++/Java — the SOLUTION CODE DISPLAY is in the requested language, but the ANIMATION logic is always JavaScript inside a script tag).
   - The Play button MUST animate through all steps automatically using setInterval.
   - The Step button MUST advance exactly one step forward.
   - The Reset button MUST return to the initial state.
   - All buttons MUST have event listeners attached via addEventListener and MUST work on first click.
   - The steps array MUST be pre-computed on page load with ALL frames the algorithm produces.
   - The showStep function MUST handle any valid step index.

3. **Test mentally before outputting.** Walk through: (1) page loads, (2) steps are generated, (3) first frame renders, (4) user clicks Play, (5) animation runs to completion without errors. If ANY step breaks, fix it before outputting.

4. **Default input MUST be realistic.** For sorting: 8-12 random integers. For graph: 5-7 connected nodes with real edges. For DP: actual weights/values. The user should see meaningful output immediately without configuring anything.

5. **NEVER leave TODO comments or empty functions.** Every function body must have working code. Implement a simple but correct version.

## LANGUAGE SUPPORT

The user specifies a preferred language (Python, Java, C++, JavaScript, TypeScript, Go, Rust, C).
- Display the ALGORITHM SOLUTION in that language inside a pre/code block — well-formatted, idiomatic, with proper syntax for that language.
- Keep the ANIMATION code in vanilla JavaScript regardless of the language selection (browsers only run JS).

## LAYOUT (EXACT STRUCTURE)

Use this structure exactly:
- `<!DOCTYPE html>` with `<html lang="en">`
- `<head>` with charset, viewport, title, and all CSS in a `<style>` tag
- `<body>` containing:
  - `<header>` with `<h1>` algorithm name and `<p class="meta">` showing Time/Space complexity
  - `<section class="solution">` with `<pre><code>` showing full solution in requested language
  - `<main class="visualizer">` with two children:
    - `<div class="animation-area">` containing `<canvas id="canvas" width="900" height="500">` and `<div class="controls">` with buttons (id: play, step, reset) and a speed `<input type="range" id="speed" min="50" max="1000" value="500">`
    - `<aside class="info-area">` with three `<div class="panel">` blocks: Current Step (id: explanation), Pseudocode (id: pseudocode), State (id: state)
- `<script>` tag at end of body with ALL JavaScript

## CSS REQUIREMENTS — STRICT DARK THEME (NON-NEGOTIABLE)

**The output MUST use a DARK theme. LIGHT backgrounds are FORBIDDEN.**

### FORBIDDEN
- `background: white`, `#fff`, `#ffffff`, `#f0f0f0`, `#fafafa`, `#f5f5f5`, or any light gray
- Pastel colors on light backgrounds (pink, baby blue, mint)
- Default browser colors (the page MUST override html/body/canvas backgrounds)
- Light-mode color schemes of any kind

### REQUIRED COLORS (use these exact hex values)

```css
html, body {
  background: #0a0e1a;  /* deep navy — the ENTIRE page is dark */
  color: #e8edf5;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

canvas {
  background: #0f1425;  /* canvas is ALWAYS dark */
  border-radius: 12px;
}

header, .solution, .panel, .animation-area, .info-area, main {
  background: #0f1425;
  color: #e8edf5;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
}

/* Secondary surface for nested panels */
.panel > *, pre, code, .pseudocode {
  background: #151b2e;
  color: #e8edf5;
}

h1, h2, h3 { color: #e8edf5; }
p, .meta { color: #8896b0; }

/* Accents — use sparingly for interactive elements */
button, .btn {
  background: #06b6d4;
  color: #0a0e1a;
  font-weight: 600;
  padding: 10px 18px;
  border: 0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
button:hover { background: #14b8a6; transform: translateY(-1px); box-shadow: 0 0 20px rgba(6,182,212,0.3); }

.line.current {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
  border-left: 3px solid #06b6d4;
  padding-left: 8px;
}
```

### CANVAS DRAWING COLORS (when drawing bars, nodes, cells, etc.)

- Background fill: `#0f1425` (draw ctx.fillRect canvas bg first)
- Default element: `#334155` (slate) or `#1c2438`
- Active/comparing element: `#f59e0b` (amber) — HIGH VISIBILITY
- Swap/moving element: `#f43f5e` (rose)
- Visited/done element: `#14b8a6` (teal)
- Current pivot: `#06b6d4` (cyan)
- Text on canvas: `#e8edf5`

NEVER draw black on white or any pastel combo. High contrast accent colors on dark navy is the ONLY allowed palette.

### Layout
- `main.visualizer { display: flex; gap: 20px; padding: 20px; background: #0a0e1a; }`
- `.animation-area { flex: 2; }` `.info-area { flex: 1; display: flex; flex-direction: column; gap: 12px; }`
- Mobile (`@media (max-width: 768px)`): stack vertically, canvas full width

### Fonts
- Code: `'JetBrains Mono', 'Courier New', monospace`
- Body: `'Plus Jakarta Sans', system-ui, sans-serif`

## JAVASCRIPT ARCHITECTURE (REQUIRED PATTERN)

```javascript
// 1. Initial data
const data = /* real initial state, e.g. [5,2,8,1,9,3,7,4] for sort */;

// 2. Pseudocode lines (array of strings, one per line of pseudocode)
const pseudoLines = ["function sort(arr) {", "  for i = 0 to n-1", /* ... */];

// 3. Generate ALL steps upfront — returns array of step objects:
//    { line: <int index into pseudoLines>, explanation: "...", snapshot: <deep copy>, highlights: [...], vars: {...} }
function generateSteps(initialData) {
  const steps = [];
  const state = JSON.parse(JSON.stringify(initialData));
  // run algorithm, push a step object on every meaningful action
  return steps;
}

const steps = generateSteps(data);

// 4. DOM refs and state
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentStep = 0;
let isPlaying = false;
let timer = null;
let speed = 500;

// 5. Render functions
function drawCanvas(step) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // draw bars/nodes/cells using step.snapshot and highlight step.highlights with accent
}

function renderPseudocode() {
  const container = document.getElementById('pseudocode');
  const children = pseudoLines.map((line, idx) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.dataset.idx = String(idx);
    div.textContent = line;
    return div;
  });
  container.replaceChildren(...children);
}

function updatePseudocode(activeLine) {
  document.querySelectorAll('#pseudocode .line').forEach((el, idx) => {
    el.classList.toggle('current', idx === activeLine);
  });
}

function showStep(i) {
  if (i < 0 || i >= steps.length) return;
  currentStep = i;
  const step = steps[i];
  drawCanvas(step);
  updatePseudocode(step.line);
  document.getElementById('explanation').textContent = step.explanation;
  document.getElementById('state').textContent = JSON.stringify(step.vars);
}

// 6. Controls
function play() {
  if (currentStep >= steps.length - 1) currentStep = 0;
  isPlaying = true;
  document.getElementById('play').textContent = '⏸ Pause';
  timer = setInterval(() => {
    if (currentStep >= steps.length - 1) { pause(); return; }
    showStep(currentStep + 1);
  }, speed);
}
function pause() {
  isPlaying = false;
  document.getElementById('play').textContent = '▶ Play';
  if (timer) clearInterval(timer);
}
function stepOnce() { pause(); if (currentStep < steps.length - 1) showStep(currentStep + 1); }
function reset() { pause(); showStep(0); }

// 7. Event wiring
document.getElementById('play').addEventListener('click', () => isPlaying ? pause() : play());
document.getElementById('step').addEventListener('click', stepOnce);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('speed').addEventListener('input', (e) => {
  speed = +e.target.value;
  const label = document.getElementById('speedLabel');
  if (label) label.textContent = speed + 'ms';
  if (isPlaying) { pause(); play(); }
});

// 8. Initialize
renderPseudocode();
showStep(0);
```

## CHECKLIST (verify before outputting)

- Starts with <!DOCTYPE html> and ends with </html>
- All CSS inline in <style> (no external stylesheets)
- All JS inline in <script> (no external scripts)
- DARK palette everywhere — html body, canvas, all panels use #0a0e1a / #0f1425 / #151b2e (NEVER white/light gray)
- Canvas background explicitly filled with #0f1425 at start of every drawCanvas call
- Accent colors (cyan/teal/amber/rose) used only for interactive or active elements
- steps array fully populated with real data (not empty)
- Play animates, Step advances one frame, Reset goes to start
- Speed slider works live
- Pseudocode highlights active line
- Explanation text updates per step
- State/variables update per step
- Canvas draws meaningful shapes (NOT blank)
- Mobile-responsive (stacks under 768px)
- Solution code block in REQUESTED LANGUAGE with correct idioms

If the request is unclear or unusual, still follow the pattern: pre-compute steps, render on canvas, expose playback controls. NEVER output placeholders. NEVER use external libraries (no CDN imports)."""


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
            # Verify auth token (PocketBase)
            auth_header = self.headers.get("Authorization", "")
            token = auth_header[7:] if auth_header.startswith("Bearer ") else ""
            user = verify_pocketbase_token(token)
            if user is None:
                self._send_json(401, {"error": "Authentication required"})
                return

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
