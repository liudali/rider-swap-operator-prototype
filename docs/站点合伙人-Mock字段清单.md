# 站点合伙人 · Mock 字段清单

> **这是什么**：站点合伙人原型演示用的 Mock 数据结构说明——档案、绑站、变更记录、分润行、提现申请分别长什么样、演示账号怎么对。  
> **依据/关联**：[站点合伙人.md](./站点合伙人.md) · [合伙人站点分佣.md](./合伙人站点分佣.md) · 数据源 `prototype/js/config-mock.js` · 交互 `prototype/js/app.js`  
> **写法**：[业务文档写作规范](./业务文档写作规范.md)

---

## 业务设定

### 一句话

这份清单告诉开发和测试：绿色出行下怎么演示「一站双合伙人、同人多站、待开户闸门、合伙人门户提现」。

### Mock 用来验证什么

| 场景 | 演示要点 |
|------|----------|
| 一站多合伙人 | 浦东站：王场地方 25% + 李物业 5%（合计 30%） |
| 同人多站 | 王场地方：浦东 25%、世博 25% |
| 待开户 | 「浦东场地运营公司」待开户，不可绑站/提现 |
| 渠道专属站 | 京东专属站默认不参与分润，列表标「渠道专属」 |
| 合伙人门户 | 王场地方 / 李物业独立登录；看站点、明细、提现 |
| 变更留痕 | 添加/调比例/解绑立即生效并写变更记录 |

### 怎么登录看

| 身份 | 选谁 | 看什么 |
|------|------|--------|
| 运营商 | 绿色出行 | 站点合伙人菜单 + 站点列表「合伙人」抽屉 |
| 站点合伙人 | 王场地方 | 浦东 25%+世博 25%；累计与可提现演示数 |
| 站点合伙人 | 李物业 | 浦东 5%+张江 15%；无提现记录 |

### 权限（员工演示）

财务员工默认看不到合伙人菜单；主体登录或勾选「查看/编辑站点合伙人」后可见。

---

## 实现附录（开发用）

> 业务读者可跳过。下列为字段表与 Mock 样例。

### A. 演示主体

| 运营商 | 说明 |
|--------|------|
| `OP-SX` 绿色出行 | 主演示：浦东双合伙人 + 世博当前生效比例 |

### B. `sitePartners`（合伙人档案）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 如 `SP-01` |
| `operatorId` | string | 所属运营商 |
| `partnerType` | enum | `个人` / `公司`（建档锁定） |
| `accountStatus` | enum | `待开户` / `已开户` |
| `name` | string | 姓名或公司全称 |
| `idNo` | string? | 个人：身份证号 |
| `licenseNo` | string? | 公司：统一社会信用代码 |
| `legalName` | string? | 公司：法定代表人 |
| `contactName` | string? | 公司必填联系人 |
| `phone` | string | 手机/电话 |
| `bankAccountName` / `bankName` / `bankAccount` | string | 开户收款资料 |
| `bankAccountLabel` | string | 列表脱敏标签 |
| `openedAt` | string? | 开户日 |
| `status` | enum | `启用` / `停用` |

| id | 类型 | 名称 | 开户 |
|----|------|------|------|
| SP-01 | 个人 | 王场地方 | 已开户 |
| SP-02 | 公司 | 上海李物业有限公司 | 已开户 |
| SP-03 | 公司 | 浦东场地运营公司 | **待开户** |

### C. `sitePartnerBindings`（站点 × 合伙人）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 如 `SPB-01` |
| `siteId` | string | 站点 ID |
| `operatorId` | string | 运营商 |
| `partnerId` | string | 合伙人 |
| `partnerName` | string | 冗余展示 |
| `partnerType` | enum | 个人/公司 |
| `ratePct` | number | 当前生效比例 |
| `effectiveAt` | string | 绑定生效日 |
| `status` | enum | `生效` / `已解绑` |

| 站点 | 合伙人 | 比例 | 备注 |
|------|--------|------|------|
| ST-SH-01 浦东骑手驿站 | 王场地方 | 25% | — |
| ST-SH-01 | 李物业 | 5% | 合计 30% |
| ST-SH-02 世博换电服务点 | 王场地方 | 25% | 已生效 |
| ST-SH-05 张江筹备站 | 李物业 | 15% | — |

渠道专属站 `ST-SH-JD`：默认不参与；列表展示「渠道专属」。

### D. `sitePartnerBindingLogs`（绑定变更记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 变更记录 ID |
| `time` | datetime | 操作时间 |
| `siteId` / `siteName` | string | 站点 |
| `operatorId` | string | 所属运营商 |
| `bindingId` | string? | 绑定记录 ID |
| `partnerId` / `partnerName` | string | 合伙人 |
| `action` | enum | `添加` / `调比例` / `解绑` |
| `beforeRatePct` / `afterRatePct` | number? | 变更前后比例 |
| `by` | string | 操作人 |
| `remark` | string | 备注 |

规则：添加、调比例、解绑均立即生效；每次操作追加一条；历史分润不回溯。

### E. `sitePartnerSplitLines`（分润明细）

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

多合伙人同一订单：同一 `orderRef` 多行，各合伙人一行。

### F. `sitePartnerWithdrawalRequests`（合伙人提现）

| 字段 | 说明 |
|------|------|
| `partnerId` | 合伙人 |
| `operatorId` | 关联合伙人运营商 |
| `amount` | 申请金额 |
| `status` | `待审核` / `已到账` / `已驳回` |
| `accountLabel` | 到账账户展示 |

### G. 原型入口对照

**运营商侧**

| 入口 | 路径 | 能力 |
|------|------|------|
| 侧栏 | 运营商 → **站点合伙人** | Tab：合伙人档案 / 分润绑定一览 / 分润明细 |
| 站点管理 | 站点列表 → **合伙人** 按钮 | 抽屉：添加/调比例/解绑 |

**合伙人门户**

| 登录 | 侧栏 | 演示要点 |
|------|------|----------|
| 站点合伙人 · 王场地方 | 总览 / 我的站点 / 分润明细 / 提现结算 / 收款账户 | 浦东 25%+世博 25%；累计 ¥122.25；可提现 ¥12.25 |
| 站点合伙人 · 李物业 | 同上 | 浦东 5%+张江 15%；无提现记录 |

### H. 权限 ID

| 权限 ID | 说明 |
|---------|------|
| `site_partners.view` | 查看站点合伙人菜单 |
| `site_partners.edit` | 编辑档案与站点绑定 |

默认财务员工「王会计」未含上述权限。

### I. 修订记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.2 | 2026-07-16 | 分型开户字段、即时生效与 bindingLogs |
| 1.1 | 2026-07-07 | 补合伙人独立登录门户与提现 Mock |
| 1.0 | 2026-07-07 | 初版：对齐 config-mock 与验收勾稽 |
