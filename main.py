from __future__ import annotations

import http.server
import os
import socketserver
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8766


def main() -> None:
    root = Path(__file__).resolve().parent / "prototype"
    if not root.is_dir():
        raise SystemExit(f"Prototype directory not found: {root}")

    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({".md": "text/plain; charset=utf-8"})

    with socketserver.TCPServer((HOST, PORT), handler) as httpd:
        httpd.allow_reuse_address = True
        os.chdir(root)
        url = f"http://{HOST}:{PORT}/index.html"
        print(f"Serving 外卖 prototype at http://{HOST}:{PORT}/")
        print("App:    /index.html")
        print("Press Ctrl+C to stop.")
        webbrowser.open(url)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
