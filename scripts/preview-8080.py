#!/usr/bin/env python3
"""Serve luc-than dist on 0.0.0.0:8080. Local /assets/* first, then CDN."""
from __future__ import annotations

import http.server
import os
import socketserver
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
CDN = "https://luc-than.vercel.app"
HOST = "0.0.0.0"
PORT = 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(DIST), **kwargs)

    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        local = DIST / path.lstrip("/")
        if path.startswith("/assets/") and not local.is_file():
            try:
                req = urllib.request.Request(CDN + path, headers={"User-Agent": "luc-than-preview"})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    data = resp.read()
                    self.send_response(200)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "application/octet-stream"))
                    self.send_header("Cache-Control", "public, max-age=60")
                    self.send_header("Content-Length", str(len(data)))
                    self.end_headers()
                    self.wfile.write(data)
                    return
            except Exception:
                self.send_error(404, "asset missing")
                return
        if path in ("/", "") or path.endswith("/"):
            index = DIST / "index.html"
            if index.is_file():
                return http.server.SimpleHTTPRequestHandler.do_GET(self)
        return super().do_GET()


def main():
    os.chdir(DIST)
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer((HOST, PORT), Handler) as httpd:
        print(f"luc-than preview on http://{HOST}:{PORT}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
