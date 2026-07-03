#!/usr/bin/env bash
# 将 prototype 同步到 docs/（GitHub Pages 站点根），可选提交并推送。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototype/index.html"
DST="$ROOT/docs/index.html"
PROTOTYPE_ASSETS="$ROOT/prototype"
DOCS_ASSETS="$ROOT/docs"
DOC_VIEWER_SRC="$ROOT/prototype/docs/index.html"
DOC_VIEWER_DST="$ROOT/docs/documentation/index.html"
MOBILE_SRC="$ROOT/prototype/mobile"
MOBILE_DST="$ROOT/docs/mobile"
PAGES_URL="https://lihuoxiu555.github.io/rider-swap-operator-prototype/"
CHANGELOG="$ROOT/docs/原型变更记录.md"

usage() {
  cat <<EOF
用法: $(basename "$0") [选项]

  同步 prototype → docs/，供 GitHub Pages 使用：
    · prototype/index.html        → docs/index.html
    · prototype/docs/index.html   → docs/documentation/index.html
    · docs/*.md                   → prototype/docs/md → docs/documentation/md
    · prototype/mobile            → docs/mobile

选项:
  -h, --help     显示帮助
  -l, --log      写入 docs/原型变更记录.md（必填说明，见 -m 或 positional）
  -c, --commit   同步后 git add 并 commit（需有改动）
  -p, --push     与 -c 一起：commit 后 push 到 origin
  -m, --message  提交说明（与 -c 合用）；若同时 -l 且未单独给 -l 文案，则兼作变更记录说明

示例:
  $(basename "$0") -l "总览新增用电量统计"     # 同步 + 写变更记录（推荐）
  $(basename "$0") -l "说明" -c -p -m "更新原型：说明"
EOF
}

do_commit=false
do_push=false
msg=""
log_msg=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -c|--commit) do_commit=true; shift ;;
    -p|--push) do_push=true; do_commit=true; shift ;;
    -l|--log)
      log_msg="${2:-}"
      shift 2
      ;;
    -m|--message)
      msg="${2:-}"
      shift 2
      ;;
    *) echo "未知参数: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [[ -n "$log_msg" && -z "$msg" ]]; then
  msg="$log_msg"
fi

collect_changed_paths() {
  ROOT_DIR="$ROOT" python3 <<'PY'
import os, subprocess
root = os.environ["ROOT_DIR"]
paths = set()
cmds = [
    ["git", "-C", root, "diff", "--name-only", "--", "docs/", "prototype/", "scripts/"],
    ["git", "-C", root, "diff", "--name-only", "--cached", "--", "docs/", "prototype/", "scripts/"],
    ["git", "-C", root, "ls-files", "--others", "--exclude-standard", "docs/", "prototype/", "scripts/"],
]
for cmd in cmds:
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
        text = out.decode("utf-8", errors="replace")
        for line in text.splitlines():
            line = line.strip()
            if line:
                paths.add(line)
    except subprocess.CalledProcessError:
        pass
if not paths:
    print("—")
else:
    print("、".join(sorted(paths)[:12]))
PY
}

collect_doc_updates() {
  ROOT_DIR="$ROOT" python3 <<'PY'
import os, subprocess, pathlib
root = os.environ["ROOT_DIR"]
paths = set()
cmds = [
    ["git", "-C", root, "diff", "--name-only", "--", "docs/"],
    ["git", "-C", root, "diff", "--name-only", "--cached", "--", "docs/"],
    ["git", "-C", root, "ls-files", "--others", "--exclude-standard", "docs/"],
]
for cmd in cmds:
    try:
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL)
        text = out.decode("utf-8", errors="replace")
        for line in text.splitlines():
            line = line.strip()
            if not line.endswith(".md"):
                continue
            name = pathlib.Path(line).name
            if name == "原型变更记录.md":
                continue
            paths.add(name)
    except subprocess.CalledProcessError:
        pass
if not paths:
    print("—")
else:
    print("、".join(sorted(paths)[:10]))
PY
}

append_changelog() {
  local description="$1"
  local ts docs files row

  if [[ -z "$description" ]]; then
    echo "错误: -l/--log 须附带改动说明，例如: $(basename "$0") -l \"总览新增用电量统计\"" >&2
    exit 1
  fi

  ts="$(date "+%Y-%m-%d %H:%M")"
  docs="$(collect_doc_updates)"
  files="$(collect_changed_paths)"
  [[ -z "$docs" ]] && docs="—"
  [[ -z "$files" ]] && files="—"

  if [[ ! -f "$CHANGELOG" ]]; then
    cat > "$CHANGELOG" <<EOF
# 原型变更记录

> 每次改动 prototype/ 后须更新 docs/ 并执行 \`./scripts/sync-pages.sh -l "说明"\`。

| 时间 | 改动说明 | 文档更新 | 涉及文件 |
|------|----------|----------|----------|
EOF
  fi

  row="| ${ts} | ${description} | ${docs} | ${files} |"
  CHANGELOG_PATH="$CHANGELOG" ROW_TEXT="$row" python3 <<'PY'
import os
from pathlib import Path

def clean(text):
    if not text:
        return text
    return text.encode("utf-8", "surrogatepass").decode("utf-8", "replace")

path = Path(os.environ["CHANGELOG_PATH"])
row = clean(os.environ["ROW_TEXT"])
raw = path.read_text(encoding="utf-8", errors="replace") if path.exists() else ""
lines = raw.splitlines()
out = []
inserted = False
for line in lines:
    out.append(line)
    if not inserted and line.startswith("|------|"):
        out.append(row)
        inserted = True
if not inserted:
    out.extend([
        "| 时间 | 改动说明 | 文档更新 | 涉及文件 |",
        "|------|----------|----------|----------|",
        row,
    ])
path.write_text("\n".join(out) + "\n", encoding="utf-8")
PY
  echo "已写入变更记录: docs/原型变更记录.md（${ts}）"
}

sync_md_to_prototype() {
  local n=0
  if [[ ! -d "$DOC_SRC_DIR" ]]; then
    return
  fi
  mkdir -p "$DOC_DST_DIR"
  for md in "$DOC_SRC_DIR"/*.md; do
    [[ -f "$md" ]] || continue
    [[ $(wc -c < "$md") -gt 50 ]] || continue
    cp "$md" "$DOC_DST_DIR/"
    n=$((n + 1))
  done
  echo "已同步: docs/*.md → prototype/docs/md（${n} 个文件）"
}

DOC_SRC_DIR="$ROOT/docs"
DOC_DST_DIR="$ROOT/prototype/docs/md"

if [[ ! -f "$SRC" ]] || [[ ! -s "$SRC" ]]; then
  echo "错误: prototype/index.html 缺失或为空" >&2
  exit 1
fi

if [[ ! -f "$DOC_VIEWER_SRC" ]] || [[ ! -s "$DOC_VIEWER_SRC" ]]; then
  echo "错误: prototype/docs/index.html 缺失或为空，文档页无法使用" >&2
  exit 1
fi

# 空 docs/*.md 从 documentation/md 备份恢复
DOC_BACKUP="$ROOT/docs/documentation/md"
if [[ -d "$DOC_BACKUP" ]]; then
  for md in "$ROOT/docs"/*.md; do
    [[ -f "$md" ]] || continue
    base="$(basename "$md")"
    if [[ ! -s "$md" ]] || [[ $(wc -c < "$md") -lt 50 ]]; then
      if [[ -f "$DOC_BACKUP/$base" ]] && [[ $(wc -c < "$DOC_BACKUP/$base") -gt 50 ]]; then
        cp "$DOC_BACKUP/$base" "$md"
        echo "已修复空文档: docs/$base"
      fi
    fi
  done
fi

# 真源 docs/*.md → prototype/docs/md（先于 Pages 镜像）
sync_md_to_prototype

mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "已同步: prototype/index.html → docs/index.html"

for dir in css js data-panel; do
  if [[ -d "$PROTOTYPE_ASSETS/$dir" ]]; then
    rm -rf "$DOCS_ASSETS/$dir"
    cp -R "$PROTOTYPE_ASSETS/$dir" "$DOCS_ASSETS/$dir"
    echo "已同步: prototype/$dir → docs/$dir"
  fi
done

# GitHub Pages：误访问 /prototype/index.html 时重定向到根入口
PROTOTYPE_REDIRECT="$ROOT/docs/prototype/index.html"
mkdir -p "$(dirname "$PROTOTYPE_REDIRECT")"
if [[ ! -f "$PROTOTYPE_REDIRECT" ]]; then
  cat > "$PROTOTYPE_REDIRECT" <<'EOF'
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=../index.html">
  <title>跳转中…</title>
  <script>location.replace("../index.html");</script>
</head>
<body>
  <p>正在跳转到 <a href="../index.html">运营商后台原型</a>…</p>
  <p><small>GitHub Pages 入口为站点根路径，不含 <code>prototype/</code> 子目录。</small></p>
</body>
</html>
EOF
  echo "已创建: docs/prototype/index.html（Pages 重定向）"
fi

if [[ -n "$log_msg" ]]; then
  append_changelog "$log_msg"
  sync_md_to_prototype
fi

if [[ -f "$DOC_VIEWER_SRC" ]]; then
  mkdir -p "$(dirname "$DOC_VIEWER_DST")"
  cp "$DOC_VIEWER_SRC" "$DOC_VIEWER_DST"
  echo "已同步: prototype/docs/index.html → docs/documentation/index.html"
  if [[ -d "$ROOT/prototype/docs/md" ]]; then
    rm -rf "$ROOT/docs/documentation/md"
    cp -R "$ROOT/prototype/docs/md" "$ROOT/docs/documentation/md"
    echo "已同步: prototype/docs/md → docs/documentation/md"
  fi
  if [[ -d "$ROOT/prototype/docs/vendor" ]]; then
    rm -rf "$ROOT/docs/documentation/vendor"
    cp -R "$ROOT/prototype/docs/vendor" "$ROOT/docs/documentation/vendor"
    echo "已同步: prototype/docs/vendor → docs/documentation/vendor"
  fi
fi

if [[ -d "$MOBILE_SRC" ]]; then
  rm -rf "$MOBILE_DST"
  cp -R "$MOBILE_SRC" "$MOBILE_DST"
  echo "已同步: prototype/mobile → docs/mobile"
fi

if ! $do_commit; then
  echo "下一步: ./scripts/sync-pages.sh -l \"改动说明\"  # 推荐：同步并写变更记录"
  echo "或: git add docs/ prototype/ && git commit && git push"
  echo "线上预览: $PAGES_URL"
  echo "推送: $(basename "$0") -l \"说明\" -c -p -m \"更新原型：说明\""
  exit 0
fi

cd "$ROOT"
if [[ -z "$msg" ]]; then
  msg="sync prototype to GitHub Pages"
fi

git add "$DST" "$SRC"
[[ -d "$PROTOTYPE_ASSETS/css" ]] && git add docs/css/ prototype/css/
[[ -d "$PROTOTYPE_ASSETS/js" ]] && git add docs/js/ prototype/js/
[[ -d "$PROTOTYPE_ASSETS/data-panel" ]] && git add docs/data-panel/ prototype/data-panel/
[[ -f "$CHANGELOG" ]] && git add "$CHANGELOG"
[[ -f "$DOC_VIEWER_DST" ]] && git add "$DOC_VIEWER_SRC" "$DOC_VIEWER_DST"
[[ -d "$ROOT/docs/documentation/md" ]] && git add docs/documentation/
[[ -d "$MOBILE_DST" ]] && git add docs/mobile/
[[ -d "$ROOT/prototype/docs/md" ]] && git add prototype/docs/md/
[[ -d "$MOBILE_SRC" ]] && git add prototype/mobile/

if git diff --cached --quiet; then
  echo "无待提交改动（prototype 与 docs/ 均已是最新）"
  if $do_push; then
    git push
    echo "已 push（无新 commit）"
  fi
  exit 0
fi

git commit -m "$msg"
echo "已提交: $msg"

if $do_push; then
  git push
  echo "已推送到远程，约 1～2 分钟后 Pages 更新: $PAGES_URL"
else
  echo "未推送，可执行: git push"
fi
