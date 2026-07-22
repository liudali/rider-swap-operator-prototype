# 骑手用户端 · 双故事线主线 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让骑手端文档与原型按个人套餐（P01–P09）与人天池（C01–C08）双故事线讲清完整生命周期，并默认收纳非主线身份。

**Architecture:** 在单文件 `prototype/mobile/index.html` 内把左侧「演示控制台」改成「主线导览」：用 `MAINLINE` 配置驱动步骤状态（角色、站点、geo、是否打开 overlay）。重写 `docs/骑手端PRD.md` 为单一阅读入口；验收按 Pxx/Cxx 勾稽。不拆后台、不接真实 SDK。

**Tech Stack:** 静态 HTML/CSS/JavaScript（骑手端单文件）、Python `unittest` 静态回归、`scripts/sync-pages.sh`、本地 `python3 main.py`。

## Global Constraints

- 信息组织必须是**双故事线导览**（个人 + 人天池），不是共享主干或纯状态地图。
- 演示台**默认只暴露**两条主线；设备租赁 / 骑士卡等标「二期」并折叠。
- 人天池用户端从**权益到账**开始；渠道采购→登记→分配仅文档前置。
- 步骤编号固定：`P01–P09`、`C01–C08`；与设计文档一致。
- 图例符号与服务卡颜色语义见设计文档 §4，文档与原型共用。
- 真源：`docs/*.md` + `prototype/`；改完后必须 `sync-pages.sh`。
- 本仓库若无 `.git`，跳过 commit 步骤，仅保证测试与本地预览通过。

## File map

| 文件 | 职责 |
|------|------|
| `tests/test_rider_user_mainline.py` | 静态断言：导览结构、默认证件、PRD/验收含 P/C 编号 |
| `docs/骑手端PRD.md` | 用户端单一入口：图例、双故事线、页面规格 |
| `docs/acceptance-criteria.md` | 骑手端章节按 Pxx/Cxx 增补 |
| `prototype/mobile/index.html` | 主线导览 UI + 步骤状态机 + 结果页/权限微调 |
| `docs/原型变更记录.md` | sync `-l` 写入变更说明（脚本自动或手补） |
| `docs/superpowers/specs/2026-07-17-rider-user-mainline-design.md` | 只读规格，实施中不改决策 |

---

### Task 1: 静态回归测试脚手架

**Files:**
- Create: `tests/test_rider_user_mainline.py`

**Interfaces:**
- Produces: 失败测试套件，约束后续 HTML/文档改动
- Consumes: 设计文档步骤编号约定

- [ ] **Step 1: 编写失败测试**

```python
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MOBILE = (ROOT / "prototype/mobile/index.html").read_text(encoding="utf-8")
PRD = (ROOT / "docs/骑手端PRD.md").read_text(encoding="utf-8")
AC = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")


class RiderUserMainlineTests(unittest.TestCase):
    def test_mainline_story_keys_exist(self):
        self.assertIn("MAINLINE", MOBILE)
        self.assertIn('story: "personal"', MOBILE)
        self.assertIn('story: "channel"', MOBILE)

    def test_personal_steps_p01_p09(self):
        for step in [f"P0{i}" for i in range(1, 10)]:
            self.assertIn(step, MOBILE)
            self.assertIn(step, PRD)

    def test_channel_steps_c01_c08(self):
        for step in [f"C0{i}" for i in range(1, 9)]:
            self.assertIn(step, MOBILE)
            self.assertIn(step, PRD)

    def test_demo_panel_has_mainline_guide(self):
        self.assertIn("主线导览", MOBILE)
        self.assertIn("id=\"mainlineSteps\"", MOBILE)
        self.assertIn("id=\"btnMainlineNext\"", MOBILE)
        self.assertIn("补充场景", MOBILE)

    def test_default_role_is_mainline_personal(self):
        self.assertRegex(MOBILE, r'role:\s*"personal"')
        self.assertIn('option value="personal" selected', MOBILE)

    def test_phase2_roles_marked_supplement(self):
        self.assertIn("二期", MOBILE)
        self.assertIn("lease_whitelist", MOBILE)

    def test_channel_swap_shows_day_confirm(self):
        self.assertIn("今日已确认", MOBILE)

    def test_acceptance_has_pxx_cxx(self):
        self.assertIn("P01", AC)
        self.assertIn("C06", AC)
```

- [ ] **Step 2: 运行测试确认失败**

```bash
cd 原型-外卖 && python3 -m unittest tests/test_rider_user_mainline.py -v
```

Expected: 多个 FAIL（尚无 `MAINLINE` / PRD 未含完整步骤表）。

- [ ] **Step 3: 若有 git 则提交测试文件；否则跳过**

```bash
# 仅当 git rev-parse 成功时执行
git add tests/test_rider_user_mainline.py
git commit -m "test: add rider user mainline static regression scaffolding"
```

---

### Task 2: 重写骑手端 PRD（双故事线 + 图例 + 页面规格）

**Files:**
- Modify: `docs/骑手端PRD.md`（整文件重写结构，可保留文末「非本期」与演示身份表）
- Modify: `tests/test_rider_user_mainline.py`（若需放宽/对齐文案断言）

**Interfaces:**
- Produces: 开发可读的单一入口文档，步骤与设计文档一致
- Consumes: 设计文档 §4–§8；现有 `个人套餐定价与退款.md`、`天数池.md`、`渠道骑手可换电校验.md`、`用户-运营商归属模型.md` 链接

- [ ] **Step 1: 按下列大纲重写 `docs/骑手端PRD.md`**

必须包含章节（标题可微调，内容不可缺）：

1. 定位与两类用户表（个人套餐 / 渠道人天）
2. **图例**（设计文档 §4 全表 + 服务卡颜色）
3. 信息架构（三 Tab）
4. **主线一 P01–P09**（每步：前置、操作、成功、异常入口）
5. **主线二 C01–C08**（含 ■ 前置说明：采购/登记/分配不在本端演示）
6. 页面规格：首页、扫码、我的服务卡、服务购买、订单三 Tab  
   - 每页表格列：字段 | 枚举 | 空态 | 错误态 | 个人 vs 人天池权限差异
7. 补充场景清单（个人 / 人天池 / 二期）
8. 演示身份表：主线默认 + 补充场景分组（勿把二期写进「主线默认」）
9. 与后台对齐表 + 非本期 + 关键埋点（对齐 `最小埋点清单.md` 中骑手相关项）

P04 SKU 必须写清：方案 B；1天/单次为默认套餐（渠道兜底）；自然日 vs 24h 口径链到 `个人套餐定价与退款.md`。

- [ ] **Step 2: 自查无「站点绑定用户」、无「站点覆盖价」旧表述**

```bash
rg -n "绑定站点|站点新人|方案 A" docs/骑手端PRD.md || true
```

Expected: 无过时绑定/站点新人规则（若提及须标注已废弃）。

- [ ] **Step 3: 跑测试（PRD 相关应开始通过）**

```bash
python3 -m unittest tests.test_rider_user_mainline.RiderUserMainlineTests.test_personal_steps_p01_p09 \
  tests.test_rider_user_mainline.RiderUserMainlineTests.test_channel_steps_c01_c08 -v
```

Expected: PASS（PRD 断言）；MOBILE 相关仍可 FAIL。

---

### Task 3: 原型左侧改为主线导览（结构 + 数据）

**Files:**
- Modify: `prototype/mobile/index.html`（`<aside class="demo-panel">` 区块约 L353–400；`<style>` 增补导览样式；`<script>` 顶部增 `MAINLINE`）

**Interfaces:**
- Produces:
  - `state.mainline = { story: "personal"|"channel", stepId: "P01"|"C01"|... }`
  - `MAINLINE.personal.steps[]` / `MAINLINE.channel.steps[]`，每项：
    ```js
    { id, title, role, scanSite?, geo?, hint, autoOpen? }
    // autoOpen: null | "pkg" | "scan" | "kyc" | "opPick" | "mine"
    ```
- Consumes: 现有 `USERS`、`applyDemo` 逻辑

- [ ] **Step 1: 在 `state` 中增加**

```javascript
mainline: { story: "personal", stepId: "P06" },
```

默认故事线个人、默认落在「日常换电」便于打开即看核心能力；首次走查可用「跳到 P01」。

- [ ] **Step 2: 定义 `MAINLINE` 配置（完整写入 HTML）**

个人线至少映射：

| id | role | 备注 |
|----|------|------|
| P01 | guest | 未登录 |
| P02 | none | kyc false（登录后） |
| P03 | none | geo 可切 |
| P04 | none | kyc true；autoOpen pkg |
| P05 | pending_pickup | autoOpen scan |
| P06 | personal | holdsBattery true |
| P07 | personal | hint 续费 |
| P08 | frozen / 或 personal→演示冻结 | 可用 frozen |
| P09 | cooling_refund | 退款 |

人天池线：

| id | role |
|----|------|
| C01 | guest（切 channel 故事线后的登录）或 channel 说明从已登录演示 |
| C02–C05 | channel |
| C06 | channel_fail |
| C07 | 新增或复用字段：`channelResigned: true` + holdsBattery |
| C08 | 还电后完结态 |

C01 推荐：故事线切换到 channel 时若 step=C01 则用 `guest`，下一步应用到 `channel`。  
C07：在 `USERS` 增加 `channel_resign`：

```javascript
channel_resign: {
  loggedIn: true, phone: "136****2110", name: "孙骑手", userId: "U2110",
  kyc: true, entitlement: "渠道人天", pkg: "人天额度", remainingDays: 0,
  status: "已离职", operator: "OP-SX", homeSite: "ST-SH-02",
  channel: "顺丰同城渠道", team: "世博车队", poolId: "QP-2601",
  holdsBattery: true, channelResigned: true
},
```

- [ ] **Step 3: 重写 aside 结构**

替换原「登录身份」大 select 为：

```html
<aside class="demo-panel">
  <h2>主线导览</h2>
  <div class="story-tabs">
    <button type="button" data-story="personal" class="active">个人套餐</button>
    <button type="button" data-story="channel">人天池</button>
  </div>
  <ol id="mainlineSteps" class="mainline-steps"></ol>
  <p id="mainlineHint" class="mainline-hint"></p>
  <div class="mainline-actions">
    <button type="button" id="btnMainlinePrev">上一步</button>
    <button type="button" class="primary" id="btnMainlineNext">下一步</button>
  </div>
  <details class="supplement-details">
    <summary>补充场景</summary>
    <!-- 原 demoRole 选项按组：个人异常 / 人天池异常 / 二期 -->
    <label>场景身份</label>
    <select id="demoRole">...</select>
    <label>扫码站点</label>
    <select id="demoSite">...</select>
    <label>定位场景</label>
    <select id="demoGeo">...</select>
    <label><input type="checkbox" id="policyCrossNet" checked /> 允许跨网换电</label>
    <button type="button" class="primary" id="applyDemo">应用补充场景</button>
  </details>
  <p><a href="../index.html">← 返回运营商后台原型</a></p>
  <p><a id="navDocsLink" href="../docs/index.html">📄 产品文档</a></p>
</aside>
```

`demoRole` 的 `selected` 保持 `personal`。二期 option 文案前缀 `⋯ 二期 ·`。

- [ ] **Step 4: CSS**

为 `.story-tabs`、`.mainline-steps`、`.mainline-steps li.active`、`.supplement-details` 增加紧凑样式（延续现有 `--blue`，勿引入紫粉默认 AI 风）。

- [ ] **Step 5: 实现 `renderMainlineSteps()`**

根据 `state.mainline.story` 渲染步骤列表；点击步骤调用 `applyMainlineStep(id)`。

- [ ] **Step 6: 跑测试**

```bash
python3 -m unittest tests/test_rider_user_mainline.py -v
```

Expected: `test_demo_panel_has_mainline_guide`、`test_mainline_story_keys_exist`、步骤存在类断言 PASS；`今日已确认` 等可能仍 FAIL。

---

### Task 4: 步骤应用逻辑（上一步 / 下一步 / 切故事线）

**Files:**
- Modify: `prototype/mobile/index.html`（script 区）

**Interfaces:**
- Produces: `applyMainlineStep(stepId)`、`goMainline(delta)`、故事线切换 handler
- Consumes: `MAINLINE`、现有 `applyDemo` 内重置 session / render 逻辑

- [ ] **Step 1: 实现 `applyMainlineStep`**

```javascript
function applyMainlineStep(stepId) {
  const story = state.mainline.story;
  const steps = MAINLINE[story].steps;
  const step = steps.find(s => s.id === stepId);
  if (!step) return;
  state.mainline.stepId = stepId;
  state.role = step.role;
  if (step.scanSite) {
    state.scanSite = step.scanSite;
    document.getElementById("demoSite").value = step.scanSite;
  }
  if (step.geo) {
    state.geoScenario = step.geo;
    document.getElementById("demoGeo").value = step.geo;
  }
  document.getElementById("demoRole").value = step.role;
  resetSessionContext();
  // card_link / launch 等按角色补 session（复用 applyDemo 内分支）
  renderMainlineSteps();
  document.getElementById("mainlineHint").textContent = step.hint || "";
  renderMine();
  renderOrders();
  renderMapPins();
  closeOverlay("overlayScan");
  closeOverlay("overlayPkg");
  if (step.autoOpen === "pkg") openPurchaseFlow();
  else if (step.autoOpen === "scan") startScan();
  else if (step.autoOpen === "kyc") openOverlay("overlayKyc");
  else if (step.autoOpen === "mine") switchTab("mine");
  toast("主线 " + stepId + " · " + step.title);
}
```

- [ ] **Step 2: 绑定按钮**

```javascript
document.getElementById("btnMainlineNext").onclick = () => goMainline(1);
document.getElementById("btnMainlinePrev").onclick = () => goMainline(-1);
document.querySelectorAll("[data-story]").forEach(btn => {
  btn.onclick = () => {
    state.mainline.story = btn.dataset.story;
    const first = MAINLINE[state.mainline.story].steps[0].id;
    applyMainlineStep(first);
  };
});
```

`goMainline(delta)`：在当前 `steps` 数组中按 index ±1，边界 toast「已到起点/终点」。

- [ ] **Step 3: 保留 `applyDemo` 供补充场景**；应用后将 `state.mainline.stepId` 置空或标 `supplement`，步骤列表取消高亮。

- [ ] **Step 4: 人天池权限：隐藏主购套餐入口**

在 `renderMine` 常用功能网格中：

```javascript
const hideBuy = u.entitlement === "渠道人天" && !u.preOccupyFail;
// hideBuy 时不渲染「购买套餐」grid-item；预占失败仍靠服务卡「自费换电」
```

- [ ] **Step 5: 浏览器手测清单（本地）**

```bash
cd 原型-外卖 && python3 main.py
# 打开 http://127.0.0.1:8766/prototype/mobile/index.html
```

手测：个人线 P01→P09 可点下一步；人天池 C01→C08；补充场景折叠内仍可切 `lease_whitelist`。

---

### Task 5: 结果页图例、完结态、设置页对齐

**Files:**
- Modify: `prototype/mobile/index.html`（`showScanResult`、`renderMine`、设置 select、`mapLegend`）

**Interfaces:**
- Produces: 渠道换电成功文案含「今日已确认」；灰态服务卡；设置页身份与控制台一致

- [ ] **Step 1: 修改 `showScanResult` 成功分支**

当 `user().entitlement === "渠道人天"` 且非兜底失败路径时，成功详情追加：

```html
<br><small>✓ 今日人天：已确认消耗（同日不重复扣）</small>
```

自费兜底成功则写：`渠道兜底自费 · 不扣渠道池`。

- [ ] **Step 2: 服务卡完结态**

对 `status === "已离职"` 或 `channelResigned`：

```javascript
card = `<div class="service-card done"><div><h3>服务已完结</h3>
  <p>${u.channel || ""} · 剩余人天已回池 · 不向骑手退款</p></div></div>`;
```

CSS：

```css
.service-card.done { background: linear-gradient(135deg, #8a94a6, #5c6575); }
```

- [ ] **Step 3: 地图图例**

在非专属站场景显示固定文案：

```text
图例：蓝色钉 = 可换电站 · 扫一扫换电
```

- [ ] **Step 4: 设置页 `#settingsRole`**

与补充场景 select 分组对齐，补全 `pending_pickup`、`channel_resign`；二期选项带 `⋯` 前缀。

- [ ] **Step 5: 跑全量静态测试**

```bash
python3 -m unittest tests/test_rider_user_mainline.py -v
```

Expected: 全部 PASS。

---

### Task 6: 验收标准按 Pxx/Cxx 增补

**Files:**
- Modify: `docs/acceptance-criteria.md` §「骑手端（移动端）」（约 L400 起）

**Interfaces:**
- Produces: 与 PRD/原型步骤编号勾稽的验收表
- Consumes: Task 2 PRD 步骤表

- [ ] **Step 1: 在骑手端章节顶部插入「主线导览」表**

| 模块 | 验收项 | 预期 |
|------|--------|------|
| 导览 | 故事线 | 可切换个人套餐 / 人天池；默认非二期身份 |
| 导览 | P01–P09 | 下一步可连续演示至退款/完结相关态 |
| 导览 | C01–C08 | 含预占失败自费（C06）与离职回池文案（C07/C08） |
| 导览 | 补充场景 | 折叠；内含二期身份且标注 |
| 图例 | 服务卡 | 蓝个人 / 紫渠道 / 橙警告 / 灰完结 |
| 扫码 | 人天确认 | 渠道换电成功页展示「今日已确认」 |
| 权限 | 人天池无主购 | 渠道人天服务中不展示「购买套餐」主入口 |

- [ ] **Step 2: 将原「演示台 · 身份切换」行改为**

「主线默认证件 + 补充场景折叠内身份；二期不计入一期必测」。

- [ ] **Step 3: 设备租赁 / 骑士卡行目标注「补充场景 · 二期」**，不删。

- [ ] **Step 4: 跑测试**

```bash
python3 -m unittest tests.FAKESECRET_g1h2i3j4k5l6m7n8o9p0 -v
```

Expected: PASS。

---

### Task 7: 同步 Pages 镜像并走查

**Files:**
- Modify via script: `docs/mobile/`、`docs/documentation/md/骑手端PRD.md`、`prototype/docs/md/` 等镜像
- Optionally: `docs/原型变更记录.md`

**Interfaces:**
- Consumes: Task 2–6 全部真源改动

- [ ] **Step 1: 同步**

```bash
cd 原型-外卖 && ./scripts/sync-pages.sh -l "骑手端双故事线主线：导览+PRD+验收"
```

Expected: 退出码 0；`docs/mobile/index.html` 含 `主线导览`。

- [ ] **Step 2: 全量相关测试**

```bash
python3 -m unittest tests/test_rider_user_mainline.py -v
```

Expected: OK。

- [ ] **Step 3: 人工走查清单（打勾记入变更记录或 PR 描述）**

- [ ] 个人：P01 登录 → P04 购套餐 → P05 领电 → P06 换电 → P08 冻结解冻 → P09 冷静期申请  
- [ ] 人天池：C02 权益卡 → C05 换电见「今日已确认」→ C06 自费兜底 → C07/C08 离职完结  
- [ ] 补充场景折叠打开后 `personal_cross3` 仍可用  
- [ ] 文档浏览器可打开新版 `骑手端PRD.md`

- [ ] **Step 4: 询问用户是否提交并推送在线版**（规则要求；未要求则不 push）

---

## Spec coverage checklist（自检）

| 设计要求 | Task |
|----------|------|
| 双故事线导览 | 3, 4 |
| P01–P09 / C01–C08 | 2, 3, 6 |
| 补充场景折叠 + 二期收纳 | 3, 6 |
| 图例与服务卡颜色 | 2, 5 |
| 人天池从权益到账起 | 2, 3 |
| 换电成功展示确认消耗 | 5 |
| 页面字段/空态/错误/权限 | 2 |
| 验收 Pxx/Cxx | 6 |
| sync-pages | 7 |
| Non-goals（不改后台/不接 SDK） | 全任务不触碰 `app.js` 后台主逻辑 |

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-17-rider-user-mainline.md`.

**Two execution options:**

1. **Subagent-Driven（推荐）** — 每任务派生子代理，任务间复查  
2. **Inline Execution** — 本会话按 executing-plans 连续执行并设检查点  

Which approach?
*** End Patch
