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

2. **The visualization MUST actually work end-to-end.** These are the MOST COMMON FAILURES — avoid them:

   ❌ **FAILURE: Blank canvas.** Every step MUST render visible shapes on the canvas. Fill the background with #0f1425, then draw bars / cells / nodes / characters based on `step.snapshot`. NEVER leave `drawCanvas` as a stub.

   ❌ **FAILURE: Empty pseudocode.** The `pseudoLines` array MUST contain 5-12 lines describing the algorithm in plain English or pseudocode. `renderPseudocode()` MUST be called on load to populate the panel.

   ❌ **FAILURE: Empty variables panel.** Every step's `vars` object MUST have at least 2 meaningful keys (like `i`, `j`, `result`, `low`, `high`, `current`) with current values. Empty `{}` is NEVER acceptable.

   ❌ **FAILURE: Generic "Algorithm started" as only step.** The `steps` array MUST contain 10+ step objects reflecting actual algorithm execution. Each step has a DIFFERENT `line`, `explanation`, `snapshot`, `highlights`, and `vars`.

   ❌ **FAILURE: Placeholder comments.** `// TODO`, `// implement here`, `/* ... */` are ALL forbidden. Write real code.

   ❌ **FAILURE: Broken buttons.** All 4 controls (Play / Step / Reset / Speed) MUST work on first click via `addEventListener`.

3. **Test mentally before outputting.** Walk through: (1) page loads, (2) `generateSteps()` returns a populated array, (3) `renderPseudocode()` fills the panel, (4) `showStep(0)` draws the first frame (NOT blank), (5) Play animates through all frames, (6) `vars` panel updates with real numbers. If ANY step would produce blank output, FIX IT BEFORE OUTPUTTING.

4. **Default input MUST be realistic.** For sort: 8-12 random integers. For search: 10+ sorted integers. For string algorithms: a representative test string like `"  -42abc"` for atoi, `"racecar"` for palindrome. For graph: 5-7 nodes with labeled coordinates and edges array. For DP: actual weights/values with 3-5 items. The user sees meaningful output IMMEDIATELY.

5. **Solution code block is SEPARATE from animation code.** The `<pre><code>` block in `<section class="solution">` shows the algorithm in the REQUESTED LANGUAGE (Python, Java, C++, etc.). The `<script>` at bottom of body is ALWAYS vanilla JavaScript. Do not mix them up.

6. **If the requested algorithm is abstract (like atoi, regex, recursion) — still visualize it visually.** Use character cells with pointer arrows, grid of states, tree of calls. Every algorithm can be visualized — be creative but concrete. If truly stuck, substitute the CLOSEST well-known algorithm (e.g. "atoi" → show characters being parsed one by one with a pointer arrow and a running result value).

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

## ALGORITHM CATEGORY DETECTION — PICK A DRAWING STYLE

Detect what kind of algorithm the user asked for, then pick the matching visualization style:

| Category | Examples | Draw Style |
|----------|----------|------------|
| **Array/Sort** | bubble, merge, quick, insertion | Bars — height = value, width = canvas.width / n |
| **Array/Search** | linear, binary | Cells — rectangles with value text inside, highlight active |
| **String parsing** | atoi, palindrome, regex, KMP | Character cells — boxes with each char, pointer arrows |
| **Graph** | BFS, DFS, Dijkstra, MST | Nodes + edges — circles with labels, lines between them |
| **Tree** | BST insert, AVL, heap, traversal | Nodes as circles connected by lines in hierarchical layout |
| **Linked List** | reverse, cycle, merge | Rectangles connected by arrows |
| **DP** | fibonacci, knapsack, LCS | Grid — colored cells in a 2D grid |
| **Stack/Queue** | parentheses, expression eval | Vertical or horizontal rectangles stacking |

**If you cannot classify — default to Array/Sort with an 8-element random array.**

## REQUIRED STEP OBJECT SHAPE

Every step MUST have ALL of these fields — no exceptions:

```javascript
{
  line: 3,                                    // index into pseudoLines (required, number)
  explanation: "Comparing arr[0]=5 with arr[1]=2",  // (required, non-empty string)
  snapshot: [5, 2, 8, 1, 9, 3, 7, 4],          // (required, deep copy of current state)
  highlights: [0, 1],                          // (required, array of indices to highlight in accent color)
  vars: { i: 0, j: 1, swapped: false }        // (required, non-empty object)
}
```

`vars` MUST be non-empty. `explanation` MUST describe what's happening in plain English.

## CONCRETE COMPLETE EXAMPLE — BUBBLE SORT (reference implementation)

This is a FULLY WORKING example. Follow this exact structure, adapting the algorithm logic for the requested problem. The `drawCanvas` function MUST draw meaningful shapes — NEVER leave it empty.

```javascript
// 1. Initial data — ALWAYS provide real default input (never empty arrays)
const data = [5, 2, 8, 1, 9, 3, 7, 4];

// 2. Pseudocode — MUST be populated, each line is one step of the algorithm
const pseudoLines = [
  "function bubbleSort(arr):",
  "  n = len(arr)",
  "  for i from 0 to n-1:",
  "    for j from 0 to n-i-2:",
  "      if arr[j] > arr[j+1]:",
  "        swap(arr[j], arr[j+1])",
  "  return arr"
];

// 3. Generate ALL steps by running the algorithm
function generateSteps(initialData) {
  const steps = [];
  const arr = [...initialData];
  const n = arr.length;

  steps.push({
    line: 0,
    explanation: `Starting bubble sort on array of ${n} elements.`,
    snapshot: [...arr],
    highlights: [],
    vars: { n: n, i: null, j: null }
  });

  for (let i = 0; i < n - 1; i++) {
    steps.push({
      line: 2,
      explanation: `Outer loop iteration i=${i}. Will bubble largest to position ${n - 1 - i}.`,
      snapshot: [...arr],
      highlights: [],
      vars: { n, i, j: null }
    });

    for (let j = 0; j < n - i - 1; j++) {
      steps.push({
        line: 4,
        explanation: `Compare arr[${j}]=${arr[j]} with arr[${j + 1}]=${arr[j + 1]}.`,
        snapshot: [...arr],
        highlights: [j, j + 1],
        vars: { n, i, j, left: arr[j], right: arr[j + 1] }
      });

      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
        steps.push({
          line: 5,
          explanation: `Swap! arr[${j}] and arr[${j + 1}] were out of order.`,
          snapshot: [...arr],
          highlights: [j, j + 1],
          vars: { n, i, j, swapped: true }
        });
      }
    }
  }

  steps.push({
    line: 6,
    explanation: `Sorted! Final result: [${arr.join(', ')}]`,
    snapshot: [...arr],
    highlights: arr.map((_, idx) => idx),
    vars: { n, result: arr }
  });

  return steps;
}

const steps = generateSteps(data);

// 4. DOM refs + state
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let currentStep = 0;
let isPlaying = false;
let timer = null;
let speed = 500;

// 5. Draw canvas — CATEGORY: Array/Sort (bars)
function drawCanvas(step) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0f1425';
  ctx.fillRect(0, 0, W, H);

  const arr = step.snapshot;
  const maxVal = Math.max(...arr, 1);
  const barGap = 4;
  const totalGaps = (arr.length - 1) * barGap;
  const barW = (W - 40 - totalGaps) / arr.length;
  const maxBarH = H - 80;

  arr.forEach((val, idx) => {
    const x = 20 + idx * (barW + barGap);
    const h = (val / maxVal) * maxBarH;
    const y = H - 40 - h;

    // Bar color based on state
    let color = '#334155';
    if (step.highlights.includes(idx)) {
      if (step.explanation.toLowerCase().includes('swap')) color = '#f43f5e';
      else if (step.explanation.toLowerCase().includes('sorted')) color = '#14b8a6';
      else color = '#f59e0b';
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, y, barW, h);

    // Value label
    ctx.fillStyle = '#e8edf5';
    ctx.font = '13px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(val), x + barW / 2, y - 8);

    // Index label
    ctx.fillStyle = '#556480';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText(String(idx), x + barW / 2, H - 20);
  });
}

// 6. Render pseudocode (populates the list on page load)
function renderPseudocode() {
  const container = document.getElementById('pseudocode');
  const children = pseudoLines.map((line, idx) => {
    const div = document.createElement('div');
    div.className = 'line';
    div.dataset.idx = String(idx);
    div.textContent = `${idx + 1}. ${line}`;
    return div;
  });
  container.replaceChildren(...children);
}

function updatePseudocode(activeLine) {
  document.querySelectorAll('#pseudocode .line').forEach((el, idx) => {
    el.classList.toggle('current', idx === activeLine);
  });
}

// 7. Show a step (updates everything in sync)
function showStep(i) {
  if (i < 0 || i >= steps.length) return;
  currentStep = i;
  const step = steps[i];
  drawCanvas(step);
  updatePseudocode(step.line);
  document.getElementById('explanation').textContent = step.explanation;
  document.getElementById('state').textContent = JSON.stringify(step.vars, null, 2);
  const stepLabel = document.getElementById('stepLabel');
  if (stepLabel) stepLabel.textContent = `Step ${i + 1} / ${steps.length}`;
}

// 8. Playback
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
  if (timer) { clearInterval(timer); timer = null; }
}
function stepOnce() { pause(); if (currentStep < steps.length - 1) showStep(currentStep + 1); }
function reset() { pause(); showStep(0); }

// 9. Wire events
document.getElementById('play').addEventListener('click', () => isPlaying ? pause() : play());
document.getElementById('step').addEventListener('click', stepOnce);
document.getElementById('reset').addEventListener('click', reset);
document.getElementById('speed').addEventListener('input', (e) => {
  speed = +e.target.value;
  const label = document.getElementById('speedLabel');
  if (label) label.textContent = speed + 'ms';
  if (isPlaying) { pause(); play(); }
});

// 10. Initialize
renderPseudocode();
showStep(0);
```

## CATEGORY-SPECIFIC DRAW FUNCTIONS

Adapt `drawCanvas` to the algorithm category. Here are the patterns:

### String parsing (atoi, palindrome, etc.)
```javascript
function drawCanvas(step) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0f1425'; ctx.fillRect(0, 0, W, H);
  const chars = step.snapshot; // array of characters
  const cellW = Math.min(60, (W - 40) / chars.length);
  const cellH = 60;
  const startX = (W - chars.length * cellW) / 2;
  const y = H / 2 - cellH / 2;

  chars.forEach((ch, idx) => {
    const x = startX + idx * cellW;
    ctx.fillStyle = step.highlights.includes(idx) ? '#f59e0b' : '#1c2438';
    ctx.fillRect(x, y, cellW - 4, cellH);
    ctx.strokeStyle = '#334155'; ctx.strokeRect(x, y, cellW - 4, cellH);
    ctx.fillStyle = '#e8edf5'; ctx.font = '24px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(ch === ' ' ? '·' : ch, x + (cellW - 4) / 2, y + 38);
    ctx.fillStyle = '#556480'; ctx.font = '11px JetBrains Mono';
    ctx.fillText(String(idx), x + (cellW - 4) / 2, y + cellH + 18);
  });

  // Pointer arrow for current index
  if (step.vars.i !== undefined && step.vars.i !== null) {
    const px = startX + step.vars.i * cellW + (cellW - 4) / 2;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(px, y - 20); ctx.lineTo(px - 8, y - 4); ctx.lineTo(px + 8, y - 4); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#06b6d4'; ctx.font = '12px JetBrains Mono';
    ctx.fillText(`i=${step.vars.i}`, px, y - 26);
  }

  // Show result if available
  if (step.vars.result !== undefined) {
    ctx.fillStyle = '#14b8a6'; ctx.font = '20px JetBrains Mono'; ctx.textAlign = 'left';
    ctx.fillText(`result = ${step.vars.result}`, 20, 40);
  }
}
```

### Graph (BFS/DFS/Dijkstra)
```javascript
function drawCanvas(step) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0f1425'; ctx.fillRect(0, 0, W, H);
  const { nodes, edges, visited, current } = step.snapshot;
  // draw edges first
  edges.forEach(([from, to, weight]) => {
    const a = nodes[from], b = nodes[to];
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (weight !== undefined) {
      ctx.fillStyle = '#8896b0'; ctx.font = '12px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(weight, (a.x + b.x) / 2, (a.y + b.y) / 2 - 6);
    }
  });
  // draw nodes
  nodes.forEach((node, idx) => {
    let color = '#1c2438';
    if (visited && visited.includes(idx)) color = '#14b8a6';
    if (current === idx) color = '#f59e0b';
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(node.x, node.y, 22, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e8edf5'; ctx.font = 'bold 14px JetBrains Mono'; ctx.textAlign = 'center';
    ctx.fillText(node.label || String(idx), node.x, node.y + 5);
  });
}
```

### DP (grid)
```javascript
function drawCanvas(step) {
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#0f1425'; ctx.fillRect(0, 0, W, H);
  const grid = step.snapshot; // 2D array
  const rows = grid.length, cols = grid[0].length;
  const cellSize = Math.min((W - 60) / cols, (H - 60) / rows, 60);
  const startX = (W - cols * cellSize) / 2;
  const startY = (H - rows * cellSize) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const isHighlight = step.highlights.some(h => h[0] === r && h[1] === c);
      ctx.fillStyle = isHighlight ? '#f59e0b' : (grid[r][c] > 0 ? '#1c2438' : '#0f1425');
      ctx.fillRect(x, y, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = '#334155'; ctx.strokeRect(x, y, cellSize - 2, cellSize - 2);
      ctx.fillStyle = '#e8edf5'; ctx.font = '14px JetBrains Mono'; ctx.textAlign = 'center';
      ctx.fillText(String(grid[r][c]), x + cellSize / 2, y + cellSize / 2 + 5);
    }
  }
}
```

## FINAL SELF-VERIFICATION (run this check before outputting)

Mentally run the generated page. For EACH of these, answer yes/no:

1. Does the page start with `<!DOCTYPE html>` and end with `</html>`? → YES required
2. Is ALL CSS inside `<style>` and ALL JS inside `<script>` (no external refs)? → YES required
3. Is `html`, `body`, and `canvas` all set to dark navy (#0a0e1a or #0f1425)? → YES required
4. Does `drawCanvas` have real code that draws shapes (not just `ctx.clearRect`)? → YES required
5. Does `pseudoLines` array contain 5+ actual algorithm steps as strings? → YES required
6. Does `generateSteps()` push 10+ step objects? → YES required
7. Does every step have `line`, `explanation` (non-empty), `snapshot`, `highlights`, and `vars` (non-empty)? → YES required
8. Does `#explanation` update per step? `#state` shows real variable values? → YES required
9. Do the Play/Step/Reset buttons have `addEventListener` calls? → YES required
10. On first load (showStep(0)) does the canvas show visible shapes (not blank)? → YES required
11. Is the solution code block in the REQUESTED LANGUAGE with idiomatic syntax? → YES required

If ANY answer is NO, the output is INCORRECT. Fix it.

NEVER use external libraries (no CDN imports). NEVER output markdown fences. Return ONLY the raw HTML."""


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
