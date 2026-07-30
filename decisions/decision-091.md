# 决策卡片 #091 · 文档面板「来源与前置」

| 项 | 内容 |
|----|------|
| 日期 | 2026-07-28 |
| 阶段 | 发布前 · 原型文档面板 |
| 结论 | **已落地**：释义与规则卡之间独立第三节；相关页可跳转上游原型页 |

## 决策问题

「当前页是什么」只讲本页，缺少业务链路上下文；读者不知道数据从哪来、做完去哪。

## 调用的大师视角

- **俞军**：降低「理解页面在流程中位置」的替换成本，面板才有导航价值。  
- **乔布斯**：只做一句前置/来源/下游 + 可点相关页，不做第二套流程图编辑器。

## 方案选择

| 选项 | 结论 |
|------|------|
| A · 并入释义块 | 否，信息过载 |
| **B · 独立第三节** | **是**（用户确认） |
| C · 仅规则卡脚注 | 否，规则卡仍偏条文 |

**深度**：相关页按钮 → `data-doc-nav` → `navigateDocPanelView(viewKey)` 跳转原型。  
**范围 MVP**：人天池各 Tab + 订单/退款主路径（`VIEW_PAGE_LINEAGE`）。

## 增补（2026-07-28 · 全量）

`VIEW_PAGE_LINEAGE` 已扩至与 `VIEW_PAGE_MEANING` 全量对齐（~69 viewKey）；`navigateDocPanelView` 支持站点/平台服务/渠道销售等 Tab 跳转。

## 落点

| 文件 | 变更 |
|------|------|
| `doc-catalog.js` | `VIEW_PAGE_LINEAGE` + `lineageForView()` |
| `doc-search-panel.js` | `renderPageLineageHtml()`，插在释义与规则卡之间 |
| `app.js` | `window.navigateDocPanelView` |
| `doc-search-panel.css` | `.doc-page-lineage` 蓝色区分释义绿 |

## 反方最强论据

链路文案需随产品改版人工维护；未覆盖页无此块（可接受，按页扩表）。

## 失效条件

viewKey 与 Tab 解析双轨漂移，导致跳转落错页。

## 下一步

验证人天池「额度池 → 分配 → 消耗 → 异常」与订单「购卡 → 押金 → 退款」跳转；高频页补 lineage。
