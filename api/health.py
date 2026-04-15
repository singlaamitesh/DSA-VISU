"""Vercel Python Serverless Function — Health Check"""

import json
import os
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        model = os.environ.get("OPENROUTER_MODEL", "google/gemini-2.5-flash")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({
            "status": "ok",
            "model": model,
        }).encode())
