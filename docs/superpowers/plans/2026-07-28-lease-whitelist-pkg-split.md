# 白名单套餐拆页 + 型号同步 Implementation Plan

> **For agentic workers:** 本计划由当前会话直接执行（变更面小，不拆 subagent）。

**Goal:** 渠道设备租赁「白名单套餐」拆为套餐定价页与订单页，并同步电池型号字段（decision-089）。

**Architecture:** 复用 `leasePkgPricing` 仅渲染定价；新增 `leasePkgOrders`；Mock SKU/订单补 `batteryModel`；编辑改为行内；引用计数纳入白名单 SKU。

**Tech Stack:** 静态原型 `prototype/js/app.js` + `config-mock.js`；文档 AC/清单/决策卡。

## Global Constraints

- 不做白名单开关
- 型号枚举 = 平台启用字典 `BATTERY_MODEL_OPTIONS`
- 唯一键 = 渠道 × 电池型号 × 套餐名
- 同步 `docs/` via `./scripts/sync-pages.sh`

---

### Task 1: Mock + 导航配置

- [x] `channelLeasePkgSkus` 补 `batteryModel` + LP-30B
- [x] `channelLeasePkgOrders` 补 `batteryModel`
- [x] `CH-RENT` 菜单插入 `leasePkgOrders`；`PAGE_TITLES` / `PAGE_BLURBS` / 权限映射

### Task 2: 渲染与编辑

- [x] `renderLeasePkgPricing` 仅定价 + 型号列 + 行内编辑
- [x] 新增 `renderLeasePkgOrders`
- [x] `VIEW_MAP` / 事件绑定 / `batteryModelUsageCount`

### Task 3: 文档 + sync

- [x] decision-089、AC、角色清单、结算规则、变更记录、spec 状态
- [x] `sync-pages.sh`；counter +1
