# Algorhythm

Interactive algorithm visualizer with 12 built-in DSA visualizations (sorting, searching, graph, DP) and AI-powered custom generation via OpenRouter.

**Stack:** React 18 + TypeScript + Vite + Tailwind • FastAPI + LangGraph (Python) • PocketBase (auth + SQLite DB)

## Local Development

Open three terminals.

### 1. PocketBase (auth + database)

```bash
bash deploy/dev-start.sh
```

First run: open http://127.0.0.1:8090/_/ to create an admin account, then:

```bash
bash deploy/init-pocketbase.sh http://127.0.0.1:8090 your@email.com YourPassword
```

### 2. Python backend

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and set OPENROUTER_API_KEY (get one at https://openrouter.ai/)

export $(grep -v '^#' .env | xargs)
python -m uvicorn api.server:app --reload --port 8000
```

### 3. Frontend

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Deployment (DigitalOcean)

See [deploy/README.md](deploy/README.md) for full droplet setup.

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_POCKETBASE_URL` | frontend | PocketBase URL |
| `POCKETBASE_URL` | backend | Server-side PocketBase URL (for token verification) |
| `OPENROUTER_API_KEY` | backend | OpenRouter API key |
| `OPENROUTER_MODEL` | backend | Model identifier (default: `google/gemini-2.5-flash`) |

## License

MIT
