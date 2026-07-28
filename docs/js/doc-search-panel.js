/**
 * 右侧文档搜索悬浮框 · decision-087
 * 依赖：DocCatalog、marked（可选，缺省时用纯文本预览）
 */
(function (global) {
  const Cat = () => global.DocCatalog;

  const state = {
    open: false,
    indexReady: false,
    indexLoading: false,
    docs: [], // { file, label, group, text, loadError }
    contextKey: "",
    contextTitle: "",
    contextKeywords: [],
    contextExplain: null,
    userDirty: false,
    query: "",
    mode: "list", // list | reader
    readingFile: null,
    readingFocus: "auto",
    matchCount: 0,
    debounceTimer: null
  };

  let els = {};
  let domReady = false;

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /** 面板摘录用：去掉 md 标记，避免 **加粗** 原样露出 */
  function stripMdForPanel(text) {
    return String(text == null ? "" : text)
      .replace(/\r\n/g, "\n")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/!\[[^\]]*]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/__([^_]+)__/g, "$1")
      .replace(/(^|[^*\n])\*([^*\n]+)\*(?!\*)/g, "$1$2")
      .replace(/^>\s?/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\|/g, " ")
      .replace(/\n{2,}/g, "\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function highlight(text, terms) {
    let out = escapeHtml(stripMdForPanel(text));
    const uniq = Array.from(new Set((terms || []).filter(Boolean))).sort((a, b) => b.length - a.length);
    uniq.forEach(t => {
      const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      out = out.replace(re, m => `<mark>${m}</mark>`);
    });
    return out;
  }

  function snippetAround(text, terms, radius) {
    const plain = stripMdForPanel(text);
    const lower = plain.toLowerCase();
    let best = -1;
    let hit = "";
    for (const t of terms) {
      const i = lower.indexOf(t.toLowerCase());
      if (i >= 0 && (best < 0 || i < best)) {
        best = i;
        hit = t;
      }
    }
    if (best < 0) return plain.slice(0, radius * 2);
    const start = Math.max(0, best - radius);
    const end = Math.min(plain.length, best + hit.length + radius);
    let snip = plain.slice(start, end).replace(/\s+/g, " ").trim();
    if (start > 0) snip = "…" + snip;
    if (end < plain.length) snip = snip + "…";
    return snip;
  }

  function removeOrphanDocSearchNodes() {
    document.querySelectorAll(".doc-search-rail, .doc-search-panel").forEach(node => {
      if (els.rail && node === els.rail) return;
      if (els.panel && node === els.panel) return;
      node.remove();
    });
  }

  function ensureDom() {
    if (domReady && els.panel && document.body.contains(els.panel) && els.rail && document.body.contains(els.rail)) {
      removeOrphanDocSearchNodes();
      return;
    }

    // 切页会反复 setContext；必须单例，否则旧面板无法收起且侧栏再点会叠一层
    document.querySelectorAll(".doc-search-rail, .doc-search-panel").forEach(node => node.remove());
    els = {};

    const rail = document.createElement("button");
    rail.type = "button";
    rail.className = "doc-search-rail";
    rail.id = "docSearchRail";
    rail.setAttribute("aria-label", "打开文档搜索");
    rail.innerHTML = `文档<span class="doc-search-badge" id="docSearchBadge" hidden>0</span>`;

    const panel = document.createElement("aside");
    panel.className = "doc-search-panel";
    panel.id = "docSearchPanel";
    panel.setAttribute("aria-label", "文档搜索");
    panel.innerHTML = `
      <div class="doc-search-head">
        <h2>搜文档</h2>
        <div class="doc-search-head-actions">
          <button type="button" class="btn-icon" id="docSearchCollapse" title="收起" aria-label="收起">›</button>
        </div>
      </div>
      <div class="doc-search-context" id="docSearchContext" hidden></div>
      <div class="doc-search-bar">
        <input type="search" id="docSearchInput" placeholder="搜索产品规则，如：押金、退款、额度池" autocomplete="off" />
      </div>
      <div class="doc-search-body" id="docSearchBody"></div>
    `;

    document.body.appendChild(rail);
    document.body.appendChild(panel);

    els = {
      rail,
      badge: rail.querySelector("#docSearchBadge"),
      panel,
      context: panel.querySelector("#docSearchContext"),
      input: panel.querySelector("#docSearchInput"),
      body: panel.querySelector("#docSearchBody"),
      collapse: panel.querySelector("#docSearchCollapse")
    };

    rail.addEventListener("click", () => setOpen(true));
    els.collapse.addEventListener("click", () => setOpen(false));
    els.input.addEventListener("input", () => {
      state.userDirty = true;
      state.query = els.input.value;
      state.mode = "list";
      state.readingFile = null;
      scheduleRenderList();
      updateContextBar();
    });
    els.body.addEventListener("click", onBodyClick);
    els.context.addEventListener("click", onContextClick);
    if (state.open) {
      panel.classList.add("open");
      rail.hidden = true;
    }
    domReady = true;
  }

  function setOpen(open) {
    ensureDom();
    state.open = !!open;
    els.panel.classList.toggle("open", state.open);
    els.rail.hidden = state.open;
    if (state.open) {
      ensureIndex().then(() => {
        if (!state.userDirty && state.contextKeywords.length) {
          applyContextQuery(false);
        } else {
          renderBody();
        }
      });
      setTimeout(() => els.input && els.input.focus(), 50);
    }
  }

  function updateBadge(count) {
    state.matchCount = count;
    if (!els.badge) return;
    if (count > 0) {
      els.badge.hidden = false;
      els.badge.textContent = count > 9 ? "9+" : String(count);
    } else {
      els.badge.hidden = true;
    }
  }

  function updateContextBar() {
    const box = els.context;
    if (!state.contextTitle && !state.contextKeywords.length && !state.contextExplain) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    box.hidden = false;
    const dirtyHint = state.userDirty
      ? `<span class="muted">已手动搜索</span> <button type="button" class="linkish" data-doc-restore>恢复当前页推荐</button>`
      : `<button type="button" class="linkish" data-doc-clear>清除</button>`;
    const path = (state.contextExplain && state.contextExplain.path) || [];
    const pathHtml = path.length
      ? `<div class="doc-explain-path">${path.map(p => `<span>${escapeHtml(p)}</span>`).join("<i>›</i>")}</div>`
      : `<span class="chip">当前页：${escapeHtml(state.contextTitle || "—")}</span>`;
    box.innerHTML = `${pathHtml}${dirtyHint}`;
  }

  function renderPageExplainHtml() {
    const ex = state.contextExplain;
    if (!ex || state.userDirty) return "";
    const does = (ex.does || "").trim();
    const notDoes = (ex.notDoes || "").trim();
    const scopeHtml = (does || notDoes)
      ? `<ul class="doc-explain-scope">
          ${does ? `<li><strong>做什么</strong>：${escapeHtml(does)}</li>` : ""}
          ${notDoes ? `<li><strong>不做什么</strong>：${escapeHtml(notDoes)}</li>` : ""}
        </ul>`
      : "";
    return `
      <section class="doc-page-explain" aria-label="当前页释义">
        <h3>当前页是什么</h3>
        <p class="doc-explain-lead">${escapeHtml(ex.meaning || "—")}</p>
        ${scopeHtml}
        <div class="doc-explain-path">${(ex.path || []).map(p => `<span>${escapeHtml(p)}</span>`).join("<i>›</i>")}</div>
        <dl class="doc-explain-grid">
          <div><dt>角色</dt><dd>${escapeHtml(ex.role || "—")}</dd></div>
          <div><dt>功能</dt><dd>${escapeHtml(ex.feature || "—")}</dd></div>
        </dl>
      </section>
    `;
  }

  function renderPageLineageHtml() {
    if (state.userDirty) return "";
    const viewKey = state.contextKey || "";
    const catalog = Cat();
    const lineage = catalog && typeof catalog.lineageForView === "function"
      ? catalog.lineageForView(viewKey)
      : null;
    if (!lineage) return "";
    const rows = [];
    if ((lineage.upstream || "").trim()) rows.push({ dt: "前置", dd: lineage.upstream.trim() });
    if ((lineage.sources || "").trim()) rows.push({ dt: "数据来源", dd: lineage.sources.trim() });
    if ((lineage.downstream || "").trim()) rows.push({ dt: "下游", dd: lineage.downstream.trim() });
    if (!rows.length && !(lineage.links || []).length) return "";
    const links = (lineage.links || []).filter(l => l && l.key && l.label);
    const linksHtml = links.length
      ? `<div class="doc-lineage-links">
          <span class="doc-lineage-links-label">相关页</span>
          ${links.map(l => `<button type="button" class="doc-lineage-link" data-doc-nav="${escapeHtml(l.key)}">${escapeHtml(l.label)}</button>`).join("")}
        </div>`
      : "";
    return `
      <section class="doc-page-lineage" aria-label="来源与前置">
        <h3>来源与前置</h3>
        ${rows.length ? `<dl class="doc-lineage-grid">${rows.map(r => `<div><dt>${escapeHtml(r.dt)}</dt><dd>${escapeHtml(r.dd)}</dd></div>`).join("")}</dl>` : ""}
        ${linksHtml}
      </section>
    `;
  }

  /** 从段落抽一条可读规则句 */
  function ruleOneLiner(text) {
    const raw = stripMdForPanel(text).replace(/\s+/g, " ").trim();
    if (!raw) return "";
    // 优先取列表首条（strip 后可能仍带序号痕迹）
    const bullet = raw.match(/(?:^|\s)[-*·]\s*([^。！？\n]{8,80})/);
    if (bullet) return bullet[1].trim();
    const sent = raw.split(/[。！？\n]/).map(s => s.trim()).find(s => s.length >= 8);
    const line = (sent || raw).slice(0, 96);
    return line + (raw.length > line.length ? "…" : "");
  }

  /** 优先抽取「业务设定」层，避免附录/变更明细伪代码进摘要 */
  function extractReadableLayer(md) {
    const text = String(md || "");
    // 业务设定 → 下一 ## 标题为止（实现附录 / 变更明细 / 其它章节均截止）
    const biz = text.match(/^##\s*业务设定\s*\n([\s\S]*?)(?=^##\s+)/m);
    if (biz) return biz[1].trim();
    const confirmed = text.match(/^##\s*已确认规则\s*\n([\s\S]*?)(?=^##\s+)/m);
    if (confirmed) return confirmed[1].trim();
    const cut = text.split(/^##\s*(?:实现附录|变更明细)/m)[0];
    return (cut || text).trim();
  }

  /**
   * 本页关键设定摘要卡：精选规则优先；无精选时再从推荐文档业务层抽段
   */
  function buildPageRuleCards(limit) {
    const max = limit || 7;
    const cards = [];
    const seen = new Set();
    const catalog = global.DocCatalog;
    const viewKey = state.contextKey || "";

    function pushSummary(summary, meta) {
      const text = stripMdForPanel(summary).replace(/\s+/g, " ").trim();
      if (text.length < 8) return;
      if (/[=`]/.test(text) && /_\w+|Mode|valid_|userOwner/.test(text)) return;
      const dedupe = text.slice(0, 48);
      if (seen.has(dedupe)) return;
      seen.add(dedupe);
      const file = meta.file || "";
      const label = meta.label
        || (file && catalog && catalog.allDocs
          ? ((catalog.allDocs().find(d => d.file === file) || {}).label || file)
          : (meta.label || "当前页"));
      cards.push({
        id: "rule-" + cards.length,
        summary: text,
        full: stripMdForPanel(meta.full || text),
        heading: stripMdForPanel(meta.heading || ""),
        file,
        label,
        curated: !!meta.curated
      });
    }

    // 0) 本页精选规则（可读完整句，不靠关键词碎片）
    if (catalog && typeof catalog.rulesForView === "function") {
      catalog.rulesForView(viewKey).slice(0, max).forEach(r => {
        pushSummary(r.summary, {
          curated: true,
          file: r.file || "",
          heading: r.heading || "",
          full: r.summary
        });
      });
    }
    if (cards.length >= max) return cards.slice(0, max);

    const hits = searchContextHits();
    const title = (state.contextTitle || "").trim();
    const terms = (title ? [title] : []).concat(
      (state.contextKeywords || []).filter(k => k && k !== title)
    );

    function pushCard(doc, block) {
      if (!block || block.headingOnly) return;
      pushSummary(ruleOneLiner(block.text), {
        full: block.text,
        heading: block.heading || "",
        file: doc.file,
        label: doc.label
      });
    }

    // 1) 推荐文档业务层补足（仅当精选不足）
    hits.filter(h => h.kind === "prefer").forEach(h => {
      if (cards.length >= max) return;
      if (h.doc.file === "业务文档写作规范.md") return;
      const readable = extractReadableLayer(h.doc.text);
      let blocks = collectMatchBlocks(readable, terms, 6);
      if (!blocks.length) {
        const paras = String(readable || "")
          .split(/\n\n+/)
          .map(p => p.trim())
          .filter(p => p.length > 24 && !/^#+\s/.test(p) && !/^\|/.test(p) && !/^>/.test(p));
        paras.slice(0, 3).forEach(p => pushCard(h.doc, { heading: "", text: p }));
        return;
      }
      blocks.forEach(b => {
        if (cards.length >= max) return;
        pushCard(h.doc, b);
      });
    });

    // 2) 仍不足才用其它相关文档（避免渠道结算等弱相关抢镜）
    if (cards.length < 3) {
      hits.filter(h => h.kind !== "prefer").forEach(h => {
        if (cards.length >= max) return;
        if (h.doc.file === "业务文档写作规范.md") return;
        const readable = extractReadableLayer(h.doc.text);
        collectMatchBlocks(readable, terms, 2).forEach(b => {
          if (cards.length >= max) return;
          pushCard(h.doc, b);
        });
      });
    }

    if (!cards.length && state.contextExplain?.meaning) {
      pushSummary(state.contextExplain.meaning, {
        heading: "页面释义",
        label: "当前页",
        full: state.contextExplain.meaning
      });
    }
    return cards;
  }

  function renderRuleCardsHtml(cards) {
    if (!cards.length) {
      return `<p class="doc-search-status">暂无摘要，可点下方文档溯源或手动搜索。</p>`;
    }
    return `
      <section class="doc-rule-cards" aria-label="本页关键设定">
        <h3 class="doc-rule-heading">本页关键设定 · ${cards.length}</h3>
        <p class="doc-search-status" style="margin-top:0">${cards.some(c => c.curated) ? "以下为精选可读规则；点出处可溯源全文。" : "由文档业务层摘录；需要时再展开原文或溯源。"}</p>
        ${cards.map((c, i) => `
          <article class="doc-rule-card" data-rule-id="${escapeHtml(c.id)}">
            <div class="doc-rule-summary"><span class="doc-rule-no">${i + 1}</span>${escapeHtml(c.summary)}</div>
            <div class="doc-rule-source">
              ${c.file
                ? `出处：<button type="button" class="linkish" data-doc-open="${escapeHtml(c.file)}" data-doc-focus="matches">${escapeHtml(c.label)}</button>${c.heading ? ` › ${escapeHtml(c.heading)}` : ""}`
                : `出处：${escapeHtml(c.label)}${c.heading ? ` › ${escapeHtml(c.heading)}` : ""}`}
              <button type="button" class="linkish" data-rule-toggle="${escapeHtml(c.id)}">展开原文</button>
            </div>
            <div class="doc-rule-full" id="rule-full-${escapeHtml(c.id)}" hidden>${highlight(c.full, activeReadTerms())}</div>
          </article>
        `).join("")}
      </section>
    `;
  }

  function renderRelatedDocsHtml(hits) {
    if (!hits.length) return "";
    return `
      <details class="doc-related-docs">
        <summary>相关文档溯源 · ${hits.length}</summary>
        <div class="doc-related-list">
          ${hits.map(h => `
            <button type="button" class="doc-search-hit" data-doc-open="${escapeHtml(h.doc.file)}" data-doc-focus="matches">
              <div class="hit-title">${escapeHtml(h.doc.label)}${h.kind === "prefer" ? ' <span style="font-size:11px;color:#0f766e">推荐</span>' : ""}</div>
              <div class="hit-meta">${escapeHtml(h.doc.group || "")} · ${escapeHtml(h.doc.file)}</div>
            </button>
          `).join("")}
        </div>
      </details>
    `;
  }

  function onBodyClick(e) {
    const toggle = e.target.closest("[data-rule-toggle]");
    if (toggle) {
      const id = toggle.getAttribute("data-rule-toggle");
      const full = els.body.querySelector('[id="rule-full-' + id.replace(/"/g, "") + '"]');
      if (full) {
        const open = full.hasAttribute("hidden");
        if (open) full.removeAttribute("hidden");
        else full.setAttribute("hidden", "");
        toggle.textContent = open ? "收起原文" : "展开原文";
      }
      return;
    }
    const openBtn = e.target.closest("[data-doc-open]");
    if (openBtn) {
      const focus = openBtn.getAttribute("data-doc-focus") || "auto";
      openReader(openBtn.getAttribute("data-doc-open"), { focus });
      return;
    }
    const back = e.target.closest("[data-doc-back]");
    if (back) {
      state.mode = "list";
      state.readingFile = null;
      state.readingFocus = "auto";
      renderBody();
      return;
    }
    const full = e.target.closest("[data-doc-show-full]");
    if (full) {
      state.readingFocus = "full";
      openReader(state.readingFile, { focus: "full" });
      return;
    }
    const only = e.target.closest("[data-doc-show-matches]");
    if (only) {
      state.readingFocus = "matches";
      openReader(state.readingFile, { focus: "matches" });
      return;
    }
    const navBtn = e.target.closest("[data-doc-nav]");
    if (navBtn) {
      const vk = navBtn.getAttribute("data-doc-nav");
      if (vk && typeof window.navigateDocPanelView === "function") {
        window.navigateDocPanelView(vk);
      }
    }
  }

  function activeReadTerms() {
    const q = (els.input?.value || state.query || "").trim();
    const fromInput = q.split(/\s+/).filter(Boolean);
    if (state.userDirty) return fromInput;
    const fromCtx = [state.contextTitle].concat(state.contextKeywords || []).filter(Boolean);
    const set = new Set([...fromInput, ...fromCtx]);
    return Array.from(set);
  }

  /** 从 md 抽出含关键词的段落/小节，供阅读态优先展示 */
  function collectMatchBlocks(md, terms, limit) {
    const lowerTerms = (terms || []).map(t => String(t).toLowerCase()).filter(Boolean);
    if (!md || !lowerTerms.length) return [];
    const lines = String(md).split(/\n/);
    const blocks = [];
    let heading = "";
    let buf = [];

    function flush() {
      const text = buf.join("\n").trim();
      buf = [];
      if (!text) return;
      const low = text.toLowerCase();
      if (!lowerTerms.some(t => low.includes(t))) return;
      blocks.push({ heading, text });
    }

    lines.forEach(line => {
      const hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm) {
        flush();
        heading = hm[2].trim();
        const hLow = heading.toLowerCase();
        if (lowerTerms.some(t => hLow.includes(t))) {
          blocks.push({ heading, text: heading, headingOnly: true });
        }
        return;
      }
      if (!line.trim()) {
        flush();
        return;
      }
      buf.push(line);
    });
    flush();

    // 去重过短块，限制数量
    const out = [];
    const seen = new Set();
    for (const b of blocks) {
      const key = (b.heading + "\n" + b.text).slice(0, 160);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(b);
      if (out.length >= (limit || 10)) break;
    }
    return out;
  }

  function renderMatchBlocksHtml(blocks, terms) {
    if (!blocks.length) {
      return `<p class="doc-search-status">正文未找到可摘录的匹配段，可改「查看全文」。</p>`;
    }
    return blocks.map((b, i) => `
      <section class="doc-match-block">
        <div class="doc-match-index">匹配 ${i + 1}${b.heading ? ` · ${escapeHtml(b.heading)}` : ""}</div>
        <div class="doc-match-text">${highlight(b.text, terms)}</div>
      </section>
    `).join("");
  }

  function onContextClick(e) {
    if (e.target.closest("[data-doc-restore]")) {
      state.userDirty = false;
      applyContextQuery(true);
      return;
    }
    if (e.target.closest("[data-doc-clear]")) {
      state.userDirty = false;
      state.query = "";
      els.input.value = "";
      state.mode = "list";
      state.readingFile = null;
      renderBody();
      updateContextBar();
    }
  }

  async function ensureIndex() {
    if (state.indexReady || state.indexLoading) return state._indexPromise;
    state.indexLoading = true;
    const catalog = Cat();
    if (!catalog) {
      state.indexLoading = false;
      return;
    }
    state._indexPromise = (async () => {
      const items = catalog.allDocs();
      const results = await Promise.all(items.map(async it => {
        try {
          const url = catalog.docFileUrl(it.file);
          const res = await fetch(url);
          if (!res.ok) throw new Error("HTTP " + res.status);
          const text = await res.text();
          if (!text.trim() || text.trim().startsWith("<!")) throw new Error("invalid md");
          return { ...it, text, loadError: false };
        } catch (err) {
          console.warn("[DocSearch] skip", it.file, err);
          return { ...it, text: "", loadError: true };
        }
      }));
      state.docs = results;
      state.indexReady = true;
      state.indexLoading = false;
      refreshContextMatches();
    })();
    return state._indexPromise;
  }

  function searchDocs(query, mode) {
    const q = (query || "").trim();
    if (!q) return { empty: true, hits: [] };
    const terms = q.split(/\s+/).filter(Boolean);
    const useOr = mode === "or" || mode === "context";
    const hits = [];
    state.docs.forEach(doc => {
      if (doc.loadError) return;
      const hayTitle = (doc.label + " " + doc.file).toLowerCase();
      const hayBody = (doc.text || "").toLowerCase();
      const matchedTerms = terms.filter(t => {
        const tl = t.toLowerCase();
        return hayTitle.includes(tl) || hayBody.includes(tl);
      });
      if (useOr ? matchedTerms.length === 0 : matchedTerms.length < terms.length) return;
      const titleHit = terms.some(t => hayTitle.includes(t.toLowerCase()));
      const primary = state.contextTitle && hayTitle.includes(state.contextTitle.toLowerCase());
      hits.push({
        doc,
        titleHit,
        primary,
        score: (primary ? 100 : 0) + (titleHit ? 20 : 0) + matchedTerms.length,
        terms: useOr ? matchedTerms : terms,
        snippet: snippetAround(doc.text || doc.label, matchedTerms.length ? matchedTerms : terms, 40),
        kind: "keyword"
      });
    });
    hits.sort((a, b) => b.score - a.score || a.doc.label.localeCompare(b.doc.label, "zh"));
    return { empty: false, hits };
  }

  /** 上下文预匹配：推荐业务设定置顶，过滤变更/会议/竞品等弱相关 */
  function searchContextHits() {
    const catalog = Cat();
    const preferFiles = catalog.preferredDocsForView(state.contextKey) || [];
    const preferSet = new Set(preferFiles);
    const title = (state.contextTitle || "").trim();
    const terms = (title ? [title] : []).concat(
      (state.contextKeywords || []).filter(k => k && k !== title)
    );
    const hits = [];
    const seen = new Set();

    preferFiles.forEach((file, idx) => {
      if (catalog.isContextDemoted(file)) return;
      const doc = state.docs.find(d => d.file === file);
      if (!doc || doc.loadError || seen.has(file)) return;
      seen.add(file);
      hits.push({
        doc,
        titleHit: true,
        primary: true,
        score: 2000 - idx,
        terms: terms.slice(0, 3),
        snippet: snippetAround(doc.text || doc.label, terms.length ? terms : [doc.label], 48),
        kind: "prefer"
      });
    });

    if (terms.length) {
      const { hits: kwHits } = searchDocs(terms.join(" "), "or");
      kwHits.forEach(h => {
        if (seen.has(h.doc.file)) return;
        if (catalog.isContextDemoted(h.doc.file)) return;
        // 仅保留：标题命中，或业务分组且非纯正文偶然命中
        const business = catalog.isBusinessGroup(h.doc.group);
        if (!h.titleHit && !h.primary && !(business && h.score >= 2)) return;
        if (!h.titleHit && !business) return;
        seen.add(h.doc.file);
        hits.push({
          ...h,
          score: 800 + h.score + (h.primary ? 50 : 0) + (h.titleHit ? 30 : 0),
          kind: "related"
        });
      });
    }

    hits.sort((a, b) => b.score - a.score || a.doc.label.localeCompare(b.doc.label, "zh"));
    return hits.slice(0, 12);
  }

  function scheduleRenderList() {
    clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => renderBody(), 200);
  }

  function applyContextQuery(forceRender) {
    // 输入框只放页面名，避免「押金 退押 实付」扫出一堆弱相关
    const title = (state.contextTitle || "").trim();
    state.query = title;
    if (els.input) els.input.value = title;
    state.mode = "list";
    state.readingFile = null;
    state.userDirty = false;
    updateContextBar();
    if (forceRender || state.open) renderBody();
    refreshContextMatches();
  }

  function refreshContextMatches() {
    if (!state.indexReady) return;
    if (!state.contextKey && !state.contextKeywords.length) {
      updateBadge(0);
      return;
    }
    updateBadge(buildPageRuleCards(7).length);
  }

  function renderCatalog() {
    const groups = Cat().DOC_GROUPS;
    return groups.map(g => `
      <div class="doc-search-group">
        <h3>${escapeHtml(g.title)}</h3>
        ${g.items.map(it => `
          <button type="button" class="doc-item" data-doc-open="${escapeHtml(it.file)}" data-doc-focus="full">${escapeHtml(it.label)}</button>
        `).join("")}
      </div>
    `).join("");
  }

  function renderHits(hits, terms, opts) {
    if (!hits.length) {
      return `<p class="doc-search-status">未找到，试试押金 / 渠道结算</p>`;
    }
    const showSections = opts && opts.context;
    const prefer = showSections ? hits.filter(h => h.kind === "prefer") : hits;
    const related = showSections ? hits.filter(h => h.kind !== "prefer") : [];

    function block(list, heading) {
      if (!list.length) return "";
      const head = heading ? `<p class="doc-search-status" style="font-weight:600;color:#0f766e">${heading}</p>` : "";
      return head + list.map(h => `
        <button type="button" class="doc-search-hit" data-doc-open="${escapeHtml(h.doc.file)}" data-doc-focus="matches">
          <div class="hit-title">${highlight(h.doc.label, terms)}${h.kind === "prefer" ? ' <span style="font-size:11px;color:#0f766e;font-weight:500">推荐</span>' : ""}</div>
          <div class="hit-meta">${escapeHtml(h.doc.group || "")} · ${escapeHtml(h.doc.file)}</div>
          <div class="hit-snippet">${highlight(h.snippet, terms)}</div>
        </button>
      `).join("");
    }

    if (showSections) {
      return block(prefer, `推荐业务设定 · ${prefer.length}`)
        + block(related, related.length ? `其他相关 · ${related.length}` : "");
    }
    return block(hits, "");
  }

  function openReader(file, opts) {
    const doc = state.docs.find(d => d.file === file);
    state.mode = "reader";
    state.readingFile = file;
    const terms = activeReadTerms();
    const wantMatches = (opts && opts.focus === "matches")
      || ((opts?.focus !== "full") && (state.readingFocus === "matches" || (opts?.focus === "auto" && terms.length)));
    const showMatches = wantMatches && terms.length > 0;
    state.readingFocus = showMatches ? "matches" : "full";

    const label = doc?.label || file;
    const viewer = Cat().docsViewerUrl(file);
    let htmlBody = "";
    let modeToggle = "";

    if (doc?.loadError || !doc?.text) {
      htmlBody = `<p class="doc-search-status">文档加载失败。请通过本地 http 打开，或点「新标签打开」。</p>`;
    } else if (showMatches) {
      const blocks = collectMatchBlocks(doc.text, terms, 12);
      htmlBody = `<p class="doc-search-status">共 ${blocks.length} 处关键匹配（非全文）</p>`
        + renderMatchBlocksHtml(blocks, terms);
      modeToggle = `<button type="button" data-doc-show-full>查看全文</button>`;
    } else if (typeof marked !== "undefined" && marked.parse) {
      htmlBody = marked.parse(doc.text, { gfm: true, breaks: false });
      if (terms.length) {
        modeToggle = `<button type="button" data-doc-show-matches>只看匹配</button>`;
      }
    } else {
      htmlBody = `<pre>${escapeHtml(doc.text)}</pre>`;
      if (terms.length) modeToggle = `<button type="button" data-doc-show-matches>只看匹配</button>`;
    }

    els.body.innerHTML = `
      <div class="doc-reader-bar">
        <button type="button" data-doc-back>← 返回</button>
        <span class="doc-name" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        ${modeToggle}
        <a href="${escapeHtml(viewer)}" target="_blank" rel="noopener">新标签打开</a>
      </div>
      <article class="doc-reader md${showMatches ? " doc-reader-matches" : ""}">${htmlBody}</article>
    `;
  }

  function renderBody() {
    if (!els.body) return;
    if (!state.indexReady) {
      els.body.innerHTML = `<p class="doc-search-status">正在加载文档索引…</p>`;
      ensureIndex().then(() => {
        if (state.open) renderBody();
      });
      return;
    }
    if (state.mode === "reader" && state.readingFile) {
      openReader(state.readingFile);
      return;
    }
    const useContext = !state.userDirty && state.contextKey;
    if (useContext) {
      const hits = searchContextHits();
      const cards = buildPageRuleCards(7);
      els.body.innerHTML = renderPageExplainHtml()
        + renderPageLineageHtml()
        + renderRuleCardsHtml(cards)
        + renderRelatedDocsHtml(hits);
      return;
    }
    const q = (els.input?.value || state.query || "").trim();
    if (!q) {
      els.body.innerHTML = renderCatalog();
      return;
    }
    const { hits } = searchDocs(q, "and");
    const terms = q.split(/\s+/).filter(Boolean);
    els.body.innerHTML = `<p class="doc-search-status">共 ${hits.length} 篇</p>` + renderHits(hits, terms, { context: false });
  }

  /**
   * 由 app.js render() 调用
   * @param {{ key: string, title: string, keywords?: string[], explain?: object }} ctx
   */
  function setContext(ctx) {
    ensureDom();
    const key = ctx?.key || "";
    const title = ctx?.title || "";
    const keywords = (ctx?.keywords && ctx.keywords.length)
      ? ctx.keywords
      : (Cat()?.keywordsForView(key, title) || (title ? [title] : []));
    const explain = ctx?.explain || null;

    const changed = key !== state.contextKey || title !== state.contextTitle
      || JSON.stringify(explain) !== JSON.stringify(state.contextExplain);
    state.contextKey = key;
    state.contextTitle = title;
    state.contextKeywords = keywords;
    state.contextExplain = explain;

    if (!changed && state.indexReady) {
      refreshContextMatches();
      updateContextBar();
      return;
    }

    updateContextBar();
    ensureIndex().then(() => {
      refreshContextMatches();
      if (state.open && !state.userDirty) {
        applyContextQuery(true);
      } else if (state.open && state.userDirty) {
        updateContextBar();
      }
    });
  }

  function init() {
    if (!Cat()) {
      console.warn("[DocSearch] DocCatalog missing");
      return;
    }
    ensureDom();
    // 登录门禁时仍可显示竖条，便于评审查文档
    ensureIndex();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  global.DocSearchPanel = { setContext, setOpen, ensureIndex };
})(typeof window !== "undefined" ? window : globalThis);
