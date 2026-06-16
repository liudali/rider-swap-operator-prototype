from __future__ import annotations

import errno
import http.server
import os
import socket
import socketserver
import subprocess
import urllib.error
import urllib.request
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8766


def sync_docs_to_viewer(app_root: Path) -> None:
    """把 docs/*.md 复制到文档浏览器旁的 md/ 目录，避免 fetch 404。"""
    import shutil

    src = app_root / "docs"
    dst = app_root / "prototype" / "docs" / "md"
    if not src.is_dir():
        return
    dst.mkdir(parents=True, exist_ok=True)
    for md in src.glob("*.md"):
        shutil.copy2(md, dst / md.name)


def main() -> None:
    app_root = Path(__file__).resolve().parent
    proto_root = app_root / "prototype"
    if not proto_root.is_dir():
        raise SystemExit(f"Prototype directory not found: {proto_root}")

    sync_docs_to_viewer(app_root)

    class DevHandler(http.server.SimpleHTTPRequestHandler):
        extensions_map = {
            **http.server.SimpleHTTPRequestHandler.extensions_map,
            ".md": "text/plain; charset=utf-8",
        }

        def end_headers(self) -> None:
            # 原型开发：避免浏览器 304 缓存导致看不到最新改动
            if self.path.endswith((".html", ".js", ".css", ".md")):
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
                self.send_header("Pragma", "no-cache")
            super().end_headers()

    handler = DevHandler

    def port_in_use() -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind((HOST, PORT))
            except OSError as e:
                if e.errno in (errno.EADDRINUSE, 48, 98):
                    return True
                raise
            return False

    def port_owner_pid() -> str | None:
        try:
            out = subprocess.check_output(
                ["lsof", "-ti", f":{PORT}"],
                stderr=subprocess.DEVNULL,
                text=True,
            ).strip()
        except (subprocess.CalledProcessError, FileNotFoundError):
            return None
        return out.splitlines()[0] if out else None

    def existing_server_url() -> str | None:
        for path in ("/prototype/index.html", "/index.html"):
            url = f"http://{HOST}:{PORT}{path}"
            try:
                with urllib.request.urlopen(url, timeout=1) as resp:
                    if resp.status == 200:
                        return url
            except (urllib.error.URLError, TimeoutError):
                continue
        return None

    if port_in_use():
        pid = port_owner_pid()
        live_url = existing_server_url()
        print(f"端口 {PORT} 已被占用" + (f"（PID {pid}）" if pid else "") + "。")
        if live_url:
            print(f"本地原型可能已在运行，直接打开：{live_url}")
        else:
            print("占用该端口的进程可能不是本原型服务。")
        print(f"若要重启，先结束旧进程：lsof -ti :{PORT} | xargs kill")
        print("然后重新执行：python3 main.py")
        raise SystemExit(1)

    with socketserver.TCPServer((HOST, PORT), handler) as httpd:
        httpd.allow_reuse_address = True
        os.chdir(app_root)
        url = f"http://{HOST}:{PORT}/prototype/index.html"
        print(f"Serving 外卖 at http://{HOST}:{PORT}/")
        print("后台:   /prototype/index.html")
        print("骑手端: /prototype/mobile/index.html")
        print("文档:   /prototype/docs/index.html")
        print("Markdown: /docs/*.md")
        print("Press Ctrl+C to stop.")
        webbrowser.open(url)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
