# 站点经营分析 · Mock 字段清单（开发落地）

> **PRD 业务口径**：[PRD.md §5.8](./PRD.md#58-运营商总览--站点繁忙度分析)（含 §5.8.3 用电量统计）  
> **原型参考**：`prototype/index.html` → `siteBusinessStats()` / `overviewPowerStats()`  
> **验收**：`acceptance-criteria.md` 运营商总览 · 站点繁忙度分析 / 用电量统计

**评估原则**：站点经营状况用**繁忙度**（格口、电池、等待），**不用收入**归因或金额列。

---

## 1. API 建议

```
GET /api/v1/operators/{operatorId}/site-busyness
  ?range=today|7d|30d   # 等待队列可实时；换电衍生指标可选
  &site_id=optional
```

**响应**：`{ rows: SiteBusynessRow[], totals: SiteBusynessTotals, range, generated_at }`

---

## 2. 表格展示字段（一期）

| # | 前端列名 | 字段键 | 类型 | Mock / 生产计算 |
|---|----------|--------|------|-----------------|
| 1 | 站点 | `site_name` / `site_id` | string | 至少有一台归属当前运营商柜机的站点 |
| 2 | 地址 | `site_address` | string | `sites.address \|\| sites.city` |
| 3 | 柜机 | `cabinet_total` / `cabinet_online` / `cabinet_offline` | int | COUNT(cabinets) WHERE `device_owner_id=op` AND `site=site_name` |
| 4 | 格口占用 | `slot_used` / `slot_total` / `slot_util_pct` | int | `slot_total=Σcabinet.slots`；`slot_used`=柜内电池数（见 §3.2） |
| 5 | 柜内电池 | `batteries_in_cab` | int | 见 §3.1 |
| 6 | 等待中 | `waiting_count` | int | IoT/排队：当前站点待换电骑手数（实时） |
| 7 | 繁忙度 | `busy_level` | enum | `低` / `中` / `高`（见 §3.3） |
| 8 | 站点状态 | `site_status` | enum | `sites.status`（在营/建设中等） |

### 合计行 `totals`

| 键 | 计算 |
|----|------|
| `site_count` | `rows.length` |
| `cabinet_*` / `batteries_in_cab` / `slot_*` | 各列 SUM |
| `waiting_count` | SUM |
| `busy_level` | 不合计 |

---

## 3. 计算伪代码

### 3.1 柜内电池 `batteries_in_cab`

```sql
SELECT COUNT(*)
FROM batteries b
JOIN cabinets c ON b.in_cab = c.sn
WHERE b.device_owner_id = :operator_id
  AND c.site = :site_name
  AND b.in_cab LIKE 'CAB-%'
```

### 3.2 格口占用

```javascript
cabinetsAtSite = cabinets.filter(c => c.device_owner_id === opId && c.site === siteName)
slotTotal = sum(cabinetsAtSite.map(c => c.slots || 0))
slotUsed = batteriesInCab  // 或在柜占用格口数（IoT 上报为准）
slotUtilPct = slotTotal ? round(slotUsed / slotTotal * 100) : 0
```

### 3.3 等待中 `waiting_count`

```javascript
// 生产：换电队列服务 / IoT 待开仓请求数，按 cabinet.site 聚合
waitingCount = site.waiting_count ?? queueService.countBySite(siteId)
```

### 3.4 繁忙度 `busy_level`（建议阈值，可配置）

```javascript
if (waitingCount >= 3 || slotUtilPct >= 85) busyLevel = '高'
else if (waitingCount >= 1 || slotUtilPct >= 60) busyLevel = '中'
else busyLevel = '低'
```

---

## 4. 明确不做（本期）

| 项 | 说明 |
|----|------|
| 用户绑定站点 | 不设 `user_home_site_id`；用户列表不展示主站 |
| 站点收入列 | 不在总览表展示金额；租赁账单不做「站点收入覆盖」 |
| 购/换站标记 | 运营商后台不对用户标注购套餐站或换电站 |
| `purchase_site_id` 归因 | 收入摊销在**运营商主体**；不按站点分摊 |

---

## 5. 数据源映射（原型 Mock 表）

| Mock 变量 | 用途 |
|-----------|------|
| `cabinets[]` | 柜机台数、格口总数、站点归属 |
| `batteries[]` | 柜内电池、格口占用 |
| `sites[]` | 地址、状态、`waitingCount` |
| `state.pf.overview.site` | 站点筛选 |

---

## 6. MODULE_NOTES 键对照

| 键 | 对应列/模块 |
|----|-------------|
| `overview_site_stats` | 表格模块 |
| `overview_site_slots` | 格口占用 |
| `overview_site_cab_batteries` | 柜内电池 |
| `overview_site_waiting` | 等待中 |
| `overview_site_busy` | 繁忙度 |
| `overview_site_cabinets` | 柜机 |
| `overview_site_status` | 站点状态 |

---

## 7. 验收要点

- [ ] 表格**无**服务用户数、换电笔数、收入金额列
- [ ] 格口占用 = 已用/总数，与柜内电池数逻辑一致
- [ ] 等待中为实时或近实时快照
- [ ] 繁忙度与格口/等待阈值联动
- [ ] 筛选单站点后仅一行且字段可复核

---

## 8. 用电量统计（§5.8.3）

### 8.1 API 建议

```
GET /api/v1/operators/{operatorId}/cabinet-power-stats
  ?date_from=YYYY-MM-DD
  &date_to=YYYY-MM-DD
  &site_id=optional
```

**响应**：`{ from, to, total_kwh, cabinet_count, daily_trend[], site_rows[], cabinet_rows[] }`

### 8.2 筛选与状态

| 筛选项 | 存储键 | 说明 |
|--------|--------|------|
| 统计日起 | `state.pf.overviewPower.dateFrom` | 模块内独立；与顶栏 KPI「统计范围」**解耦** |
| 统计日止 | `state.pf.overviewPower.dateTo` | 自定义日期须点「查询」 |
| 快捷范围 | `state.pf.overviewPower.range` | `today` / `7` / `30`；切换时同步起止并即时刷新 |
| 站点 | `state.pf.overview.site` | 随总览顶栏联动 |

### 8.3 Mock 数据源

| Mock 变量 | 字段 | 用途 |
|-----------|------|------|
| `cabinetPowerDaily[]` | `sn`, `site`, `date`, `kwh`, `deviceOwnerId` | 按日增量汇总 |
| `cabinets[]` | `deviceId`, `deviceName`, `usedPowerKwh` | 单柜明细、当前累计读数 |

### 8.4 计算伪代码

```javascript
rows = cabinetPowerDaily.filter(r =>
  r.deviceOwnerId === operatorId &&
  r.date >= dateFrom && r.date <= dateTo &&
  (site === '全部' || r.site === site)
)
totalKwh = sum(rows.kwh)
cabinetCount = distinct(rows.sn).length
dailyTrend = groupBy(rows, 'date').sum('kwh')
```

### 8.5 MODULE_NOTES 键

| 键 | 说明 |
|----|------|
| `overview_power_stats` | 模块说明 |
| `overview_power_kwh` | 总用电量 |
| `overview_power_site` | 按站点汇总 |
| `overview_power_cabinet` | 按柜机明细 |

### 8.6 验收要点

- [ ] 模块内有统计日起/止 + 快捷范围 + 查询；**不**依赖顶栏日期
- [ ] 顶栏切换站点后 KPI / 趋势 / 两表联动刷新
- [ ] 按柜机明细可跳转换电柜详情页
- [ ] 空态：筛选无数据时 KPI 为 0、表格提示「暂无数据」
