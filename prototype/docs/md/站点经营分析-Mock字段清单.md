# 站点经营分析 · Mock 字段清单（开发落地）

> **PRD 业务口径**：[PRD.md §5.8](./PRD.md#58-运营商总览--站点繁忙度分析)（含 §5.8.3 用电量统计）  
> **原型参考**：`prototype/index.html` → `siteBusinessStats()` / `overviewPowerStats()`  
> **验收**：`acceptance-criteria.md` 运营商总览 · 站点繁忙度分析 / 用电量统计

**评估原则**：站点经营状况用**繁忙度**（格口、电池、等待），**不用收入**归因或金额列。

---

## 1. API 建议

```
GET /api/v1/operators/{operatorId}/site-busyness
  ?date=YYYY-MM-DD      # 统计日：高峰与小时分布
  &site_id=optional
```

**响应**：`{ rows: SiteBusynessRow[], totals: SiteBusynessTotals, date, generated_at }`

---

## 2. 卡片 / 表格展示字段（一期）

| # | 前端列名 | 字段键 | 类型 | Mock / 生产计算 |
|---|----------|--------|------|-----------------|
| 1 | 站点 | `site_name` / `site_id` | string | 至少有一台归属当前运营商柜机的站点 |
| 2 | 地址 | `site_address` | string | `sites.address \|\| sites.city` |
| 3 | 柜机 | `cabinet_total` / `cabinet_online` / `cabinet_offline` | int | COUNT(cabinets) WHERE `device_owner_id=op` AND `site=site_name` |
| 4 | 格口占用 | `slot_used` / `slot_total` / `slot_util_pct` | int | `slot_total=Σcabinet.slots`；`slot_used`=柜内电池数（见 §3.2） |
| 5 | 柜内电池 | `batteries_in_cab` | int | 见 §3.1 |
| 6 | 等待中 | `waiting_count` | int | IoT/排队：当前站点待换电骑手数（实时） |
| 7 | 繁忙度 | `busy_level` | enum | `低` / `中` / `高`（见 §3.3，**实时**） |
| 8 | 站点状态 | `site_status` | enum | `sites.status` |
| 9 | 换电高峰 | `peak_windows` | string[] | 统计日小时聚合后的高峰段文案，如 `11:00–14:00` |
| 10 | 最忙小时 | `hot_hour` / `hot_count` | int | `argmax(hourly_counts)` |
| 11 | 小时分布 | `hourly_counts[0..23]` | int[] | Mock：`siteSwapHourly`；生产：换电成功单按完成小时 COUNT |

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

### 3.5 换电高峰 `peak_windows`（统计日）

```javascript
hourly[0..23] = COUNT(swap_success WHERE site_id AND date(completed_at)=date GROUP BY hour)
max = max(hourly)
thresh = max(2, ceil(max * 0.65))
// 连续 hour ≥ thresh 合并为 [from, to]，展示为 HH:00–(to+1):00
hot_hour = argmax(hourly)
```

**说明**：实时繁忙度与统计日高峰互补——前者看「现在堵不堵」，后者看「一天里何时最集中」，用于排班/备电。

---

## 4. 明确不做（本期）

| 项 | 说明 |
|----|------|
| 用户绑定站点 | 不设 `user_home_site_id`；用户列表不展示主站 |
| 站点收入列 | 不在总览表展示金额；租赁账单不做「站点收入覆盖」 |
| 购/换站标记 | 运营商后台不对用户标注购套餐站或换电站 |
| `purchase_site_id` 归因 | 收入摊销在**运营商主体**；不按站点分摊 |
| 多日热力对比 | 本期单日切换；近 7 日热力矩阵二期 |

---

## 5. 数据源映射（原型 Mock 表）

| Mock 变量 | 用途 |
|-----------|------|
| `cabinets[]` | 柜机台数、格口总数、站点归属 |
| `batteries[]` | 柜内电池、格口占用 |
| `sites[]` | 地址、状态、`waitingCount` |
| `siteSwapHourly[]` | 站点×日×小时换电笔数（高峰与 24h 条） |
| `state.pf.overviewSiteBusy.date` | 统计日 |

---

## 6. MODULE_NOTES 键对照

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

---

## 7. 验收要点

- [ ] 表格/卡片**无**收入金额列
- [ ] 实时繁忙度与格口/等待阈值联动
- [ ] 每站展示统计日高峰段 + 24h 分布条 + 当日笔数/最忙小时
- [ ] 切换统计日可刷新高峰（Mock 覆盖 2026-06-01～30）
- [ ] 筛选单站点后仅该站且字段可复核

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

---

## 9. 站点支出（总览卡片）

### 9.1 数据源

| Mock 变量 | 关键字段 | 用途 |
|-----------|----------|------|
| `siteExpenseProfiles[]` | `siteId`, `venueFeeAmount`, `electricityMode`, `electricityUnitPrice`, `electricityFixedAmount`, `paymentCycle`, `landlord*`, `payMethod`, `payeeName`, `payAccount` | 站点费用配置 |
| `siteExpenseBills[]` | `periodStart`, `periodEnd`, `venueFee`, `electricityKwh`, `electricityFee`, `totalAmount`, `status`, `dueDate`, `payments[]` | 周期账单与支付记录 |
| `cabinetPowerDaily[]` | `site`, `date`, `kwh` | 按量电费的当月实际用电 |
| `state.pf.overviewExpense` | `month`, `siteId` | 总览卡片筛选 |

### 9.2 计算口径

```javascript
venueFeeInMonth = bill.venueFee / monthsBetween(bill.periodStart, bill.periodEnd)
electricityFeeInMonth =
  profile.electricityMode === '按量'
    ? sum(cabinetPowerDaily in selectedMonthAndSite) * profile.electricityUnitPrice
    : profile.electricityFixedAmount
```

- 场费：选中月落在账期内时，按账期自然月数等分；季付即当月 `1/3`。
- 电费：按所选月的实际时间消耗计算，不按账单账期等分；包月取固定月费。
- 已支付：仅汇总支付时间落在所选月的 `payments.amount`；部分支付保留未付余额。

### 9.3 状态与边界

- 筛选：月份必选，站点可选“全部”。
- 空态：无账单/配置时 KPI 为 0，并提示“暂无站点支出数据”。
- 错误态：按量模式缺单价或包月模式缺固定金额时禁止保存；账期起日晚于止日时禁止提交。
- 权限：运营商可配置与登记支付；站点合伙人只读本人绑定站点分润，不可见运营商站点成本。
