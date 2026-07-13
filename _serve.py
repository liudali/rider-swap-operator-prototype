from __future__ import annotations

import errno
import http.server
import json
import os
import socket
import socketserver
import subprocess
import sys
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
HOST_DISPLAY = "127.0.0.1"  # 文档与打印统一用 IPv4，避免 macOS localhost→::1 连不上
PORTS_FILE = Path(__file__).resolve().parent / "ports.json"


def load_ports() -> dict[str, dict]:
    with PORTS_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def project_config(project_id: str) -> dict:
    ports = load_ports()
    if project_id not in ports:
        known = ", ".join(sorted(ports))
        raise SystemExit(f"未知原型项目: {project_id}\n可用项目: {known}")
    return ports[project_id]


def project_url(project_id: str) -> str:
    cfg = project_config(project_id)
    return f"http://{HOST_DISPLAY}:{cfg['port']}{cfg['entry']}"


def port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            s.bind((HOST, port))
        except OSError as e:
            if e.errno in (errno.EADDRINUSE, 48, 98):
                return True
            raise
        return False


def port_owner_pid(port: int) -> str | None:
    try:
        out = subprocess.check_output(
            ["lsof", "-ti", f":{port}"],
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None
    return out.splitlines()[0] if out else None


def existing_server_url(port: int, entry: str) -> str | None:
    import http.client

    for path in (entry, "/index.html", "/"):
        try:
            conn = http.client.HTTPConnection(HOST, port, timeout=1)
            conn.request("HEAD", path)
            resp = conn.getresponse()
            resp.read()
            if resp.status in (200, 302):
                return f"http://{HOST_DISPLAY}:{port}{entry}"
        except (OSError, TimeoutError, ConnectionResetError):
            continue
    return None


def make_handler(*, entry: str, no_cache: bool = False) -> type[http.server.SimpleHTTPRequestHandler]:
    entry_path = entry

    class DevHandler(http.server.SimpleHTTPRequestHandler):
        extensions_map = {
            **http.server.SimpleHTTPRequestHandler.extensions_map,
            ".md": "text/plain; charset=utf-8",
        }

        def do_GET(self) -> None:
            path = self.path.split("?", 1)[0]
            if path in ("", "/"):
                self.send_response(302)
                self.send_header("Location", entry_path)
                self.end_headers()
                return
            super().do_GET()

        def end_headers(self) -> None:
            if no_cache and self.path.endswith((".html", ".js", ".css", ".md")):
                self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
                self.send_header("Pragma", "no-cache")
            super().end_headers()

        def log_message(self, fmt: str, *args) -> None:
            if os.environ.get("PROTOTYPE_QUIET") == "1":
                return
            super().log_message(fmt, *args)

    return DevHandler


class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True


def run_static_server(
    *,
    project_id: str,
    app_root: Path | None = None,
    no_cache: bool = False,
    open_browser: bool | None = None,
    extra_lines: list[str] | None = None,
) -> None:
    cfg = project_config(project_id)
    port = int(cfg["port"])
    entry = str(cfg["entry"])
    label = str(cfg.get("label", project_id))
    serve_dir = str(cfg.get("serveDir", "prototype"))

    if open_browser is None:
        open_browser = (
            os.environ.get("PROTOTYPE_NO_BROWSER") != "1"
            and "--no-browser" not in sys.argv
        )

    root = (app_root or Path.cwd()).resolve()
    doc_root = root / serve_dir if serve_dir != "." else root
    if not doc_root.is_dir():
        raise SystemExit(f"Prototype directory not found: {doc_root}")

    live_url = existing_server_url(port, entry)
    if port_in_use(port):
        pid = port_owner_pid(port)
        if live_url:
            print(f"✓ {label} 已在运行（端口 {port}" + (f"，PID {pid}" if pid else "") + "）")
            print(f"  打开: {live_url}")
            if open_browser:
                try:
                    webbrowser.open(live_url)
                except Exception:
                    pass
            return
        print(f"端口 {port} 已被占用" + (f"（PID {pid}）" if pid else "") + "，但无法访问原型页面。")
        print(f"请先结束占用进程：lsof -ti :{port} | xargs kill")
        print("然后重新执行：python3 main.py")
        raise SystemExit(1)

    handler = make_handler(entry=entry, no_cache=no_cache)
    with ReusableTCPServer((HOST, port), handler) as httpd:
        os.chdir(doc_root)
        url = f"http://{HOST_DISPLAY}:{port}{entry}"
        print(f"Serving {label} at http://{HOST_DISPLAY}:{port}/")
        print(f"入口:   {entry}")
        if extra_lines:
            for line in extra_lines:
                print(line)
        print("Press Ctrl+C to stop.")
        if open_browser:
            try:
                webbrowser.open(url)
            except Exception:
                pass
        httpd.serve_forever()


def check_all_status() -> list[dict]:
    rows: list[dict] = []
    for project_id, cfg in load_ports().items():
        port = int(cfg["port"])
        entry = str(cfg["entry"])
        url = f"http://{HOST_DISPLAY}:{port}{entry}"
        live = existing_server_url(port, entry)
        rows.append(
            {
                "id": project_id,
                "label": cfg.get("label", project_id),
                "port": port,
                "url": url,
                "running": live is not None,
                "pid": port_owner_pid(port) if live else None,
            }
        )
    return rows


def print_status() -> None:
    rows = check_all_status()
    print("原型预览状态（须先启动 python3 main.py 或 serve.py --start-all）：\n")
    print(f"{'状态':<4} {'项目':<18} {'端口':<6} 地址")
    print("-" * 72)
    for row in rows:
        mark = "✓" if row["running"] else "✗"
        print(f"{mark:<4} {row['label']:<18} {row['port']:<6} {row['url']}")
    down = [r for r in rows if not r["running"]]
    if down:
        print(f"\n未启动 {len(down)} 个：在 原型/ 目录执行  python3 serve.py --start-all")


def print_port_table() -> None:
    print("原型项目本地预览（127.0.0.1，非公网地址；须先启动服务）：\n")
    print(f"{'项目':<18} {'端口':<6} 入口")
    print("-" * 60)
    for project_id, cfg in load_ports().items():
        port = cfg["port"]
        entry = cfg["entry"]
        label = cfg.get("label", project_id)
        print(f"{label:<18} {port:<6} http://{HOST_DISPLAY}:{port}{entry}")
    print("\n启动：cd 原型 && python3 serve.py --start-all")
    print("状态：cd 原型 && python3 serve.py --status")
