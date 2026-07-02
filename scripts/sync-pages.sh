#!/usr/bin/env bash
# 将 prototype 同步到 docs/（GitHub Pages 站点根），可选提交并推送。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/prototype/index.html"
DST="$ROOT/docs/index.html"
DOC_VIEWER_SRC="$ROOT/prototype/docs/index.html"
DOC_VIEWER_DST="$ROOT/docs/documentation/index.html"
MOBILE_SRC="$ROOT/prototype/mobile"
MOBILE_DST="$ROOT/docs/mobile"
PAGES_URL="https://lihuoxiu555.github.io/rider-swap-operator-prototype/"

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
  -c, --commit   同步后 git add 并 commit（需有改动）
  -p, --push     与 -c 一起：commit 后 push 到 origin
  -m, --message  提交说明（与 -c 合用，默认自动生成）

示例:
  $(basename "$0")              # 仅同步文件
  $(basename "$0") -c -m "更新站点筛选"
  $(basename "$0") -c -p -m "更新合作伙伴分润页"
EOF
}

do_commit=false
do_push=false
msg=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage; exit 0 ;;
    -c|--commit) do_commit=true; shift ;;
    -p|--push) do_push=true; do_commit=true; shift ;;
    -m|--message)
      msg="${2:-}"
      shift 2
      ;;
    *) echo "未知参数: $1" >&2; usage >&2; exit 1 ;;
  esac
done

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
DOC_SRC_DIR="$ROOT/docs"
DOC_DST_DIR="$ROOT/prototype/docs/md"
if [[ -d "$DOC_SRC_DIR" ]]; then
  mkdir -p "$DOC_DST_DIR"
  n=0
  for md in "$DOC_SRC_DIR"/*.md; do
    [[ -f "$md" ]] || continue
    [[ $(wc -c < "$md") -gt 50 ]] || continue
    cp "$md" "$DOC_DST_DIR/"
    n=$((n + 1))
  done
  echo "已同步: docs/*.md → prototype/docs/md（${n} 个文件）"
fi

mkdir -p "$(dirname "$DST")"
cp "$SRC" "$DST"
echo "已同步: prototype/index.html → docs/index.html"

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
  echo "下一步: git add docs/ prototype/ && git commit && git push"
  echo "线上预览: $PAGES_URL"
  echo "是否同步至在线版本？可执行: $(basename "$0") -c -p -m \"说明本次改动\""
  exit 0
fi

cd "$ROOT"
if [[ -z "$msg" ]]; then
  msg="sync prototype to GitHub Pages"
fi

git add "$DST" "$SRC"
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
