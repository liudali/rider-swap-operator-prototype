# 低电外呼提醒用户端原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立“低电外呼提醒方案”独立项目，交付方案一的小程序用户端 PRD、可交互原型和可执行验收标准。

**Architecture:** 原型采用无构建依赖的静态 HTML/CSS/JavaScript。`state.js` 维护通讯录保存状态机，`app.js` 只负责渲染和交互绑定；浏览器原生打开即可演示，Node 内置测试运行器验证状态迁移和页面契约。

**Tech Stack:** HTML5、CSS3、原生 JavaScript、macOS JavaScriptCore（`osascript`）、Python `unittest`；Node.js `node:test` 作为开发环境等价测试

## Global Constraints

- 固定外呼号码为全平台唯一号码；当前号码由外呼服务商分配。
- 小程序只通过 `wx.addPhoneContact` 发起写入，必须由用户授权并在系统联系人页确认。
- 联系人名称使用“智格低电量提醒”，不宣称小程序可读取或持续校验用户通讯录。
- 首次领取电池成功后只主动引导一次；取消或拒绝后保留“我的－来电提醒”手动入口。
- 原型必须覆盖导航、弹窗、表单、状态列表、Mock 数据、空态、错误态及号码变更态。
- 不实现真实微信 API、真实外呼、运营商来显认证、短信或订阅消息。

---

### Task 1: 锁定产品规格和决策

**Files:**
- Create: `低电外呼提醒方案/docs/PRD.md`
- Create: `低电外呼提醒方案/decisions/decision-001.md`
- Create: `低电外呼提醒方案/decisions/counter.json`

**Interfaces:**
- Consumes: 已确认的固定号码模式、服务商号码权属、方案一范围。
- Produces: 页面字段、状态枚举、主异常流程、埋点和成功指标，供原型与验收标准复用。

- [ ] **Step 1: 编写 PRD**

PRD 明确首次领电成功引导、手动入口、微信授权、系统新增/合并联系人、成功、取消、拒绝、API 不支持、号码更新八类流程。

- [ ] **Step 2: 编写决策卡片**

记录“通讯录保存作为 P0；运营商来显不进入本项目”的支持理由、反方论据、失效条件和下一步验证。

- [ ] **Step 3: 自检规格**

检索 `TBD|TODO|待补充`，预期无匹配；逐页确认均列出字段、枚举、空态、错误态、权限差异。

### Task 2: 以测试定义提醒状态机

**Files:**
- Create: `低电外呼提醒方案/tests/reminder-state.jxa.js`
- Create: `低电外呼提醒方案/tests/reminder-state.test.cjs`
- Create: `低电外呼提醒方案/prototype/state.js`

**Interfaces:**
- Produces:
  - `REMINDER_CONTACT`
  - `createInitialState(overrides?)`
  - `transition(state, event)`
  - `shouldAutoPrompt(state)`
  - `deriveReminderStatus(state)`

- [ ] **Step 1: 写失败测试**

```js
test('首次领电成功且从未引导时自动弹出保存提醒', () => {
  const state = createInitialState({ hasBattery: false });
  const next = transition(state, { type: 'FIRST_PICKUP_SUCCESS' });
  assert.equal(next.overlay, 'intro');
});

test('用户拒绝授权后不标记为已保存', () => {
  const next = transition(createInitialState(), { type: 'PERMISSION_DENIED' });
  assert.equal(next.saveStatus, 'permission_denied');
  assert.equal(next.savedNumberVersion, null);
});

test('号码版本变化后状态为需要更新', () => {
  const saved = createInitialState({
    saveStatus: 'saved',
    savedNumberVersion: 'v1',
    currentNumberVersion: 'v2'
  });
  assert.equal(deriveReminderStatus(saved).key, 'outdated');
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `osascript -l JavaScript "$PWD/tests/reminder-state.jxa.js" "$PWD/prototype/state.js"`

Expected: FAIL，原因是 `prototype/state.js` 尚不存在。

- [ ] **Step 3: 实现最小状态机**

事件至少包括 `FIRST_PICKUP_SUCCESS`、`OPEN_REMINDER`、`START_SAVE`、`PERMISSION_ALLOWED`、`PERMISSION_DENIED`、`CHOOSE_NEW`、`CHOOSE_EXISTING`、`SYSTEM_CANCELLED`、`SAVE_CONFIRMED`、`DISMISS_INTRO`、`NUMBER_UPDATED`、`RESET_DEMO`。

- [ ] **Step 4: 运行测试并确认 GREEN**

Run: `osascript -l JavaScript "$PWD/tests/reminder-state.jxa.js" "$PWD/prototype/state.js"`

Expected: 所有状态迁移测试通过，0 failure。

### Task 3: 以页面契约驱动可交互原型

**Files:**
- Create: `低电外呼提醒方案/tests/prototype_contract_test.py`
- Create: `低电外呼提醒方案/prototype/index.html`
- Create: `低电外呼提醒方案/prototype/styles.css`
- Create: `低电外呼提醒方案/prototype/app.js`

**Interfaces:**
- Consumes: `window.ReminderState`。
- Produces: `renderApp()`、`dispatch(event)`，以及由 `data-action` 声明的交互入口。

- [ ] **Step 1: 写失败的页面契约测试**

测试 HTML 必须包含：

```js
[
  'data-tab="home"',
  'data-tab="mine"',
  'data-action="start-save"',
  'data-action="allow-permission"',
  'data-action="deny-permission"',
  'data-action="confirm-system-save"',
  'id="system-contact-form"',
  'id="event-log-table"'
]
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `python3 -m unittest tests/prototype_contract_test.py`

Expected: FAIL，原因是 `prototype/index.html` 尚不存在。

- [ ] **Step 3: 实现用户端页面**

实现首页低电卡、首次领电成功页、“我的”页、来电提醒设置页，以及页面底部三 Tab 导航。

- [ ] **Step 4: 实现弹层和系统页模拟**

实现保存说明底部弹层、微信通讯录写入授权弹窗、新增/合并联系人选择、系统联系人表单、保存成功、取消、拒绝和不支持提示。

- [ ] **Step 5: 实现场景控制台和 Mock 事件表**

提供“首次领电、手动设置、拒绝授权、已保存、号码已更新、低电来电”场景切换；记录时间、事件、结果和关键属性。

- [ ] **Step 6: 运行页面契约测试并确认 GREEN**

Run: `python3 -m unittest tests/prototype_contract_test.py`

Expected: 页面契约测试全部通过，0 failure。

### Task 4: 编写验收与项目说明

**Files:**
- Create: `低电外呼提醒方案/acceptance-criteria.md`
- Create: `低电外呼提醒方案/README.md`

**Interfaces:**
- Consumes: PRD 页面状态和原型操作。
- Produces: 可由产品、开发、测试逐项执行的 Given/When/Then 验收清单。

- [ ] **Step 1: 编写验收标准**

覆盖正常流程、重复引导控制、权限拒绝、系统取消、API 不支持、号码变更、埋点、隐私和响应式展示。

- [ ] **Step 2: 编写 README**

写明目录、打开方式、测试命令、Mock 范围及开发接入注意事项。

### Task 5: 完整验证

**Files:**
- Verify: `低电外呼提醒方案/**`

- [ ] **Step 1: 运行全部测试**

Run: `osascript -l JavaScript "$PWD/tests/reminder-state.jxa.js" "$PWD/prototype/state.js" && python3 -m unittest tests/prototype_contract_test.py`

Expected: 全部通过，0 failure。

- [ ] **Step 2: 检查 HTML、CSS、JavaScript 语法和引用**

Run: `osascript -l JavaScript "$PWD/tests/reminder-state.jxa.js" "$PWD/prototype/state.js" && osascript -l JavaScript "$PWD/prototype/app.js"`

Expected: exit 0。

- [ ] **Step 3: 检查文档占位符和关键交付物**

Run: `test -f docs/PRD.md && test -f prototype/index.html && test -f acceptance-criteria.md && ! rg -n "TBD|TODO|待补充" docs/PRD.md acceptance-criteria.md decisions/decision-001.md`

Expected: exit 0。

- [ ] **Step 4: 按验收标准复核需求**

确认每个页面都有字段、枚举、空态、错误态、权限差异；确认原型包含导航、弹窗、表单、状态列表、Mock 数据和事件表。
