# 平台管理员管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在平台管理员侧新增一期「管理员」模块，复用员工列表、表单和权限机制，支持角色模板与自定义菜单权限。

**Architecture:** 继续使用 `employees` 视图与 `employeeStore`，通过平台角色分支动态改变菜单名称、二期状态、登录分组和页面文案。新增平台菜单权限映射和管理员模板，不创建第二套人员管理组件。

**Tech Stack:** 静态 HTML/CSS/JavaScript、Python `unittest` 静态回归测试、Bash 同步脚本、GitHub Pages。

## Global Constraints

- 平台「管理员」属于一期，不显示二期标记。
- 运营商、渠道商、资金方「员工」继续属于二期。
- 平台管理员账号登录不带「【二期】」；其他主体员工继续带前缀。
- 超级管理员不可修改权限、不可停用。
- 权限粒度为平台菜单查看权，不实现数据行级权限。
- 不新增依赖，不拆分现有大型 JS 文件。

---

### Task 1: 平台管理员数据与菜单权限映射

**Files:**
- Create: `tests/test_platform_admin_management.py`
- Modify: `prototype/js/config-mock.js:154-210`
- Modify: `prototype/js/config-mock.js:640-690`

**Interfaces:**
- Produces: `employeeStore[ENT.platform.id]` 平台管理员数据。
- Produces: `PLATFORM_ADMIN_TEMPLATES` 模板配置。
- Produces: `platform.*` 权限 ID → 平台 view 的 `PERM_VIEW_MAP` 映射。
- Consumes: 现有 `NAV.platform`、`EMP_PERMISSIONS`、`employeeStore`。

- [ ] **Step 1: 编写失败测试**

```python
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
CONFIG = (ROOT / "prototype/js/config-mock.js").read_text(encoding="utf-8")
APP = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")


class PlatformAdminManagementTests(unittest.TestCase):
    def test_platform_navigation_reuses_employee_view(self):
        platform_nav = CONFIG.split("platform: [", 1)[1].split("]", 1)[0]
        self.assertIn('"employees"', platform_nav)

    def test_platform_admin_store_has_protected_super_admin(self):
        self.assertIn('"ADM-PLAT-001"', CONFIG)
        self.assertIn('adminTemplate: "super"', CONFIG)
        self.assertIn("protected: true", CONFIG)

    def test_platform_permissions_map_to_platform_views(self):
        for permission in (
            "platform.overview",
            "platform.users",
            "platform.orders",
            "platform.devices",
            "platform.channels",
            "platform.flows",
            "platform.accounts",
            "platform.operators",
            "platform.audit",
            "platform.deposit",
            "platform.pricing",
            "platform.admins",
        ):
            self.assertIn(permission, CONFIG)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_platform_admin_management.py -v
```

Expected: 3 tests FAIL，分别因平台导航无 `employees`、无平台管理员数据、无平台权限 ID。

- [ ] **Step 3: 平台导航复用 employees**

在 `NAV.platform` 末尾加入 `"employees"`，不新增 view。

- [ ] **Step 4: 新增平台权限映射**

在 `PERM_VIEW_MAP` 增加：

```javascript
"platform.overview": ["overview"],
"platform.users": ["platformUsers"],
"platform.orders": ["platformOrders"],
"platform.devices": ["platformDevices"],
"platform.channels": ["platformChannels", "platformMarketing"],
"platform.flows": ["platformFlows"],
"platform.accounts": ["platformAccounts"],
"platform.operators": ["operators", "platformLeasing", "operatorCreditEval"],
"platform.audit": ["orderAudit"],
"platform.deposit": ["depositManage"],
"platform.pricing": ["l1Pricing"],
"platform.admins": ["employees"],
```

- [ ] **Step 5: 新增权限选项与角色模板**

```javascript
const PLATFORM_ADMIN_PERMISSIONS = [
  { id: "platform.overview", label: "总览" },
  { id: "platform.users", label: "用户管理" },
  { id: "platform.orders", label: "订单管理" },
  { id: "platform.devices", label: "设备管理" },
  { id: "platform.channels", label: "渠道管理" },
  { id: "platform.flows", label: "流水管理" },
  { id: "platform.accounts", label: "平台账户" },
  { id: "platform.operators", label: "运营商治理" },
  { id: "platform.audit", label: "变更记录" },
  { id: "platform.deposit", label: "保证金管理" },
  { id: "platform.pricing", label: "平台统价" },
  { id: "platform.admins", label: "管理员管理" },
];

const PLATFORM_ADMIN_TEMPLATES = {
  super: { label: "超级管理员", permissions: PLATFORM_ADMIN_PERMISSIONS.map(p => p.id) },
  operations: { label: "运营管理员", permissions: ["platform.overview", "platform.users", "platform.orders", "platform.devices", "platform.channels", "platform.operators", "platform.audit", "platform.pricing"] },
  finance: { label: "财务管理员", permissions: ["platform.overview", "platform.flows", "platform.accounts", "platform.operators", "platform.deposit"] },
  custom: { label: "自定义", permissions: [] },
};
```

- [ ] **Step 6: 新增平台管理员 Mock**

```javascript
[ENT.platform.id]: [
  {
    id: "ADM-PLAT-001",
    roleType: "staff",
    name: "平台超级管理员",
    phone: "138****0001",
    jobTitle: "超级管理员",
    adminTemplate: "super",
    status: "启用",
    permissions: PLATFORM_ADMIN_TEMPLATES.super.permissions,
    lastLoginAt: "2026-07-17 10:00",
    protected: true
  },
  {
    id: "ADM-PLAT-002",
    roleType: "staff",
    name: "平台运营管理员",
    phone: "138****0002",
    jobTitle: "运营管理员",
    adminTemplate: "operations",
    status: "启用",
    permissions: PLATFORM_ADMIN_TEMPLATES.operations.permissions,
    lastLoginAt: "2026-07-16 18:20",
    protected: false
  }
],
```

并在 `ENTITY_ROLE` 增加 `[ENT.platform.id]: "platform"`。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_platform_admin_management.py -v
```

Expected: 3 tests PASS。

---

### Task 2: 角色化导航、登录身份与二期例外

**Files:**
- Modify: `prototype/js/app.js:520-655`
- Modify: `prototype/js/app.js:4207-4310`
- Modify: `prototype/js/app.js:4460-4510`
- Modify: `tests/test_employee_phase2.py`
- Modify: `tests/test_platform_admin_management.py`

**Interfaces:**
- Produces: `employeeModuleLabel()`、`isPlatformAdminEmployee(employee)`。
- Consumes: `ENT.platform.id`、`isPlatformRole()`、`PHASE2_VIEWS`。

- [ ] **Step 1: 扩展失败测试**

在平台管理员测试中增加：

```python
def test_platform_admin_login_is_not_phase2_but_other_staff_are(self):
    self.assertIn('entityId === ENT.platform.id ? "" : "【二期】"', APP)
    self.assertIn('label="管理员登录"', APP)
    self.assertIn('label="员工登录（二期）"', APP)

def test_employee_phase2_has_platform_exception(self):
    self.assertIn('v === "employees" && isPlatformRole()', APP)
    self.assertIn('return false', APP.split('v === "employees" && isPlatformRole()', 1)[1][:100])
```

更新 `tests/test_employee_phase2.py`：员工登录二期断言只检查非平台员工分支，不再要求平台管理员带二期前缀。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py tests/test_platform_admin_management.py -v
```

Expected: 平台例外和登录分组测试 FAIL。

- [ ] **Step 3: 按主体拆分登录选项**

`buildLoginSelectHtml()` 生成 `adminOpts` 与 `staffOpts`：

```javascript
const prefix = entityId === ENT.platform.id ? "" : "【二期】";
const target = entityId === ENT.platform.id ? "admin" : "staff";
```

最终输出：

```html
<optgroup label="管理员登录">...</optgroup>
<optgroup label="员工登录（二期）">...</optgroup>
```

- [ ] **Step 4: 增加二期视图例外**

`isPhase2View(view)` 首行增加：

```javascript
if (v === "employees" && isPlatformRole()) return false;
```

`phase2Meta()` 的员工分支增加 `!isPlatformRole()`，保证平台管理员页不渲染二期横幅。

- [ ] **Step 5: 动态菜单名称**

新增：

```javascript
function employeeModuleLabel() {
  return isPlatformRole() ? "管理员" : "员工";
}

function navLabel(view) {
  return view === "employees" ? employeeModuleLabel() : (NAV_LABEL[view] || view);
}
```

侧栏和页头统一使用 `navLabel()`，平台显示“管理员”，其他角色显示“员工”。

- [ ] **Step 6: 管理员登录身份文案**

`currentLoginSummary()`、`syncTenantUi()` 对平台员工显示“管理员登录”，其他员工显示“员工登录”。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py tests/test_platform_admin_management.py -v
```

Expected: 全部测试 PASS。

---

### Task 3: 管理员角色模板、表单与保护规则

**Files:**
- Modify: `prototype/js/app.js:11126-11223`
- Modify: `prototype/js/app.js:14800-14815`
- Modify: `tests/test_platform_admin_management.py`

**Interfaces:**
- Produces: `isPlatformAdminManagement()`、`platformAdminPermissionOptions()`、`applyAdminTemplateToForm(templateId)`。
- Consumes: `PLATFORM_ADMIN_PERMISSIONS`、`PLATFORM_ADMIN_TEMPLATES`、`employeeStore`。

- [ ] **Step 1: 扩展失败测试**

```python
def test_platform_admin_form_has_templates_and_protection(self):
    for marker in (
        "PLATFORM_ADMIN_TEMPLATES",
        "adminTemplate",
        "至少选择一个菜单权限",
        "该手机号已存在",
        "不可停用当前登录账号",
        "protected",
    ):
        self.assertIn(marker, APP)

def test_platform_admin_page_uses_admin_copy_and_fields(self):
    for marker in ("管理员列表", "新增管理员", "角色模板", "最后登录"):
        self.assertIn(marker, APP)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_platform_admin_management.py -v
```

Expected: 管理员页面与校验文案测试 FAIL。

- [ ] **Step 3: 权限选项按角色分流**

```javascript
function employeePermissionOptions() {
  return isPlatformRole() ? PLATFORM_ADMIN_PERMISSIONS : EMP_PERMISSIONS;
}
```

`permCheckboxes()` 使用该函数；非平台员工表单保持现状。

- [ ] **Step 4: 平台管理员表单**

平台分支字段为：

```html
姓名、手机号、角色模板、状态、菜单权限
```

角色模板改变时，将对应模板权限写入复选框；用户再次调整后按权限快照保存。

- [ ] **Step 5: 保存校验与保护**

保存前执行：

```javascript
if (duplicatePhone) return showProtoToast("该手机号已存在");
if (!perms.length) return showProtoToast("至少选择一个菜单权限");
if (isSelf && data.status === "停用") return showProtoToast("不可停用当前登录账号");
if (existing?.protected) return showProtoToast("超级管理员不可修改");
```

新平台管理员 ID 使用 `ADM-PLAT-` 前缀，并保存 `adminTemplate`、`lastLoginAt`、`protected:false`。

- [ ] **Step 6: 平台管理员列表**

平台分支显示：

```text
姓名/手机号 | 角色模板 | 状态 | 权限摘要 | 最后登录 | 操作
```

超级管理员操作列展示“受保护”；其他管理员显示编辑按钮。空态文案为“暂无管理员，请新增管理员并配置菜单权限”。

- [ ] **Step 7: 运行测试并确认通过**

Run:

```bash
python3 -m unittest tests/test_platform_admin_management.py -v
```

Expected: 全部测试 PASS。

---

### Task 4: 产品文档、决策卡与三端同步

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/acceptance-criteria.md`
- Modify: `docs/角色与功能清单.md`
- Create: `decisions/decision-038.md`
- Modify: `decisions/counter.json`
- Modify (generated): `prototype/docs/md/*`
- Modify (generated): `docs/documentation/md/*`
- Modify (generated): `docs/js/app.js`
- Modify: `docs/原型变更记录.md`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-07-17-platform-admin-management-design.md`。
- Produces: 平台管理员一期例外在原型、PRD、验收和角色清单中一致。

- [ ] **Step 1: 增加文档失败测试**

```python
def test_docs_define_platform_admin_as_phase1_exception(self):
    prd = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
    acceptance = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")
    roles = (ROOT / "docs/角色与功能清单.md").read_text(encoding="utf-8")
    self.assertIn("管理员（一期）", prd)
    self.assertIn("平台管理员管理", acceptance)
    self.assertIn("超级管理员不可", acceptance)
    self.assertIn("管理员管理", roles)
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
python3 -m unittest tests/test_platform_admin_management.py -v
```

Expected: 文档断言 FAIL。

- [ ] **Step 3: 更新核心文档**

- PRD：平台角色和功能模块新增“管理员（一期）”；员工二期说明追加“平台管理员管理除外”。
- 验收：新增列表字段、模板、权限、超级管理员保护、自停用拦截、空态和权限差异。
- 角色清单：平台新增管理员管理，状态“已实现”；其他主体员工仍为二期。

- [ ] **Step 4: 写入决策资产**

创建 `decision-038.md`：

```markdown
# 决策卡片 038 · 平台管理员复用员工模块并作为一期例外

- 日期：2026-07-17
- 结论：平台侧复用 employees 视图显示“管理员”，一期交付；其他主体员工仍二期。
- 支持理由：复用交互与权限基础能力，减少重复建设。
- 反对理由：同一 view 按角色改变名称和范围，需回归测试防止串标。
- 失效条件：平台管理员需要独立账号域、审批流或行级权限时拆分模块。
- Non-goals：真实密码、邀请、登录审计、行级权限。
```

将 `decisions/counter.json` 的 `call_count` 从 `130` 更新为 `131`。

- [ ] **Step 5: 同步并写变更记录**

Run:

```bash
./scripts/sync-pages.sh -l "平台管理员：新增一期管理员模块，复用员工页面并支持角色模板与菜单权限"
```

- [ ] **Step 6: 完整验证**

Run:

```bash
python3 -m unittest tests/test_employee_phase2.py tests/test_platform_admin_management.py -v
git diff --check
cmp -s prototype/js/app.js docs/js/app.js
diff -qr prototype/docs/md docs/documentation/md
```

Expected: 所有测试 PASS；格式和镜像检查退出码为 0。

- [ ] **Step 7: 浏览器冒烟**

使用本地原型验证：

- 平台侧栏为“管理员”，无二期徽章。
- 登录下拉平台管理员无二期前缀；其他员工仍带前缀。
- 管理员页面角色模板、权限勾选、保护规则可演示。
- 平台管理员登录后仅显示授权菜单。
- 其他主体员工页面仍显示二期横幅。

- [ ] **Step 8: 提交与上线（仅用户明确要求时）**

```bash
git add prototype docs decisions tests
git commit -m "更新原型：平台新增管理员权限配置"
git push origin main
```
