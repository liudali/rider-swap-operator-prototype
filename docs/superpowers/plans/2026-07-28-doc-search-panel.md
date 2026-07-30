# 文档搜索悬浮框 Implementation Plan

> **For agentic workers:** Steps use checkbox syntax. Spec: `docs/superpowers/specs/2026-07-28-doc-search-panel-design.md` · decision-087.

**Goal:** 运营商后台右侧可收起文档搜索面板：全文检索 + 框内预览 + 进页关键词预匹配。

**Architecture:** `doc-catalog.js` 共享清单；`doc-search-panel.js` 负责索引/UI；`app.js` 在 `render()` 末尾派发页面上下文。

**Tech Stack:** Vanilla JS、marked（`docs/vendor/marked.min.js`）、现有 prototype CSS 变量。

## Global Constraints

- 仅索引产品文档 md；不索引 decisions/specs
- 不强制自动展开面板；z-index < drawer(50/51)
- 用户手改搜索词后切页不覆盖

---

### Task 1: catalog + CSS + panel JS + wire index/app/docs

- [x] Create `prototype/js/doc-catalog.js`（DOC_GROUPS 补全、VIEW_DOC_KEYWORDS、url helpers）
- [x] Create `prototype/css/doc-search-panel.css`
- [x] Create `prototype/js/doc-search-panel.js`
- [x] Wire `prototype/index.html`；`app.js` render 钩子；`docs/index.html` 共用 catalog + `?file=`
- [ ] Manual check: 用户押金页角标/预匹配；搜押金；全文预览；新标签打开
