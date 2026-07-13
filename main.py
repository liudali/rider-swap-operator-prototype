from __future__ import annotations

import shutil
import sys
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(APP_ROOT))

from _serve import run_static_server  # noqa: E402


def sync_docs_to_viewer(app_root: Path) -> None:
    """把 docs/*.md 复制到文档浏览器 md/ 目录；跳过空文件，并镜像到 documentation/md。"""
    src = app_root / "docs"
    dst = app_root / "prototype" / "docs" / "md"
    pages_md = app_root / "docs" / "documentation" / "md"
    backup = pages_md if pages_md.is_dir() else None

    if not src.is_dir():
        return

    dst.mkdir(parents=True, exist_ok=True)
    pages_md.mkdir(parents=True, exist_ok=True)

    for md in src.glob("*.md"):
        size = md.stat().st_size
        if size < 50 and backup:
            backup_file = backup / md.name
            if backup_file.is_file() and backup_file.stat().st_size > size:
                shutil.copy2(backup_file, md)
                print(f"已修复空文档: docs/{md.name} ← documentation/md/")
                size = md.stat().st_size
        if size < 50:
            print(f"跳过空文档: docs/{md.name}")
            continue
        shutil.copy2(md, dst / md.name)
        shutil.copy2(md, pages_md / md.name)


def main() -> None:
    proto_root = APP_ROOT / "prototype"
    if not proto_root.is_dir():
        raise SystemExit(f"Prototype directory not found: {proto_root}")

    sync_docs_to_viewer(APP_ROOT)
    run_static_server(
        project_id="外卖",
        app_root=APP_ROOT,
        no_cache=True,
        extra_lines=[
            "后台:   /prototype/index.html",
            "骑手端: /prototype/mobile/index.html",
            "文档:   /prototype/docs/index.html",
            "数据面板: /prototype/data-panel/index.html",
        ],
    )


if __name__ == "__main__":
    main()
