# 员工相关能力标记二期 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将所有员工入口、员工登录身份和员工页面统一表达为二期，同时保留现有 Mock 与权限演示。

**Architecture:** 复用 `app.js` 现有 `PHASE2_VIEWS`、`phase2Meta()`、`phase2BadgeHtml()` 和 `phase2BannerHtml()`，不新增状态或样式。仅补齐员工登录选项的二期前缀，并将文档真源统一为二期口径后通过同步脚本生成三端镜像。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Python `unittest` 静态回归测试、Bash 同步脚本、GitHub Pages。

## Global Constraints

- 员工整块为二期：一期不交付，原型仅演示。
- 不删除员工页面、员工 Mock 数据、权限判断或员工登录能力。
- 渠道分销继续无员工入口、无员工账号。
- `docs/*.md` 是文档真源；禁止直接维护镜像副本。
- 不新增依赖。

---

### Task 1: 员工二期标记回归测试与登录入口

**Files:**
- Create: `tests/test_employee_phase2.py`
- Modify: `prototype/js/app.js:636-655`

**Interfaces:**
- Consumes: `buildLoginSelectHtml()`、`PHASE2_VIEWS`、`phase2Meta()`。
- Produces: 所有员工登录 `<option>` 以 `【二期】` 开头；员工侧栏和页面横幅继续由现有二期机制生成。

- [ ] **Step 1: 创建失败的静态回归测试**

```python
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")


class EmployeePhase2Tests(unittest.TestCase):
    def test_employee_view_uses_phase2_navigation_and_banner(self):
        self.assertIn('"employees",', APP_JS.split("const PHASE2_VIEWS", 1)[1].split("]);", 1)[0])
        self.assertIn('if (state.view === "employees")', APP_JS)
        self.assertIn('label: "员工模块"', APP_JS)
        self.assertIn("一期不交付，原型仅演示", APP_JS)

    def test_all_employee_login_options_are_marked_phase2(self):
        login_block = APP_JS.split("let staffOpts", 1)[1].split("const partnerOpts", 1)[0]
        employee_option_lines = [
            line for line in login_block.splitlines()
            if 'staffOpts += `<option value="emp:' in line
        ]
        self.assertGreaterEqual(len(employee_option_lines), 2)
        self.assertTrue(all("【二期】" in line for line in employee_option_lines))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
cd 原型-外卖
python3 -m unittest tests/test_employee_phase2.py -v
```

Expected: `test_all_employee_login_options_are_marked_phase2` FAIL，原因是员工和团队管理员 `<option>` 尚无 `【二期】`。

- [ ] **Step 3: 最小修改员工登录选项**

将两类员工选项改为：

```javascript
staffOpts += `<option value="emp:${e.id}">【二期】${e.name} · ${e.jobTitle || "员工"}（${host}）</option>`;
```

```javascript
staffOpts += `<option value="emp:${e.id}">【二期】${e.name} · 团队管理员（${e.jobTitle || "团队"} · ${host}）</option>`;
```

- [ ] **Step 4: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py -v
```

Expected: 2 tests PASS。

---

### Task 2: 核心产品文档统一二期口径

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/acceptance-criteria.md`
- Modify: `docs/角色与功能清单.md`
- Create: `decisions/decision-037.md`
- Modify: `decisions/counter.json`

**Interfaces:**
- Consumes: 设计说明 `docs/superpowers/specs/2026-07-17-employee-phase2-design.md`。
- Produces: 员工范围、验收、角色状态与决策资产统一。

- [ ] **Step 1: 扩展回归测试检查文档真源**

在 `tests/test_employee_phase2.py` 增加：

```python
PRD = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
ACCEPTANCE = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")
ROLE_LIST = (ROOT / "docs/角色与功能清单.md").read_text(encoding="utf-8")


def test_core_docs_mark_employee_scope_phase2(self):
    self.assertIn("员工整块", PRD)
    self.assertIn("员工（二期）", ACCEPTANCE)
    self.assertIn("一期验收可不测", ACCEPTANCE)
    self.assertIn("二期 · 已实现（原型）", ROLE_LIST)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py -v
```

Expected: 文档断言 FAIL，指出 PRD/验收/角色清单仍有未标二期的员工描述。

- [ ] **Step 3: 修改 PRD**

统一以下口径：

```markdown
| **员工（二期）** | — | 运营员工与权限 Mock | 额度运营员工与权限 Mock | 放款审核等岗位 Mock |
```

权限章节增加：

```markdown
> **二期范围**：各角色员工账号、员工登录、权限配置与数据范围整块二期；一期不交付，原型仅演示。
```

- [ ] **Step 4: 修改验收标准**

导航中的渠道商、资金方员工均追加“（二期）”；员工验收改为：

```markdown
| **员工（二期）** | 范围 | 侧栏与登录账号均标二期；页面显示“一期不交付”横幅；一期验收可不测 |
| 员工（二期） | 演示 | 原型仍可新增/编辑员工、配置权限、切换员工登录并验证数据隔离 |
```

- [ ] **Step 5: 修改角色与功能清单**

平台、运营商、渠道商、资金方所有员工行状态统一为：

```markdown
**二期** · 已实现（原型）
```

- [ ] **Step 6: 写入决策卡片和计数**

`decisions/decision-037.md` 写明：

```markdown
# 决策卡片 037 · 员工账号与权限整块二期

- 日期：2026-07-17
- 阶段：MVP
- 结论：员工菜单、员工登录、权限配置整块标二期；一期不交付，原型保留演示。
- 支持理由：减少一期范围误解，同时保留评审能力。
- 反对理由：二期徽章较多；接受统一表达带来的视觉成本。
- 失效条件：一期确需真实员工账号和权限体系时重新拆回一期。
- Non-goals：不隐藏页面，不改权限模型，不接真实账号系统。
```

将 `decisions/counter.json` 的 `call_count` 从 `129` 更新为 `130`；任务结束后生成调用 #130 自动复盘。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py -v
```

Expected: 全部测试 PASS。

---

### Task 3: 三端同步与浏览器验收

**Files:**
- Modify (generated): `prototype/docs/md/*`
- Modify (generated): `docs/documentation/md/*`
- Modify (generated): `docs/js/app.js`
- Modify: `docs/原型变更记录.md`

**Interfaces:**
- Consumes: `prototype/` 原型真源、`docs/*.md` 文档真源。
- Produces: 本地原型、文档浏览器和 GitHub Pages 发布目录一致。

- [ ] **Step 1: 同步并写变更记录**

Run:

```bash
./scripts/sync-pages.sh -l "员工相关：侧栏、登录账号、页面与核心文档统一标记二期"
```

Expected: 41 份 Markdown 同步，`prototype/js` 复制到 `docs/js`，变更记录新增一行。

- [ ] **Step 2: 运行完整静态测试与格式检查**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py -v
git diff --check
```

Expected: 全部 PASS；`git diff --check` 无输出。

- [ ] **Step 3: 检查镜像一致**

Run:

```bash
cmp -s prototype/js/app.js docs/js/app.js
diff -qr prototype/docs/md docs/documentation/md
```

Expected: 两条命令退出码均为 0、无输出。

- [ ] **Step 4: 本地浏览器冒烟**

Run:

```bash
python3 main.py
```

访问：

- `http://127.0.0.1:8766/prototype/index.html`
- 运营商、渠道商、资金方侧栏「员工」均显示二期徽章。
- 登录下拉全部员工账号带「【二期】」。
- 员工页面显示二期横幅，新增/编辑与权限配置仍可演示。
- 骑士卡渠道无员工入口及账号。

- [ ] **Step 5: 提交（仅用户明确要求时）**

```bash
git add prototype docs decisions tests
git commit -m "更新原型：员工账号与权限统一标记二期"
```

- [ ] **Step 6: 推送上线（仅用户明确要求时）**

```bash
git push origin main
```

Expected: GitHub Pages 更新后，线上登录下拉和员工页面均显示二期标记。
