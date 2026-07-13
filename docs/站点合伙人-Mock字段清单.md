# 站点合伙人 · Mock 字段清单

> 原型数据源：`prototype/js/config-mock.js` · 交互：`prototype/js/app.js`  
> 规则真源：[站点合伙人.md](./站点合伙人.md) · [合伙人站点分佣.md](./合伙人站点分佣.md)

---

## 1. 演示主体

| 运营商 | 说明 |
|--------|------|
| `OP-SX` 绿色出行 | 主演示：浦东站双合伙人 + 世博站待生效 |

登录：
- **运营商** → 绿色出行（配置侧）
- **站点合伙人** → 王场地方 / 李物业（门户侧）

---

## 2. `sitePartners`（合伙人档案）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 如 `SP-01` |
| `operatorId` | string | 所属运营商 |
| `partnerType` | enum | `个人` / `公司` |
| `name` | string | 姓名或公司全称 |
| `contactName` | string? | 公司必填联系人 |
| `phone` | string | 手机/电话 |
| `bankAccount` | string | 收款账户（演示脱敏） |
| `status` | enum | `启用` / `停用` |

**Mock 样例**

| id | 类型 | 名称 |
|----|------|------|
| SP-01 | 个人 | 王场地方 |
| SP-02 | 公司 | 上海李物业有限公司 |
| SP-03 | 公司 | 浦东场地运营公司 |

---

## 3. `sitePartnerBindings`（站点 × 合伙人）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 如 `SPB-01` |
| `siteId` | string | 站点 ID |
| `operatorId` | string | 运营商 |
| `partnerId` | string | 合伙人 |
| `partnerName` | string | 冗余展示 |
| `partnerType` | enum | 个人/公司 |
| `ratePct` | number | 当前生效比例 |
| `pendingRatePct` | number? | 待生效比例 |
| `pendingEffectiveAt` | string? | 待生效时间（次日 0:00） |
| `effectiveAt` | string | 绑定生效日 |
| `status` | enum | `生效` / `已解绑` |

**Mock 样例（验收勾稽）**

| 站点 | 合伙人 | 比例 | 备注 |
|------|--------|------|------|
| ST-SH-01 浦东骑手驿站 | 王场地方 | 25% | — |
| ST-SH-01 | 李物业 | 5% | 合计 30% |
| ST-SH-02 世博换电服务点 | 王场地方 | 20% | 待生效 →25% |
| ST-SH-05 张江筹备站 | 李物业 | 15% | — |

**渠道专属站** `ST-SH-JD`：默认不参与；列表展示「渠道专属」。

---

## 4. `sitePartnerSplitLines`（分润明细）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 行 ID |
| `date` | string | 收入确认日 |
| `siteId` / `siteName` | string | 站点 |
| `partnerId` / `partnerName` | string | 合伙人 |
| `partnerRatePct` | number | 本站比例 |
| `shareBase` | number | 计提基数 B |
| `platformAmount` | number | 平台 1%（首行展示，同行其他合伙人可为 0） |
| `partnerAmount` | number | 该合伙人份额 |
| `operatorAmount` | number | 运营商余量（末行吸收尾差） |
| `splitLabel` | string | 展示标签 |
| `orderRef` | string | 关联套餐/换电单 |
| `userType` | string | 固定 `personal` |

**多合伙人同一订单**：同一 `orderRef` 多行，各合伙人一行切分。

---

## 5. `sitePartnerWithdrawalRequests`（合伙人提现）

| 字段 | 说明 |
|------|------|
| `partnerId` | 合伙人 |
| `operatorId` | 关联合伙人运营商 |
| `amount` | 申请金额 |
| `status` | `待审核` / `已到账` / `已驳回` |
| `accountLabel` | 到账账户展示 |

---

## 6. 原型入口对照

### 运营商侧

| 入口 | 路径 | 能力 |
|------|------|------|
| 侧栏 | 运营商 → **站点合伙人** | Tab：合伙人档案 / 分润绑定一览 / 分润明细 |
| 站点管理 | 站点列表 → **合伙人** 按钮 | 抽屉：添加/调比例/解绑 |

### 合伙人门户（独立登录）

| 登录 | 侧栏 | 演示要点 |
|------|------|----------|
| 站点合伙人 · 王场地方 | 总览 / 我的站点 / 分润明细 / 提现结算 / 收款账户 | 浦东 25%+世博 20%；累计 ¥122.25；可提现 ¥12.25 |
| 站点合伙人 · 李物业 | 同上 | 浦东 5%+张江 15%；无提现记录 |

---

## 7. 权限（员工演示）

| 权限 ID | 说明 |
|---------|------|
| `site_partners.view` | 查看站点合伙人菜单 |
| `site_partners.edit` | 编辑档案与站点绑定 |

默认财务员工 `王会计` 未含合伙人权限；主体登录或勾选上述权限可见。

---

## 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-07-07 | 初版：对齐 config-mock 与验收勾稽 |
| 1.1 | 2026-07-07 | 补合伙人独立登录门户与提现 Mock |
