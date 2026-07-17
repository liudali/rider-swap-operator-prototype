# 人天额度池 · 额度明细并入额度池 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 移除人天额度池顶层「额度明细」，将其作为「额度池」页面内的二级 Tab。

**Architecture:** 保留 `dayPoolTab="pools"` 作为顶层状态，新增 `dayPoolPoolsSubTab` 区分列表与明细。复用现有 `innerTabSidebar()`、`dayPool_ledger` 筛选和账本渲染，不修改账本数据与计算逻辑。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Python `unittest` 静态回归测试、Bash 同步脚本、GitHub Pages。

## Global Constraints

- 顶层 Tab 不再出现独立「额度明细」。
- 额度池页内 Tab 为「额度池列表 / 额度明细」。
- 额度明细默认展示全部额度池，不继承列表选择。
- 旧 `dayPoolTab="ledger"` 必须兼容。
- 团队管理员仍固定进入消耗明细。
- 不修改额度账本字段、流水类型或计算口径。

---

### Task 1: 状态、筛选键与顶层导航收拢

**Files:**
- Create: `tests/test_day_pool_ledger_merge.py`
- Modify: `prototype/js/app.js:1-20`
- Modify: `prototype/js/app.js:724-735`
- Modify: `prototype/js/app.js:13987-14010`

**Interfaces:**
- Produces: `state.dayPoolPoolsSubTab`，枚举 `list | ledger`。
- Consumes: `dayPool_pools`、`dayPool_ledger` 现有 PF 配置。

- [ ] **Step 1: 编写失败测试**

```python
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")


class DayPoolLedgerMergeTests(unittest.TestCase):
    def test_state_has_pool_subtab(self):
        self.assertIn('dayPoolPoolsSubTab: "list"', APP)

    def test_pf_key_switches_between_pool_list_and_ledger(self):
        self.assertIn('state.dayPoolPoolsSubTab === "ledger"', APP)
        self.assertIn('return "dayPool_ledger"', APP)

    def test_top_level_tabs_do_not_include_ledger(self):
        tabs_block = APP.split('const tabs = isOrgAdminLogin()', 1)[1].split(
            'const sidebar', 1
        )[0]
        self.assertNotIn('["ledger", "额度明细"]', tabs_block)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py -v
```

Expected: 3 tests FAIL。

- [ ] **Step 3: 新增页内状态**

在 `state` 中加入：

```javascript
dayPoolPoolsSubTab: "list",
```

- [ ] **Step 4: 调整 PF 键**

将 `pfKey()` 的 dayPool 分支改为：

```javascript
if (state.view === "dayPool") {
  if (state.dayPoolTab === "pools" && state.dayPoolPoolsSubTab === "ledger") return "dayPool_ledger";
  return "dayPool_" + state.dayPoolTab;
}
```

- [ ] **Step 5: 移除顶层 ledger Tab**

顶层 `tabs` 数组删除：

```javascript
["ledger", "额度明细"]
```

- [ ] **Step 6: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py -v
```

Expected: 3 tests PASS。

---

### Task 2: 页内 Tab、账本复用与旧状态兼容

**Files:**
- Modify: `prototype/js/app.js:13987-14370`
- Modify: `prototype/js/app.js:14599-14612`
- Modify: `tests/test_day_pool_ledger_merge.py`

**Interfaces:**
- Produces: `data-dppools-sub=list|ledger` 页内导航。
- Consumes: `innerTabSidebar()`、`dayPoolLedger`、`dayPool_ledger` 筛选。

- [ ] **Step 1: 扩展失败测试**

```python
def test_pool_page_has_list_and_ledger_inner_tabs(self):
    self.assertIn('["list", "额度池列表"]', APP)
    self.assertIn('["ledger", "额度明细"]', APP)
    self.assertIn('"dppools-sub"', APP)

def test_legacy_ledger_state_redirects_to_pool_subtab(self):
    self.assertIn('state.dayPoolTab === "ledger"', APP)
    self.assertIn('state.dayPoolTab = "pools"', APP)
    self.assertIn('state.dayPoolPoolsSubTab = "ledger"', APP)

def test_pool_subtab_click_updates_only_inner_state(self):
    self.assertIn("[data-dppools-sub]", APP)
    self.assertIn("state.dayPoolPoolsSubTab", APP)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py -v
```

Expected: 页内 Tab、兼容和点击绑定测试 FAIL。

- [ ] **Step 3: 增加旧状态兼容**

在 `renderDayPool()` 获取筛选前加入：

```javascript
if (state.dayPoolTab === "ledger") {
  state.dayPoolTab = "pools";
  state.dayPoolPoolsSubTab = "ledger";
}
```

- [ ] **Step 4: 渲染额度池页内 Tab**

`tab === "pools"` 时先构建：

```javascript
const poolSubTab = state.dayPoolPoolsSubTab || "list";
const poolSubSidebar = innerTabSidebar(
  [["list", "额度池列表"], ["ledger", "额度明细"]],
  poolSubTab,
  "dppools-sub"
);
```

页面内容使用：

```javascript
body = `${poolSubSidebar}${poolSubTab === "ledger" ? ledgerHtml : poolListHtml}`;
```

- [ ] **Step 5: 复用额度明细账本**

将原 `tab === "ledger"` 分支内容移动到 `poolSubTab === "ledger"`：

- 筛选仍读取 `getPf()`，此时 `pfKey()` 返回 `dayPool_ledger`。
- 保留额度池、类型过滤。
- 空态文案改为“当前筛选条件下暂无额度变动”。
- 不读取 `dayPoolSelectedId`，因此默认展示全部额度池。

- [ ] **Step 6: 绑定页内 Tab 点击**

在 `bindPageDynamicControls()` 增加：

```javascript
root.querySelectorAll("[data-dppools-sub]").forEach(btn => {
  btn.onclick = () => {
    state.dayPoolPoolsSubTab = btn.dataset.dppoolsSub;
    render();
  };
});
```

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py -v
```

Expected: 全部测试 PASS。

---

### Task 3: 文档、决策资产、同步与浏览器验收

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/天数池.md`
- Modify: `docs/acceptance-criteria.md`
- Modify: `docs/角色与功能清单.md`
- Create: `decisions/decision-039.md`
- Modify: `decisions/counter.json`
- Modify (generated): `prototype/docs/md/*`
- Modify (generated): `docs/documentation/md/*`
- Modify (generated): `docs/js/app.js`
- Modify: `docs/原型变更记录.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-17-day-pool-ledger-merge-design.md`。
- Produces: 原型与文档统一为 8 个顶层 Tab + 2 个额度池页内 Tab。

- [ ] **Step 1: 增加文档失败测试**

```python
def test_docs_describe_nested_pool_ledger_tabs(self):
    prd = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
    quota = (ROOT / "docs/天数池.md").read_text(encoding="utf-8")
    acceptance = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")
    self.assertIn("8 个顶层 Tab", prd)
    self.assertIn("额度池列表 / 额度明细", quota)
    self.assertIn("页内 Tab", acceptance)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py -v
```

Expected: 文档断言 FAIL。

- [ ] **Step 3: 更新核心文档**

- PRD：人天额度池改为 8 个顶层 Tab；额度池含“额度池列表 / 额度明细”。
- 天数池：更新后台能力表，额度池行说明包含列表与账本；删除独立时长账本行。
- 验收：更新 Tab 数量、默认全部额度池、独立筛选和旧入口兼容。
- 角色清单：人天额度池描述增加页内额度明细。

- [ ] **Step 4: 写入决策资产**

创建 `decision-039.md`：

```markdown
# 决策卡片 039 · 额度明细并入额度池页内 Tab

- 日期：2026-07-17
- 结论：移除顶层额度明细；额度池页内设列表/明细，明细默认全部额度池。
- 支持理由：减少顶层导航，列表与账本同属额度池任务。
- 反对理由：增加一层页内导航。
- 失效条件：账本需要独立权限或深链运营时恢复顶层入口。
- Non-goals：不改账本数据与计算口径，不联动列表选择。
```

将 `decisions/counter.json` 的 `call_count` 从 `131` 更新为 `132`。

- [ ] **Step 5: 同步并写变更记录**

Run:

```bash
./scripts/sync-pages.sh -l "人天额度池：额度明细并入额度池页内 Tab，顶层导航由 9 项收拢为 8 项"
```

- [ ] **Step 6: 完整验证**

Run:

```bash
python3 -m unittest tests/test_day_pool_ledger_merge.py tests/test_employee_phase2.py tests/test_platform_admin_management.py -v
git diff --check
cmp -s prototype/js/app.js docs/js/app.js
diff -qr prototype/docs/md docs/documentation/md
```

Expected: 所有测试 PASS；格式和镜像检查退出码为 0。

- [ ] **Step 7: 浏览器验收**

- 顺丰同城渠道 → 人天额度池：顶层仅 8 项，无独立额度明细。
- 额度池页内显示“额度池列表 / 额度明细”。
- 额度明细默认全部额度池，可筛额度池和类型。
- 切回列表后恢复列表筛选。
- 团队管理员仍直接进入消耗明细。

- [ ] **Step 8: 提交与上线（仅用户明确要求时）**

```bash
git add prototype docs decisions tests
git commit -m "更新原型：额度明细并入额度池页内"
git push origin main
```
