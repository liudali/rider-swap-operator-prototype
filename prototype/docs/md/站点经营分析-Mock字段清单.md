# 站点经营分析 · Mock 字段清单

> **这是什么**：运营商总览里「站点繁忙度」「用电量」「站点支出」三类卡片/表格的 Mock 与计算口径，供开发对照原型落地。  
> **依据/关联**：[PRD.md](./PRD.md) §5.8（含用电量）· 原型 `siteBusinessStats()` / `overviewPowerStats()` · [acceptance-criteria.md](./acceptance-criteria.md)  
> **写法**：[业务文档写作规范](./业务文档写作规范.md)

---

## 业务设定

### 一句话

看站点「堵不堵、电用多少、场费电费多少」——**不用收入金额**给站点打分；繁忙度看格口、柜内电池、等待人数。

### Mock 用来验证什么

| 模块 | 业务要看见什么 | 明确不做 |
|------|----------------|----------|
| 站点繁忙度 | 实时繁忙（低/中/高）、格口占用、等待中、统计日高峰与 24 小时分布 | 不展示站点收入列；不绑用户主站 |
| 用电量统计 | 模块内自选日期范围；总用电 + 按站/按柜汇总 | 不跟顶栏 KPI「统计范围」绑死 |
| 站点支出 | 按月看场费分摊、电费（按量或包月）、支付记录 | 合伙人门户看不见运营商成本 |

### 怎么理解繁忙度（白话）

- **现在堵不堵**：看等待人数 + 格口占用比例 → 低 / 中 / 高。  
- **一天何时最集中**：选一个统计日，看高峰时段文案 + 每小时换电笔数条。  
- 两者互补：排班/备电看高峰，现场调度看实时。

建议阈值（可配置）：等待 ≥3 或占用 ≥85% → 高；等待 ≥1 或占用 ≥60% → 中；否则低。

### 用电量怎么筛

- 模块内选起止日期或快捷「今天 / 近 7 天 / 近 30 天」，点查询刷新。  
- 站点可随总览顶栏联动；无数据时 KPI 为 0、表提示「暂无数据」。

### 站点支出怎么理解

- **场费**：账单账期跨多个自然月时，按月等分（如季付当月记三分之一）。  
- **电费**：按所选月实际用电 × 单价，或取固定月费；不跟场费账期强行对齐。  
- **已支付**：只汇总支付时间落在所选月的金额。  
- 缺单价/固定金额时禁止保存；账期起晚于止禁止提交。

### 验收（白话）

- 繁忙度表/卡**没有**收入金额列。  
- 改格口/等待后，实时繁忙度跟着变。  
- 每站有高峰段 + 24h 条 + 当日笔数/最忙小时；换统计日可刷新。  
- 用电量不依赖顶栏日期；切站点后 KPI/趋势/两表一起刷。  
- 支出空态提示「暂无站点支出数据」。

---

## 实现附录（开发用）

> 业务读者可跳过。字段键、API、伪代码在此。

### A. 站点繁忙度 API

```
GET /api/v1/operators/{operatorId}/site-busyness
  ?date=YYYY-MM-DD
  &site_id=optional
```

响应：`{ rows: SiteBusynessRow[], totals: SiteBusynessTotals, date, generated_at }`

### B. 繁忙度展示字段（一期）

| # | 前端列名 | 字段键 | 类型 | Mock / 生产计算 |
|---|----------|--------|------|-----------------|
| 1 | 站点 | `site_name` / `site_id` | string | 至少有一台归属当前运营商柜机的站点 |
| 2 | 地址 | `site_address` | string | `sites.address \|\| sites.city` |
| 3 | 柜机 | `cabinet_total` / `cabinet_online` / `cabinet_offline` | int | COUNT(cabinets) WHERE `device_owner_id=op` AND `site=site_name` |
| 4 | 格口占用 | `slot_used` / `slot_total` / `slot_util_pct` | int | `slot_total=Σcabinet.slots`；`slot_used`≈柜内电池数 |
| 5 | 柜内电池 | `batteries_in_cab` | int | 见 §C |
| 6 | 等待中 | `waiting_count` | int | IoT/排队：当前站点待换电骑手数 |
| 7 | 繁忙度 | `busy_level` | enum | `低` / `中` / `高` |
| 8 | 站点状态 | `site_status` | enum | `sites.status` |
| 9 | 换电高峰 | `peak_windows` | string[] | 如 `11:00–14:00` |
| 10 | 最忙小时 | `hot_hour` / `hot_count` | int | `argmax(hourly_counts)` |
| 11 | 小时分布 | `hourly_counts[0..23]` | int[] | Mock：`siteSwapHourly` |

合计行 `totals`：`site_count`、各柜机/电池/格口/等待 SUM；`busy_level` 不合计。

### C. 计算伪代码

**柜内电池**

```sql
SELECT COUNT(*)
FROM batteries b
JOIN cabinets c ON b.in_cab = c.sn
WHERE b.device_owner_id = :operator_id
  AND c.site = :site_name
  AND b.in_cab LIKE 'CAB-%'
```

**格口占用**

```javascript
cabinetsAtSite = cabinets.filter(c => c.device_owner_id === opId && c.site === siteName)
slotTotal = sum(cabinetsAtSite.map(c => c.slots || 0))
slotUsed = batteriesInCab
slotUtilPct = slotTotal ? round(slotUsed / slotTotal * 100) : 0
```

**繁忙度**

```javascript
if (waitingCount >= 3 || slotUtilPct >= 85) busyLevel = '高'
else if (waitingCount >= 1 || slotUtilPct >= 60) busyLevel = '中'
else busyLevel = '低'
```

**换电高峰（统计日）**

```javascript
hourly[0..23] = COUNT(swap_success WHERE site_id AND date(completed_at)=date GROUP BY hour)
max = max(hourly)
thresh = max(2, ceil(max * 0.65))
// 连续 hour ≥ thresh 合并为区间文案
hot_hour = argmax(hourly)
```

### D. 本期明确不做

| 项 | 说明 |
|----|------|
| 用户绑定站点 | 不设 `user_home_site_id` |
| 站点收入列 | 总览不展示金额 |
| 购/换站标记 | 不对用户标购站或换电站 |
| `purchase_site_id` 归因 | 收入摊销在运营商主体 |
| 多日热力对比 | 近 7 日矩阵二期 |

### E. Mock 数据源 · 繁忙度

| Mock 变量 | 用途 |
|-----------|------|
| `cabinets[]` | 柜机台数、格口、站点归属 |
| `batteries[]` | 柜内电池、格口占用 |
| `sites[]` | 地址、状态、`waitingCount` |
| `siteSwapHourly[]` | 站点×日×小时换电笔数 |
| `state.pf.overviewSiteBusy.date` | 统计日 |

### F. MODULE_NOTES（繁忙度）

| 键 | 对应列/模块 |
|----|-------------|
| `overview_site_stats` | 卡片模块 |
| `overview_site_slots` | 格口占用 |
| `overview_site_cab_batteries` | 柜内电池 |
| `overview_site_waiting` | 等待中 |
| `overview_site_busy` | 实时繁忙度 |
| `overview_site_peak` | 换电高峰 |
| `overview_site_busy_date` | 统计日 |
| `overview_site_cabinets` | 柜机 |
| `overview_site_status` | 站点状态 |

### G. 用电量统计

```
GET /api/v1/operators/{operatorId}/cabinet-power-stats
  ?date_from=YYYY-MM-DD
  &date_to=YYYY-MM-DD
  &site_id=optional
```

响应：`{ from, to, total_kwh, cabinet_count, daily_trend[], site_rows[], cabinet_rows[] }`

| 筛选项 | 存储键 | 说明 |
|--------|--------|------|
| 统计日起 | `state.pf.overviewPower.dateFrom` | 与顶栏 KPI 解耦 |
| 统计日止 | `state.pf.overviewPower.dateTo` | 自定义须点「查询」 |
| 快捷范围 | `state.pf.overviewPower.range` | `today` / `7` / `30` |
| 站点 | `state.pf.overview.site` | 随顶栏联动 |

| Mock 变量 | 字段 | 用途 |
|-----------|------|------|
| `cabinetPowerDaily[]` | `sn`, `site`, `date`, `kwh`, `deviceOwnerId` | 按日增量 |
| `cabinets[]` | `deviceId`, `deviceName`, `usedPowerKwh` | 单柜明细 |

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

| MODULE_NOTES | 说明 |
|--------------|------|
| `overview_power_stats` | 模块说明 |
| `overview_power_kwh` | 总用电量 |
| `overview_power_site` | 按站点汇总 |
| `overview_power_cabinet` | 按柜机明细 |

### H. 站点支出

| Mock 变量 | 关键字段 | 用途 |
|-----------|----------|------|
| `siteExpenseProfiles[]` | `siteId`, `venueFeeAmount`, `electricityMode`, `electricityUnitPrice`, `electricityFixedAmount`, `paymentCycle`, `landlord*`, `payMethod`, `payeeName`, `payAccount` | 费用配置 |
| `siteExpenseBills[]` | `periodStart`, `periodEnd`, `venueFee`, `electricityKwh`, `electricityFee`, `totalAmount`, `status`, `dueDate`, `payments[]` | 账单与支付 |
| `cabinetPowerDaily[]` | `site`, `date`, `kwh` | 按量电费 |
| `state.pf.overviewExpense` | `month`, `siteId` | 卡片筛选 |

```javascript
venueFeeInMonth = bill.venueFee / monthsBetween(bill.periodStart, bill.periodEnd)
electricityFeeInMonth =
  profile.electricityMode === '按量'
    ? sum(cabinetPowerDaily in selectedMonthAndSite) * profile.electricityUnitPrice
    : profile.electricityFixedAmount
```
