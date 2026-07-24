    const PLATFORM_OPS_SHARE = 0;
    const DEFAULT_PLATFORM_FEE_RATE = 0.01;
    const PLATFORM_FEE_RATE = DEFAULT_PLATFORM_FEE_RATE;

    /** 个人用户付费分佣：平台抽成 + 运营商净额（可按运营商配置不同比例） */
    function formatFeeRatePct(rate) {
      const pct = rate * 100;
      return (pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")) + "%";
    }

    function operatorPlatformFeeConfig(operatorId) {
      return operatorPlatformFeeRates[operatorId] || {
        cEndRate: DEFAULT_PLATFORM_FEE_RATE,
        bEndRate: DEFAULT_PLATFORM_FEE_RATE,
        effectiveFrom: "—",
        status: "生效",
        updatedAt: "—",
        updatedBy: "平台默认",
        remark: "未单独配置，使用默认 1%"
      };
    }

    function operatorCEndFeeRate(operatorId) {
      return operatorPlatformFeeConfig(operatorId).cEndRate;
    }

    function operatorBEndFeeRate(operatorId) {
      return operatorPlatformFeeConfig(operatorId).bEndRate;
    }

    function operatorFeeRateSummary(operatorId) {
      const cfg = operatorPlatformFeeConfig(operatorId);
      if (cfg.cEndRate === cfg.bEndRate) return formatFeeRatePct(cfg.cEndRate);
      return `C ${formatFeeRatePct(cfg.cEndRate)} / B ${formatFeeRatePct(cfg.bEndRate)}`;
    }

    function calcPersonalPaymentSplit(allocatable, operatorId) {
      const rate = operatorId ? operatorCEndFeeRate(operatorId) : DEFAULT_PLATFORM_FEE_RATE;
      const platformShare = Math.round(allocatable * rate * 1000) / 1000;
      const operatorShare = Math.round((allocatable - platformShare) * 1000) / 1000;
      const platformPct = Math.round(rate * 10000) / 100;
      const operatorPct = Math.round((100 - platformPct) * 1000) / 1000;
      return { platformShare, operatorShare, platformPct, operatorPct };
    }

    function splitPctLabel(operatorId) {
      const sp = calcPersonalPaymentSplit(100, operatorId);
      return `平台${sp.platformPct}% + 运营商${sp.operatorPct}%`;
    }

    function calcPlatformFeeAmount(basePrice, operatorId, trigger) {
      const t = String(trigger || "");
      const isBEnd = t === "确认消耗" || t.startsWith("确认消耗") || t === "consume" || t === "激活码核销";
      const rate = isBEnd ? operatorBEndFeeRate(operatorId) : operatorCEndFeeRate(operatorId);
      return Math.round(basePrice * rate * 1000) / 1000;
    }
    const l1UnifiedPricing = { cabinetFee: 0.5, batteryFee: 0.1, effectiveFrom: "2026-01-01", status: "生效", updatedAt: "2026-01-01", updatedBy: "平台管理员" };
    /** 平台统一人天标准日值：B 端 1% 计提基数；亦为运营商面向渠道商的默认批发价（运营商可改） */
    const platformStandardDayPrice = { price: 8.5, effectiveFrom: "2026-01-01", status: "生效", updatedAt: "2026-01-01", updatedBy: "平台管理员" };
    /** 跨网统价 · 城市覆盖（默认全网价可被城市行覆盖；改价不追溯） */
    const l1CityOverrides = [
      { id: "L1C-SH", city: "上海", cabinetFee: 0.5, batteryFee: 0.1, status: "沿用全网", updatedAt: "2026-07-01" },
      { id: "L1C-HZ", city: "杭州", cabinetFee: 0.6, batteryFee: 0.12, status: "覆盖生效", updatedAt: "2026-07-10" }
    ];
    /** 人天标准日值 · 城市覆盖 */
    const stdDayCityOverrides = [
      { id: "STD-SH", city: "上海", price: 8.5, status: "沿用全网", updatedAt: "2026-07-01" },
      { id: "STD-HZ", city: "杭州", price: 9.0, status: "覆盖生效", updatedAt: "2026-07-12" }
    ];
    const leasePenaltyConfig = {
      types: ["逾期未缴", "擅自转租", "设备损毁", "提前退租"],
      graceDays: 3, dailyRatePct: 0.05, capPctOfDue: 24, updatedAt: "2026-07-13", updatedBy: "产品确认"
    };
    const smsAlertRecords = [
      { id: "SMS-260713-01", time: "2026-07-13 09:00", template: "人天池不足10天", toRole: "渠道商·顺丰", to: "138****1001", bizRef: "QP-2601", status: "已发送" },
      { id: "SMS-260713-02", time: "2026-07-13 09:00", template: "人天池不足10天", toRole: "运营商·绿色出行", to: "139****2002", bizRef: "QP-2601", status: "已发送" },
      { id: "SMS-260712-01", time: "2026-07-12 18:20", template: "设备离线告警", toRole: "运营商运维", to: "137****3011", bizRef: "CAB-22019", status: "已发送" }
    ];
    const smsAlertTemplates = [
      { id: "TPL-POOL-10D", name: "人天池不足10天", receivers: "渠道管理员+运营商管理员", channel: "短信" },
      { id: "TPL-IOT-OFF", name: "设备离线告警", receivers: "运营商运维值班", channel: "短信" }
    ];

    function platformAccrualDayPrice() { return platformStandardDayPrice.price; }
    /** 额度池规则：平台统一，全池一致 */
    const POOL_CONTRACT_RULES = {
      deductMode: "换电或持电池确认", activationMode: "分配即开通", poolExpiryRefund: "不退",
      deductModeKey: "swap_or_battery_confirm", activationModeKey: "on_allocate", poolExpiryRefundKey: "none"
    };
    function userHasActivePersonalPackage(phone) {
      const digits = (phone || "").replace(/\D/g, "");
      const u = users.find(x => {
        const p = (x.phone || "").replace(/\D/g, "");
        return digits && (p.endsWith(digits.slice(-4)) || p === digits);
      });
      if (!u || u.poolId) return false;
      if (u.serviceState === "已冻结") return false;
      if (u.serviceState === "中途完结") return false;
      if ((u.pkg || "").includes("人天池")) return false;
      return !u.serviceState || u.serviceState === "服务中";
    }
    function recycleChannelRiderToPool(rider, reason, operatorLabel) {
      const pool = dayPools.find(p => p.id === rider.poolId);
      const days = rider.remainingDays || 0;
      if (pool && days > 0) {
        pool.availableDays += days;
        pool.balancePct = Math.round(pool.availableDays / pool.totalDays * 1000) / 10;
        appendPoolLedger(pool, "收回入账", days, rider.id, reason);
        dayPoolAllocationLogs.unshift({
          id: "AL-" + Date.now().toString().slice(-4), poolId: pool.id, riderId: rider.id, riderName: rider.name,
          type: "收回", days, time: new Date().toISOString().slice(0, 16).replace("T", " "),
          operator: operatorLabel || "渠道商管理员", poolBalanceAfter: pool.availableDays, remark: reason
        });
      }
      rider.allocatedDays = rider.usedDays || 0;
      rider.remainingDays = 0;
      rider.quotaStatus = "已收回";
      rider.todayEligibility = "已回池";
    }
    const INTER_OP_CLEAR_TIME = "23:59:59";
    const PAY_ARCH = "B";
    const PAYEE_OPERATOR = "绿色出行";
    const DATA_PANEL_PATH = "data-panel/index.html";
    const PAYEE_MCH = { wx: "1900000123***", ali: "2088123456***" };
    const PLATFORM = { id: "PLATFORM", name: "智格超能" };
    const ENT = {
      platform: { id: "PLATFORM", name: "智格超能" },
      operator: { id: "OP-SX", name: PAYEE_OPERATOR },
      channel: { id: "CH-SF", name: "顺丰同城渠道" },
      leasing: { id: "LEASE-HD", name: "华东设备租赁公司" },
      sitePartner: { id: "SP-01", name: "站点合伙人" }
    };

    const CHANNEL_REGISTRY = {
      "CH-SF": { id: "CH-SF", name: "顺丰同城渠道", settlementMode: "人天池", logo: "🚚", tree: "向运营商采购人天额度 · 团队登记 · 预占确认消耗" },
      "CH-CARD": { id: "CH-CARD", name: "骑士卡渠道", settlementMode: "卡差价", logo: "🟡", tree: "推广链接 · 用户直购 · 渠道标记 · 佣金结算" },
      "CH-RENT": { id: "CH-RENT", name: "京东物流租赁渠道", settlementMode: "设备租赁", logo: "🔴", tree: "租赁设备+月租 · 白名单套餐 · 渠道收款" },
      "CH-ACT": { id: "CH-ACT", name: "蜂鸟激活码渠道", settlementMode: "激活码", logo: "🎫", tree: "批发激活码 · 骑手核销获套餐 · 不经平台收款" }
    };
    const CHANNEL_NAV = {
      "CH-SF": ["overview", "channelSettlement", "dayPool", "orderAudit", "channelCredit", "employees"],
      "CH-CARD": ["overview", "channelSettlement", "channelLinks", "channelOrders", "commissionStatement", "accounts", "orderAudit"],
      "CH-RENT": ["overview", "channelSettlement", "leasePkgPricing", "accounts", "rentPool", "rentDevices", "leaseBatteryHold", "leaseWhitelist", "channelInterOp", "orderAudit", "channelCredit", "employees"],
      "CH-ACT": ["overview", "channelSettlement", "activationCodes", "activationRecords", "orderAudit", "channelCredit", "employees"]
    };

    const ROLE = {
      platform: { name: ENT.platform.name, type: "平台管理员", tree: "用户/订单/设备/流水 · 运营商治理（含渠道监管）· 跨网统价" },
      operator: { name: ENT.operator.name, type: "运营商", tree: "换电运营 · 定价 · 渠道管理 · 设备订单流水" },
      channel: { name: ENT.channel.name, type: "渠道商", tree: "单运营商签约 · 三种结算模式 · 渠道信用额度 · 团队登记" },
      leasing: { name: ENT.leasing.name, type: "设备租赁公司", tree: "放款申请确认 · 授信与还款跟踪 · 须平台绑定运营商" },
      sitePartner: { name: "站点合伙人", type: "站点合伙人", tree: "绑定站点分润 · 明细查询 · 提现结算（只读配置）" }
    };
    const NAV = {
      platform: ["overview", "platformUsers", "platformOrders", "platformDevices", "platformMarketing", "platformFlows", "platformAccounts", "operators", "platformLeasing", "operatorCreditEval", "orderAudit", "depositManage", "l1Pricing", "employees"],
      operator: ["overview", "pricing", "channelSales", "sites", "devices", "financeManage", "orderService", "flows", "platformService", "employees", "users", "accounts"],
      channel: ["overview", "channelSettlement", "dayPool", "channelCredit", "employees"],
      leasing: ["overview", "employees", "financeDrawdown", "accounts"],
      sitePartner: ["partnerOverview", "partnerBindings", "partnerLedger", "partnerWithdraw", "partnerAccount"]
    };
    const NAV_LABEL = {
      overview: "总览", employees: "员工", sites: "站点管理", sitePartners: "站点合伙人", siteExpenses: "站点支出", devices: "我的设备",
      orderService: "订单与服务", orderPackage: "套餐购买订单", orderSwap: "换电订单", orderUserDeposit: "用户押金", orderFreeze: "服务冻结", orderAudit: "变更记录", refundManage: "退款管理",
      flows: "我的流水", users: "用户",
      leaseAgreements: "协议与设备", leaseCollect: "租金收缴", leaseRent: "月租金",
      financeManage: "融资管理", financeDrawdown: "放款申请",
      accounts: "收款账户", dayPool: "人天额度池", channelSettlement: "结算模式说明", channelCredit: "渠道信用额度",
      channelLinks: "套餐与链接", channelOrders: "购卡记录", commissionStatement: "佣金对账", rentPool: "月租账单", rentDevices: "租赁设备", leaseBatteryHold: "电池持有", leaseWhitelist: "白名单用户", leasePkgPricing: "白名单套餐", channelInterOp: "跨网往来账",
      activationCodes: "激活码", activationRecords: "核销记录",
      pricing: "平台设置", channelSales: "渠道管理", platformService: "平台服务", depositAccount: "服务保证金账户", interOp: "运营商往来账", platformFee: "平台服务费",
      operators: "运营商管理", platformLeasing: "租赁公司", operatorCreditEval: "运营商信用评估", depositManage: "保证金管理", deviceBinding: "设备绑定", l1Pricing: "平台统价",
      platformUsers: "用户管理", platformOrders: "订单管理", platformDevices: "设备管理",
      platformChannels: "渠道商管理", platformMarketing: "平台营销", platformFlows: "流水管理", platformAccounts: "平台账户",
      partnerOverview: "总览", partnerBindings: "我的站点", partnerLedger: "分润明细",
      partnerWithdraw: "提现结算", partnerAccount: "收款账户"
    };

    const ENTITY_ROLE = { [ENT.platform.id]: "platform", "OP-SX": "operator", "CH-SF": "channel", "CH-CARD": "channel", "CH-RENT": "channel", "CH-ACT": "channel", "LEASE-HD": "leasing", "LEASE-HS": "leasing", "OP-HZ": "operator" };

    const PERM_VIEW_MAP = {
      "overview.view": ["overview"],
      "sites.view": ["sites"], "sites.edit": ["sites"],
      "site_partners.view": ["sites"], "site_partners.edit": ["sites"],
      "site_expenses.view": ["sites"], "site_expenses.edit": ["sites"],
      "devices.view": ["devices"], "devices.edit": ["devices"],
      "orders.view": ["orderService", "orderPackage", "orderSwap", "orderUserDeposit", "orderFreeze", "orderAudit"],
      "orders.audit": ["orderService", "orderPackage", "orderFreeze"],
      "refunds.view": ["orderService", "refundManage"], "refunds.audit": ["orderService", "refundManage"],
      "flows.view": ["flows"],
      "users.view": ["users"],
      "employees.view": ["employees"], "employees.edit": ["employees"],
      "finance.view": ["financeManage"],
      "finance.drawdown": ["financeDrawdown"],
      "accounts.view": ["accounts"],
      "day_pool.view": ["dayPool", "orderAudit"],
      "day_pool.edit": ["dayPool", "orderAudit"],
      "day_pool.export": ["dayPool", "orderAudit"],
      "channel_settlement.view": ["channelSettlement"],
      "channel_credit.view": ["channelCredit"],
      "channel_links.view": ["channelLinks", "orderAudit"],
      "channel_orders.view": ["channelOrders", "orderAudit"],
      "rent_pool.view": ["rentPool", "orderAudit"],
      "rent_devices.view": ["rentDevices", "orderAudit"],
      "lease_whitelist.view": ["leaseWhitelist", "orderAudit"],
      "channel_inter_op.view": ["channelInterOp", "orderAudit"],
      "lease_pkg.view": ["leasePkgPricing", "orderAudit"],
      "lease_battery.view": ["leaseBatteryHold", "orderAudit"],
      "pricing.view": ["pricing"], "pricing.edit": ["pricing"],
      "channel_sales.view": ["channelSales"],
      "inter_op.view": ["platformService"],
      "deposit.view": ["platformService"],
      "platform_fee.view": ["platformService"],
      "activation_codes.view": ["activationCodes", "activationRecords", "orderAudit"],
      "platform.overview": ["overview"],
      "platform.users": ["platformUsers"],
      "platform.orders": ["platformOrders"],
      "platform.devices": ["platformDevices"],
      "platform.channels": ["operators"],
      "platform.marketing": ["platformMarketing"],
      "platform.flows": ["platformFlows"],
      "platform.accounts": ["platformAccounts"],
      "platform.operators": ["operators"],
      "platform.operator_withdraw": ["operators"],
      "platform.operator_fee": ["operators"],
      "platform.leasing": ["platformLeasing"],
      "platform.operator_credit": ["operatorCreditEval"],
      "platform.audit": ["orderAudit"],
      "platform.deposit": ["depositManage"],
      "platform.pricing": ["l1Pricing"],
      "platform.admins": ["employees"]
    };


    const meta = {
      overview: ["总览", "设备四类 KPI + 经营汇总；站点繁忙度（实时等级 + 按日换电高峰时段）与用电量汇总统计。"],
      sites: ["站点管理", "站点信息、场费电费、站点支出与站点合伙人。"],
      sitePartners: ["站点合伙人", "按个人/公司建档并完成开户；一站多位、一人多站；在「站点管理」中按站配置比例。"],
      partnerOverview: ["总览", "累计分润、本月分润、绑定站点；只读查看运营商为您配置的站点与比例。"],
      partnerBindings: ["我的站点", "各绑定站点的当前分润比例（只读）。"],
      partnerLedger: ["分润明细", "个人用户 C 端确认收入产生的分润切分行。"],
      partnerWithdraw: ["提现结算", "须已开户；向运营商发起提现/代付申请；审核后打款至开户账户。"],
      partnerAccount: ["收款账户", "按个人/公司类型展示开户资料；待开户可自助补齐。"],
      siteExpenses: ["站点支出", "跨站点全部周期账单与支付记录；按站配置见「场费电费」。"],
      devices: ["我的设备", "换电柜/电池台账；二期含流转导出、运维记录、电柜组成、端口操作。"],
      orderService: ["订单与服务", "二级：套餐购买订单 / 换电订单 / 用户押金 / 服务冻结 / 变更记录 / 退款管理。"],
      orderPackage: ["套餐购买订单", "已并入「订单与服务」；个人用户购买包月/次卡；含待退款状态。"],
      orderSwap: ["换电订单", "已并入「订单与服务」；换电行为与三元组；个人套餐不展示应分（支付已清分）。"],
      orderUserDeposit: ["用户押金", "已并入「订单与服务」；用户购套餐同笔实付押金与信用免押明细；筛选+分页；退押走退款管理。"],
      orderFreeze: ["服务冻结", "已并入「订单与服务」；个人套餐冻结/解冻记录；满足条件时系统自动生效。"],
      refundManage: ["退款管理", "已并入「订单与服务」；C 端退订/中途完结退款：申请队列、审核确认、退款设置。"],
      orderAudit: ["变更记录", "已并入「订单与服务」（运营商）；订单/服务生命周期审计时间线（C-02）。"],
      flows: ["我的流水", "C 端支付成功实时清分；提现须平台审核；本页展示资金实收、清分明细与提现申请。"],
      employees: ["员工", "运营员工维护与功能权限配置。"],
      users: ["用户", ""],
      leaseAgreements: ["协议与设备", "租赁协议关联设备清单；清单单独维护，支持导入与设备替换；一运营商可与<strong>多家租赁公司</strong>分别签约（须平台先建立绑定）。"],
      leaseCollect: ["租金收缴", "按账期跟踪各承租方租金收缴进度、方式与逾期。"],
      leaseRent: ["月租金", "租赁租金须运营商<strong>手动</strong>缴纳：微信/支付宝扫码或对公打款工单；<strong>不做自动扣款</strong>。"],
      financeManage: ["融资管理", "运营商与融资租赁方协作台账：授信项目 → 可融资资产池 → 放款申请批次 → 预还款计划 → 借据 → 正式还款计划 → 还款日历。"],
      financeDrawdown: ["放款申请", "资方视角：录入主体授信、尽调审查、登记放款、还款工单确认。"],
      activationCodes: ["激活码", "渠道申请批发 → 确认到账按单造码；标记发放；一码一用；作废需运营商确认（无退款）。"],
      activationRecords: ["核销记录", "激活码核销成功记录；触发平台向运营商 B 端 1% 计提（与人天池确认消耗同类费率）。"],
      accounts: ["收款账户管理", "进件子商户须绑定对公结算账户：提现/分账打款至此对公户；含开户名、开户行、账号。"],
      dayPool: ["人天额度池", "渠道商向签约运营商购买人天额度，登记骑手并分配/收回；换电时按日预占与确认消耗。"],
      pricing: ["平台设置", ""],
      channelSales: ["渠道管理", "签约渠道商、渠道订单与渠道权益；维护各渠道权益与定价。"],
      interOp: ["运营商往来账", "已并入「平台服务 → 运营商往来」页内 Tab：概况 / 跨网服务费明细 / 日清账单 / 周月汇总。"],
      depositAccount: ["服务保证金账户", "页内 Tab：账户概况 / 充值申请 / 变动明细。"],
      platformService: ["平台服务", "二级：服务保证金账户 / 平台服务费 / 运营商往来（页内：概况/明细/日清/周月）。"],
      channelSettlement: ["渠道结算模式", "人天池 / 渠道分销（骑士卡） / 设备租赁 / 激活码四种结算模式演示。"],
      channelCredit: ["渠道信用额度", "平台评估信用抵扣押金；运营商可调整额度；渠道提交打款凭证由运营商审核。"],
      commissionStatement: ["佣金对账", "页内「月度汇总 / 明细」；统计范围默认<strong>近6个月</strong>，可选近12个月或任意自然月。开启<strong>佣金及时到付</strong>时展示已即时分账；未开启则为线下待结。"],
      channelLinks: ["套餐与链接", "管理运营商授权的可售套餐；同一套餐可生成<strong>多条推广链接</strong>与<strong>二维码</strong>；扫码直达运营商小程序；24h 归因期内享渠道专享价。"],
      channelOrders: ["购卡记录", "经本渠道推广链接成交的套餐购买记录；支持<strong>支付时间</strong>筛选。"],
      rentPool: ["月租账单", "向运营商支付设备月租（MO-）；欠费停服。"],
      rentDevices: ["租赁设备", "柜机/电池 SN 与部署站点；月租为签约统一价。"],
      leaseWhitelist: ["白名单用户", "扁平名单 · 无团队 · 渠道自行维护；区分<strong>白名单免费</strong>与<strong>白名单付费</strong>（须购白名单套餐）。"],
      leasePkgPricing: ["白名单套餐", "渠道自定 SKU 与零售价；<strong>仅白名单用户</strong>可购；款项进入<strong>本渠道收款账户</strong>。"],
      channelInterOp: ["渠道跨网往来账", "设备租赁渠道开通跨网后，骑手在他网换电的跨网设备服务费经平台代收代付。"],
      platformFee: ["平台服务费", "页内 Tab：费用总览 / C 端支付分账 / B 端消耗计提。"],
      operators: ["运营商管理", "二级：运营商列表 / 提现审核 / 平台服务费 / 渠道商管理。主体维护、账户汇总、准入档位；渠道商全平台只读监管。"],
      platformLeasing: ["租赁公司", "平台维护设备租赁公司与运营商绑定关系；绑定后租赁公司方可向该运营商发起签约。"],
      operatorCreditEval: ["运营商信用评估", "准入档位制（A/B/C/D）：档位配置、入网定档、升降档与变更记录；约束信用额度封顶。"],
      depositManage: ["保证金管理", "平台清分专户、运营商对公充值确认、保证金/信用额度调整（≤档位封顶）与变动账本。"],
      deviceBinding: ["设备绑定", "仅平台可将物联网设备绑定至运营商；绑定后运营商方可分配至站点。"],
      l1Pricing: ["平台统价", "二级：跨网服务费（含城市覆盖） / 人天标准日值（含城市覆盖） / 预警短信。"],
      platformUsers: ["用户管理", "二级菜单：用户信息 / 用户押金统计 / 服务变更。"],
      platformOrders: ["订单管理", "全平台套餐购买、换电与渠道批发订单查询与追溯。"],
      platformDevices: ["设备管理", "全量设备台账；「批量导入」弹窗：先选运营商，再手工填 SN 或上传 SN 表格（类型/参数 IoT 回填）。"],
      platformChannels: ["渠道商管理", "已并入「运营商管理 → 渠道商管理」；全平台渠道商查询与监管；主体由签约运营商创建维护，平台只读。"],
      platformMarketing: ["平台营销", "【二期】立减券获客；购时锁 OP；款进运营商（不代收）；券面价差默认运营商让利；1% + 营销服务费协议结算。一期不交付，原型仅演示。"],
      platformFlows: ["流水管理", "用户支付记录、运营商间跨网清分、平台提成。"],
      platformAccounts: ["平台账户", "智格平台技术服务费收款商户；<strong>账户余额/冻结为当前实时状态</strong>；提成与营收构成按月汇总。"]
    };

    const MODULE_NOTES = {
      scope: { title: "数据范围", content: "运营商、资金方可持有自有或租赁设备；渠道商不持设备。各主体仅管理本人数据。员工登录时数据范围限定在所属主体及授权范围。<br><br><strong>说明按钮规则</strong>：凡展示统计结果的字段/KPI，「说明」中须写清<strong>字段定义</strong>、<strong>计算公式或聚合口径</strong>、<strong>数据来源</strong>（及演示缩放规则，如有）。" },
      asset_owner: { title: "设备归属", content: "柜机/电池归属运营商或资金方（租赁时产权在出租方）。后台仅展示当前登录主体名下设备；订单按 device_owner_id 过滤。" },
      own_data: { title: "自有经营数据", content: "「我的设备 / 套餐·换电·服务订单 / 我的流水」仅含本运营商自有（或承租）设备相关数据。" },
      employees_panel: { title: "员工管理", content: "渠道商可添加运营员工并分配功能权限。" },
      employees_perms: { title: "员工权限", content: "按功能模块勾选可见/可操作范围；未授权菜单对员工账号不可见（演示为配置说明）。" },
      employee_login: { title: "员工登录", content: "员工使用独立账号登录；侧栏仅展示其权限内的菜单；数据范围限定在所属主体。" },
      employee_login_scope: { title: "权限与数据范围", content: "运营员工按勾选权限看到对应模块，数据与所属主体一致。" },
      overview_sites: { title: "在营站点", content: "统计范围：当前主体授权站点中，status=在营 且至少 1 台柜机 online=true 的站点数。" },
      overview_online: { title: "柜机在线率", content: "公式：在线柜机数 ÷ 授权站点柜机总数 × 100%。在线判定来自物联网 lastHeartbeat；离线含故障、断网。" },
      overview_orders: { title: "订单数", content: "筛选期内 payTime 落在范围内的 packageOrders 笔数，状态含支付成功、服务中、待退款等（不含已驳回）。" },
      overview_net: { title: "可分配经营收入", content: "运营商主体维度：包月按日摊销 P÷D 后的确认收入（扣通道费）。<strong>不按站点归因</strong>；站点评估见「站点繁忙度分析」。" },
      overview_kpi_panel: { title: "经营概览", content: "上方为柜机/电池/站点<strong>实时快照</strong>（自有+租赁合并）；「统计范围」仅缩放下方「套餐购买金额」「活跃用户」。财务提现、跨网、服务费等改至对应业务页查看。" },
      overview_cab_total: { title: "柜机", content: "计数：自有柜机 + 租赁柜机（deviceOwnerId=当前运营商）。<br>副文案「在线 X 台 · Y%」：online=true 台数；在线率 = 在线÷总数×100%（1 位小数），自有/租赁合并计算。" },
      overview_bat_total: { title: "电池", content: "计数：自有电池 + 租赁电池。<br>在线判定：有 online 字段优先；否则随所在柜机 online；柜外充电/未入柜按 health=正常计为在线。[假设]" },
      overview_site_status: { title: "站点", content: "计数：myOperatorSites（本运营商站点）。副文案拆分营业状态：在营 / 建设中 / 停用。" },
      overview_pkg_pay: { title: "套餐购买金额", content: "公式：Σ packageOrders.pay（当前运营商），再按统计范围倍数缩放（原型）。含义：C 端套餐/次卡<strong>实付合计</strong>，非清分台账。" },
      overview_own_cab: { title: "自有柜机", content: "（已合并至「柜机」KPI）计数：cabinets 中 deviceOwnerId=当前运营商 且 ownership≠租赁。" },
      overview_own_bat: { title: "自有电池", content: "（已合并至「电池」KPI）" },
      overview_lease_cab: { title: "租赁柜机", content: "（已合并至「柜机」KPI）" },
      overview_lease_bat: { title: "租赁电池", content: "（已合并至「电池」KPI）" },
      overview_cleared: { title: "已清分金额", content: "概览已改为「套餐购买金额」；清分明细见财务/资金相关页。原公式：Σ packageOrders.accrued 且 payout=已清分。" },
      overview_withdrawable: { title: "可提现余额", content: "概览已下线该 KPI；<strong>一期</strong>公式：已清分 − 已提现 − 待审提现。<strong>二期</strong>再扣本月融资待还预留。详见提现申请页。" },
      overview_inter_pending: { title: "跨网待日清", content: "概览已下线；见运营商往来账。" },
      overview_platform_fee_kpi: { title: "平台服务费（概览 KPI）", content: "概览已下线；见平台服务费账单。" },
      overview_channel_summary: { title: "签约渠道汇总", content: "概览已改为「站点」营业状态 KPI；渠道签约仍见渠道管理。" },
      channel_settlement_activation: { title: "激活码结算", content: "渠道<strong>申请</strong>批发单 AC-（线下对公）→ 运营商<strong>确认到账</strong>后系统<strong>按订单数量自动造码</strong>（订单=批次，码带批次内编号）。渠道<strong>标记发放</strong>；核销后状态自动更新。无线上退款；作废由渠道发起、运营商确认。骑手小程序输码开通，<strong>不经平台收款</strong>。平台 1% 在<strong>核销成功时</strong>按「标准人天价 × 服务人天 × B 端费率」向 U 计提（与批发单价无关）。" },
      inter_op_receivable: { title: "待日清·平台代收（应收）", content: "公式：Σ 待日清往来账中 direction=平台代收 的金额。<br>含义：其他运营商用户在本运营商设备换电时，平台待划入本运营商的跨网设备服务费。" },
      inter_op_payable: { title: "待日清·平台代付（应付）", content: "公式：Σ 待日清往来账中 direction=平台代付 的金额。<br>含义：本运营商用户在他网换电时，平台待从本运营商保证金/信用额度代付的跨网设备服务费。" },
      inter_op_net: { title: "轧差净额", content: "公式：平台代收（应收）− 平台代付（应付）。<br>正数表示日清后净收入，负数表示净支出；仅展示平台代收/代付，不见对手运营商。" },
      data_drill_panel: { title: "换电订单数", content: "紧凑卡片：按日换电订单数（含当日）。<br>· <strong>平台总览</strong>：先筛运营商，再筛该运营商下站点（切换运营商时站点重置为全部）<br>· 时间范围默认近 7 天，可选近 30 天或自定义（最多 31 天）" },
      data_drill_spark: { title: "换电订单折线图", content: "按所选站点与日期区间生成每日 Mock 换电订单数；右侧合计为区间之和；最高/最低取自序列。正式环境对接按日聚合 API（含当日）。" },
      platform_no_share: { title: "平台运营分成", content: "骑手套餐/换电应分台账记录运营商本站经营应得。平台收取 1% 技术服务费（C 端支付分账 + B 端确认消耗计提），见「平台服务费」。" },
      pricing_pkg: { title: "个人套餐定价", content: "默认按<strong>运营商×城市×SKU</strong>维护城市底价。<strong>一期可选 SKU（暂定）</strong>：包月30天、7天套餐、1天套餐、单次换电（名称仅可选、编辑时不可改名）。渠道骑手<strong>不</strong>走个人套餐自费兜底。<strong>价格分区</strong>为<strong>二期</strong>。押金见「押金设置」。" },
      pricing_zone: { title: "价格分区（二期）", content: "<strong>二期</strong>：运营商在同城创建分区，勾选挂接站点并按 SKU 配置区价。<strong>一站仅可属一个分区</strong>；未挂区用城市底价。解析：区价 ?? 城市底价。<strong>移除分区</strong>即恢复城市底价。已购订单沿用下单快照。一期验收不测。" },
      channel_sales: { title: "渠道管理", content: "运营商维护<strong>签约渠道</strong>、<strong>渠道订单</strong>与渠道权益。已售额度池：每渠道×运营商<strong>仅一个</strong>实例。" },
      channel_partner_rights: { title: "渠道商权益", content: "按结算模式区分：<strong>人天池</strong>—批发人天/额度池/团队/信用；<strong>渠道分销</strong>—授权 SKU 专享价+佣金+推广链接；<strong>设备租赁</strong>—统一月租/专属站/白名单/<strong>白名单套餐+收款账户</strong>/电池持有；<strong>激活码</strong>—申请批发/确认造码/标记发放/作废审批/核销记录。" },
      channel_partner_manage: { title: "渠道商主体管理", content: "由运营商在「渠道管理 → 签约渠道」维护。<strong>登录账号为手机号</strong>，渠道商在登录页选「渠道商登录」凭手机号+密码进入，默认密码 123456；可在登录页/账号菜单通过<strong>短信验证码</strong>改密（演示码 888888）。卡差价：按渠道×SKU 配置专享价与佣金；可开启<strong>佣金及时到付</strong>（须渠道进件收款账户）。人天池：批发单价与起购；设备租赁：统一月租与专属站。平台仅查询监管。" },
      login_portal: { title: "登录分流与改密", content: "登录页区分<strong>运营商登录</strong>与<strong>渠道商登录</strong>。账号均为手机号+密码。修改密码页：手机号 → 获取验证码 → 新密码（≥6 位）→ 返回登录；演示验证码固定 888888。" },
      day_pool_one_per_operator: { title: "一运营商一池", content: "渠道商 × 运营商 = <strong>唯一</strong> `DayPool`。向第二家运营商签约才新增池；增购、赠送、退款、分配、预占/确认等均写入<strong>额度变动记录</strong>，不新建第二池。" },
      day_pool_b2b_settlement: { title: "B2B 资金与平台计提", content: "渠道<strong>采购/到账时</strong>批发款已是运营商收入（在线 T+0/T+1 或线下确认）。骑手<strong>确认消耗</strong>仅扣池余额，<strong>不向运营商二次打款</strong>；平台按标准人天价 × 1% 向额度售卖方计提（见「平台服务费」）。" },
      inter_op: { title: "运营商往来账", content: "归属「平台服务 → 运营商往来」页内 Tab：概况 / 跨网服务费明细 / 日清账单 / 周月汇总。跨站换电时 U 经平台代付柜机费+电池费；日清优先划扣平台保证金。概况支持<strong>今日/昨日/近7天/近30天</strong>；明细可筛站点/状态/方向/换电单。运营商只见平台代收/代付，不见对手方。" },
      inter_op_case3: { title: "案例 #3", content: "个人用户 U 在 C 柜换 B 电池：U 经平台代付 ¥0.5 柜机费 + ¥0.1 电池费（U→B，已确认）；双方不见对手方信息。" },
      inter_op_privacy: { title: "平台代收代付", content: "运营商互不可见对方主体；往来账仅展示「平台代收」「平台代付」及金额，内部三元组由平台清分。" },
      inter_op_pricing: { title: "跨网使用费单价", content: "平台统一管控（暂定）：柜机 ¥0.5/次，电池 ¥0.1/次。运营商后台只读，变更由平台发布。" },
      inter_op_clearing: { title: "日清规则", content: "每天 23:59:59 汇总当日 跨网设备服务费明细并清分：优先划扣平台保证金，仅当保证金余额为 0 时才启用信用额度记账。周/月报表由日账单聚合。" },
      operator_deposit: { title: "平台保证金", content: "运营商在平台预存的清分账户。平时 跨网设备服务费平台代收/代付、B 端 1% 平台费均从保证金划扣；余额为 0 后才启用信用额度。充值通过对公转账至平台清分专户，平台财务确认后入账。" },
      operator_credit: { title: "信用额度", content: "仅当平台保证金余额为 0 时启用，允许欠费记账。信用额度也用光后，自动关闭该运营商所属全部用户（个人+渠道）的跨网换电；本站换电不受影响。" },
      operator_credit_eval: { title: "准入档位", content: "平台对运营商主体的招商准入政策包（方案 B）。A/B/C/D 四档绑定最低保证金、信用封顶、跨网默认、可签渠道数。入网定档 + 年度复审；运营商只读，不能自改授信上限。与「渠道信用评估」独立。" },
      deposit_recharge: { title: "对公充值流程", content: "① 运营商在「保证金账户」提交充值申请（金额、转账日期、银行流水号）；② 对公转账至平台清分专户（附言含运营商 ID）；③ 平台在「保证金管理 → 充值确认」核对到账后确认入账；④ 保证金余额增加，恢复保证金优先扣款。" },
      deposit_manage: { title: "平台保证金管理", content: "平台维护清分收款专户；审核运营商对公充值；可手工调整保证金余额、设置信用额度上限。所有变动写入保证金账本。" },
      swap_policy: { title: "换电范围设置", content: "运营商可开启/关闭<strong>跨网换电</strong>（双向封闭）。<strong>同运营商内任意站点</strong>均可购套餐、换电；<strong>不设用户绑定站点</strong>。" },
      swap_policy_cross_net: { title: "跨网换电", content: "关闭后：① 本运营商用户不可在其他运营商柜机换电；② 其他运营商用户不可在本运营商站点换电。与信用额度停跨网叠加。" },
      platform_fee: { title: "平台服务费", content: "平台按<strong>运营商维度</strong>配置抽成比例（默认 1%）。<strong>C 端</strong>：支付成功分账至平台商户（已确认）。<strong>B 端渠道人天</strong>：确认消耗时按平台标准人天价 × 该运营商 B 端费率向额度售卖方 U 计提（与批发价无关）。运营商后台只读查看本主体适用比例；优先划扣保证金，保证金为 0 才占用信用额度。" },
      platform_operator_fee_rate: { title: "运营商平台服务费", content: "在<strong>运营商管理 → 运营商平台服务费</strong>维护各运营商 C 端 / B 端抽成比例（可不同）。新订单、新消耗按生效配置计算；历史已清分不回溯。运营商在「平台服务费」页只读查看。" },
      platform_fee_trigger: { title: "计费触发", content: "C 端：支付成功分账（费率=该运营商 C 端比例）。B 端人天池：<strong>确认消耗</strong>分两场景——<strong>确认消耗-换电</strong>（关联换电单）与<strong>确认消耗-持有电池</strong>（当日无换电但持电池，无关联单）；费率=该运营商 B 端比例，计提基数=平台标准人天价。B 端激活码：<strong>码核销成功</strong>（同 B 端费率）。计提主体均为额度售卖方 U。" },
      platform_standard_day_price: { title: "人天标准日值", content: "平台统一设置（默认 ¥8.5/人天），可按<strong>城市覆盖</strong>；向运营商展示；B 端 1% 平台费按此计提。亦为运营商面向渠道商的<strong>默认批发价</strong>，运营商可在定价管理中修改实际批发价。" },
      pricing_quota: { title: "人天批发定价", content: "运营商向签约渠道商设定人天批发单价与最低起购量；<strong>默认批发价</strong>（无渠道）供新建签约继承，可单独设置；各渠道可覆盖。新建默认价=平台标准人天价，运营商可改。平台 B 端 1% 仍按平台标准价计提。" },
      flows_accrual: { title: "清分明细", content: "C 端支付成功后的分账明细：平台 1%、运营商净额；含退款冲正记录。" },
      overview_users: { title: "活跃用户", content: "计数：users 中 deviceOwnerId=当前主体，且 serviceState∉{已冻结,中途完结}，pkg 文案不含「退款/完结」的去重骑手。<br>受经营概览内「统计范围」演示缩放（今日×1 / 近7日×5.2 / 近30日×18）。" },
      overview_site_stats: { title: "站点繁忙度", content: "每站点一张卡片：<strong>实时繁忙度</strong>（低/中/高）+ <strong>统计日换电高峰</strong>（按小时聚合，标出集中时段与 24h 分布条）。不用收入评估。" },
      overview_site_name: { title: "站点", content: "站点名称 + sites.id。须至少有一台归属当前运营商的柜机。" },
      overview_site_address: { title: "地址", content: "取自 sites.address；未维护时回退 city。" },
      overview_site_cabinets: { title: "柜机", content: "总台数及在线/离线快照。" },
      overview_site_slots: { title: "格口占用", content: "已占用 / 格口总数；占用≈柜内电池数。占用率≥85% 参与「高」繁忙判定。" },
      overview_site_cab_batteries: { title: "柜内电池", content: "当前在柜电池块数（实时快照）。" },
      overview_site_waiting: { title: "等待中", content: "当前站点排队待换电骑手数。≥3 参与「高」繁忙判定。" },
      overview_site_busy: { title: "繁忙度", content: "高（等待≥3 或格口≥85%）· 中（等待≥1 或≥60%）· 低。仅反映<strong>此刻</strong>排队/格口，与下方「当日高峰」互补。" },
      overview_site_peak: { title: "换电高峰", content: "统计日按小时 Σ 换电成功笔数；≥当日峰值 65% 的连续小时合并为高峰段。用于排班与备电，不替代实时繁忙度。" },
      overview_site_busy_date: { title: "统计日", content: "模块内独立日期；默认演示日 2026-06-15。切换后刷新各站当日小时分布与高峰段。" },
      overview_power_stats: { title: "用电量统计", content: "模块内独立<strong>起止时间</strong>与<strong>站点筛选</strong>（默认所有站点）；变更即刷新。展示汇总 KPI 与日用电趋势折线图。" },
      overview_power_kwh: { title: "用电量", content: "单位 kWh；来源为柜机每日上报的充电/待机消耗合计（Mock：cabinetPowerDaily）。" },
      overview_site_expense: { title: "站点支出", content: "总览卡片：按<strong>月</strong>与<strong>站点</strong>汇总。<strong>场费</strong>跨月账期按账期比例分摊（如季付 1/3）；<strong>电费按当月时间消耗计算</strong>（按量=柜机日用电×单价，包月=固定月费）。" },
      overview_site_expense_venue: { title: "场费", content: "跨月账期按账期月数等分（如季付当月 = 场费×1/3）。" },
      overview_site_expense_elec: { title: "电费", content: "按当月时间消耗计算：<strong>按量</strong>取柜机日用电合计×站点单价；<strong>包月</strong>取配置固定月费。与账单账期分摊无关。" },
      site_expenses_panel: { title: "场费电费", content: "在<strong>站点管理 → 场费电费</strong>按站点维护<strong>场地费</strong>、<strong>电费</strong>（按量/包月）、<strong>付费周期</strong>、场地所有人与<strong>收款方式</strong>；周期账单可登记支付。跨站汇总见同级「站点支出」。" },
      site_expenses_venue: { title: "场地费", content: "与场地方约定的固定场地使用费；按付费周期出账。" },
      site_expenses_electricity: { title: "电费", content: "按量：期间用电量 × 单价；包月：固定金额。用电量可引用 IoT 统计或手工录入。" },
      site_expenses_cycle: { title: "付费周期", content: "月结 / 季结 / 年结；决定账单账期粒度与应付日。" },
      site_expenses_landlord: { title: "场地所有人", content: "场地方联系人/产权方；用于对账与合同追溯。" },
      site_expenses_pay_method: { title: "收款方式", content: "对公转账 / 微信 / 支付宝 / 现金；含收款户名与账号。" },
      site_expenses_bill: { title: "周期账单", content: "账期内场地费 + 电费合计；状态：待支付 / 部分支付 / 已结清。" },
      site_expenses_time: { title: "时间筛选", content: "按<strong>账期起止</strong>与筛选范围求交集过滤账单与 KPI；快捷范围切换时同步起止日期；自定义日期点击「查询」生效。" },
      site_expenses_payment: { title: "支付记录", content: "针对账单的实付登记：时间、金额、方式、流水号、经办人。「期间已付」= 筛选期内支付流水合计。" },
      site_partner_panel: { title: "站点合伙人", content: "运营商建档时选定类型（<strong>个人</strong>/<strong>公司</strong>），类型锁定后按类型完成<strong>开户资料绑定</strong>方可绑站与提现。一站可绑多位、一人可多站；本站合伙人比例合计 ≤99%。" },
      site_partner_binding: { title: "站点合伙人设置", content: "在<strong>站点 → 合伙人设置</strong>中为该站添加/调整合伙人及本站比例。仅<strong>已开户</strong>合伙人可绑定。添加 / 调比例 / 解绑均<strong>立即生效</strong>，并写入变更记录。渠道专属站默认不参与。" },
      site_partner_change_log: { title: "合伙人变更记录", content: "记录本站合伙人的<strong>添加、调比例、解绑</strong>：操作时间、操作人、变更前后比例。变更立即生效，已发生的分润明细不回溯。" },
      site_partner_open_account: { title: "合伙人开户", content: "运营商建档时锁定<strong>个人/公司</strong>类型；开户须按类型绑定资料：个人=实名+身份证+个人卡；公司=证照+法人+对公户。未开户不可绑站、不可提现。" },
      site_partner_split: { title: "分润明细", content: "仅<strong>个人用户</strong> C 端确认收入参与切分：平台 1% + 合伙人 R% + 运营商余量（吸收尾差）。渠道人天、设备租赁白名单不参与。" },
      partner_portal: { title: "合伙人门户", content: "站点合伙人<strong>独立登录</strong>视角：只读查看运营商配置的绑定站点与比例、分润明细；待开户时可自助补齐开户资料；提现向<strong>运营商</strong>申请，审核后代付/对公结算。" },
      partner_bindings_readonly: { title: "比例只读", content: "分润比例由运营商在「站点管理 → 合伙人」配置；变更<strong>立即生效</strong>。本页只读当前生效比例。" },
      partner_withdraw: { title: "提现结算", content: "须<strong>已开户</strong>。累计分润达可提现余额后可申请；<strong>运营商</strong>审核后打款至开户收款账户。与运营商向平台提现（平台审核）流程不同。" },
      overview_power_site: { title: "站点用电", content: "Σ 该站点下所有柜机在筛选期内的日用电量；柜机数为去重 SN 数。" },
      overview_power_cabinet: { title: "单柜用电", content: "单台柜机在筛选期内的累计用电；可跳转「我的设备 → 换电柜」查看实时读数。" },
      sites_panel: { title: "站点信息", content: "运营商负责站点 CRUD 与设备分配；入口在「站点管理 → 站点信息」。可维护<strong>定位坐标</strong>（经度/纬度，非必填，成对填写）。换电范围见「平台设置 → 换电范围」。" },
      devices_cab: { title: "换电柜管理", content: "列表字段对齐 IoT 台账。<strong>仅换电柜</strong>可绑定/变更站点；电池与站点无绑定关系。已绑定站点的柜机可执行<strong>移柜</strong>。<br>详情「换电模式切换」枚举：<strong>正常换电 / MQTT离线换电 / 蓝牙换电</strong>。<br><span class='badge-p2'>二期</span>：导出电池流转记录、运维操作记录、电柜组成、详情页<strong>远程运维按钮条</strong>（快照/通断电/风扇/重启等）、端口状态·操作 — 一期不交付，原型可浏览。" },
      devices_cab_remote_ops: { title: "换电柜详情 · 远程运维（二期）", content: "【二期】详情页运维按钮条：查看快照/发送请求/运维记录、通断电、风扇、主板重启、更新版本、上传二维码、反向供电等。一期不交付；原型可浏览并提示二期。" },
      devices_cab_compose: { title: "电柜组成（二期）", content: "【二期】模块清单与格口快照；含隔口开关、上下电演示。一期不交付。" },
      devices_cab_port_ops: { title: "端口状态 · 操作（二期）", content: "【二期】详情页端口状态可只读浏览；开门/刷新/补电/通断电等<strong>操作</strong>属二期。一期不交付，原型仅演示入口。" },
      devices_cab_bat_flow: { title: "导出电池流转记录（二期）", content: "【二期】按时间范围导出电池入柜/出柜/流转 CSV。一期不交付。" },
      devices_cab_ops_log: { title: "运维操作记录（二期）", content: "【二期】远程运维指令与结果流水。一期不交付，原型可浏览演示表。" },
      devices_move_cab: { title: "移柜", content: "前提：柜机已绑定站点（<code>cabinets.site</code> 对应运营商在营站点）。将柜机从 A 站迁至 B 站，同步更新投放地址与城市；<strong>不迁移电池</strong>（电池位置仍随柜内格口/流转记录，与站点无绑定）。移柜留痕 Mock。" },
      devices_bat: { title: "电池", content: "归属本运营商的电池 SN、电量与健康度。位置四档：自有电柜 / 其他运营商电柜 / 柜外 / 柜外-用户；支持按位置筛选与分页。补电与调拨在运维流程处理（原型仅占位）。" },
      orders_pkg: { title: "套餐购买订单", content: "骑手支付购买的包月/次卡订单，定义服务有效期与额度。支持中途完结退款、冻结/解冻。一笔套餐在有效期内可产生多笔换电订单。" },
      orders_service_change: { title: "服务变更", content: "骑手发起的<strong>中途完结</strong>及<strong>冻结/解冻</strong>记录。中途完结进入退款流程；冻结/解冻在个人用户满足条件时<strong>系统自动生效</strong>，本后台只读查询。" },
      orders_early_end: { title: "退款追溯", content: "退款详情抽屉展示<strong>进度步骤</strong>、关联<strong>服务变更单/套餐单</strong>及<strong>支付与退款流水</strong>、清分冲正；与列表审核操作在同一模块完成。" },
      refund_manage: { title: "退款管理", content: "C 端退订/中途完结/冷静期/<strong>押金退还</strong>统一入口。待审单点「处理退款」：展示可退口径，快捷策略（手动/全部/仅押金/拒绝），录入实退押金与实退订单金额（≤可退）。套餐退款与押金退还可<strong>分别</strong>设置自动/手动。<strong>支付渠道按比例原路退</strong>：退套餐费时<strong>平台 C 端 1% 同步按比例冲正退还</strong>（见 decision-008）。押金不参与 1%，退押无平台费冲正。" },
      refund_platform_fee: { title: "平台费退还", content: "微信/支付宝等通道退款按分账比例回退。<br>· 退套餐费 R 时：平台费退还 ≈ R × C 端费率（或 原平台费 × R/原实付）<br>· 清分明细记「平台费冲正」<br>· <strong>押金</strong>未参与分账 → 退押不冲平台费<br>· 废止旧口径「平台 1% 不退」（D24）在 C 端原路退场景的适用" },
      refund_cooling_period: { title: "3 天冷静期", content: "自<strong>支付成功/开通服务</strong>起 <strong>3 个自然日</strong>内，用户可申请退款。<br>建议应退套餐费 = 实付 ×（总天数 − 已使用天数）÷ 总天数；押金按还电规则另计。<br><strong>默认须运营商审核</strong>；确认退款时可修改实退金额。<br>超过 3 天：不享受冷静期强制退款权益；平台不主动退还，用户可尝试中途完结（须符合 SKU 规则）。" },
      refund_mode_auto: { title: "套餐退款 · 自动", content: "开启后，符合 §5.2.1 SKU 规则（<strong>不含冷静期</strong>）且已还电 → 系统自动原路退。<strong>冷静期申请始终须人工确认</strong>（不受自动模式影响）。" },
      refund_mode_manual: { title: "套餐退款 · 手动", content: "关闭自动退款时，所有<strong>套餐类</strong>退款申请进入待审核；运营商<strong>确认退款</strong>后系统自动执行原路退/垫付记账。" },
      deposit_refund_mode: { title: "押金退还模式", content: "骑手申请<strong>仅退电池押金</strong>（已还电）统一进入「退款管理」。<br>· <strong>自动退款</strong>：已还电且无争议 → 系统自动原路退运营商子商户实收押金<br>· <strong>手动确认</strong>：进入待审核，确认后系统执行<br>· 与套餐退款模式<strong>独立配置</strong>；冷静期/中途完结中的押金子项随主单审核" },
      orders_freeze: { title: "服务冻结", content: "<strong>个人套餐</strong>用户在<strong>套餐有效期内</strong>且<strong>未持有电池</strong>时可申请冻结/解除冻结，<strong>满足条件即系统自动生效</strong>，无需运营商审核。冻结期间不可换电；解冻后 <code>valid_to</code> 按冻结天数顺延，<strong>首次服务为领取电池</strong>（非换电），之后继续消耗原套餐额度。渠道人天用户不适用。" },
      orders_deposit: { title: "电池押金", content: "换电需绑定电池时收取押金；归还电池并完结服务后退还。<br>· <strong>押金方式（全站统一）</strong>：仅 <strong>实付 / 信用免押 / 渠道担保 / ——</strong>（decision-068）；不单列「无需押金」<br>· <strong>套餐购买订单</strong>：押金方式与<strong>收款状态</strong>（已收 / 待付 / ——）分列；仅实付有收款状态（decision-067）<br>· <strong>实付</strong>：购套餐同笔支付，全额进运营商子商户，<strong>不参与</strong>平台/合伙人清分<br>· <strong>信用免押</strong>：芝麻信用/微信支付分达标免实付（仍须还电规则）" },
      orders_user_deposit: { title: "用户押金", content: "运营商「订单与服务 → 用户押金」：按套餐单展示押金明细。<br>· <strong>押金类型</strong>：实付 / 信用免押<br>· <strong>押金状态</strong>：仅实付有「在押 / 退押中 / 已退押」；信用免押统一 ——<br>· 筛选项：套餐单号、手机、支付日、押金类型、押金状态；支持分页<br>· 渠道担保不在本页；退押执行在「退款管理」" },
      orders_deposit_waiver: { title: "信用免押", content: "满足运营商「押金设置」中的<strong>微信支付分</strong>或<strong>芝麻信用</strong>门槛可免实付押金（仍须遵守还电规则）。详情页与实付押金分开展示。" },
      rider_battery_deposit: { title: "骑手电池押金", content: "与「平台保证金」不同。<br>· 个人：购套餐<strong>同笔</strong>免押或实缴 → 运营商子商户<br>· 渠道人天：<strong>首次领电前</strong>免押或实缴（非静默渠道担保）<br>· <strong>押金方式（全站）</strong>：仅 <strong>实付 / 信用免押 / 渠道担保 / ——</strong>（decision-068）<br>· 运营商「订单与服务 → 用户押金」明细；「用户」台账；平台「用户管理 → 用户押金统计」只读汇总<br>· 数额见「定价管理 → 押金设置」；<strong>仅退押</strong>进「退款管理」" },
      platform_users_info: { title: "用户信息", content: "全平台用户列表。<br>· <strong>电池押金</strong>：实付（实收¥xx）/ 信用免押（支付分或芝麻 xx分）/ 渠道担保（渠道名）/ ——<br>· <strong>押金状态</strong>：仅<strong>实付</strong>有「在押 / 退押中」；信用免押、渠道担保、无记录统一 ——<br>· <strong>持有电池</strong>：编码-SOC-SOH（归属运营商）或未持有" },
      platform_users_deposit_stats: { title: "用户押金统计", content: "按运营商汇总实付在押、免押人数、渠道担保、退押中金额；只读，不参与平台/合伙人清分。" },
      pricing_deposit: { title: "押金设置", content: "面向<strong>个人购套餐</strong>与<strong>渠道人天首次领电</strong>：用户可选<strong>微信支付分免押</strong>或<strong>实缴押金</strong>。<br>· 可配置：押金数额、微信支付分门槛、芝麻信用门槛、启停<br>· 任一路达标即可免押（实收 ¥0）；均未达标则须实缴<br>· 个人：购套餐同笔；渠道人天：首次领取电池前办结（decision-050）<br>· 设备租赁白名单仍可走渠道担保（B 端）" },
      orders_swap: { title: "换电订单", content: "列出换电单；权益来源：<strong>个人套餐</strong>（支付时已清分，本表不展示应分）、<strong>渠道人天</strong>、<strong>激活码（二期）</strong>（按天/次确认消耗，类人天）。每笔记录三元组 U/C/B 与跨网设备服务费。" },
      orders_swap_triplet: { title: "运营商三元组与 跨网设备服务费", content: "换电成功时 IoT 上报 userOwner/cabinetOwner/batteryOwner。应付方恒为 userOwner：C≠U 时代付柜机费 ¥0.5/次；B≠U 时代付电池费 ¥0.1/次；经平台保证金/信用额度日清。运营商往来账只见平台代收/代付。" },
      orders_swap_entitlement: { title: "权益来源与消耗", content: "<strong>个人套餐</strong>：骑手在线购套餐，款在<strong>支付成功</strong>时已清分；换电仅履约，不记应分/消耗。点套餐单号在<strong>换电订单页内</strong>抽屉查看套餐明细，不跳转「套餐购买订单」列表。<br><strong>渠道人天</strong>：换电消耗额度池人天（预占→确认）。<br><strong>激活码（二期）</strong>：渠道线下批发码，骑手输码开通；换电按<strong>天/次</strong>确认消耗并向运营商结算（类人天），不产生 C 端应分金额。" },
      orders_swap_log: { title: "换电进度", content: "与骑手端一致的四步柜门交互：① N号柜门已打开 → ② 请放入电池并关闭柜门（提示确认插好）→ ③ M号柜门已打开 → ④ 请取出电池并关闭柜门。N/M 取还电/取电格口。" },
      orders_usage: { title: "有效期内使用情况", content: "在套餐 valid_from～valid_to 内汇总：已换电次数、涉及站点、换电明细列表。次卡展示剩余次数；包月展示剩余天数与期内换电次数。" },
      accrual_swap: { title: "换电清分", content: "C 端支付成功后<strong>实时清分</strong>至平台/运营商；换电记录关联清分状态为已清分。" },
      payout_pkg: { title: "支付即清分", content: "套餐/次卡支付成功时实时清分：平台 C 端服务费、站点合伙人分润、运营商净额；押金不参与切分。提现须平台审核。" },
      arch_b: { title: "架构 B · 运营商收款", content: "骑手 C 端支付进入<strong>运营商</strong>微信/支付宝子商户；支付成功时 1% 分账至平台商户。人天池/激活码渠道无 C 端收款账户；<strong>渠道分销</strong>在运营商开启「佣金及时到付」且渠道进件后，佣金随支付<strong>即时分账</strong>至渠道子商户。" },
      flows_receipt: { title: "资金实收", content: "骑手套餐/自费支付进入<strong>运营商</strong>进件商户的实收流水；<strong>退款亦由运营商子商户原路出款</strong>。" },
      flows_accrual: { title: "清分明细", content: "C 端支付成功后的分账明细：平台 1%、运营商净额；开启<strong>佣金及时到付</strong>的骑士卡链接订单另含渠道佣金分账；含退款冲正记录。" },
      flows_payout: { title: "提现申请", content: "运营商从可提现余额发起申请 → 平台审核 → 通过后打款至<strong>收款账户</strong>默认子商户绑定的<strong>对公结算账户</strong>。<br><strong>一期</strong>可提现 = 已清分 − 已提现 − 待审（不扣融资待还）。「本月融资待还」预留属<strong>二期</strong>（与融资管理同期）。<strong>未绑定对公不可提现</strong>。<strong>渠道商-设备租赁</strong>不适用本流程（白名单套餐款进渠道子商户）。" },
      flows_withdraw_apply: { title: "发起提现", content: "申请金额不得超过当前可提现余额；提交后状态为「待审核」，平台在流水管理审核。" },
      platform_withdraw_review: { title: "运营商提现审核", content: "平台审核运营商提现申请：通过后代付/提现至运营商绑定账户；驳回须填写原因。<br>仅适用于<strong>运营商</strong>经营收入子商户，不含渠道商-设备租赁。" },
      orders_pkg_pay: { title: "收款主体", content: "架构 B 下 C 端套餐支付进入<strong>运营商</strong>进件商户（演示：绿色出行）。渠道商无收款账户；B 端采购款付至运营商。" },
      users_panel: { title: "用户", content: "本运营商旗下骑手；<strong>不设绑定站点</strong>。<br>· <strong>套餐/服务</strong>与<strong>服务状态</strong>分列<br>· <strong>电池押金</strong>（方式）与<strong>押金状态</strong>分列；仅实付有在押/退押中<br>· 人天池权益、换电与最近活跃" },
      lease_agreements: { title: "协议与设备", content: "资方维护<strong>租赁协议</strong>（承租运营商 + 关联设备清单 + 租金条款）；<strong>设备清单单独维护</strong>，一清单可对应一协议；同一运营商可有<strong>多份协议/多份清单</strong>。不含站点。变更须运营商确认，次月 1 日生效。" },
      lease_device_lists: { title: "设备清单", content: "资方独立维护的设备组合（柜机/电池 SN）；可<strong>导入</strong>、清单内设备允许<strong>替换</strong>（如电池 A 无法维修换为电池 B），保留替换记录。新建协议时选择待绑定清单。" },
      lease_device_replace: { title: "设备替换", content: "在设备清单中将故障设备标记为「已替换」，登记新 SN 与原因；<strong>仅保修期内</strong>可替换（保修期跟随设备，平台管理员可编辑）。若清单已绑定履约中协议，替换后须运营商确认（次月 1 日生效）。" },
      lease_confirm: { title: "运营商确认", content: "新签或变更协议提交后状态为「待确认」/「变更待确认」。运营商确认前<strong>不出账</strong>。确认后按生效日执行；变更统一<strong>次月 1 日</strong>生效。租金始终<strong>手动缴纳</strong>，无自动扣款。" },
      finance_scope: { title: "融资台账", content: "运营商与融资租赁方<strong>唯一在线协作入口</strong>：授信项目 → 可融资资产池 → <strong>资产包</strong> → 放款申请批次 → 预还款计划 → 借据 → 还款日历。<br><strong>decision-056</strong>：运营商「我的设备」不再维护独立「设备租赁协议」；融资设备在设备列表仅显示「融资」标签，协议/还款一律在本模块（二期）。" },
      finance_dashboard: { title: "融资工作台", content: "汇总待还、逾期、拟占用、主体授信占用；待办含尽调、登记放款（资方）。" },
      finance_ledger: { title: "融资台账", content: "按资方、项目、月份、批次查看全部放款申请；批次详情含<strong>关联资产包</strong>、申请/确认金额、预还款计划、借据与还款进度。" },
      finance_projects: { title: "授信项目", content: "<strong>运营商主体级总授信</strong>由资方批授信后录入；展示总额、已占用、拟占用（已提交待审+尽调通过待放款）、可用。默认<strong>非循环</strong>，循环额度在借据还清后释放。" },
      finance_operator_credit: { title: "主体级总授信", content: "资方对运营商的批授信额度（录入）。口径：总额 = 可用 + 已占用 + 拟占用。新增申请须关联已建授信项目；已提交待审即占用拟占用。" },
      finance_asset_package: { title: "资产包", content: "融资前须先<strong>配置资产包</strong>：从可融资池勾选设备组成一包，再生成放款批次。<strong>互斥</strong>：已被其他包/批次占用的 SN 不可重复选。首期不做 Excel 导入。" },
      finance_asset_replace: { title: "资产替换", content: "融资资产池内：坏件登记换新 SN；旧资产标「已替换」，新资产继承包/协议关联（演示）。" },
      finance_agreement: { title: "融资协议", content: "独立实体：协议号 + 设备清单 + <strong>一份还款计划</strong>。一批次一协议；登记放款时由资方操作并自动生成。" },
      finance_due_diligence: { title: "尽调审查", content: "资方对运营商及标的物审查，<strong>非竞标</strong>。通过后待登记放款，占用拟占用额度。" },
      finance_disburse: { title: "登记放款", content: "<strong>仅资方</strong>可操作。绑定资产包、预还款计划、协议与借据。" },
      finance_repay_ticket: { title: "还款工单", content: "运营商提交还款（含部分还款）；资方确认后计入实还。循环额度借据还清后释放。" },
      finance_penalty: { title: "违约金（可配）", content: "一期可配：违约类型（逾期未缴/擅自转租/设备损毁/提前退租）+ 参数（宽限期、日率、上限比例）。系统按规则计算；租金逾期一期<strong>只标记不自动停服</strong>。" },
      finance_asset_exclusion: { title: "资产互斥", content: "同一 SN 同时仅属一个有效资产包/批次。「包内占选」= 草稿包占用；「申请锁定」= 已提交资方；「已融资」= 已绑定借据。" },
      finance_assets: { title: "可融资资产池", content: "人工确认可融资设备清单。状态含：可融资 / 包内占选 / 申请锁定 / 已融资 等；列「关联资产包/批次」便于追溯。" },
      finance_repayments: { title: "还款日历", content: "按自然日聚合多笔借据正式还款计划；展示应还、实还、未还与逾期；支持登记还款（演示）。" },
      finance_approval: { title: "资方审批（通用）", content: "标准审批视图：申请摘要 → 资产包明细 → 授信占用 → 预还款计划 → 通过/驳回。驳回须填原因，批次退回运营商。" },
      finance_drawdown: { title: "放款申请（资方）", content: "录入主体授信；<strong>尽调审查</strong>已提交批次；<strong>登记放款</strong>（仅资方）；确认还款工单。" },
      finance_pre_plan: { title: "预还款计划", content: "借据生成前维护；可 Excel 上传或手工录入。提交资方后进入待确认；资方确认后锁定，放款时固化为正式还款计划。" },
      finance_confirm_flow: { title: "状态流转", content: "资产包 → 批次草稿 → 已提交资方（拟占用）→ 尽调通过/驳回 → 登记放款（协议+借据）→ 已放款 → 还款工单。" },
      lease_term_fixed: { title: "固定租期", content: "须填写起止日期；到期自动进入「待续签/已到期」；续签须运营商重新确认。" },
      lease_term_rolling: { title: "滚动租期", content: "仅填起始日，无固定截止日；任一方终止须<strong>提前 N 天通知</strong>（协议约定，如 30 天）；终止结算单须运营商确认。" },
      lease_collect: { title: "租金收缴", content: "出租方专用：按账期跟踪微信/支付宝扫码/对公工单收缴进度；审核运营商提交的对公打款工单。<strong>无自动扣款</strong>。" },
      lease_rent_monthly: { title: "月租金", content: "承租方按月查看各<strong>租赁协议</strong>账单与缴纳状态（月租金按协议出账，不按单台设备拆分）。到期须<strong>主动</strong>微信/支付宝扫码或对公工单缴纳；<strong>系统不自动扣款</strong>。" },
      lease_cover_gap: { title: "待缴租金", content: "应付 − 已实还；须在线扫码或对公工单<strong>手动</strong>缴纳。<strong>不与站点繁忙度或收入挂钩</strong>。" },
      lease_auto_deduct: { title: "自动扣款（不支持）", content: "租赁租金<strong>永不启用</strong>自动扣款、代扣协议或经营收入划扣。仅支持手动扫码与对公工单。" },
      lease_manual_pay: { title: "在线缴纳", content: "运营商在「月租金」选择<strong>微信支付</strong>或<strong>支付宝</strong>扫码支付，成功后即时核销账单并打款至资方收款商户。" },
      lease_offline_ticket: { title: "对公打款工单", content: "运营商对公转账至资方对公账户后，在「月租金」提交工单（金额、流水号、转账日、凭证说明）；<strong>资方在「租金收缴」审核确认</strong>后账单核销。驳回须重新提交。" },
      lease_devices: { title: "清单内设备", content: "来自关联设备清单的在租 SN；清单由资方单独维护，支持导入与设备替换。" },
      lease_contracts: { title: "租赁协议", content: "资方维护：承租方、设备清单、月租金、押金、租期类型（固定/滚动）、还款日。变更后须运营商重新确认，次月 1 日生效。" },
      lease_repay: { title: "还款计划", content: "按期应还/已还金额与状态；逾期标红。" },
      lease_panel: { title: "资金方后台", content: "设备租赁公司（融资租赁方）登录后审核<strong>平台已绑定</strong>运营商提交的放款申请、确认预还款计划与放款金额；合作运营商名单来源于<strong>平台管理员</strong>维护的绑定关系。" },
      accounts_panel: { title: "收款账户管理", content: "架构 B：C 端套餐款进<strong>运营商子商户</strong>（微信/支付宝进件）；每个进件账户须绑定<strong>对公结算账户</strong>（户名/开户行/账号）。平台审核提现后打款至默认子商户绑定的对公户。B2B/对公通道账户本身即对公户。" },
      accounts_corp_bind: { title: "绑定对公账户", content: "字段：对公户名、开户行、对公账号、联行号（选填）。未绑定对公不可发起提现。变更后新提现按新账户打款，历史申请不变。" },
      accounts: { title: "进件账户摘要", content: "运营商/资金方在微信、支付宝的进件子商户号摘要；完整进件与对公绑定在「收款账户」菜单维护。" },
      device_ownership: { title: "设备权属", content: "<strong>自有</strong>：产权归本运营主体。<br><strong>融资</strong>（原「设备租赁」权属，<span class='badge-p2'>二期</span>）：设备融资/还款并入「融资管理」；运营商<strong>我的设备</strong>不再打开「租赁协议」抽屉，仅展示融资标签与资方摘要。<br>渠道商「设备租赁」结算模式（白名单）仍为独立二期渠道模式，与运营商设备融资不是同一需求。" },

      channel_settlement_card: { title: "渠道分销（骑士卡）", content: "渠道为<strong>推广销售渠道</strong>：用户经推广链接/二维码进入<strong>运营商小程序</strong>，24h 内购套餐享<strong>渠道专享价</strong>。<br><strong>本月成交</strong>=筛选月 channelLinkOrders 笔数；<strong>本月应结佣</strong>=Σ commission；<strong>推广链接</strong>点击/成交=各 link 累计 clicks/conversions。" },
      channel_settlement_rent: { title: "设备租赁", content: "运营商维护<strong>租赁设备清单</strong>与<strong>专属站点</strong>；签约<strong>统一月租</strong>（MO→运营商）。渠道视为<strong>小型运营商</strong>：设备为租赁资产，可配置<strong>跨网换电</strong>（须向平台缴纳保证金）。白名单分<strong>免费</strong>（B2B 覆盖）与<strong>付费</strong>（须购白名单套餐）。" },
      lease_whitelist_pkg: { title: "白名单套餐", content: "仅<strong>白名单付费</strong>类型用户须购买。渠道在「白名单套餐」维护 SKU；支付进<strong>渠道收款账户</strong>。白名单免费用户无需购套餐。" },
      lease_whitelist: { title: "白名单用户", content: "渠道自行维护扁平名单。<strong>白名单免费</strong>：入名单即可换电（月租 B2B 覆盖）。<strong>白名单付费</strong>：须购有效白名单套餐方可换电。添加时选择类型。" },
      lease_whitelist_access: { title: "白名单类型", content: "<strong>白名单免费</strong>：渠道 B2B 月租已覆盖，名单内骑手免 C 端购套餐即可换电。<br><strong>白名单付费</strong>：名单内骑手须购买「白名单套餐」（款进渠道子商户）后换电；未购套餐扫码引导购买。" },
      channel_lease_crossnet: { title: "设备租赁 · 跨网换电", content: "渠道商在设备租赁模式下可视为<strong>小型运营商</strong>：名下骑手 userOwner=渠道。开通跨网后，骑手在他网换电产生<strong>跨网设备服务费</strong>，由渠道向平台保证金/信用额度支付（规则同运营商）。<br><strong>开通条件</strong>：向平台缴纳跨网保证金（演示 ¥20,000）。" },
      channel_inter_op: { title: "渠道跨网往来账", content: "设备租赁渠道开通跨网后，本渠道骑手在他网换电的<strong>跨网设备服务费</strong>经平台代收代付；渠道只见平台代付/代收，不见对手方运营商。" },
      lease_battery_hold: { title: "电池持有", content: "展示本渠道白名单用户当前持有的<strong>电池 SN</strong>、SOC、取电时间与站点；数据来自换电/IoT，渠道<strong>只读</strong>。" },
      lease_dedicated_site: { title: "渠道专属站点", content: "签约设备租赁时可<strong>新建/绑定专属站点</strong>，标记 <code>public_open=false</code>（<strong>专用·不对公众开放</strong>）。租赁设备默认部署在该站。<br>骑手端小程序地图/附近站点：<strong>仅该渠道白名单用户</strong>可见专属站 POI；非白名单地图不可见，扫码拦截。" },
      channel_card_margin: { title: "佣金对账", content: "按<strong>自然月</strong>汇总经推广链接成交订单。<br><strong>佣金及时到付</strong>：支付成功已分账至渠道子商户，对账页展示「已即时分账」。<br><strong>线下结算</strong>：应结佣金=Σ commission；由运营商与渠道线下结。平台 1%=Σ pay×1%。" },
      channel_card_accounts: { title: "骑士卡收款账户", content: "一期能力（decision-064）。<strong>即时到付</strong>：须开通微信/支付宝子商户并绑定对公，接收佣金分账。<strong>线下结算</strong>：购卡款进运营商；渠道仍须维护对公账户，供运营商按对账线下打佣。" },
      channel_instant_commission: { title: "佣金及时到付", content: "仅<strong>渠道分销（骑士卡）</strong>签约可开。运营商在「渠道管理 → 签约渠道」开启；须渠道绑定收款账户并完成微信/支付宝进件。开启后设置<strong>渠道佣金比例</strong>。<br><strong>变更（decision-065）</strong>：即时↔线下切换于<strong>次日 00:00</strong>生效，保存时须确认提示；历史订单不回溯；对账月度汇总按结算方式<strong>拆行</strong>。" },
      pricing_card: { title: "渠道分销价", content: "同一运营商可签<strong>多个分销渠道</strong>，各渠道独立维护授权 SKU、正式价、<strong>专享价</strong>与佣金。「平台设置 → 渠道分销价」操作仅<strong>编辑</strong>价格；签约档案在「渠道管理 → 签约渠道」。专享价 ≤ 正式零售价。" },
      day_pool_panel: { title: "人天额度池", content: "渠道商向签约运营商批发换电人天额度。<br><strong>可用</strong>=Σ DayPool.availableDays；<strong>预占中</strong>=Σ frozenDays。00:00 预占 → 换电/持电池确认消耗 → 日终释放未消耗预占。" },
      day_pool_reserve: { title: "预占与确认消耗", content: "天级模式：每日 00:00 预占 1 人天。当日<strong>有换电或持有电池</strong>→确认消耗 1 人天（每骑手每日 1 条记录）；<strong>无换电且未持电池</strong>→日终释放。同一骑手同一天只扣 1 人天，但记录当日换电次数。" },
      day_pool_consume: { title: "骑手日消耗（渠道商说明）", content: "每骑手每个自然日最多 1 条确认消耗记录，含<strong>当日换电次数</strong>与<strong>持有电池数</strong>。<br><br><strong>判定规则</strong>：① 当天有换电 → 确认消耗；② 当天未换电但<strong>持有电池</strong> → 仍视为使用服务，确认消耗；③ 不持有电池且未换电 → 不产生消耗，日终释放预占。" },
      day_pool_swap_sync: { title: "换电同步", content: "渠道骑手<strong>每一次</strong>成功换电均实时同步至渠道商后台，可与人天消耗记录勾稽。跨网换电同样同步（含站点、换电单号）。" },
      day_pool_insufficient: { title: "余额不足", content: "不允许透支。余额不足以覆盖配置范围内全部骑手时，整批预占失败（不做部分分配）。管理员可续费/调范围后手动重试；续费成功后系统自动重试失败批次。<strong>骑手无可用额度时禁止换电</strong>（持电池仅可还电）；<strong>无自费兜底</strong>，须渠道续配。见 decision-054。" },
      day_pool_rules: { title: "额度使用规则（已下线）", content: "<strong>decision-062</strong>：已移除「额度使用规则」与<strong>团队周期额度上限</strong>。额度仅受<strong>额度池可用余额</strong>与<strong>骑手个人已分配剩余</strong>约束；团队仅作编排（绑定消耗池）。池级扣天/激活口径见「额度池」详情。" },
      day_pool_b2b_refund: { title: "额度池退款说明（渠道商）", content: "人天额度池<strong>不支持在线退款</strong>。若需退未使用额度，须与<strong>签约运营商线下协商</strong>；达成一致后由运营商在后台执行额度扣减（账本类型：<strong>退款</strong>），资金按对公约定另行结算。渠道商后台不可自行发起池退款。" },
      day_pool_operator_adjust: { title: "运营商额度调整", content: "运营商在「渠道管理 → 渠道权益 → 已售额度池」手工调账。类型：充值、赠送、退款、修正、过期恢复（30 天内）。" },
      entitlement_api: { title: "渠道骑手可换电校验", content: "换电前调用 <code>POST /api/v1/entitlement/check</code>：返回 allowed_swap / allowed_return、fail_reason、gate_reason。无人天额度时 <strong>allowed_swap=false</strong>，持电池仅可还电；<strong>无自费兜底 SKU</strong>。见 decision-054。" },
      day_pool_team: { title: "骑手团队", content: "入口在<strong>骑手登记</strong>页内 Tab「骑手团队」。渠道商创建团队并<strong>绑定消耗额度池</strong>（必选）。一运营商一池时默认团队自动绑定；向多家运营商签约时各团队须指定对应池。登记/分配/预占/消耗均从团队绑定池扣减。在职与离职骑手均可加入/变更/移除团队。" },
      day_pool_org: { title: "团队与额度池", content: "编排单元为<strong>团队</strong>（非组织/站点）。团队 <code>pool_id</code> 决定从哪个额度池扣减；额度使用规则为团队配置周期额度上限。" },
      day_pool_retail: { title: "骑手零售价", content: "由运营商在「定价管理」维护个人套餐城市价；渠道商只读。<strong>已取消</strong>渠道零额度自费兜底：无预占/无额度时不可换电，仅可还电，须渠道续配。" },
      day_pool_allocate: { title: "分配与收回", content: "分配：从团队绑定池可用余额划出 N 人天给骑手（分配即开通，按池统一口径预占/确认）。收回/退出团队：剩余未用人天自动退回池余额。" },
      day_pool_contract: { title: "额度池规则", content: "平台统一（只读）：<strong>分配即开通</strong>；每日预占后<strong>换电或持电池</strong>确认消耗；池过期<strong>不退</strong>。B 端结算节奏由渠道商与运营商线下协商，不在此展示。" },
      day_pool_identity: { title: "个人与渠道互斥", content: "同一骑手<strong>不可同时</strong>拥有生效中个人套餐与渠道团队成员身份。加入团队前须<strong>退订或冻结</strong>个人套餐。退出团队（主动/被移除）时<strong>未用人天自动回池</strong>。" },
      day_pool_channel: { title: "渠道商额度管理", content: "骑手须登记在渠道商名下并归属某一<strong>团队</strong>；团队绑定消耗额度池。登记时校验无生效中个人套餐。在职/离职均可<strong>加入、变更、移除团队</strong>；移除时未用人天自动回池并记离职。<strong>批量导入</strong>支持手工粘贴或上传 CSV/TXT/XLSX（手机号、姓名）。" },
      day_pool_purchase: { title: "购买人天额度", content: "渠道商向签约运营商按批发价采购人天；<strong>同一运营商续费在原池增购</strong>，不因团队再建第二池。向新运营商签约才产生新池实例。" },
      day_pool_ledger: { title: "额度明细账本", content: "所有额度变动留痕。渠道商可见：购买、分配、收回、预占、确认消耗、释放、续费等。运营商调账类型：<strong>充值、赠送、退款、修正、过期恢复</strong>（协商退款走「退款」；过期恢复仅运营商、池过期后 30 天内）。" },
      day_pool_warn: { title: "低余额预警", content: "规则①余额&lt;总额 20%；规则②余额不足以支撑<strong>在职骑手×10 天</strong>。触发后<strong>短信预警渠道商+运营商</strong>，并写入短信记录表（2026-07-13 确认）。" },
      day_pool_hold_no_quota: { title: "零额度 / 待还电", content: "渠道商顶栏「骑手零额度」（在职剩余人天=0）。原因：①个人无额度 ②预占失败。持电池→「待还电」：<strong>仅可还电、禁止换电</strong>；不透支；<strong>无自费兜底</strong>。见 decision-049 / 054。" },
      day_pool_refund: { title: "续费与退款", content: "<strong>续费</strong>：渠道商在原池上增购人天（在线/线下采购）。<strong>退款</strong>：不支持在线操作，须与运营商线下协商，由运营商后台扣减额度（类型：退款）。详见「额度池退款说明」。" },
      platform_scope: { title: "平台管理范围", content: "平台管理员可查看全业务汇总，治理运营商主体、设备绑定与跨网统价；不替代运营商日常运营与定价。" },
      platform_operators: { title: "运营商管理", content: "运营商主体由平台创建与维护，含基础信息、<strong>登录账号（手机号）</strong>（默认密码 123456）、进件账户摘要、平台保证金与信用额度。运营商在登录页选「运营商登录」凭手机号进入；登录后仅见本人经营数据。" },
      platform_leasing_companies: { title: "设备租赁公司", content: "平台管理员维护出租方主体档案（可<strong>多家并存</strong>）。前期演示环境以「华东设备租赁公司」为主；架构支持后续接入更多租赁公司。" },
      platform_lease_binding: { title: "租赁关系绑定", content: "平台管理员建立「租赁公司 ↔ 运营商」绑定后，该租赁公司方可向该运营商发起租赁协议签约。<strong>运营商</strong>承租信息来源于平台运营商档案；一运营商可同时与多家租赁公司建立绑定并分别签约。" },
      platform_device_bind: { title: "设备归属", content: "平台通过「批量导入」弹窗指定运营商完成归属；类型与参数来自 IoT，无需人工填写。导入后初始站点为「未分配站点」。" },
      platform_l1_pricing: { title: "跨网服务费", content: "柜机/电池服务费<strong>全网默认价</strong> + <strong>城市覆盖价</strong>由平台发布；跨运营商换电清分按此单价；城市价优先；改价不追溯。" },
      platform_day_standard: { title: "人天标准日值", content: "全网默认日值 + <strong>城市覆盖</strong>；B 端 1% 计提基数；亦为运营商默认批发价（可改）。" },
      platform_stats: { title: "业务汇总", content: "全平台 Mock 汇总：<br>· <strong>业务快照（不受统计范围）</strong>：运营商、渠道商、在营站点、设备<br>· <strong>经营指标（随统计范围缩放）</strong>：用户、套餐订单、换电成功、业务流水、平台营收（演示：今日×1 / 近7日×5.2 / 近30日×18）<br>· 业务流水=套餐实付+渠道 B2B 批发 · 平台营收=Σ(C 端实付×1%) + Σ(B 端确认消耗×标准人天价×1%)" },
      platform_operator_device_gate: { title: "设备绑定前置", content: "运营商「我的设备」仅展示平台已绑定的柜机/电池；未绑定设备不会出现在运营商后台。" },
      platform_orders: { title: "全平台订单", content: "套餐购买订单按售卖运营商过滤；换电订单展示全平台三元组与 跨网设备服务费；渠道商订单为人天批发采购单（PO-）。" },
      platform_channel_po: { title: "渠道商采购支付", content: "线下订单须售卖运营商在「渠道管理 → 渠道订单」确认到账后，额度池/账期才生效。" },
      platform_users: { title: "用户服务运营商", content: "用户当前所属运营商取决于<strong>购买服务的提供方</strong>：个人套餐=套餐售卖运营商；渠道成员=人天额度售卖运营商（签约批发合同的 sellerOperator）。与换电三元组 userOwner 一致。" },
      platform_users_battery: { title: "持有电池", content: "仅<strong>服务中且已换电</strong>的用户展示：<code>电池编码-SOC xx%-SOH yy%（归属 xxx运营商）</code>；SOH 为健康度百分比；<strong>必须有归属运营商</strong>。<strong>已冻结 / 中途完结 / 待首换开通</strong>及无持电记录 → <strong>未持有</strong>。" },
      platform_users_freeze: { title: "申请冻结校验", content: "仅<strong>个人套餐</strong>用户可申请。须同时满足：套餐<strong>服务中且在有效期内</strong>、<strong>未持有电池</strong>（仍持有则拒绝并提示先还电）。校验通过后<strong>即时冻结</strong>，无需人工审核。" },
      platform_devices_import: { title: "批量导入", content: "入口在<strong>设备台账</strong>页「批量导入」弹窗。<strong>先选归属运营商</strong>，再二选一：① 手工录入（少量，每行一个 SN）；② 表格导入（大量，上传 CSV/TXT，首列 SN）。类型/城市/规格由 IoT 按 SN 回填；导入即归属进台账。<strong>无「待绑定」队列</strong>。" },
      platform_channels: { title: "渠道商监管查询", content: "渠道商主体由签约运营商在「渠道管理 → 签约渠道」维护；平台本页只读监管。" },
      channel_no_receipt: { title: "渠道收款账户", content: "人天池/激活码等模式：渠道仅 B 端向运营商付款，<strong>无</strong> C 端收款账户。<br><strong>设备租赁</strong>例外：白名单用户购套餐款进<strong>渠道子商户</strong>，须在「收款账户」进件。" },
      platform_marketing: { title: "平台营销（二期）", content: "【二期】立减优惠券：原价 − 券 = 实付；链接须带 <code>op=</code>；支付成功即锁定 userOwner；款进运营商。<strong>不代收、不拨付用户款</strong>。券面价差<strong>默认运营商承担</strong>；营销服务费按协议月结。一期不交付，原型仅演示。" },
      platform_marketing_collect: { title: "运营商收款", content: "用户经 ch=PLATFORM 链接购套餐，须已锁定运营商；实付款进<strong>该运营商</strong>子商户；支付分账 1%。立减额由运营商让利（无平台补贴）。" },
      platform_marketing_payout: { title: "券核销与营销费", content: "立减合计 = 运营商让利记账；另计应付营销服务费。<strong>无</strong>用户款拨付、无平台补贴出账。月度对账供运营商确认营销费。" },
      platform_flows: { title: "平台流水视角", content: "用户支付：C 端套餐/自费流水及 1% 平台分账。运营商之间：跨网柜机/电池费经平台代收代付的日清流水。平台提成：B 端确认消耗（换电 / 持有电池）计提 + C 端支付分账汇总；持电池确认无关联换电单。" },
      platform_account: { title: "平台收款账户", content: "智格平台 1% 技术服务费统一进入平台商户（微信/支付宝分账 + B 端代扣）。<strong>账户余额、冻结</strong>为商户当前实时状态，不受统计月份影响；月提成与营收构成随月份切换。非运营商经营账户。" },
      module_order_audit: { title: "变更记录", content: "统一<strong>变更记录</strong>（C-02/D-A1）：跨模块时间线，记录订单/服务生命周期事件（冻结、消耗、换电、退款等）。用于客诉、对账与监管；<strong>非新订单列表</strong>。渠道仅见本渠道成员事件；运营商见本主体订单；平台全平台只读。" },
      module_channel_credit: { title: "渠道信用额度", content: "平台按在册骑手与设备标准评估<strong>信用额度</strong>，用于抵扣渠道应押总额；运营商可调整额度上限。渠道线下打款后提交凭证，由<strong>运营商审核</strong>。分级抵扣规则按信用评分映射抵扣比例。与运营商准入档位（A/B/C/D）独立。" },
      module_channel_links: { title: "套餐与链接", content: "渠道可售套餐由运营商签约配置（正式价/专享价/佣金只读）。渠道可为同一套餐创建<strong>多条推广链接</strong>，填写<strong>链接用途</strong>；每条可<strong>生成二维码</strong>（内容与链接一致）。链接直达<strong>签约运营商小程序</strong>；用户点击后 <strong>24h</strong> 内购买授权 SKU 均享渠道专享价。" },
      module_channel_orders: { title: "购卡记录", content: "仅展示经本渠道推广链接成交的套餐购买记录。支持按支付时间筛选；记录关联链接用途与 link_code。" },
      module_rent_devices: { title: "租赁设备", content: "运营商维护柜机/电池 SN 与部署站点；<strong>月租为签约统一价</strong>，不在此按单台定价或展示。" }
    };

    const VIEW_MODULE_NOTE = {
      overview: ["scope", "overview_sites", "overview_online", "overview_orders", "overview_net", "overview_site_expense", "overview_site_stats", "overview_power_stats"],
      pricing: ["pricing_pkg", "pricing_zone", "pricing_quota", "pricing_card", "pricing_deposit", "swap_policy", "swap_policy_cross_net", "platform_standard_day_price"],
      channelSales: ["channel_sales", "channel_partner_manage", "channel_partner_rights", "day_pool_one_per_operator", "day_pool_b2b_settlement"],
      sites: ["sites_panel", "site_expenses_panel", "site_partner_binding", "site_partner_change_log"],
      sitePartners: ["site_partner_panel", "site_partner_open_account", "site_partner_binding", "site_partner_change_log", "site_partner_split"],
      partnerOverview: ["partner_portal", "site_partner_open_account"],
      partnerBindings: ["partner_bindings_readonly", "site_partner_binding"],
      partnerLedger: ["site_partner_split", "partner_portal"],
      partnerAccount: ["partner_portal", "site_partner_open_account"],
      partnerWithdraw: ["partner_withdraw", "site_partner_open_account"],
      siteExpenses: ["site_expenses_panel", "site_expenses_venue", "site_expenses_electricity", "site_expenses_cycle", "site_expenses_landlord", "site_expenses_pay_method", "site_expenses_bill", "site_expenses_payment", "site_expenses_time"],
      devices: ["devices_cab", "devices_cab_compose", "devices_cab_port_ops", "devices_cab_bat_flow", "devices_cab_ops_log", "devices_cab_remote_ops", "devices_bat", "devices_move_cab", "platform_operator_device_gate", "device_ownership"],
      leaseAgreements: ["lease_agreements", "lease_device_lists", "lease_device_replace", "lease_confirm"],
      leaseCollect: ["lease_collect", "lease_offline_ticket", "lease_manual_pay"],
      leaseRent: ["lease_rent_monthly", "lease_cover_gap", "lease_manual_pay", "lease_offline_ticket"],
      financeManage: ["finance_scope", "finance_dashboard", "finance_operator_credit", "finance_asset_package", "finance_ledger", "finance_projects", "finance_assets", "finance_agreement", "finance_repayments", "finance_repay_ticket", "finance_due_diligence", "finance_disburse", "finance_penalty"],
      financeDrawdown: ["finance_drawdown", "finance_operator_credit", "finance_due_diligence", "finance_disburse", "finance_pre_plan", "finance_repay_ticket", "finance_penalty"],
      orderService: ["orders_pkg", "orders_swap", "orders_user_deposit", "orders_freeze", "module_order_audit", "refund_manage"],
      orderPackage: ["orders_pkg", "orders_deposit", "orders_deposit_waiver", "arch_b", "payout_pkg"],
      orderSwap: ["orders_swap", "orders_swap_triplet", "orders_swap_entitlement", "orders_swap_log"],
      orderUserDeposit: ["orders_user_deposit", "orders_deposit", "orders_deposit_waiver", "rider_battery_deposit"],
      orderFreeze: ["orders_freeze"],
      orderAudit: ["module_order_audit"],
      refundManage: ["refund_manage", "refund_cooling_period", "refund_mode_auto", "refund_mode_manual", "orders_early_end"],
      flows: ["flows_receipt", "flows_accrual", "flows_payout", "arch_b", "platform_no_share"],
      interOp: ["inter_op", "inter_op_pricing", "inter_op_clearing", "operator_deposit", "operator_credit"],
      depositAccount: ["deposit_recharge", "operator_deposit", "operator_credit", "operator_credit_eval"],
      platformService: ["deposit_recharge", "operator_deposit", "platform_fee", "inter_op", "inter_op_clearing"],
      platformFee: ["platform_fee", "platform_fee_trigger", "platform_operator_fee_rate", "platform_standard_day_price"],
      employees: ["employees_panel", "employees_perms", "employee_login_scope"],
      users: ["users_panel", "rider_battery_deposit", "orders_deposit_waiver"],
      accounts: ["accounts_panel", "accounts_corp_bind", "arch_b"],
      dayPool: ["day_pool_panel", "day_pool_reserve", "day_pool_consume", "day_pool_team", "day_pool_identity", "day_pool_b2b_refund", "day_pool_hold_no_quota", "entitlement_api"],
      channelCredit: ["module_channel_credit"],
      channelLinks: ["module_channel_links", "channel_settlement_card", "pricing_card"],
      channelOrders: ["module_channel_orders", "channel_settlement_card"],
      commissionStatement: ["channel_card_margin", "channel_instant_commission", "channel_settlement_card", "platform_fee"],
      rentPool: ["channel_settlement_rent"],
      rentDevices: ["module_rent_devices", "channel_settlement_rent", "lease_dedicated_site"],
      leaseBatteryHold: ["lease_battery_hold", "channel_settlement_rent"],
      leaseWhitelist: ["lease_whitelist", "lease_whitelist_access", "channel_settlement_rent", "lease_whitelist_pkg"],
      leasePkgPricing: ["lease_whitelist_pkg", "lease_whitelist_access", "channel_settlement_rent"],
      channelInterOp: ["channel_inter_op", "channel_lease_crossnet", "inter_op_privacy"],
      operators: ["platform_operators", "operator_credit_eval", "accounts", "platform_withdraw_review", "platform_operator_fee_rate", "platform_channels", "channel_partner_manage", "channel_no_receipt"],
      operatorCreditEval: ["operator_credit_eval"],
      depositManage: ["deposit_manage", "deposit_recharge", "operator_deposit", "operator_credit"],
      deviceBinding: ["platform_device_bind", "platform_operator_device_gate", "platform_devices_import"],
      l1Pricing: ["platform_l1_pricing", "platform_day_standard", "platform_standard_day_price", "day_pool_warn", "inter_op_pricing"],
      platformUsers: ["platform_users", "platform_users_info", "platform_users_deposit_stats", "rider_battery_deposit", "platform_users_battery", "platform_users_freeze", "orders_service_change"],
      platformOrders: ["platform_orders", "platform_channel_po"],
      platformDevices: ["platform_device_bind", "platform_devices_import", "platform_operator_device_gate"],
      platformChannels: ["platform_channels", "channel_partner_manage", "channel_no_receipt"],
      platformMarketing: ["platform_marketing", "platform_marketing_collect", "platform_marketing_payout"],
      platformFlows: ["platform_flows", "platform_fee"],
      platformAccounts: ["platform_account", "platform_fee"],
      platformLeasing: ["platform_leasing_companies", "platform_lease_binding"]
    };


    const sites = [
      { id: "ST-SH-01", name: "浦东骑手驿站", city: "上海", address: "上海市浦东新区张杨路1588号", lng: 121.5275, lat: 31.2304, type: "配送站", cabinets: 3, batteries: 36, status: "在营", operatorId: "OP-SX", waitingCount: 2 },
      { id: "ST-SH-02", name: "世博换电服务点", city: "上海", address: "上海市浦东新区世博大道1368号", lng: 121.4892, lat: 31.1901, type: "配送站", cabinets: 1, batteries: 12, status: "在营", operatorId: "OP-SX", waitingCount: 0 },
      { id: "ST-SH-04", name: "陆家嘴分站", city: "上海", address: "上海市浦东新区世纪大道88号", lng: 121.5056, lat: 31.2397, type: "写字楼", cabinets: 2, batteries: 24, status: "在营", operatorId: "OP-LJZ", waitingCount: 1 },
      { id: "ST-SH-JD", name: "京东物流专属站", city: "上海", address: "上海市浦东新区康桥路888号", lng: 121.589, lat: 31.142, type: "渠道专属", cabinets: 4, batteries: 24, status: "在营", operatorId: "OP-SX", channelId: "CH-RENT", channelDedicated: true, publicOpen: false, visibilityMode: "whitelist_only", waitingCount: 1 },
      { id: "ST-SH-05", name: "张江筹备站", city: "上海", address: "上海市浦东新区张江路2000号", lng: null, lat: null, type: "配送站", cabinets: 0, batteries: 0, status: "建设中", operatorId: "OP-SX", waitingCount: 0 },
      { id: "ST-SH-LG", name: "临港偏远站", city: "上海", address: "上海市浦东新区临港大道1888号", lng: 121.923, lat: 30.893, type: "配送站", cabinets: 2, batteries: 18, status: "在营", operatorId: "OP-SX", waitingCount: 0, remoteHint: true }
    ];

    const sitePartners = [
      {
        id: "SP-01", operatorId: "OP-SX", partnerType: "个人", name: "王场地方", phone: "138****8801",
        idNo: "310***********1234", bankAccountName: "王场地方", bankName: "工商银行",
        bankAccount: "6217 **** 1234", bankAccountLabel: "6217 **** 1234 · 工商银行",
        accountStatus: "已开户", openedAt: "2026-01-01", status: "启用"
      },
      {
        id: "SP-02", operatorId: "OP-SX", partnerType: "公司", name: "上海李物业有限公司",
        contactName: "李经理", phone: "139****8802", licenseNo: "91310000MA1K******",
        legalName: "李某某", bankAccountName: "上海李物业有限公司", bankName: "建设银行",
        bankAccount: "3100 **** 5678", bankAccountLabel: "3100 **** 5678 · 建设银行对公",
        accountStatus: "已开户", openedAt: "2026-02-01", status: "启用"
      },
      {
        id: "SP-03", operatorId: "OP-SX", partnerType: "公司", name: "浦东场地运营公司",
        contactName: "张总", phone: "021-5888****", bankAccount: "—", bankAccountLabel: "—",
        accountStatus: "待开户", openedAt: null, status: "启用"
      }
    ];

    const sitePartnerBindings = [
      { id: "SPB-01", siteId: "ST-SH-01", operatorId: "OP-SX", partnerId: "SP-01", partnerName: "王场地方", partnerType: "个人", ratePct: 25, pendingRatePct: null, effectiveAt: "2026-01-01", status: "生效" },
      { id: "SPB-02", siteId: "ST-SH-01", operatorId: "OP-SX", partnerId: "SP-02", partnerName: "上海李物业有限公司", partnerType: "公司", ratePct: 5, pendingRatePct: null, effectiveAt: "2026-02-01", status: "生效" },
      { id: "SPB-03", siteId: "ST-SH-02", operatorId: "OP-SX", partnerId: "SP-01", partnerName: "王场地方", partnerType: "个人", ratePct: 25, pendingRatePct: null, effectiveAt: "2026-05-01", status: "生效" },
      { id: "SPB-04", siteId: "ST-SH-05", operatorId: "OP-SX", partnerId: "SP-02", partnerName: "上海李物业有限公司", partnerType: "公司", ratePct: 15, pendingRatePct: null, effectiveAt: "2026-03-01", status: "生效" }
    ];

    /** 站点合伙人绑定变更记录：添加 / 调比例 / 解绑 · 立即生效留痕 */
    const sitePartnerBindingLogs = [
      { id: "SPBL-001", time: "2026-01-01 10:00", siteId: "ST-SH-01", siteName: "浦东骑手驿站", operatorId: "OP-SX", bindingId: "SPB-01", partnerId: "SP-01", partnerName: "王场地方", action: "添加", beforeRatePct: null, afterRatePct: 25, by: "绿色出行管理员", remark: "开站配置" },
      { id: "SPBL-002", time: "2026-02-01 11:20", siteId: "ST-SH-01", siteName: "浦东骑手驿站", operatorId: "OP-SX", bindingId: "SPB-02", partnerId: "SP-02", partnerName: "上海李物业有限公司", action: "添加", beforeRatePct: null, afterRatePct: 5, by: "绿色出行管理员", remark: "" },
      { id: "SPBL-003", time: "2026-05-01 09:00", siteId: "ST-SH-02", siteName: "世博换电服务点", operatorId: "OP-SX", bindingId: "SPB-03", partnerId: "SP-01", partnerName: "王场地方", action: "添加", beforeRatePct: null, afterRatePct: 20, by: "绿色出行管理员", remark: "" },
      { id: "SPBL-004", time: "2026-06-11 16:30", siteId: "ST-SH-02", siteName: "世博换电服务点", operatorId: "OP-SX", bindingId: "SPB-03", partnerId: "SP-01", partnerName: "王场地方", action: "调比例", beforeRatePct: 20, afterRatePct: 25, by: "绿色出行管理员", remark: "立即生效" },
      { id: "SPBL-005", time: "2026-03-01 14:00", siteId: "ST-SH-05", siteName: "张江筹备站", operatorId: "OP-SX", bindingId: "SPB-04", partnerId: "SP-02", partnerName: "上海李物业有限公司", action: "添加", beforeRatePct: null, afterRatePct: 15, by: "绿色出行管理员", remark: "" }
    ];

    const sitePartnerSplitLines = [
      { id: "SPL-001", date: "2026-06-10", siteId: "ST-SH-01", siteName: "浦东骑手驿站", partnerId: "SP-01", partnerName: "王场地方", partnerRatePct: 25, shareBase: 245, platformAmount: 2.45, partnerAmount: 61.25, operatorAmount: 0, splitLabel: "王场地方25%", orderRef: "SUB260610088", userType: "personal" },
      { id: "SPL-001b", date: "2026-06-10", siteId: "ST-SH-01", siteName: "浦东骑手驿站", partnerId: "SP-02", partnerName: "上海李物业有限公司", partnerRatePct: 5, shareBase: 245, platformAmount: 0, partnerAmount: 12.25, operatorAmount: 169.05, splitLabel: "李物业5%+运营商69%", orderRef: "SUB260610088", userType: "personal" },
      { id: "SPL-002", date: "2026-06-10", siteId: "ST-SH-02", siteName: "世博换电服务点", partnerId: "SP-01", partnerName: "王场地方", partnerRatePct: 20, shareBase: 180, platformAmount: 1.8, partnerAmount: 36, operatorAmount: 142.2, splitLabel: "平台1%+合伙人20%+运营商79%", orderRef: "SUB260610091", userType: "personal" },
      { id: "SPL-003", date: "2026-06-09", siteId: "ST-SH-01", siteName: "浦东骑手驿站", partnerId: "SP-01", partnerName: "王场地方", partnerRatePct: 25, shareBase: 100, platformAmount: 1, partnerAmount: 25, operatorAmount: 0, splitLabel: "王场地方25%", orderRef: "SW2606090830", userType: "personal" },
      { id: "SPL-003b", date: "2026-06-09", siteId: "ST-SH-01", siteName: "浦东骑手驿站", partnerId: "SP-02", partnerName: "上海李物业有限公司", partnerRatePct: 5, shareBase: 100, platformAmount: 0, partnerAmount: 5, operatorAmount: 69, splitLabel: "李物业5%+运营商69%", orderRef: "SW2606090830", userType: "personal" },
      { id: "SPL-004", date: "2026-06-08", siteId: "ST-SH-05", siteName: "张江筹备站", partnerId: "SP-02", partnerName: "上海李物业有限公司", partnerRatePct: 15, shareBase: 120, platformAmount: 1.2, partnerAmount: 18, operatorAmount: 100.8, splitLabel: "李物业15%", orderRef: "SUB260608077", userType: "personal" }
    ];

    const sitePartnerWithdrawalRequests = [
      { id: "SPW-260608", partnerId: "SP-01", operatorId: "OP-SX", amount: 80, applyTime: "2026-06-08 10:15", reviewTime: "2026-06-09 14:00", reviewedBy: "绿色出行财务", status: "已到账", paidTime: "2026-06-09 14:00", accountLabel: "6217 **** 1234 · 工商银行", rejectReason: null },
      { id: "SPW-260611", partnerId: "SP-01", operatorId: "OP-SX", amount: 30, applyTime: "2026-06-11 09:30", reviewTime: null, reviewedBy: null, status: "待审核", paidTime: null, accountLabel: "6217 **** 1234 · 工商银行", rejectReason: null }
    ];

    function sitePartnerBindingsFor(siteId, operatorId) {
      return sitePartnerBindings.filter(b => b.siteId === siteId && b.operatorId === operatorId && b.status === "生效");
    }

    function sitePartnerBindingFor(siteId, operatorId) {
      const list = sitePartnerBindingsFor(siteId, operatorId);
      return list[0] || null;
    }

    const EMP_PERMISSIONS = [
      { id: "overview.view", label: "总览" },
      { id: "sites.view", label: "站点查看" },
      { id: "sites.edit", label: "站点编辑" },
      { id: "site_partners.view", label: "站点合伙人查看" },
      { id: "site_partners.edit", label: "站点合伙人编辑" },
      { id: "site_expenses.view", label: "站点支出查看" },
      { id: "site_expenses.edit", label: "站点支出编辑" },
      { id: "devices.view", label: "设备查看" },
      { id: "devices.edit", label: "设备运维" },
      { id: "orders.view", label: "订单查看" },
      { id: "orders.audit", label: "服务变更审核" },
      { id: "refunds.view", label: "退款管理查看" },
      { id: "refunds.audit", label: "退款确认操作" },
      { id: "flows.view", label: "流水查看" },
      { id: "users.view", label: "骑手用户" },
      { id: "employees.view", label: "员工管理" },
      { id: "employees.edit", label: "员工编辑" },
      { id: "finance.view", label: "融资管理" },
      { id: "finance.drawdown", label: "放款申请审核" },
      { id: "accounts.view", label: "收款账户" },
      { id: "day_pool.view", label: "人天额度池查看" },
      { id: "day_pool.edit", label: "人天额度池配置" },
      { id: "day_pool.export", label: "团队消耗导出" },
      { id: "pricing.view", label: "定价查看" },
      { id: "pricing.edit", label: "定价编辑" },
      { id: "channel_sales.view", label: "渠道管理" },
      { id: "inter_op.view", label: "运营商往来账" },
      { id: "deposit.view", label: "服务保证金账户" },
      { id: "platform_fee.view", label: "平台服务费" },
      { id: "activation_codes.view", label: "激活码管理" }
    ];

    const PLATFORM_ADMIN_PERMISSIONS = [
      { id: "platform.overview", label: "总览" },
      { id: "platform.users", label: "用户管理" },
      { id: "platform.orders", label: "订单管理" },
      { id: "platform.devices", label: "设备管理" },
      { id: "platform.channels", label: "渠道商管理（运营商管理下）" },
      { id: "platform.marketing", label: "平台营销（二期）" },
      { id: "platform.flows", label: "流水管理" },
      { id: "platform.accounts", label: "平台账户" },
      { id: "platform.operators", label: "运营商治理" },
      { id: "platform.operator_withdraw", label: "运营商提现审核" },
      { id: "platform.operator_fee", label: "运营商平台服务费" },
      { id: "platform.leasing", label: "租赁公司（二期）" },
      { id: "platform.operator_credit", label: "运营商信用评估" },
      { id: "platform.audit", label: "变更记录" },
      { id: "platform.deposit", label: "保证金管理" },
      { id: "platform.pricing", label: "平台统价" },
      { id: "platform.admins", label: "管理员管理" }
    ];

    const PLATFORM_ADMIN_TEMPLATES = {
      super: { label: "超级管理员", permissions: PLATFORM_ADMIN_PERMISSIONS.map(p => p.id) },
      operations: {
        label: "运营管理员",
        permissions: ["platform.overview", "platform.users", "platform.orders", "platform.devices", "platform.channels", "platform.operators", "platform.audit", "platform.pricing"]
      },
      finance: {
        label: "财务管理员",
        permissions: ["platform.overview", "platform.flows", "platform.accounts", "platform.operator_withdraw", "platform.operator_fee", "platform.deposit"]
      },
      custom: { label: "自定义", permissions: [] }
    };

    const employeeStore = {
      [ENT.platform.id]: [
        {
          id: "ADM-PLAT-001", roleType: "staff", name: "平台超级管理员", phone: "138****0001",
          jobTitle: "超级管理员", adminTemplate: "super", status: "启用",
          permissions: PLATFORM_ADMIN_TEMPLATES.super.permissions, lastLoginAt: "2026-07-17 10:00", protected: true
        },
        {
          id: "ADM-PLAT-002", roleType: "staff", name: "平台运营管理员", phone: "138****0002",
          jobTitle: "运营管理员", adminTemplate: "operations", status: "启用",
          permissions: PLATFORM_ADMIN_TEMPLATES.operations.permissions, lastLoginAt: "2026-07-16 18:20", protected: false
        },
        {
          id: "ADM-PLAT-003", roleType: "staff", name: "平台财务管理员", phone: "138****0003",
          jobTitle: "财务管理员", adminTemplate: "finance", status: "启用",
          permissions: PLATFORM_ADMIN_TEMPLATES.finance.permissions, lastLoginAt: "2026-07-17 08:45", protected: false
        }
      ],
      "OP-SX": [
        { id: "EMP-SX-01", roleType: "staff", name: "李小运维", phone: "137****2001", jobTitle: "站点运维", status: "启用", permissions: ["devices.view", "devices.edit", "orders.view", "users.view", "sites.view"] },
        { id: "EMP-SX-02", roleType: "staff", name: "王会计", phone: "136****2002", jobTitle: "财务助理", status: "启用", permissions: ["flows.view", "accounts.view", "orders.view", "refunds.view", "refunds.audit", "platform_fee.view", "inter_op.view", "deposit.view", "site_expenses.view", "site_expenses.edit"] }
      ],
      "CH-SF": [
        { id: "EMP-CH-01", roleType: "staff", name: "张渠道运营", phone: "139****3101", jobTitle: "额度运营", status: "启用", permissions: ["overview.view", "channel_settlement.view", "day_pool.view", "day_pool.edit", "channel_credit.view", "employees.view"] },
        { id: "EMP-TEAM-PD", roleType: "team_admin", name: "李浦东站管", phone: "138****3102", jobTitle: "团队管理员", teamId: "TEAM-DEFAULT", status: "启用", permissions: ["day_pool.view", "day_pool.export"] }
      ],
      "CH-RENT": [
        { id: "EMP-CH-R01", roleType: "staff", name: "赵租金", phone: "139****3301", jobTitle: "租金运营", status: "启用", permissions: ["overview.view", "channel_settlement.view", "lease_pkg.view", "accounts.view", "rent_pool.view", "rent_devices.view", "lease_battery.view", "lease_whitelist.view", "channel_inter_op.view", "channel_credit.view", "employees.view"] }
      ],
      "CH-ACT": [
        { id: "EMP-CH-A01", roleType: "staff", name: "周码务", phone: "139****3401", jobTitle: "激活码运营", status: "启用", permissions: ["overview.view", "channel_settlement.view", "activation_codes.view", "channel_credit.view", "employees.view"] }
      ],
      "LEASE-HD": [
        { id: "EMP-LS-01", roleType: "staff", name: "放款专员", phone: "137****9001", jobTitle: "放款审核", status: "启用", permissions: ["finance.drawdown", "overview.view", "accounts.view"] }
      ]
    };

    const cabinets = [
      {
        sn: "CAB-22018", deviceId: "1782954891846172302", commBoardId: "2401C00876", iccid: "8986001111222333444",
        deviceType: "换电柜", deviceName: "浦东骑手驿站-1号柜", deployAddress: "上海市浦东新区张杨路1588号",
        site: "浦东骑手驿站", city: "上海", slots: 12, online: true, powerStatus: "已通电", usedPowerKwh: 0.78,
        batteryUnknown: 0, deviceStatus: "启用", serviceStatus: "启用", lastSwap: "12:05", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "自有",
        qrBound: true, hardwareType: "HM221", hardwareVersion: "V3.0", softwareVersion: "MASBG129PROD60@SG", bootVersion: "1", module4gType: "ML307",
        exchangeableSpecs: "48V/20Ah", swapMode: "正常换电", bluetoothType: "类型1-0000FFE0",
        slotModules: [{ id: "M1", type: "主控", slots: 12, fw: "v3.2.1" }, { id: "M2", type: "充电模块×2", slots: 6, fw: "v2.0.8" }]
      },
      {
        sn: "CAB-22019", deviceId: "1782954814629920131", commBoardId: "2401C00929", iccid: "8986007777888899001",
        deviceType: "换电柜", deviceName: "浦东骑手驿站-2号柜", deployAddress: "上海市浦东新区张杨路1588号",
        site: "浦东骑手驿站", city: "上海", slots: 12, online: false, powerStatus: "已通电", usedPowerKwh: 0.74,
        batteryUnknown: 1, deviceStatus: "启用", lastSwap: "06-14 09:12", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "自有",
        slotModules: [{ id: "M1", type: "主控", slots: 12, fw: "v3.1.0" }]
      },
      {
        sn: "CAB-22050", deviceId: "1782954722334455667", commBoardId: "2401C01002", iccid: "898607B91025D0531404",
        deviceType: "换电柜", deviceName: "", deployAddress: "",
        site: "浦东骑手驿站", city: "上海", slots: 12, online: true, powerStatus: "已通电", usedPowerKwh: 0.8,
        batteryUnknown: 0, deviceStatus: "启用", serviceStatus: "启用", lastSwap: "07:55", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "租赁", lessorId: "LEASE-HD", lessorName: "华东设备租赁公司", leaseContractId: "LC-2501",
        qrBound: true, hardwareType: "HM221", hardwareVersion: "V3.0", softwareVersion: "MASBG129PROD60@SG", bootVersion: "1", module4gType: "ML307",
        exchangeableSpecs: "", swapMode: "正常换电", bluetoothType: "类型1-0000FFE0",
        slotModules: [{ id: "M1", type: "主控", slots: 12, fw: "v3.2.1" }]
      },
      { sn: "CAB-33001", site: "陆家嘴分站", city: "上海", slots: 8, online: true, lastSwap: "06-10 18:20", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营", ownership: "租赁", lessorId: "LEASE-HD", lessorName: "华东设备租赁公司", leaseContractId: "LC-2502" },
      {
        sn: "CAB-22021", deviceId: "1782954655123456789", commBoardId: "2401C01118", iccid: "8986005555666677888",
        deviceType: "换电柜", deviceName: "世博换电服务点-主柜", deployAddress: "上海市浦东新区世博大道1368号",
        site: "世博换电服务点", city: "上海", slots: 12, online: true, powerStatus: "已通电", usedPowerKwh: 0.62,
        batteryUnknown: 0, deviceStatus: "启用", lastSwap: "10:30", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "自有",
        slotModules: [{ id: "M1", type: "主控", slots: 12, fw: "v3.2.1" }]
      },
      { sn: "CAB-33001", site: "陆家嘴分站", city: "上海", slots: 8, online: true, lastSwap: "06-10 18:20", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营", ownership: "租赁", lessorId: "LEASE-HD", lessorName: "华东设备租赁公司", leaseContractId: "LC-2502" },
      { sn: "CAB-22021", site: "世博换电服务点", city: "上海", slots: 12, online: true, lastSwap: "10:30", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "自有" },
      { sn: "CAB-22044", site: "陆家嘴分站", city: "上海", slots: 8, online: true, lastSwap: "10:22", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" },
      { sn: "CAB-22045", site: "陆家嘴分站", city: "上海", slots: 8, online: false, lastSwap: "昨日 21:00", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" },
      { sn: "CAB-BJ-01", site: "滨江换电站", city: "上海", slots: 10, online: true, lastSwap: "16:00", deviceOwnerId: "OP-BJ", deviceOwnerName: "滨江联营" }
    ];

    const batteries = [
      { sn: "BAT-SH-1001", site: "浦东骑手驿站", city: "上海", soc: 92, soh: 98, health: "正常", inCab: "CAB-22018", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1002", site: "浦东骑手驿站", city: "上海", soc: 45, soh: 96, health: "正常", inCab: "柜外充电", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1003", site: "陆家嘴分站", city: "上海", soc: 71, soh: 97, health: "正常", inCab: "CAB-22044", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1004", site: "浦东骑手驿站", city: "上海", soc: 63, soh: 95, health: "正常", inCab: "柜外-用户", heldByUser: true, holderName: "张骑手 138****6621", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1005", site: "世博换电服务点", city: "上海", soc: 85, soh: 99, health: "正常", inCab: "CAB-22021", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1006", site: "浦东骑手驿站", city: "上海", soc: 38, soh: 94, health: "正常", inCab: "CAB-22050", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1007", site: "浦东骑手驿站", city: "上海", soc: 55, soh: 93, health: "正常", inCab: "待入柜", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1008", site: "世博换电服务点", city: "上海", soc: 80, soh: 98, health: "正常", inCab: "CAB-33001", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-1044", site: "陆家嘴分站", city: "上海", soc: 78, soh: 97, health: "正常", inCab: "CAB-22044", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" },
      { sn: "BAT-SH-1045", site: "陆家嘴分站", city: "上海", soc: 12, soh: 72, health: "低电量预警", inCab: "CAB-22045", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" },
      { sn: "BAT-SH-1050", site: "浦东骑手驿站", city: "上海", soc: 90, soh: 96, health: "正常", inCab: "CAB-22050", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", ownership: "租赁", lessorId: "LEASE-HD", lessorName: "华东设备租赁公司", leaseContractId: "LC-2501" },
      { sn: "BAT-SH-1051", site: "—", city: "上海", soc: 100, soh: 100, health: "正常", inCab: "资方库存", deviceOwnerId: null, lessorId: "LEASE-HD", lessorName: "华东设备租赁公司", ownership: "出租库存" },
      { sn: "BAT-SH-1021", site: "世博换电服务点", city: "上海", soc: 88, soh: 98, health: "正常", inCab: "CAB-22021", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行" },
      { sn: "BAT-SH-0901", site: "浦东骑手驿站", city: "上海", soc: 96, soh: 99, health: "正常", inCab: "CAB-22018", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" },
      { sn: "BAT-BJ-1001", site: "滨江换电站", city: "上海", soc: 94, soh: 99, health: "正常", inCab: "CAB-BJ-01", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营" }
    ];

    function buildCabinetPowerDaily() {
      const seen = new Set();
      const seeds = [];
      cabinets.forEach((c) => {
        if (!c.deviceOwnerId || c.usedPowerKwh == null || seen.has(c.sn)) return;
        seen.add(c.sn);
        seeds.push({ sn: c.sn, site: c.site, deviceOwnerId: c.deviceOwnerId, base: 0.018 + (seeds.length % 4) * 0.004 });
      });
      const rows = [];
      [3, 4, 5, 6].forEach(month => {
        const daysInMonth = new Date(2026, month, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const date = `2026-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          seeds.forEach((c, i) => {
            const jitter = ((d + i * 3 + month) % 7) * 0.002;
            const season = month === 6 ? 1.05 : month === 5 ? 1 : month === 4 ? 0.92 : 0.88;
            rows.push({ date, sn: c.sn, site: c.site, deviceOwnerId: c.deviceOwnerId, kwh: +((c.base + jitter) * season).toFixed(3) });
          });
        }
      });
      return rows;
    }
    const cabinetPowerDaily = buildCabinetPowerDaily();

    /** 站点×日×小时换电笔数（Mock）：模拟午高峰 / 晚高峰集中换电 */
    function buildSiteSwapHourly() {
      const siteSeeds = [];
      const seen = new Set();
      cabinets.forEach(c => {
        if (!c.deviceOwnerId || !c.site || seen.has(c.site)) return;
        seen.add(c.site);
        const meta = sites.find(s => s.name === c.site);
        siteSeeds.push({
          site: c.site,
          siteId: meta?.id || c.site,
          deviceOwnerId: c.deviceOwnerId,
          scale: Math.max(1, c.slots ? Math.round(c.slots / 4) : 2)
        });
      });
      const profileBySite = {
        "浦东骑手驿站": [0, 0, 0, 0, 0, 1, 3, 8, 14, 11, 9, 18, 22, 16, 10, 8, 12, 20, 24, 15, 7, 3, 1, 0],
        "世博换电服务点": [0, 0, 0, 0, 0, 0, 1, 4, 7, 6, 5, 9, 11, 8, 5, 4, 6, 10, 12, 8, 4, 2, 0, 0],
        "陆家嘴分站": [0, 0, 0, 0, 0, 0, 2, 6, 10, 8, 7, 12, 14, 9, 6, 5, 8, 13, 16, 10, 5, 2, 1, 0],
        "京东物流专属站": [0, 0, 0, 0, 1, 2, 5, 9, 12, 10, 8, 7, 6, 5, 6, 8, 11, 14, 13, 9, 5, 2, 1, 0]
      };
      const defaultProfile = [0, 0, 0, 0, 0, 0, 1, 3, 5, 4, 4, 7, 8, 5, 3, 3, 4, 7, 8, 5, 2, 1, 0, 0];
      const rows = [];
      for (let d = 1; d <= 30; d++) {
        const date = `2026-06-${String(d).padStart(2, "0")}`;
        const dow = new Date(`${date}T12:00:00`).getDay();
        const weekend = dow === 0 || dow === 6 ? 0.72 : 1;
        siteSeeds.forEach((s, si) => {
          const base = profileBySite[s.site] || defaultProfile;
          for (let h = 0; h < 24; h++) {
            const jitter = ((d + si * 5 + h * 3) % 5) - 2;
            const count = Math.max(0, Math.round((base[h] + jitter) * weekend * (0.85 + (s.scale % 3) * 0.08)));
            if (count === 0 && base[h] === 0) continue;
            rows.push({ date, site: s.site, siteId: s.siteId, hour: h, count, deviceOwnerId: s.deviceOwnerId });
          }
        });
      }
      return rows;
    }
    const siteSwapHourly = buildSiteSwapHourly();

    const siteExpenseProfiles = [
      {
        siteId: "ST-SH-01", operatorId: "OP-SX",
        landlordName: "张杨物业", landlordPhone: "021-5888****", landlordContact: "李经理",
        venueFeeAmount: 3500, venueFeeUnit: "月",
        electricityMode: "按量", electricityUnitPrice: 1.15, electricityFixedAmount: null,
        paymentCycle: "月结", payMethod: "对公转账", payeeName: "上海张杨物业有限公司", payAccount: "6222 **** **** 1234 · 招商银行浦东支行",
        remark: "合同至 2027-12-31"
      },
      {
        siteId: "ST-SH-02", operatorId: "OP-SX",
        landlordName: "世博场地管理", landlordPhone: "138****2202", landlordContact: "王主任",
        venueFeeAmount: 2800, venueFeeUnit: "月",
        electricityMode: "包月", electricityUnitPrice: null, electricityFixedAmount: 600,
        paymentCycle: "月结", payMethod: "对公转账", payeeName: "世博场地管理服务中心", payAccount: "6217 **** **** 5678 · 工商银行",
        remark: ""
      },
      {
        siteId: "ST-SH-JD", operatorId: "OP-SX",
        landlordName: "京东物流园区", landlordPhone: "139****3300", landlordContact: "赵园区",
        venueFeeAmount: 12000, venueFeeUnit: "季",
        electricityMode: "按量", electricityUnitPrice: 1.08, electricityFixedAmount: null,
        paymentCycle: "季结", payMethod: "对公转账", payeeName: "京东物流（上海）园区运营", payAccount: "6228 **** **** 9012 · 建设银行",
        remark: "渠道专属站 · 场地费含基础安保"
      },
      {
        siteId: "ST-SH-05", operatorId: "OP-SX",
        landlordName: "张江高科", landlordPhone: "021-5088****", landlordContact: "待签约",
        venueFeeAmount: 0, venueFeeUnit: "月",
        electricityMode: "按量", electricityUnitPrice: 1.2, electricityFixedAmount: null,
        paymentCycle: "月结", payMethod: "对公转账", payeeName: "—", payAccount: "—",
        remark: "筹备中 · 待完善收款信息"
      },
      {
        siteId: "ST-SH-LG", operatorId: "OP-SX",
        landlordName: "临港开发集团", landlordPhone: "021-6828****", landlordContact: "陈主管",
        venueFeeAmount: 2200, venueFeeUnit: "月",
        electricityMode: "按量", electricityUnitPrice: 1.05, electricityFixedAmount: null,
        paymentCycle: "月结", payMethod: "微信", payeeName: "临港开发集团场地部", payAccount: "微信号 LG-场地收款",
        remark: "偏远站 · 电费按柜机抄表结算"
      }
    ];

    const siteExpenseBills = [
      {
        id: "SEB-2606-01", siteId: "ST-SH-01", operatorId: "OP-SX",
        periodStart: "2026-06-01", periodEnd: "2026-06-30",
        venueFee: 3500, electricityKwh: 86.432, electricityFee: 99.40, totalAmount: 3599.40,
        status: "待支付", dueDate: "2026-07-10",
        payments: []
      },
      {
        id: "SEB-2605-01", siteId: "ST-SH-01", operatorId: "OP-SX",
        periodStart: "2026-05-01", periodEnd: "2026-05-31",
        venueFee: 3500, electricityKwh: 92.118, electricityFee: 105.94, totalAmount: 3605.94,
        status: "已结清", dueDate: "2026-06-10",
        payments: [
          { id: "SEP-260601", payTime: "2026-06-08 15:20", amount: 3605.94, method: "对公转账", ref: "202606081520001", operator: "王会计", remark: "5月场地+电费" }
        ]
      },
      {
        id: "SEB-2604-01", siteId: "ST-SH-01", operatorId: "OP-SX",
        periodStart: "2026-04-01", periodEnd: "2026-04-30",
        venueFee: 3500, electricityKwh: 78.26, electricityFee: 90.00, totalAmount: 3590.00,
        status: "已结清", dueDate: "2026-05-10",
        payments: [
          { id: "SEP-260430", payTime: "2026-05-06 11:10", amount: 2000, method: "对公转账", ref: "202605061110001", operator: "王会计", remark: "4月场地费首期" },
          { id: "SEP-260509", payTime: "2026-05-09 16:40", amount: 1590, method: "对公转账", ref: "202605091640002", operator: "王会计", remark: "4月尾款+电费" }
        ]
      },
      {
        id: "SEB-2606-02", siteId: "ST-SH-02", operatorId: "OP-SX",
        periodStart: "2026-06-01", periodEnd: "2026-06-30",
        venueFee: 2800, electricityKwh: null, electricityFee: 600, totalAmount: 3400,
        status: "已结清", dueDate: "2026-07-10",
        payments: [
          { id: "SEP-260602", payTime: "2026-06-12 10:05", amount: 3400, method: "对公转账", ref: "202606121005002", operator: "王会计", remark: "6月包月电费含在账单内" }
        ]
      },
      {
        id: "SEB-2605-02", siteId: "ST-SH-02", operatorId: "OP-SX",
        periodStart: "2026-05-01", periodEnd: "2026-05-31",
        venueFee: 2800, electricityKwh: null, electricityFee: 600, totalAmount: 3400,
        status: "已结清", dueDate: "2026-06-10",
        payments: [
          { id: "SEP-260518", payTime: "2026-05-18 14:22", amount: 3400, method: "支付宝", ref: "202605181422088", operator: "王会计", remark: "5月场地+包月电" }
        ]
      },
      {
        id: "SEB-2606-03", siteId: "ST-SH-JD", operatorId: "OP-SX",
        periodStart: "2026-04-01", periodEnd: "2026-06-30",
        venueFee: 12000, electricityKwh: 245.8, electricityFee: 265.46, totalAmount: 12265.46,
        status: "部分支付", dueDate: "2026-07-15",
        payments: [
          { id: "SEP-260603", payTime: "2026-06-20 09:30", amount: 8000, method: "对公转账", ref: "202606200930003", operator: "王会计", remark: "Q2 场地费首期" }
        ]
      },
      {
        id: "SEB-2603-03", siteId: "ST-SH-JD", operatorId: "OP-SX",
        periodStart: "2026-01-01", periodEnd: "2026-03-31",
        venueFee: 12000, electricityKwh: 210.5, electricityFee: 227.34, totalAmount: 12227.34,
        status: "已结清", dueDate: "2026-04-15",
        payments: [
          { id: "SEP-260410", payTime: "2026-04-10 10:00", amount: 12227.34, method: "对公转账", ref: "202604101000010", operator: "王会计", remark: "Q1 场地+电费一次结清" }
        ]
      },
      {
        id: "SEB-2606-04", siteId: "ST-SH-LG", operatorId: "OP-SX",
        periodStart: "2026-06-01", periodEnd: "2026-06-30",
        venueFee: 2200, electricityKwh: 62.4, electricityFee: 65.52, totalAmount: 2265.52,
        status: "待支付", dueDate: "2026-07-12",
        payments: []
      },
      {
        id: "SEB-2605-04", siteId: "ST-SH-LG", operatorId: "OP-SX",
        periodStart: "2026-05-01", periodEnd: "2026-05-31",
        venueFee: 2200, electricityKwh: 58.1, electricityFee: 61.01, totalAmount: 2261.01,
        status: "部分支付", dueDate: "2026-06-12",
        payments: [
          { id: "SEP-260528", payTime: "2026-05-28 18:05", amount: 1200, method: "微信", ref: "WX202605281805", operator: "王会计", remark: "5月场地费预付" }
        ]
      },
      {
        id: "SEB-2604-04", siteId: "ST-SH-LG", operatorId: "OP-SX",
        periodStart: "2026-04-01", periodEnd: "2026-04-30",
        venueFee: 2200, electricityKwh: 55.0, electricityFee: 57.75, totalAmount: 2257.75,
        status: "已结清", dueDate: "2026-05-12",
        payments: [
          { id: "SEP-260508", payTime: "2026-05-08 09:40", amount: 2257.75, method: "现金", ref: "现金收据-LG-0401", operator: "现场运维", remark: "临港站现金结清" }
        ]
      }
    ];

    const packageOrders = [
      {
        id: "SUB260524001", user: "U1028", phone: "138****1028", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-05-01 09:12", validFrom: "2026-05-01", validTo: "2026-05-31",
        swapLimit: null, swapUsed: 42, accrued: 2208, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260524002", user: "U1041", phone: "139****1041", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "已冻结", serviceState: "已冻结", payTime: "2026-05-10 14:20", validFrom: "2026-05-10", validTo: "2026-06-09",
        swapLimit: null, swapUsed: 28, accrued: 81, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 0,
        depositWaiver: { type: "微信支付分", score: 718, waivedAmount: 99 },
        freezeInfo: { applyTime: "2026-05-20 14:00", reason: "短期离岗", frozenDays: 7, maxFreezeDays: 30, resumeNote: "解冻后有效期顺延；首次服务为领取电池" }
      },
      {
        id: "SUB260525001", user: "U1055", phone: "136****1055", site: "世博换电服务点", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-05-15 10:30", validFrom: "2026-05-15", validTo: "2026-06-17",
        swapLimit: null, swapUsed: 12, accrued: 58, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22021",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null,
        resumePendingPickup: true, resumePickupNote: "2026-06-11 解冻后待首次领取电池"
      },
      {
        id: "SUB260523088", user: "U2088", phone: "137****2088", site: "陆家嘴分站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "待退款", serviceState: "中途完结", payTime: "2026-05-18 16:35", validFrom: "2026-05-18", validTo: "2026-06-17",
        swapLimit: null, swapUsed: 6, accrued: 32, payout: "待退款", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营", cabinet: "CAB-22044",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null, endTime: "2026-05-22 09:00",
        refundInfo: {
          unusedService: 179, depositRefund: 99, totalRefund: 278, refunded: 0, pending: 278,
          unusedFormula: "包月剩余 24 天 × 日单价",
          depositStatus: "运营商已提现，待运营商垫付", refundStatus: "待退款"
        }
      },
      {
        id: "SUB260401099", user: "U9001", phone: "135****9001", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "已完结", serviceState: "已完结", payTime: "2026-04-01 08:00", validFrom: "2026-04-01", validTo: "2026-04-30",
        swapLimit: null, swapUsed: 55, accrued: 220, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260524015", user: "U3321", phone: "136****3321", site: "陆家嘴分站", city: "上海", pkg: "次卡10次", pkgType: "times",
        pay: 89, status: "服务中", serviceState: "服务中", payTime: "2026-05-23 09:40", validFrom: "2026-05-23", validTo: "2026-08-23",
        swapLimit: 10, swapUsed: 3, accrued: 27, payout: "已清分", deviceOwnerId: "OP-LJZ", deviceOwnerName: "陆家嘴联营", cabinet: "CAB-22044",
        batteryDeposit: 99, depositPaid: 0,
        depositWaiver: { type: "芝麻信用", score: 652, waivedAmount: 99 }
      },
      {
        id: "SUB260601099", user: "U9001", phone: "135****9001", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "已完结", serviceState: "中途完结", payTime: "2026-05-28 09:00", validFrom: "2026-05-28", validTo: "2026-06-27",
        swapLimit: null, swapUsed: 2, accrued: 20, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 0, depositWaiver: { type: "微信支付分", score: 705, waivedAmount: 99 }, endTime: "2026-06-01 10:00"
      },
      {
        id: "SUB260608015", user: "U2199", phone: "139****2199", site: "世博换电服务点", city: "上海", pkg: "单次换电", pkgType: "single",
        pay: 9.9, status: "已完结", serviceState: "已完结", payTime: "2026-06-08 15:50", validFrom: "2026-06-08", validTo: "2026-06-09",
        swapLimit: 1, swapUsed: 0, accrued: 9.9, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22021",
        batteryDeposit: 0, depositPaid: 0, depositWaiver: null, endTime: "2026-06-08 16:05"
      },
      {
        id: "SUB260610088", user: "U2201", phone: "138****2201", site: "浦东骑手驿站", city: "上海", pkg: "7天套餐", pkgType: "weekly",
        pay: 89, status: "服务中", serviceState: "服务中", payTime: "2026-06-03 08:00", validFrom: "2026-06-03", validTo: "2026-06-10",
        swapLimit: null, swapUsed: 0, accrued: 0, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260605033", user: "U2188", phone: "136****2188", site: "浦东骑手驿站", city: "上海", pkg: "30天畅换", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-06-01 12:00", validFrom: "2026-06-01", validTo: "2026-07-01",
        swapLimit: null, swapUsed: 15, accrued: 45, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260607ME", user: "U2301", phone: "138****2301", site: "浦东骑手驿站", city: "上海", pkg: "30天畅换", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-06-07 11:30", validFrom: "2026-06-07", validTo: "2026-07-07",
        swapLimit: null, swapUsed: 8, accrued: 24, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260612088", user: "U2188", phone: "136****2188", site: "浦东骑手驿站", city: "上海", pkg: "30天畅换", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-06-10 08:00", validFrom: "2026-06-10", validTo: "2026-07-09",
        swapLimit: null, swapUsed: 5, accrued: 15, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
      {
        id: "SUB260606001", user: "U2107", phone: "137****2107", site: "浦东骑手驿站", city: "上海", pkg: "1天套餐", pkgType: "daily",
        pay: 29, status: "已完结", serviceState: "已完结", payTime: "2026-06-06 06:30", validFrom: "2026-06-06", validTo: "2026-06-07",
        swapLimit: null, swapUsed: 3, accrued: 29, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 0, depositPaid: 0, depositWaiver: null, endTime: "2026-06-07 06:30"
      },
      {
        id: "SUB260615033", user: "U1066", phone: "138****1066", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "待退款", serviceState: "中途完结", payTime: "2026-05-20 11:00", validFrom: "2026-05-20", validTo: "2026-06-19",
        swapLimit: null, swapUsed: 18, accrued: 72, payout: "待退款", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null, endTime: "2026-06-12 09:00",
        refundInfo: { unusedService: 145, depositRefund: 99, totalRefund: 244, refunded: 0, pending: 244, unusedFormula: "剩余 19 天", depositStatus: "待确认", refundStatus: "待退款" }
      },
      {
        id: "SUB2606103001", user: "U3001", phone: "138****3001", site: "浦东骑手驿站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 279, status: "服务中", serviceState: "服务中", payTime: "2026-06-10 16:30", validFrom: "2026-06-10", validTo: "2026-07-10",
        swapLimit: null, swapUsed: 5, accrued: 18, payout: "已清分", deviceOwnerId: "OP-SX", deviceOwnerName: "绿色出行", cabinet: "CAB-22018",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null,
        channelId: "CH-CARD", channelName: "骑士卡推广", linkCode: "qsk-30d-wx", linkOrderId: "LO-260610"
      },
      {
        id: "SUB260606BJ", user: "U-LJZ-01", phone: "137****7702", site: "滨江换电站", city: "上海", pkg: "包月30天", pkgType: "monthly",
        pay: 299, status: "服务中", serviceState: "服务中", payTime: "2026-06-05 10:00", validFrom: "2026-06-05", validTo: "2026-07-05",
        swapLimit: null, swapUsed: 8, accrued: 32, payout: "已清分", deviceOwnerId: "OP-BJ", deviceOwnerName: "滨江联营", cabinet: "CAB-BJ-01",
        batteryDeposit: 99, depositPaid: 99, depositWaiver: null
      },
    ];

    const operatorRefundSettings = {
      "OP-SX": {
        mode: "manual", depositRefundMode: "manual",
        coolingPeriodDays: 3, coolingPeriodEnabled: true,
        coolingDefaultAudit: true,
        updatedAt: "2026-06-10", updatedBy: "绿色出行"
      },
      "OP-LJZ": {
        mode: "manual", depositRefundMode: "auto",
        coolingPeriodDays: 3, coolingPeriodEnabled: true,
        coolingDefaultAudit: true,
        updatedAt: "2026-06-01", updatedBy: "陆家嘴联营"
      }
    };

    /** 个人用户电池押金数额：信用不足不免押时须缴纳（按运营商，与 SKU 零售价独立） */
    const operatorPersonalDepositSettings = {
      "OP-SX": {
        amount: 99, enabled: true,
        scope: "个人套餐",
        wechatPayScoreMin: 650,
        zhimaScoreMin: 650,
        note: "芝麻/支付分不足时实缴；达标免押则实收 ¥0",
        updatedAt: "2026-06-10", updatedBy: "绿色出行"
      },
      "OP-LJZ": {
        amount: 199, enabled: true,
        scope: "个人套餐",
        wechatPayScoreMin: 680,
        zhimaScoreMin: 650,
        note: "联营区示范高押金",
        updatedAt: "2026-06-01", updatedBy: "陆家嘴联营"
      }
    };

    function isWithinCoolingPeriod(pkgOrder, settings) {
      if (!settings?.coolingPeriodEnabled || !pkgOrder?.payTime) return false;
      const days = settings.coolingPeriodDays ?? 3;
      const pay = new Date(pkgOrder.payTime.replace(/-/g, "/"));
      const now = new Date("2026-06-12T12:00:00");
      const elapsedMs = now - pay;
      const elapsedDays = elapsedMs / (86400000);
      return elapsedDays >= 0 && elapsedDays <= days;
    }

    function calcCoolingSuggestedRefund(pkgOrder) {
      const pay = pkgOrder.pay || 0;
      if (!pkgOrder.payTime || !pkgOrder.validFrom || !pkgOrder.validTo) return pay;
      const start = new Date(pkgOrder.validFrom.replace(/-/g, "/"));
      const end = new Date(pkgOrder.validTo.replace(/-/g, "/"));
      const totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
      const now = new Date("2026-06-12T12:00:00");
      const usedDays = Math.min(totalDays, Math.max(0, Math.floor((now - start) / 86400000) + 1));
      const remaining = Math.max(0, totalDays - usedDays);
      const suggested = Math.round(pay * remaining / totalDays * 100) / 100;
      return { suggested, usedDays, totalDays, remaining };
    }

    const refundRequests = [
      {
        id: "RF-260522-001", operatorId: "OP-LJZ", scId: "SC26052201", orderId: "SUB260523088", user: "U2088", phone: "137****2088",
        site: "陆家嘴分站", type: "中途完结", pkgName: "包月30天", pkgRefund: 120, depositRefund: 99, totalRefund: 219,
        platformFeeRefund: 5.38, needAdvance: true, advanceReason: "运营商已提现，须垫付",
        status: "待审核", applyTime: "2026-05-22 09:00", processedTime: null, processedBy: null, rejectReason: null
      },
      {
        id: "RF-260610-001", operatorId: "OP-SX", scId: null, orderId: "SUB260610088", user: "U2201", phone: "138****2201",
        site: "浦东骑手驿站", type: "7天未使用退订", pkgName: "7天套餐", pkgRefund: 89, depositRefund: 0, totalRefund: 89,
        platformFeeRefund: 0.89, needAdvance: false, advanceReason: null,
        status: "待审核", applyTime: "2026-06-10 11:20", processedTime: null, processedBy: null, rejectReason: null
      },
      {
        id: "RF-260608-002", operatorId: "OP-SX", scId: null, orderId: "SUB260608015", user: "U2199", phone: "139****2199",
        site: "世博换电服务点", type: "单次未换电退订", pkgName: "单次换电", pkgRefund: 9.9, depositRefund: 0, totalRefund: 9.9,
        platformFeeRefund: 0.1, needAdvance: false, advanceReason: null,
        status: "已退款", applyTime: "2026-06-08 16:05", processedTime: "2026-06-08 16:06", processedBy: "系统自动", rejectReason: null,
        processMode: "auto"
      },
      {
        id: "RF-260601-003", operatorId: "OP-SX", scId: "SC26060101", orderId: "SUB260601099", user: "U9001", phone: "135****9001",
        site: "浦东骑手驿站", type: "中途完结", pkgName: "包月30天", pkgRefund: 186, depositRefund: 0, totalRefund: 186,
        platformFeeRefund: 2.99, needAdvance: false, advanceReason: null,
        status: "已退款", applyTime: "2026-06-01 10:00", processedTime: "2026-06-01 10:15", processedBy: "王会计", rejectReason: null,
        processMode: "manual"
      },
      {
        id: "RF-260605-004", operatorId: "OP-SX", scId: null, orderId: "SUB260605033", user: "U2188", phone: "136****2188",
        site: "浦东骑手驿站", type: "中途完结", pkgName: "30天畅换", pkgRefund: 0, depositRefund: 0, totalRefund: 0,
        platformFeeRefund: 0, needAdvance: false, advanceReason: null,
        status: "已驳回", applyTime: "2026-06-05 09:30", processedTime: "2026-06-05 10:00", processedBy: "李小运维", rejectReason: "仍持有电池，请先还电"
      },
      {
        id: "RF-260615-01", operatorId: "OP-SX", scId: "SC26061501", orderId: "SUB260524002", user: "U1041", phone: "139****1041",
        site: "浦东骑手驿站", type: "中途完结", pkgName: "包月30天", pkgRefund: 120, depositRefund: 0, totalRefund: 120,
        platformFeeRefund: 2.99, needAdvance: false, advanceReason: null,
        status: "待审核", applyTime: "2026-06-15 16:20", processedTime: null, processedBy: null, rejectReason: null
      },
      {
        id: "RF-260612-COOL", operatorId: "OP-SX", scId: "SC260612-COOL", orderId: "SUB260612088", user: "U2188", phone: "136****2188",
        site: "浦东骑手驿站", type: "冷静期退款", pkgName: "30天畅换", pkgRefund: 279, depositRefund: 99, totalRefund: 378,
        suggestedRefund: 279, usedDays: 2, coolingDaysLeft: 1, payAmount: 299, coolingPeriod: true,
        platformFeeRefund: 2.99, needAdvance: false, advanceReason: null,
        status: "待审核", applyTime: "2026-06-12 09:30", processedTime: null, processedBy: null, rejectReason: null,
        operatorNote: "系统建议扣 2 天使用费；押金另退"
      },
      {
        id: "RF-260615-DEP", operatorId: "OP-SX", scId: null, orderId: "SUB260605033", user: "U2188", phone: "136****2188",
        site: "浦东骑手驿站", type: "押金退还", pkgName: "30天畅换", pkgRefund: 0, depositRefund: 99, totalRefund: 99,
        platformFeeRefund: 0, needAdvance: false, advanceReason: null, depositOnly: true,
        status: "待审核", applyTime: "2026-06-15 14:20", processedTime: null, processedBy: null, rejectReason: null,
        operatorNote: "用户已还电 · 仅退电池押金 · 套餐仍服务中"
      }
    ];

    const serviceChangeRequests = [
      {
        id: "SC26060101", subId: "SUB260601099", user: "U9001", phone: "135****9001", site: "浦东骑手驿站",
        type: "中途完结", applyTime: "2026-06-01 10:00", status: "已退款",
        detail: "未使用套餐 ¥186；免押无押金退", amount: 186, deviceOwnerId: "OP-SX"
      },
      {
        id: "SC26052201", subId: "SUB260523088", user: "U2088", phone: "137****2088", site: "陆家嘴分站",
        type: "中途完结", applyTime: "2026-05-22 09:00", status: "退款处理中",
        detail: "未使用套餐 ¥179 + 押金 ¥99", amount: 278, deviceOwnerId: "OP-LJZ"
      },
      {
        id: "SC26052001", subId: "SUB260524002", user: "U1041", phone: "139****1041", site: "浦东骑手驿站",
        type: "冻结", applyTime: "2026-05-20 14:00", status: "已生效",
        detail: "短期离岗 · 未持电池 · 系统自动生效 · 解冻后首服：领取电池", amount: 0, deviceOwnerId: "OP-SX",
        frozenDays: 7
      },
      {
        id: "SC26061501", subId: "SUB260524002", user: "U1041", phone: "139****1041", site: "浦东骑手驿站",
        type: "中途完结", applyTime: "2026-06-15 16:20", status: "退款处理中",
        detail: "未使用套餐 ¥120；免押用户无押金退", amount: 120, deviceOwnerId: "OP-SX"
      },
      {
        id: "SC260612-COOL", subId: "SUB260612088", user: "U2188", phone: "136****2188", site: "浦东骑手驿站",
        type: "冷静期退款", applyTime: "2026-06-12 09:30", status: "退款处理中",
        detail: "开通第 3 天申请；建议退套餐 ¥279（已用 2 天）+ 押金 ¥99", amount: 378, deviceOwnerId: "OP-SX"
      },
      {
        id: "SC26062501", subId: "SUB260525001", user: "U1055", phone: "136****1055", site: "世博换电服务点",
        type: "解冻", applyTime: "2026-06-11 10:00", status: "已生效",
        detail: "冻结 3 天后自行解冻 · 有效期顺延 3 天 · 首次服务：领取电池（待完成）", amount: 0, deviceOwnerId: "OP-SX",
        resumeFirstService: "领取电池", frozenDays: 3
      }
    ];

    const swapOrders = [
      {
        id: "SW2605241201", subId: "SUB260524001", entitlementType: "个人套餐", user: "U1028", phone: "138****1028", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 10, slotOut: 7,
        batIn: { sn: "BAT-SH-1001", soc: 18, health: "正常" }, batOut: { sn: "BAT-SH-0901", soc: 96, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-05-24 12:05", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2605241188", subId: "SUB260524001", entitlementType: "个人套餐", user: "U1028", phone: "138****1028", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22019", slots: 12, online: true }, slotIn: 5, slotOut: 2,
        batIn: { sn: "BAT-SH-1002", soc: 42, health: "正常" }, batOut: { sn: "BAT-SH-0888", soc: 94, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-05-24 08:30", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2605241140", subId: "SUB260524002", entitlementType: "个人套餐", user: "U1041", phone: "139****1041", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 8, slotOut: 4,
        batIn: { sn: "BAT-SH-1001", soc: 25, health: "正常" }, batOut: { sn: "BAT-SH-0701", soc: 91, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-05-24 11:40", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2605201410", subId: "SUB260523088", entitlementType: "个人套餐", user: "U2088", phone: "137****2088", site: "陆家嘴分站", siteId: "ST-SH-04", city: "上海",
        cabinet: { sn: "CAB-22044", slots: 8, online: true }, slotIn: 2, slotOut: 6,
        batIn: { sn: "BAT-SH-1044", soc: 22, health: "正常" }, batOut: { sn: "BAT-SH-0601", soc: 98, health: "正常" },
        deviceOwnerId: "OP-LJZ", time: "2026-05-20 14:10", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2603301200", subId: "SUB260401099", entitlementType: "个人套餐", user: "U9001", phone: "135****9001", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 1, slotOut: 9,
        batIn: { sn: "BAT-SH-0999", soc: 15, health: "正常" }, batOut: { sn: "BAT-SH-0902", soc: 97, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-04-28 18:00", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2605240912", subId: "SUB260524015", entitlementType: "个人套餐", user: "U3321", phone: "136****3321", site: "陆家嘴分站", siteId: "ST-SH-04", city: "上海",
        cabinet: { sn: "CAB-22044", slots: 8, online: true }, slotIn: 4, slotOut: null,
        batIn: { sn: "BAT-SH-1044", soc: 35, health: "正常" }, batOut: null,
        deviceOwnerId: "OP-LJZ", time: "2026-05-24 09:12", status: "失败", failReason: "换电格口开启超时，未取走满电电池"
      },
      {
        id: "SW2606090830", subId: null, entitlementType: "渠道人天",
        poolId: "QP-2601", channelId: "CH-SF", channelName: ENT.channel.name,
        user: "U2101", phone: "138****2101", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 6, slotOut: 2,
        batIn: { sn: "BAT-SH-1010", soc: 20, health: "正常" }, batOut: { sn: "BAT-SH-0910", soc: 95, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-09 08:30", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1
      },
      {
        id: "SW2606091430", subId: null, entitlementType: "渠道人天",
        poolId: "QP-2601", channelId: "CH-SF", channelName: ENT.channel.name,
        user: "U2110", phone: "136****2110", site: "世博换电服务点", siteId: "ST-SH-02", city: "上海",
        cabinet: { sn: "CAB-22021", slots: 12, online: true }, slotIn: 6, slotOut: 2,
        batIn: { sn: "BAT-SH-1010", soc: 20, health: "正常" }, batOut: { sn: "BAT-SH-0910", soc: 95, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-09 14:30", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1
      },
      {
        id: "SW2606021015", subId: null, entitlementType: "渠道人天",
        poolId: "QP-2601", channelId: "CH-SF", channelName: ENT.channel.name,
        user: "U2110", phone: "136****2110", site: "世博换电服务点", siteId: "ST-SH-02", city: "上海",
        cabinet: { sn: "CAB-22021", slots: 12, online: true }, slotIn: 4, slotOut: 1,
        batIn: { sn: "BAT-SH-1021", soc: 28, health: "正常" }, batOut: { sn: "BAT-SH-0921", soc: 93, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-02 10:15", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1
      },
      {
        id: "SW260620001", subId: null, entitlementType: "渠道人天",
        poolId: "QP-2601", channelId: "CH-SF", channelName: ENT.channel.name,
        user: "U-DP-01", phone: "138****2001", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 7, slotOut: 3,
        batIn: { sn: "BAT-SH-1001", soc: 15, health: "正常" }, batOut: null,
        deviceOwnerId: "OP-SX", time: "2026-06-20 14:32", status: "失败", failReason: "格口 7 未检测到电池弹出"
      },
      {
        id: "SW260610044", subId: "SUB260606BJ", entitlementType: "个人套餐", user: "U-LJZ-01", phone: "137****7702", site: "滨江换电站", siteId: "ST-SH-BJ", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 2, slotOut: 5,
        batIn: { sn: "BAT-SH-0901", soc: 30, health: "正常" }, batOut: { sn: "BAT-SH-1001", soc: 96, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-10 17:00", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2606140912", subId: "SUB260524001", entitlementType: "个人套餐", user: "U1028", phone: "138****1028", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22019", slots: 12, online: false }, slotIn: 6, slotOut: null,
        batIn: { sn: "BAT-SH-1002", soc: 22, health: "正常" }, batOut: null,
        deviceOwnerId: "OP-SX", time: "2026-06-14 09:12", status: "失败", failReason: "柜机离线，换电流程中断"
      },
      {
        id: "SW2606121800", subId: "SUB260605033", entitlementType: "个人套餐", user: "U2188", phone: "136****2188", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 4, slotOut: 8,
        batIn: { sn: "BAT-SH-1002", soc: 19, health: "正常" }, batOut: { sn: "BAT-SH-0903", soc: 98, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-12 18:00", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2606110900", subId: "SUB260525001", entitlementType: "个人套餐", user: "U1055", phone: "136****1055", site: "世博换电服务点", siteId: "ST-SH-02", city: "上海",
        cabinet: { sn: "CAB-22021", slots: 12, online: true }, slotIn: 3, slotOut: 6,
        batIn: { sn: "BAT-SH-1021", soc: 24, health: "正常" }, batOut: { sn: "BAT-SH-0922", soc: 97, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-11 09:00", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW2606103001", subId: "SUB2606103001", entitlementType: "个人套餐", user: "U3001", phone: "138****3001", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 5, slotOut: 9,
        batIn: { sn: "BAT-SH-1010", soc: 21, health: "正常" }, batOut: { sn: "BAT-SH-0911", soc: 96, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-11 09:00", status: "成功", alloc: 9.96, accrual: "已清分"
      },
      {
        id: "SW-CHANNEL-CROSS", subId: null, entitlementType: "渠道人天",
        poolId: "QP-2601", channelId: "CH-SF", channelName: ENT.channel.name,
        user: "U2088", phone: "137****2088", site: "滨江换电站", siteId: "ST-BJ-01", city: "上海",
        cabinet: { sn: "CAB-BJ-01", slots: 10, online: true }, slotIn: 2, slotOut: 5,
        batIn: { sn: "BAT-SH-1001", soc: 22, health: "正常" }, batOut: { sn: "BAT-BJ-1001", soc: 95, health: "正常" },
        userOwnerId: "OP-SX", userOwnerName: "绿色出行",
        cabinetOwnerId: "OP-BJ", cabinetOwnerName: "滨江联营",
        batteryOwnerId: "OP-LJZ", batteryOwnerName: "陆家嘴联营",
        deviceOwnerId: "OP-BJ", time: "2026-06-09 17:20", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1
      },
      {
        id: "SW-CROSS-DEMO", subId: "SUB260524001", entitlementType: "个人套餐", user: "U1028", phone: "138****1028", site: "滨江换电站", siteId: "ST-BJ-01", city: "上海",
        cabinet: { sn: "CAB-BJ-01", slots: 10, online: true }, slotIn: 2, slotOut: 5,
        batIn: { sn: "BAT-SH-1001", soc: 20, health: "正常" }, batOut: { sn: "BAT-BJ-1001", soc: 94, health: "正常" },
        userOwnerId: "OP-SX", userOwnerName: "绿色出行",
        cabinetOwnerId: "OP-BJ", cabinetOwnerName: "滨江联营",
        batteryOwnerId: "OP-LJZ", batteryOwnerName: "陆家嘴联营",
        deviceOwnerId: "OP-BJ", time: "2026-06-09 16:00", status: "成功"
      },
      {
        id: "SW-ACT-0612", subId: "SUB-ACT-001", entitlementType: "激活码",
        activationCodeId: "CODE-001", activationCode: "FN30-A8K2-M9P7", codeId: "CODE-001",
        channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", skuName: "30天包月",
        user: "U-ACT-01", phone: "138****5001", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22018", slots: 12, online: true }, slotIn: 3, slotOut: 7,
        batIn: { sn: "BAT-SH-1001", soc: 22, health: "正常" }, batOut: { sn: "BAT-SH-0901", soc: 95, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-12 10:15", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1, consumeUnit: "天"
      },
      {
        id: "SW-ACT-0613", subId: "SUB-ACT-001", entitlementType: "激活码",
        activationCodeId: "CODE-001", activationCode: "FN30-A8K2-M9P7", codeId: "CODE-001",
        channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", skuName: "30天包月",
        user: "U-ACT-01", phone: "138****5001", site: "世博换电服务点", siteId: "ST-SH-02", city: "上海",
        cabinet: { sn: "CAB-22021", slots: 12, online: true }, slotIn: 2, slotOut: 5,
        batIn: { sn: "BAT-SH-1021", soc: 18, health: "正常" }, batOut: { sn: "BAT-SH-0922", soc: 97, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-13 08:40", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1, consumeUnit: "天"
      },
      {
        id: "SW-ACT-0609", subId: "SUB-ACT-002", entitlementType: "激活码",
        activationCodeId: "CODE-004", activationCode: "FN7D-D2N9-Q1S3", codeId: "CODE-004",
        channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", skuName: "7天体验",
        user: "U-ACT-02", phone: "139****5002", site: "浦东骑手驿站", siteId: "ST-SH-01", city: "上海",
        cabinet: { sn: "CAB-22019", slots: 12, online: true }, slotIn: 4, slotOut: 1,
        batIn: { sn: "BAT-SH-1002", soc: 25, health: "正常" }, batOut: { sn: "BAT-SH-0888", soc: 94, health: "正常" },
        deviceOwnerId: "OP-SX", time: "2026-06-09 11:20", status: "成功",
        poolConsume: "已确认消耗", dayQuota: 1, consumeUnit: "天"
      }
    ];

    const swapOrderLogs = {
      "SW2605241201": [
        { t: "12:04:55", kind: "user", type: "用户操作", text: "骑手打开换电页，定位站点「浦东骑手驿站」" },
        { t: "12:04:58", kind: "user", type: "用户操作", text: "扫描柜机 CAB-22018 二维码，确认发起换电" },
        { t: "12:04:59", kind: "req", type: "请求", text: "App → POST /api/v1/swap/start { subId, cabinetSn } → 200，返回 swapId=SW2605241201" },
        { t: "12:05:00", kind: "req", type: "请求", text: "平台 → 物联网 POST /device/cabinet/open { slot:3, reason:return } → 202 已受理" },
        { t: "12:05:02", kind: "dev", type: "设备动作", text: "柜机执行还电格口 #3 开仓指令" },
        { t: "12:05:03", kind: "dev", type: "设备反馈", text: "格口 #3 门磁=开，到位传感器=true" },
        { t: "12:05:18", kind: "user", type: "用户操作", text: "骑手放入电池 BAT-SH-1001，点击「已放入」" },
        { t: "12:05:19", kind: "req", type: "请求", text: "App → POST /api/v1/swap/confirm-return { batSn } → 200" },
        { t: "12:05:20", kind: "dev", type: "设备反馈", text: "BMS 识别 SN=BAT-SH-1001，SOC=18%，健康=正常，充电接触良好" },
        { t: "12:05:21", kind: "dev", type: "设备动作", text: "格口 #3 关门锁止；平台下发换电格口 #7 开仓" },
        { t: "12:05:22", kind: "dev", type: "设备反馈", text: "格口 #7 门磁=开" },
        { t: "12:05:35", kind: "user", type: "用户操作", text: "骑手取走电池 BAT-SH-0901，点击「已完成换电」" },
        { t: "12:05:36", kind: "req", type: "请求", text: "App → POST /api/v1/swap/complete → 200，订单状态=成功" },
        { t: "12:05:37", kind: "dev", type: "设备反馈", text: "格口 #7 门磁=关；BMS SN=BAT-SH-0901 SOC=96%" },
        { t: "12:05:37", kind: "req", type: "请求", text: "换电完成；个人套餐权益履约（应分已在购套餐支付时清分，本单不记应分）" },
        { t: "12:05:37", kind: "req", type: "请求", text: "三元组 U=OP-SX C=OP-SX B=OP-LJZ；跨网电池服务费 ¥0.1（U→B 平台代付）" }
      ],
      "SW-CHANNEL-CROSS": [
        { t: "17:19:50", kind: "user", type: "用户操作", text: "渠道成员 U2088 扫码换电（权益=渠道人天 QP-2601）" },
        { t: "17:19:51", kind: "req", type: "请求", text: "POST /api/v1/swap/start { poolId:QP-2601, entitlement:day_pool } → 200" },
        { t: "17:20:00", kind: "dev", type: "设备反馈", text: "换电成功；三元组 U=OP-SX C=OP-BJ B=OP-LJZ" },
        { t: "17:20:01", kind: "req", type: "请求", text: "渠道池确认消耗 1 人天；跨网设备服务费 U 代付 ¥0.5+¥0.1；B 端 1% 待代扣" }
      ],
      "SW-CROSS-DEMO": [
        { t: "15:59:50", kind: "user", type: "用户操作", text: "扫描柜机 CAB-BJ-01（滨江换电站）" },
        { t: "16:00:00", kind: "dev", type: "设备反馈", text: "换电成功；三元组 U=OP-SX C=OP-BJ B=OP-LJZ" },
        { t: "16:00:01", kind: "req", type: "请求", text: "跨网设备服务费：U 平台代付柜机费 ¥0.5 + 电池费 ¥0.1；记入往来账待日清" }
      ],
      "SW2605240912": [
        { t: "09:11:50", kind: "user", type: "用户操作", text: "扫描柜机 CAB-22044，选择换电" },
        { t: "09:11:51", kind: "req", type: "请求", text: "POST /api/v1/swap/start → 200，swapId=SW2605240912" },
        { t: "09:11:53", kind: "dev", type: "设备动作", text: "还电格口 #4 开仓" },
        { t: "09:11:54", kind: "dev", type: "设备反馈", text: "格口 #4 已开" },
        { t: "09:12:05", kind: "user", type: "用户操作", text: "确认归还 BAT-SH-1044" },
        { t: "09:12:06", kind: "dev", type: "设备反馈", text: "归还检测通过 SOC=35%" },
        { t: "09:12:07", kind: "dev", type: "设备动作", text: "换电格口 #6 开仓" },
        { t: "09:12:22", kind: "dev", type: "设备反馈", text: "格口 #6 门磁=开（持续 15s）", level: "warn" },
        { t: "09:12:37", kind: "dev", type: "设备反馈", text: "换电格口开启超时，未检测到取电", level: "fail" },
        { t: "09:12:38", kind: "req", type: "请求", text: "平台回调 App：swap/fail reason=DOOR_TIMEOUT → 订单失败" }
      ],
      "SW2605241188": [
        { t: "08:29:40", kind: "user", type: "用户操作", text: "扫码柜机 CAB-22019 发起换电" },
        { t: "08:29:41", kind: "req", type: "请求", text: "POST /swap/start → 200" },
        { t: "08:29:50", kind: "dev", type: "设备动作", text: "还电 #5 开仓 → 归还 BAT-SH-1002" },
        { t: "08:30:05", kind: "dev", type: "设备动作", text: "换电 #2 开仓 → 取出 BAT-SH-0888 SOC=94%" },
        { t: "08:30:06", kind: "req", type: "请求", text: "POST /swap/complete → 200 成功" }
      ],
      "SW2606090830": [
        { t: "08:29:50", kind: "user", type: "用户操作", text: "渠道成员 U2101 扫码换电（权益=渠道人天 QP-2601）" },
        { t: "08:29:51", kind: "req", type: "请求", text: "POST /api/v1/swap/start { poolId:QP-2601, entitlement:day_pool } → 200" },
        { t: "08:30:00", kind: "dev", type: "设备动作", text: "还电 #6 / 换电 #2 完成" },
        { t: "08:30:01", kind: "req", type: "请求", text: "POST /swap/complete → 200；预占转确认消耗 1 人天" },
        { t: "08:30:02", kind: "req", type: "请求", text: "平台服务费计提 PF-001（确认消耗）" }
      ],
      "SW2606091430": [
        { t: "14:29:40", kind: "user", type: "用户操作", text: "渠道成员 U2110 首换开通后换电（QP-2601）" },
        { t: "14:30:00", kind: "req", type: "请求", text: "POST /swap/complete → 200；确认消耗 1 人天" }
      ]
    };

    const fundReceipts = [
      { id: "RC260607ME", type: "套餐支付", order: "SUB260607ME", site: "浦东骑手驿站", city: "上海", user: "U2301", pkg: "30天畅换", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-06-07 11:30", status: "成功" },
      { id: "RC260524001", type: "套餐支付", order: "SUB260524001", site: "浦东骑手驿站", city: "上海", user: "U1028", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-05-01 09:12", status: "成功" },
      { id: "RC260524002", type: "套餐支付", order: "SUB260524002", site: "浦东骑手驿站", city: "上海", user: "U1041", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-05-10 14:20", status: "成功" },
      { id: "RC260525001", type: "套餐支付", order: "SUB260525001", site: "世博换电服务点", city: "上海", user: "U1055", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-05-15 10:30", status: "成功" },
      { id: "RC260523088", type: "套餐支付", order: "SUB260523088", site: "陆家嘴分站", city: "上海", user: "U2088", pkg: "包月30天", payee: "陆家嘴联营", deviceOwnerId: "OP-LJZ", mch: "2088999***", amount: 299, fee: 5.38, net: 293.62, channel: "支付宝", time: "2026-05-18 16:35", status: "成功" },
      { id: "RC260523088R", type: "退款出款", order: "SUB260523088", site: "陆家嘴分站", city: "上海", user: "U2088", pkg: "包月30天", payee: "陆家嘴联营", deviceOwnerId: "OP-LJZ", mch: "2088999***", amount: -120, fee: 0, net: -120, channel: "原路退回", time: "2026-05-22 10:00", status: "处理中", note: "未使用套餐部分" },
      { id: "RC260523088D", type: "押金退还", order: "SUB260523088", site: "陆家嘴分站", city: "上海", user: "U2088", pkg: "包月30天", payee: "陆家嘴联营", deviceOwnerId: "OP-LJZ", mch: "2088999***", amount: -99, fee: 0, net: -99, channel: "原路退回", time: "—", status: "待还电确认", note: "中途完结·电池已还后退押" },
      { id: "RC260401099", type: "套餐支付", order: "SUB260401099", site: "浦东骑手驿站", city: "上海", user: "U9001", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-04-01 08:00", status: "成功" },
      { id: "RC260524015", type: "套餐支付", order: "SUB260524015", site: "陆家嘴分站", city: "上海", user: "U3321", pkg: "次卡10次", payee: "陆家嘴联营", deviceOwnerId: "OP-LJZ", mch: "2088999***", amount: 89, fee: 1.6, net: 87.4, channel: "微信支付", time: "2026-05-23 09:40", status: "成功" },
      { id: "RC-POOL-001", type: "额度池采购", order: "QP-2601", site: "—", city: "上海", user: "—", pkg: "人天池 10000天", payee: PAYEE_OPERATOR, deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 85000, fee: 0, net: 85000, channel: "对公转账", time: "2026-01-05 10:00", status: "成功", note: "批发 ¥8.5/人天" },
      { id: "RC-POOL-088", type: "额度池零售", order: "PAY-POOL-088", site: "浦东骑手驿站", city: "上海", user: "U1028", pkg: "1天套餐", payee: PAYEE_OPERATOR, deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 29, fee: 0.29, net: 28.71, channel: "微信支付", time: "2026-06-09 07:50", status: "成功", note: "个人用户短时套餐（历史样例；渠道兜底路径已废止）" },
      { id: "RC260601099R", type: "退款出款", order: "SUB260601099", site: "浦东骑手驿站", city: "上海", user: "U9001", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: -186, fee: 0, net: -186, channel: "原路退回", time: "2026-06-01 10:15", status: "成功", note: "RF-260601-003 中途完结·套餐退" },
      { id: "RC260608015R", type: "退款出款", order: "SUB260608015", site: "世博换电服务点", city: "上海", user: "U2199", pkg: "单次换电", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: -9.9, fee: 0, net: -9.9, channel: "原路退回", time: "2026-06-08 16:06", status: "成功", note: "RF-260608-002 单次未换电退订" },
      { id: "RC260610088R", type: "退款出款", order: "SUB260610088", site: "浦东骑手驿站", city: "上海", user: "U2201", pkg: "7天套餐", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: -89, fee: 0, net: -89, channel: "原路退回", time: "—", status: "待审核", note: "RF-260610-001 待确认后出款" },
      { id: "RC26061501R", type: "退款出款", order: "SUB260524002", site: "浦东骑手驿站", city: "上海", user: "U1041", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: -120, fee: 0, net: -120, channel: "原路退回", time: "—", status: "待审核", note: "RF-260615-01 中途完结·待确认" },
      { id: "RC260601099", type: "套餐支付", order: "SUB260601099", site: "浦东骑手驿站", city: "上海", user: "U9001", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-05-28 09:00", status: "成功" },
      { id: "RC260608015", type: "套餐支付", order: "SUB260608015", site: "世博换电服务点", city: "上海", user: "U2199", pkg: "单次换电", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 9.9, fee: 0.1, net: 9.8, channel: "微信支付", time: "2026-06-08 15:50", status: "成功" },
      { id: "RC260610088", type: "套餐支付", order: "SUB260610088", site: "浦东骑手驿站", city: "上海", user: "U2201", pkg: "7天套餐", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 89, fee: 0.89, net: 88.11, channel: "微信支付", time: "2026-06-03 08:00", status: "成功" },
      { id: "RC260606001", type: "套餐支付", order: "SUB260606001", site: "浦东骑手驿站", city: "上海", user: "U2107", pkg: "1天套餐", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: 29, fee: 0.29, net: 28.71, channel: "微信支付", time: "2026-06-06 06:30", status: "成功" },
      { id: "RC260615033D", type: "押金退还", order: "SUB260615033", site: "浦东骑手驿站", city: "上海", user: "U1066", pkg: "包月30天", payee: "绿色出行", deviceOwnerId: "OP-SX", mch: PAYEE_MCH.wx, amount: -99, fee: 0, net: -99, channel: "原路退回", time: "—", status: "待审核", note: "中途完结·押金待退" },
      { id: "RC260606BJ", type: "套餐支付", order: "SUB260606BJ", site: "滨江换电站", city: "上海", user: "U-LJZ-01", pkg: "包月30天", payee: "滨江联营", deviceOwnerId: "OP-BJ", mch: "1900000789***", amount: 299, fee: 5.38, net: 293.62, channel: "微信支付", time: "2026-06-05 10:00", status: "成功" }
    ];

    const accrualLedger = [
      { id: "AC260607ME", type: "支付清分", order: "SUB260607ME", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 296.01, settle: "已清分", note: "30天畅换 ¥299 · 1% 分账" },
      { id: "AC-LO-260610", type: "支付清分", order: "LO-260610", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 251.1, channel: 25.11, platform: 2.79, settle: "已清分", note: "骑士卡链接购卡 ¥279 · 平台1% + 渠道9% + 运营商净额" },
      { id: "AC-LO-260601", type: "支付清分", order: "LO-260601", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 251.1, channel: 25.11, platform: 2.79, settle: "已清分", note: "骑士卡链接购卡 · 佣金及时到付" },
      { id: "AC260524001", type: "支付清分", order: "SUB260524001", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 245.1, settle: "已清分", note: "支付成功 · 运营商 99%（¥300 套餐示意）" },
      { id: "AC260524002", type: "支付清分", order: "SUB260524002", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 88.11, settle: "已清分", note: "次卡支付 · 实时清分" },
      { id: "AC260401099", type: "退款冲正", order: "SUB260401099", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: -120, settle: "已冲正", note: "中途退款 · 运营商子商户原路退" },
      { id: "AC260601099R", type: "退款冲正", order: "SUB260601099", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: -186, settle: "已冲正", note: "RF-260601-003 中途完结冲正" },
      { id: "AC260608015R", type: "退款冲正", order: "SUB260608015", site: "世博换电服务点", city: "上海", deviceOwnerId: "OP-SX", op: -9.9, settle: "已冲正", note: "RF-260608-002 单次退订冲正" },
      { id: "AC260401100", type: "支付清分", order: "SUB260401099", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", op: 186, settle: "已提现", note: "4 月包月 · 支付时已清分，后已提现" },
    ];


    const operatorWithdrawalRequests = [
      { id: "WD-260501", operatorId: "OP-SX", amount: 186, applyTime: "2026-05-02 09:00", reviewTime: "2026-05-02 09:10", reviewedBy: "平台财务", status: "已提现", withdrawTime: "2026-05-02 10:00", accountId: "PA-OP-WX", accountLabel: "微信 · 2088123456***", monthDueReserved: 0, rejectReason: null },
      { id: "WD-260601", operatorId: "OP-SX", amount: 245, applyTime: "2026-06-02 09:00", reviewTime: "2026-06-02 09:15", reviewedBy: "平台财务", status: "已提现", withdrawTime: "2026-06-02 09:30", accountId: "PA-OP-WX", accountLabel: "微信 · 2088123456***", monthDueReserved: 0, rejectReason: null },
      { id: "WD-260605", operatorId: "OP-SX", amount: 81, applyTime: "2026-06-05 14:20", reviewTime: "2026-06-05 16:00", reviewedBy: "平台财务", status: "已提现", withdrawTime: "2026-06-05 16:30", accountId: "PA-OP-WX", accountLabel: "微信 · 2088123456***", monthDueReserved: 0, rejectReason: null }
    ];

    const payoutBatches = operatorWithdrawalRequests;

    const leaseDeviceLists = [
      {
        id: "LDL-2501", lessorId: "LEASE-HD", name: "绿色出行 · 柜电套装",
        lesseeId: "OP-SX", lesseeName: ENT.operator.name, contractId: "LC-2501",
        status: "已绑定",
        devices: [
          { sn: "CAB-22050", type: "换电柜", status: "在租", warrantyUntil: "2027-06-30" },
          { sn: "BAT-SH-1050", type: "电池", status: "在租", warrantyUntil: "2027-12-31" }
        ],
        replacements: [
          { at: "2025-08-15", fromSn: "BAT-SH-1048", toSn: "BAT-SH-1050", reason: "原电池无法维修" }
        ],
        updatedAt: "2026-06-01"
      },
      {
        id: "LDL-2502", lessorId: "LEASE-HD", name: "陆家嘴 · 单柜",
        lesseeId: "OP-LJZ", lesseeName: "陆家嘴联营", contractId: "LC-2502",
        status: "已绑定",
        devices: [{ sn: "CAB-33001", type: "换电柜", status: "在租" }],
        replacements: [],
        updatedAt: "2025-06-01"
      },
      {
        id: "LDL-STBY-01", lessorId: "LEASE-HD", name: "备用电池池",
        lesseeId: null, lesseeName: null, contractId: null,
        status: "待绑定",
        devices: [
          { sn: "BAT-SH-1051", type: "电池", status: "待用" },
          { sn: "BAT-NEW-001", type: "电池", status: "待用" }
        ],
        replacements: [],
        updatedAt: "2026-05-20"
      },
      {
        id: "LDL-2601", lessorId: "LEASE-HD", name: "闪送 · 世博扩租柜",
        lesseeId: "OP-SX", lesseeName: ENT.operator.name, contractId: "LC-2603",
        status: "已绑定",
        devices: [{ sn: "CAB-22021", type: "换电柜", status: "在租" }],
        replacements: [],
        updatedAt: "2026-03-01"
      }
    ];

    const leaseContracts = [
      {
        id: "LC-2501", lessorId: "LEASE-HD", lessorName: ENT.leasing.name,
        lesseeId: "OP-SX", lesseeName: ENT.operator.name,
        deviceListId: "LDL-2501",
        termType: "固定租期", start: "2025-01-01", end: "2027-12-31", noticeDays: null,
        monthlyRent: 4200, periods: 36, totalRent: 151200, deposit: 25000,
        paidRent: 21000, paidPeriods: 5, status: "变更待确认",
        repayDay: "每月10日", autoDeduct: false, autoDeductAccountId: null,
        confirmedAt: "2025-01-05", confirmedBy: "绿色出行",
        pendingChange: {
          submittedAt: "2026-06-10 14:00", submittedBy: "华东设备租赁公司",
          effectiveDate: "2026-07-01",
          deviceListId: "LDL-2501", monthlyRent: 4500,
          addDevices: [{ sn: "BAT-SH-1051", type: "电池" }],
          reason: "增配 1 块电池，月租金调整",
          changes: [
            { field: "月租金", from: "¥4,200", to: "¥4,500" },
            { field: "设备清单", from: "LDL-2501：CAB-22050、BAT-SH-1050", to: "LDL-2501：CAB-22050、BAT-SH-1050、BAT-SH-1051" }
          ]
        }
      },
      {
        id: "LC-2502", lessorId: "LEASE-HD", lessorName: ENT.leasing.name,
        lesseeId: "OP-LJZ", lesseeName: "陆家嘴联营",
        deviceListId: "LDL-2502",
        termType: "滚动租期", start: "2025-06-01", end: null, noticeDays: 30,
        monthlyRent: 2800, periods: null, totalRent: null, deposit: 8000,
        paidRent: 33600, paidPeriods: 12, status: "待确认",
        repayDay: "每月15日", autoDeduct: false, autoDeductAccountId: null,
        confirmedAt: null, confirmedBy: null, pendingChange: null
      },
      {
        id: "LC-2603", lessorId: "LEASE-HD", lessorName: ENT.leasing.name,
        lesseeId: "OP-SX", lesseeName: ENT.operator.name,
        deviceListId: "LDL-2601",
        termType: "固定租期", start: "2026-03-01", end: "2028-02-28", noticeDays: null,
        monthlyRent: 1800, periods: 24, totalRent: 43200, deposit: 10000,
        paidRent: 3600, paidPeriods: 2, status: "履约中",
        repayDay: "每月10日", autoDeduct: false, autoDeductAccountId: null,
        confirmedAt: "2026-03-05", confirmedBy: "绿色出行", pendingChange: null
      }
    ];

    const lessorRentReceiveAccount = {
      entityId: "LEASE-HD",
      bankName: "中国工商银行上海分行",
      accountName: "华东设备租赁有限公司",
      accountNo: "1219 0666 0000 3366",
      transferRemark: "附言请填写：协议编号 + 账期（例：LC-2501 2026-06）"
    };

    const FIN_APP_STATUS = ["草稿", "已提交资方", "尽调通过", "已放款", "已归档", "已驳回"];
    const FIN_ASSET_STATUS = ["未入池", "可融资", "包内占选", "申请锁定", "已融资", "已替换", "异常"];
    const FIN_PACKAGE_STATUS = ["草稿", "已生成批次", "已提交", "已放款", "已作废"];

    const financeFinanciers = [
      { id: "LEASE-HD", name: "华东设备租赁公司", operatorIds: ["OP-SX"], contact: "王经理", phone: "138****8801", status: "合作中", remark: "融资租赁放款与还款" }
    ];

    const financeOperatorCredits = [
      {
        id: "FOC-SX-HD", operatorId: "OP-SX", financierId: "LEASE-HD",
        totalLimit: 5000000, usedAmount: 850000, pendingAmount: 60000,
        revolving: false, approvedAt: "2025-01-15", approvedBy: "王经理",
        remark: "批授信线下完成 · 默认非循环（顺丰类客户可改循环）"
      }
    ];

    const financeProjects = [
      {
        id: "FP-2501", operatorId: "OP-SX", financierId: "LEASE-HD", name: "绿色出行换电资产融资项目",
        creditLimit: 5000000, revolving: false, unitRef: 15000, usedAmount: 850000, pendingAmount: 60000,
        operatorCreditId: "FOC-SX-HD", status: "生效中", condition: "柜效≥70%或站点用户数达标后可批量申请放款"
      }
    ];

    const financeAssets = [
      { id: "FA-001", operatorId: "OP-SX", sn: "CAB-22050", type: "换电柜", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "TG-12", deployDate: "2025-03-01", users: 128, cabinetEff: 0.82, income30d: 18600, swaps30d: 420, status: "申请锁定", appId: "FDA-2606-01", packageId: "FAP-2606-01" },
      { id: "FA-002", operatorId: "OP-SX", sn: "BAT-SH-1050", type: "电池", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "48V30Ah", deployDate: "2025-03-01", users: null, cabinetEff: null, income30d: null, swaps30d: null, status: "申请锁定", appId: "FDA-2606-01", packageId: "FAP-2606-01" },
      { id: "FA-003", operatorId: "OP-SX", sn: "CAB-22018", type: "换电柜", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "TG-12", deployDate: "2024-08-15", users: 156, cabinetEff: 0.88, income30d: 22400, swaps30d: 510, status: "包内占选", appId: null, packageId: "FAP-2606-02" },
      { id: "FA-004", operatorId: "OP-SX", sn: "CAB-22019", type: "换电柜", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "TG-12", deployDate: "2024-09-01", users: 142, cabinetEff: 0.79, income30d: 19800, swaps30d: 465, status: "包内占选", appId: null, packageId: "FAP-2606-02" },
      { id: "FA-005", operatorId: "OP-SX", sn: "CAB-22021", type: "换电柜", region: "华东", city: "上海", site: "世博换电服务点", manufacturer: "星源智造", model: "TG-10", deployDate: "2024-11-20", users: 98, cabinetEff: 0.75, income30d: 15200, swaps30d: 340, status: "申请锁定", appId: "FDA-2605-02", packageId: "FAP-2605-02" },
      { id: "FA-006", operatorId: "OP-SX", sn: "CAB-22018-F", type: "换电柜", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "TG-12", deployDate: "2025-01-10", users: 120, cabinetEff: 0.81, income30d: 17500, swaps30d: 390, status: "已融资", appId: "FDA-2603-01", packageId: "FAP-2603-01", loanNoteId: "LN-2603-01" },
      { id: "FA-007", operatorId: "OP-SX", sn: "BAT-SH-1001", type: "电池", region: "华东", city: "上海", site: "浦东骑手驿站", manufacturer: "星源智造", model: "48V30Ah", deployDate: "2025-01-10", users: null, cabinetEff: null, income30d: null, swaps30d: null, status: "已融资", appId: "FDA-2603-01", packageId: "FAP-2603-01", loanNoteId: "LN-2603-01" }
    ];

    const financeAssetPackages = [
      {
        id: "FAP-2606-01", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD",
        name: "浦东站 6 月首批", status: "已提交", applicationId: "FDA-2606-01",
        assetSns: ["CAB-22050", "BAT-SH-1050"], refAmount: 45000,
        regionSummary: "华东 · 上海 · 浦东骑手驿站", remark: "柜+配套电池",
        createdAt: "2026-06-04 16:00", updatedAt: "2026-06-08 10:30"
      },
      {
        id: "FAP-2605-02", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD",
        name: "世博站 5 月包", status: "尽调通过", applicationId: "FDA-2605-02",
        assetSns: ["CAB-22021"], refAmount: 15000,
        regionSummary: "华东 · 上海 · 世博换电服务点", remark: "尽调通过待登记放款",
        createdAt: "2026-05-18 10:00", updatedAt: "2026-05-25 16:00"
      },
      {
        id: "FAP-2606-02", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD",
        name: "浦东站 6 月第二批", status: "已生成批次", applicationId: "FDA-2606-02",
        assetSns: ["CAB-22018", "CAB-22019"], refAmount: 45000,
        regionSummary: "华东 · 上海 · 浦东骑手驿站", remark: "",
        createdAt: "2026-06-10 11:00", updatedAt: "2026-06-10 14:20"
      },
      {
        id: "FAP-2603-01", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD",
        name: "3 月融资包", status: "已放款", applicationId: "FDA-2603-01",
        assetSns: ["CAB-22018-F", "BAT-SH-1001"], refAmount: 30000,
        regionSummary: "华东 · 上海 · 浦东骑手驿站", remark: "",
        createdAt: "2026-02-27 09:00", updatedAt: "2026-03-05 10:00"
      },
      {
        id: "FAP-2606-03", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD",
        name: "世博站待组包", status: "草稿", applicationId: null,
        assetSns: [], refAmount: 0,
        regionSummary: "—", remark: "待选 CAB-22021 等",
        createdAt: "2026-06-12 09:00", updatedAt: "2026-06-12 09:00"
      }
    ];

    const financeApplications = [
      {
        id: "FDA-2606-01", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD", packageId: "FAP-2606-01",
        month: "2026-06", batchNo: 1, status: "已提交资方", requestedAmount: 45000, refAmount: 45000,
        assetSns: ["CAB-22050", "BAT-SH-1050"], regionSummary: "华东 · 上海 · 1 站",
        submittedAt: "2026-06-08 10:30", diligenceAt: null, confirmedAmount: null, confirmNote: null,
        prePlanId: "FPR-2606-01-v1", loanNoteId: null, agreementId: null, createdAt: "2026-06-05 09:00"
      },
      {
        id: "FDA-2605-02", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD", packageId: "FAP-2605-02",
        month: "2026-05", batchNo: 2, status: "尽调通过", requestedAmount: 15000, refAmount: 15000,
        assetSns: ["CAB-22021"], regionSummary: "华东 · 上海 · 1 站",
        submittedAt: "2026-05-20 09:00", diligenceAt: "2026-05-25 16:00", confirmedAmount: 15000,
        confirmNote: "尽调通过：运营数据与标的物符合准入", prePlanId: "FPR-2605-02-v1", loanNoteId: null, agreementId: null,
        createdAt: "2026-05-18 11:00"
      },
      {
        id: "FDA-2606-02", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD", packageId: "FAP-2606-02",
        month: "2026-06", batchNo: 2, status: "草稿", requestedAmount: 45000, refAmount: 45000,
        assetSns: ["CAB-22018", "CAB-22019"], regionSummary: "华东 · 上海 · 1 站",
        submittedAt: null, diligenceAt: null, confirmedAmount: null, confirmNote: null,
        prePlanId: "FPR-2606-02-v1", loanNoteId: null, agreementId: null, createdAt: "2026-06-10 14:20"
      },
      {
        id: "FDA-2603-01", operatorId: "OP-SX", projectId: "FP-2501", financierId: "LEASE-HD", packageId: "FAP-2603-01",
        month: "2026-03", batchNo: 1, status: "已放款", requestedAmount: 30000, refAmount: 30000,
        assetSns: ["CAB-22018-F", "BAT-SH-1001"], regionSummary: "华东 · 上海 · 1 站",
        submittedAt: "2026-03-01 11:00", diligenceAt: "2026-03-03 16:00", confirmedAmount: 30000,
        confirmNote: "尽调通过", prePlanId: "FPR-2603-01-v1", loanNoteId: "LN-2603-01", agreementId: "FLA-202603",
        fundedAt: "2026-03-05", createdAt: "2026-02-28 10:00"
      }
    ];

    const financeAgreements = [
      {
        id: "FLA-202603", agreementNo: "FLA-20260305001", operatorId: "OP-SX", financierId: "LEASE-HD",
        projectId: "FP-2501", applicationId: "FDA-2603-01", loanNoteId: "LN-2603-01",
        deviceSns: ["CAB-22018-F", "BAT-SH-1001"], status: "履约中", signedAt: "2026-03-05",
        remark: "一批次一协议 · 一份还款计划"
      }
    ];

    const financeRepaymentTickets = [
      {
        id: "RT-2606-01", scheduleId: "FRS-003", applicationId: "FDA-2603-01", operatorId: "OP-SX", financierId: "LEASE-HD",
        amount: 5000, payMethod: "对公转账", voucherNote: "2026-06-12 浦发银行转账", status: "待确认",
        submittedAt: "2026-06-12 15:30", confirmedAt: null, confirmedBy: null
      }
    ];

    const financeAssetReplacements = [
      { id: "FAR-001", oldSn: "BAT-SH-0999", newSn: "BAT-SH-1001", reason: "电芯故障换新", replacedAt: "2026-02-20", operatorId: "OP-SX", by: "张经理" }
    ];

    const financePrePlans = [
      {
        id: "FPR-2606-01-v1", applicationId: "FDA-2606-01", version: 1, status: "待确认",
        lines: [
          { term: 1, dueDate: "2026-07-15", principal: 15000, rent: 800, serviceFee: 0 },
          { term: 2, dueDate: "2026-08-15", principal: 15000, rent: 750, serviceFee: 0 },
          { term: 3, dueDate: "2026-09-15", principal: 15000, rent: 700, serviceFee: 0 }
        ]
      },
      {
        id: "FPR-2605-02-v1", applicationId: "FDA-2605-02", version: 1, status: "已确认",
        lines: [
          { term: 1, dueDate: "2026-07-10", principal: 7500, rent: 450, serviceFee: 0 },
          { term: 2, dueDate: "2026-08-10", principal: 7500, rent: 420, serviceFee: 0 }
        ]
      },
      {
        id: "FPR-2606-02-v1", applicationId: "FDA-2606-02", version: 1, status: "草稿",
        lines: [
          { term: 1, dueDate: "2026-08-10", principal: 22500, rent: 900, serviceFee: 0 },
          { term: 2, dueDate: "2026-09-10", principal: 22500, rent: 850, serviceFee: 0 }
        ]
      },
      {
        id: "FPR-2603-01-v1", applicationId: "FDA-2603-01", version: 1, status: "已确认",
        lines: [
          { term: 1, dueDate: "2026-04-10", principal: 10000, rent: 600, serviceFee: 0 },
          { term: 2, dueDate: "2026-05-10", principal: 10000, rent: 550, serviceFee: 0 },
          { term: 3, dueDate: "2026-06-10", principal: 10000, rent: 500, serviceFee: 0 }
        ]
      }
    ];

    const financeLoanNotes = [
      {
        id: "LN-2603-01", applicationId: "FDA-2603-01", operatorId: "OP-SX", financierId: "LEASE-HD",
        projectId: "FP-2501", noteNo: "HZ20260305001", amount: 30000, fundDate: "2026-03-05",
        startDate: "2026-03-05", endDate: "2026-06-10", termMonths: 3, rate: "6.5%", contractNo: "FLC-2026-0305"
      }
    ];

    const financeRepaymentSchedules = [
      { id: "FRS-001", loanNoteId: "LN-2603-01", applicationId: "FDA-2603-01", term: 1, dueDate: "2026-04-10", principal: 10000, rent: 600, serviceFee: 0, dueAmount: 10600, paidAmount: 10600, status: "已还清" },
      { id: "FRS-002", loanNoteId: "LN-2603-01", applicationId: "FDA-2603-01", term: 2, dueDate: "2026-05-10", principal: 10000, rent: 550, serviceFee: 0, dueAmount: 10550, paidAmount: 10550, status: "已还清" },
      { id: "FRS-003", loanNoteId: "LN-2603-01", applicationId: "FDA-2603-01", term: 3, dueDate: "2026-06-10", principal: 10000, rent: 500, serviceFee: 0, dueAmount: 10500, paidAmount: 10500, status: "已还清" }
    ];

    const leaseRentBills = [
      {
        id: "BILL-OP-2506", contractId: "LC-2501", lesseeId: "OP-SX", month: "2026-06",
        dueDate: "2026-06-10", rentAmount: 4200, siteRevenue: 3200, coverGap: 1000,
        status: "待缴纳", payMode: "manual", payChannel: null,
        autoStatus: "2026-06-10 到期未缴（请扫码或对公工单）",
        paidDate: null, paidAmount: 0, manualRequired: true
      },
      {
        id: "BILL-OP-2505", contractId: "LC-2501", lesseeId: "OP-SX", month: "2026-05",
        dueDate: "2026-05-10", rentAmount: 4200, siteRevenue: 4500, coverGap: 0,
        status: "已还清", payMode: "wx", payChannel: "微信扫码",
        autoStatus: "2026-05-10 微信扫码成功 → 资方对公 1219****3366",
        paidDate: "2026-05-10", paidAmount: 4200, manualRequired: false
      },
      {
        id: "BILL-OP-2504", contractId: "LC-2501", lesseeId: "OP-SX", month: "2026-04",
        dueDate: "2026-04-10", rentAmount: 4200, siteRevenue: 4100, coverGap: 100,
        status: "已还清", payMode: "offline", payChannel: "对公转账",
        autoStatus: "2026-04-08 对公到账确认",
        paidDate: "2026-04-08", paidAmount: 4200, manualRequired: false
      },
      {
        id: "BILL-OP-2607", contractId: "LC-2501", lesseeId: "OP-SX", month: "2026-07",
        dueDate: "2026-07-10", rentAmount: 4500, siteRevenue: 0, coverGap: 4500,
        status: "未到期", payMode: null, payChannel: null,
        autoStatus: "变更待确认生效后按 ¥4500 出账",
        paidDate: null, paidAmount: 0, manualRequired: true
      },
      {
        id: "BILL-OP-2603-06", contractId: "LC-2603", lesseeId: "OP-SX", month: "2026-06",
        dueDate: "2026-06-10", rentAmount: 1800, siteRevenue: 2200, coverGap: 0,
        status: "已还清", payMode: "ali", payChannel: "支付宝扫码",
        autoStatus: "2026-06-09 支付宝扫码成功",
        paidDate: "2026-06-09", paidAmount: 1800, manualRequired: false
      },
      {
        id: "BILL-LJZ-2506", contractId: "LC-2502", lesseeId: "OP-LJZ", month: "2026-06",
        dueDate: "2026-06-15", rentAmount: 2800, siteRevenue: 1900, coverGap: 900,
        status: "待缴纳", payMode: "manual", payChannel: null,
        autoStatus: "协议待确认 · 暂按原租金出账",
        paidDate: null, paidAmount: 0, manualRequired: true
      },
    ];

    let leaseRentOfflineTickets = [
      {
        id: "LR-OFF-001", billId: "BILL-OP-2504", contractId: "LC-2501", lesseeId: "OP-SX", lesseeName: "绿色出行",
        lessorId: "LEASE-HD", month: "2026-04", amount: 4200, transferRef: "20260408123456", transferDate: "2026-04-08",
        voucherNote: "4月租金对公", status: "已确认", submitTime: "2026-04-08 11:20",
        confirmTime: "2026-04-08 16:00", confirmedBy: "华东设备租赁公司", rejectReason: null
      }
    ];

    const leaseRepayments = [
      { id: "RP-O2501", contractId: "LC-2501", period: 1, dueDate: "2025-01-10", amount: 4200, status: "已还", paidDate: "2025-01-09", lesseeId: "OP-SX" },
      { id: "RP-O2502", contractId: "LC-2501", period: 2, dueDate: "2025-02-10", amount: 4200, status: "已还", paidDate: "2025-02-10", lesseeId: "OP-SX" },
      { id: "RP-O2503", contractId: "LC-2501", period: 3, dueDate: "2025-03-10", amount: 4200, status: "已还", paidDate: "2025-03-08", lesseeId: "OP-SX" },
      { id: "RP-O2504", contractId: "LC-2501", period: 4, dueDate: "2025-04-10", amount: 4200, status: "已还", paidDate: "2025-04-10", lesseeId: "OP-SX" },
      { id: "RP-O2505", contractId: "LC-2501", period: 5, dueDate: "2026-05-10", amount: 4200, status: "已还", paidDate: "2026-05-09", lesseeId: "OP-SX" },
      { id: "RP-O2506", contractId: "LC-2501", period: 6, dueDate: "2026-06-10", amount: 4200, status: "待还", paidDate: null, lesseeId: "OP-SX" },
      { id: "RP-O2507", contractId: "LC-2501", period: 7, dueDate: "2026-07-10", amount: 4200, status: "未到期", paidDate: null, lesseeId: "OP-SX" }
    ];

    const paymentAccounts = [
      { id: "PA-OP-WX", entityId: "OP-SX", operatorId: "OP-SX", channel: "微信支付", mchName: PAYEE_OPERATOR, mchNo: PAYEE_MCH.wx, purpose: "骑手套餐收款", accountScope: "c_end", status: "已开通", default: true,
        bankAccountName: "上海绿色出行科技有限公司", bankName: "招商银行上海分行营业部", bankAccount: "1219 **** **** 8820", bankCode: "308290003113", corpBoundAt: "2026-01-08" },
      { id: "PA-OP-ALI", entityId: "OP-SX", operatorId: "OP-SX", channel: "支付宝", mchName: PAYEE_OPERATOR, mchNo: PAYEE_MCH.ali, purpose: "骑手套餐收款", accountScope: "c_end", status: "已开通", default: false,
        bankAccountName: "", bankName: "", bankAccount: "", bankCode: "", corpBoundAt: null },
      { id: "PA-OP-RENT", entityId: "OP-SX", operatorId: "OP-SX", channel: "对公转账", mchName: PAYEE_OPERATOR, mchNo: "3100****8821", purpose: "对公转账（租金等）", accountScope: "b2b", status: "已绑定", default: false,
        bankAccountName: "上海绿色出行科技有限公司", bankName: "建设银行浦东分行", bankAccount: "3100 **** **** 8821", bankCode: "105290037017", corpBoundAt: "2026-01-10" },
      { id: "PA-OP-FEE", entityId: "OP-SX", operatorId: "OP-SX", channel: "预存户", mchName: PAYEE_OPERATOR, mchNo: "FEE-PREPAY-001", purpose: "平台服务费预存", accountScope: "internal", status: "已开通", default: false,
        bankAccountName: "", bankName: "", bankAccount: "", bankCode: "", corpBoundAt: null },
      { id: "PA-OP-B2B", entityId: "OP-SX", operatorId: "OP-SX", channel: "对公转账", mchName: PAYEE_OPERATOR, mchNo: "3100****8822", purpose: "渠道批发收款", accountScope: "b2b", status: "已开通", default: false,
        bankAccountName: "上海绿色出行科技有限公司", bankName: "建设银行浦东分行", bankAccount: "3100 **** **** 8822", bankCode: "105290037017", corpBoundAt: "2026-02-01" },
      { id: "PA-LJZ-WX", entityId: "OP-LJZ", operatorId: "OP-LJZ", channel: "微信支付", mchName: "陆家嘴联营", mchNo: "2088999***", purpose: "骑手套餐收款", accountScope: "c_end", status: "已开通", default: true,
        bankAccountName: "上海陆家嘴联营能源有限公司", bankName: "工商银行陆家嘴支行", bankAccount: "1001 **** **** 3344", bankCode: "102290026399", corpBoundAt: "2026-03-01" },
      { id: "PA-LEASE-WX", entityId: "LEASE-HD", channel: "微信支付", mchName: ENT.leasing.name, mchNo: "1900000999***", purpose: "租金收款", status: "已开通", default: true,
        bankAccountName: ENT.leasing.name, bankName: "交通银行上海分行", bankAccount: "3100 **** **** 7788", bankCode: "301290000007", corpBoundAt: "2025-11-01" },
      { id: "PA-LEASE-CORP", entityId: "LEASE-HD", channel: "对公账户", mchName: ENT.leasing.name, mchNo: "1219****3366", purpose: "租金收款（对公入账）", status: "已开通", default: true,
        bankAccountName: ENT.leasing.name, bankName: "交通银行上海分行", bankAccount: "1219 **** **** 3366", bankCode: "301290000007", corpBoundAt: "2025-11-01" },
      { id: "PA-CH-RENT-WX", entityId: "CH-RENT", channel: "微信支付", mchName: "京东物流租赁渠道", mchNo: "1678901234***", purpose: "白名单套餐收款", status: "已开通", default: true,
        bankAccountName: "京东物流（上海）有限公司", bankName: "招商银行上海分行", bankAccount: "7559 **** **** 1001", bankCode: "308290003113", corpBoundAt: "2026-04-01" },
      { id: "PA-CH-RENT-ALI", entityId: "CH-RENT", channel: "支付宝", mchName: "京东物流租赁渠道", mchNo: "2088123456789012", purpose: "白名单套餐收款", status: "已开通", default: false,
        bankAccountName: "", bankName: "", bankAccount: "", bankCode: "", corpBoundAt: null },
      { id: "PA-CH-CARD-WX", entityId: "CH-CARD", channel: "微信支付", mchName: "骑士卡渠道", mchNo: "1678123456***", purpose: "链接购卡佣金分账", accountScope: "commission_split", status: "已开通", default: true,
        bankAccountName: "上海骑士卡网络科技有限公司", bankName: "宁波银行上海分行", bankAccount: "7001 **** **** 5566", bankCode: "313290000017", corpBoundAt: "2026-05-01" },
      { id: "PA-CH-CARD-ALI", entityId: "CH-CARD", channel: "支付宝", mchName: "骑士卡渠道", mchNo: "2088123999***", purpose: "链接购卡佣金分账", accountScope: "commission_split", status: "已开通", default: false,
        bankAccountName: "", bankName: "", bankAccount: "", bankCode: "", corpBoundAt: null }
    ];

    const users = [
      { id: "U1028", phone: "138****1028", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 剩18天", swaps: 42, last: "今日 12:05" },
      { id: "U1041", phone: "139****1041", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 已冻结", swaps: 28, last: "05-20 14:10", deposit: "免押·支付分", serviceState: "已冻结" },
      { id: "U1055", phone: "136****1055", site: "世博换电服务点", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 剩26天 · 待领取电池", swaps: 12, last: "06-11 10:00", serviceState: "服务中", resumePendingPickup: true },
      { id: "U2088", phone: "137****2088", site: "陆家嘴分站", city: "上海", deviceOwnerId: "OP-LJZ", pkg: "中途完结退款中", swaps: 6, last: "05-20 14:10", deposit: "押¥99", serviceState: "中途完结" },
      { id: "U3321", phone: "136****3321", site: "陆家嘴分站", city: "上海", deviceOwnerId: "OP-LJZ", pkg: "次卡 · 剩7次", swaps: 3, last: "05-23 09:50", deposit: "免押·芝麻", serviceState: "服务中" },
      { id: "U2101", phone: "138****2101", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "人天池 · 今日已用", swaps: 1, last: "今日 08:30", poolTeam: "默认团队", poolEligibility: "已确认消耗", poolId: "QP-2601" },
      { id: "U2102", phone: "139****2102", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "人天池 · 今日预占", swaps: 0, last: "—", poolTeam: "默认团队", poolEligibility: "已预占", poolId: "QP-2601" },
      { id: "U2103", phone: "137****2103", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "人天池", serviceState: "不可用", swaps: 0, last: "—", poolTeam: "默认团队", poolEligibility: "预占失败", poolId: "QP-2601", poolFailReason: "余额不足" },
      { id: "U2110", phone: "136****2110", site: "世博换电服务点", city: "上海", deviceOwnerId: "OP-SX", pkg: "人天池 · 今日预占", swaps: 0, last: "—", poolTeam: "世博车队", poolEligibility: "已预占", poolId: "QP-2601" },
      { id: "U2111", phone: "135****2111", site: "世博换电服务点", city: "上海", deviceOwnerId: "OP-SX", pkg: "已离职", swaps: 12, last: "06-07 16:20", poolTeam: "世博车队", poolEligibility: "已回池", poolId: "QP-2601", serviceState: "已离职" },
      { id: "U9001", phone: "135****9001", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "已完结", swaps: 2, last: "06-01 10:00", serviceState: "中途完结" },
      { id: "U2199", phone: "139****2199", site: "世博换电服务点", city: "上海", deviceOwnerId: "OP-SX", pkg: "单次 · 已退", swaps: 0, last: "06-08 16:05", serviceState: "已完结" },
      { id: "U2201", phone: "138****2201", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "7天 · 待退", swaps: 0, last: "06-03 08:00", deposit: "押¥99", serviceState: "服务中" },
      { id: "U2188", phone: "136****2188", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 服务中", swaps: 15, last: "06-12 18:00", deposit: "押¥99", serviceState: "服务中" },
      { id: "U1066", phone: "138****1066", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "中途完结退款中", swaps: 18, last: "06-12 09:00", deposit: "押¥99", serviceState: "中途完结" },
      { id: "U2107", phone: "137****2107", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "1天 · 已完结", swaps: 3, last: "06-06 22:00", serviceState: "已完结" },
      { id: "U3001", phone: "138****3001", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 渠道购卡", swaps: 5, last: "06-11 09:00", channelId: "CH-CARD", serviceState: "服务中" },
      { id: "U-LJZ-01", phone: "137****7702", site: "滨江换电站", city: "上海", deviceOwnerId: "OP-BJ", pkg: "包月 · 剩23天", swaps: 8, last: "06-10 17:00", deposit: "押¥99", serviceState: "服务中" },
      { id: "U2301", phone: "138****2301", site: "浦东骑手驿站", city: "上海", deviceOwnerId: "OP-SX", pkg: "包月 · 服务中", swaps: 8, last: "06-12 08:00", deposit: "押¥99", serviceState: "服务中" }
    ];

    const dayPools = [
      {
        id: "QP-2601", name: "顺丰浦东人天池", ownerId: "CH-SF", ownerName: ENT.channel.name, sellerId: "OP-SX", sellerName: PAYEE_OPERATOR,
        totalDays: 10000, availableDays: 185, frozenDays: 12, consumedDays: 9803, giftedDays: 200, refundedDays: 0, expiredDays: 0,
        validFrom: "2026-01-01", validTo: "2026-12-31", wholesalePrice: 8.5, orderNo: "PO-202601-088",
        status: "余额不足", balancePct: 18.5, warnSms: true, ...POOL_CONTRACT_RULES,
      },
      {
        id: "QP-2602", name: "临时渠道人天池", ownerId: "CH-TEMP", ownerName: "临时渠道", sellerId: "OP-SX", sellerName: PAYEE_OPERATOR,
        totalDays: 2000, availableDays: 1680, frozenDays: 0, consumedDays: 320, giftedDays: 0, refundedDays: 0, expiredDays: 0,
        validFrom: "2026-03-01", validTo: "2026-12-31", wholesalePrice: 8.5, orderNo: "PO-202603-015",
        status: "正常", balancePct: 84, warnSms: false, ...POOL_CONTRACT_RULES,
      },
    ];

    const dayPoolTeams = [
      { id: "TEAM-DEFAULT", channelId: "CH-SF", name: "默认团队", poolId: "QP-2601", isDefault: true, riderCount: 5, status: "启用", createdAt: "2026-01-01", remark: "渠道开户时自动创建并绑定额度池" },
      { id: "TEAM-WB", channelId: "CH-SF", name: "世博车队", poolId: "QP-2601", isDefault: false, riderCount: 1, status: "启用", createdAt: "2026-06-01", remark: "共享闪送主池 QP-2601" },
    ];

    /* decision-062：不再维护团队周期额度上限；保留空数组以免历史引用报错 */
    const dayPoolRules = [];

    const dayPoolRiders = [
      { id: "U2101", name: "王骑手", phone: "138****2101", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 30, usedDays: 12, remainingDays: 18, quotaStatus: "使用中", todayEligibility: "已确认消耗", todaySwaps: 1, batteryHeld: 1, ruleId: "RULE-01" },
      { id: "U2102", name: "李骑手", phone: "139****2102", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 30, usedDays: 8, remainingDays: 22, quotaStatus: "使用中", todayEligibility: "已预占", todaySwaps: 0, batteryHeld: 0, ruleId: "RULE-01" },
      { id: "U2103", name: "赵骑手", phone: "137****2103", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 0, usedDays: 0, remainingDays: 0, quotaStatus: "未分配", todayEligibility: "待还电", todaySwaps: 0, batteryHeld: 1, ruleId: "RULE-01", failReason: "余额不足", gateReason: "预占失败" },
      { id: "U2104", name: "钱骑手", phone: "136****2104", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 0, usedDays: 0, remainingDays: 0, quotaStatus: "未分配", todayEligibility: "预占失败", todaySwaps: 0, batteryHeld: 0, ruleId: "RULE-01", failReason: "余额不足", gateReason: "预占失败" },
      { id: "U2110", name: "孙骑手", phone: "136****2110", teamId: "TEAM-WB", team: "世博车队", poolId: "QP-2601", site: "世博换电服务点", city: "上海", status: "在职", allocatedDays: 15, usedDays: 2, remainingDays: 13, quotaStatus: "使用中", todayEligibility: "已预占", todaySwaps: 0, batteryHeld: 0, ruleId: "RULE-02" },
      { id: "U2106", name: "陈骑手", phone: "135****2106", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 30, usedDays: 10, remainingDays: 20, quotaStatus: "使用中", todayEligibility: "已确认消耗", todaySwaps: 0, batteryHeld: 1, ruleId: "RULE-01", confirmReason: "持电池" },
      { id: "U2112", name: "吴骑手", phone: "134****2112", teamId: "TEAM-DEFAULT", team: "默认团队", poolId: "QP-2601", site: "浦东骑手驿站", city: "上海", status: "在职", allocatedDays: 30, usedDays: 30, remainingDays: 0, quotaStatus: "已用尽", todayEligibility: "待还电", todaySwaps: 0, batteryHeld: 1, ruleId: "RULE-01", gateReason: "个人无额度", holdNote: "昨日确认消耗后额度用尽，仍持电池" },
      { id: "U2111", name: "周骑手", phone: "135****2111", teamId: "TEAM-WB", team: "世博车队", poolId: "QP-2601", site: "世博换电服务点", city: "上海", status: "离职", allocatedDays: 30, usedDays: 12, remainingDays: 0, quotaStatus: "已收回", todayEligibility: "已回池", todaySwaps: 0, batteryHeld: 0, ruleId: "RULE-02", recycledDays: 18 }
    ];

    const dayPoolAllocationLogs = [
      { id: "AL-001", poolId: "QP-2601", riderId: "U2101", riderName: "王骑手", type: "分配", days: 30, time: "2026-05-01 10:00", operator: "渠道商管理员", poolBalanceAfter: 9970, remark: "月度额度" },
      { id: "AL-002", poolId: "QP-2601", riderId: "U2102", riderName: "李骑手", type: "分配", days: 30, time: "2026-05-01 10:05", operator: "渠道商管理员", poolBalanceAfter: 9940, remark: "月度额度" },
      { id: "AL-003", poolId: "QP-2601", riderId: "U2110", riderName: "孙骑手", type: "分配", days: 15, time: "2026-05-15 14:00", operator: "渠道商管理员", poolBalanceAfter: 9925, remark: "世博车队 · 月度额度" },
      { id: "AL-004", poolId: "QP-2601", riderId: "U2111", riderName: "周骑手", type: "收回", days: 18, time: "2026-06-07 16:20", operator: "渠道商管理员", poolBalanceAfter: 227, remark: "离职收回未用人天" },
      { id: "AL-005", poolId: "QP-2601", riderId: "U2101", riderName: "王骑手", type: "消耗", days: 1, time: "2026-06-09 08:30", operator: "系统", poolBalanceAfter: 185, remark: "当日首次换电确认" }
    ];

    const dayPoolDailyConsume = [
      { date: "2026-06-09", poolId: "QP-2601", team: "默认团队", city: "上海", site: "浦东骑手驿站", qualified: 5, reserved: 5, confirmed: 2, released: 0, swapUsers: 1, swapCount: 1, batteryOnlyUsers: 1, unreleased: 3 },
      { date: "2026-06-08", poolId: "QP-2601", team: "默认团队", city: "上海", site: "浦东骑手驿站", qualified: 5, reserved: 5, confirmed: 3, released: 2, swapUsers: 2, swapCount: 3, batteryOnlyUsers: 1, unreleased: 0 },
      { date: "2026-06-09", poolId: "QP-2601", team: "世博车队", city: "上海", site: "世博换电服务点", qualified: 1, reserved: 1, confirmed: 0, released: 0, swapUsers: 0, swapCount: 0, batteryOnlyUsers: 0, unreleased: 1 }
    ];

    const dayPoolRiderDailyConsume = [
      { id: "DC-0609-01", date: "2026-06-09", poolId: "QP-2601", riderId: "U2101", riderName: "王骑手", team: "默认团队", site: "浦东骑手驿站", swapCount: 1, batteryHeld: 1, confirmedDays: 1, confirmReason: "换电", status: "已确认" },
      { id: "DC-0609-02", date: "2026-06-09", poolId: "QP-2601", riderId: "U2106", riderName: "陈骑手", team: "默认团队", site: "浦东骑手驿站", swapCount: 0, batteryHeld: 1, confirmedDays: 1, confirmReason: "持电池", status: "已确认" },
      { id: "DC-0609-03", date: "2026-06-09", poolId: "QP-2601", riderId: "U2102", riderName: "李骑手", team: "默认团队", site: "浦东骑手驿站", swapCount: 0, batteryHeld: 0, confirmedDays: 0, confirmReason: "—", status: "已预占" },
      { id: "DC-0608-01", date: "2026-06-08", poolId: "QP-2601", riderId: "U2101", riderName: "王骑手", team: "默认团队", site: "浦东骑手驿站", swapCount: 2, batteryHeld: 1, confirmedDays: 1, confirmReason: "换电", status: "已确认" }
    ];

    const channelRiderSwapSync = [
      { id: "CS-001", swapId: "SW2606090830", poolId: "QP-2601", riderId: "U2101", riderName: "王骑手", team: "默认团队", site: "浦东骑手驿站", city: "上海", time: "2026-06-09 08:30", status: "成功", syncedAt: "2026-06-09 08:30:02" },
      { id: "CS-002", swapId: "SW2606091430", poolId: "QP-2601", riderId: "U2110", riderName: "孙骑手", team: "世博车队", site: "世博换电服务点", city: "上海", time: "2026-06-09 14:30", status: "成功", syncedAt: "2026-06-09 14:30:01" },
      { id: "CS-003", swapId: "SW-CHANNEL-CROSS", poolId: "QP-2601", riderId: "U2088", riderName: "王骑手", team: "默认团队", site: "滨江换电站", city: "上海", time: "2026-06-09 17:20", status: "成功", syncedAt: "2026-06-09 17:20:01", crossNet: true }
    ];

    const dayPoolRetailPrices = [
      { id: "RP-01", poolId: "QP-2601", city: "上海", pkg: "包月30天", retailPrice: 299, wholesalePrice: 8.5, status: "生效", updatedAt: "2026-05-01" },
      { id: "RP-03", poolId: "QP-2601", city: "上海", pkg: "次卡10次", retailPrice: 89, wholesalePrice: 8.5, status: "生效", updatedAt: "2026-04-15" },
      { id: "RP-04", poolId: "QP-2601", city: "上海", pkg: "1天套餐", retailPrice: 29, wholesalePrice: 8.5, validityHours: 24, status: "生效", updatedAt: "2026-06-01" },
      { id: "RP-05", poolId: "QP-2601", city: "上海", pkg: "单次换电", retailPrice: 9.9, wholesalePrice: 8.5, validityHours: 24, status: "生效", updatedAt: "2026-06-01" }
    ];

    const dayPoolExceptions = [
      { id: "EX-0609-01", poolId: "QP-2601", type: "预占失败", reason: "余额不足", batchDate: "2026-06-09", affected: 2, status: "待重试", retrySource: "—", detail: "需 12 人天，可用仅 9 人天（演示：整批失败）" },
      { id: "EX-0608-02", poolId: "QP-2601", type: "支付退款待处理", reason: "人工处理", batchDate: "2026-06-08", affected: 1, status: "待处理", retrySource: "—", detail: "骑手自费订单 RC-POOL-088 退款，资格/额度不自动回退" },
      { id: "EX-0607-03", poolId: "QP-2601", type: "用户冲突", reason: "多团队", batchDate: "2026-06-07", affected: 1, status: "已拒绝", retrySource: "—", detail: "导入 U2199 已属于其他团队" }
    ];

    const dayPoolLedger = [
      { id: "LG-001", poolId: "QP-2601", time: "2026-01-05 10:00", type: "购买入账", deltaDays: 10000, balanceAfter: 10000, operator: PAYEE_OPERATOR, ref: "PO-202601-088", reason: "向运营商批发采购" },
      { id: "LG-002", poolId: "QP-2601", time: "2026-02-01 09:00", type: "赠送入账", deltaDays: 200, balanceAfter: 10200, operator: PAYEE_OPERATOR, ref: "—", reason: "运营商活动赠送" },
      { id: "LG-T01", poolId: "QP-2602", time: "2026-03-05 11:00", type: "购买入账", deltaDays: 2000, balanceAfter: 2000, operator: PAYEE_OPERATOR, ref: "PO-202603-015", reason: "临时渠道首批采购" },
      { id: "LG-003", poolId: "QP-2601", time: "2026-06-09 00:00", type: "用户资格预占", deltaDays: -12, balanceAfter: 197, operator: "系统", ref: "RULE-01", reason: "顺丰浦东 12 人预占" },
      { id: "LG-004", poolId: "QP-2601", time: "2026-06-09 08:30", type: "预占确认消耗", deltaDays: 0, balanceAfter: 185, operator: "系统", ref: "U2101", reason: "换电确认 1 人天" },
      { id: "LG-004b", poolId: "QP-2601", time: "2026-06-09 12:00", type: "预占确认消耗", deltaDays: 0, balanceAfter: 184, operator: "系统", ref: "U2106", reason: "持电池确认 1 人天（当日无换电）" },
      { id: "LG-T02", poolId: "QP-2602", time: "2026-06-09 00:00", type: "用户资格预占", deltaDays: -20, balanceAfter: 1680, operator: "系统", ref: "—", reason: "临时渠道 20 人预占" },
      { id: "LG-T03", poolId: "QP-2602", time: "2026-06-08 18:00", type: "预占确认消耗", deltaDays: 0, balanceAfter: 1700, operator: "系统", ref: "U-TEMP-01", reason: "换电确认 1 人天" },
      { id: "LG-005", poolId: "QP-2601", time: "2026-06-08 23:59", type: "预占释放", deltaDays: 3, balanceAfter: 209, operator: "系统", ref: "RULE-01", reason: "3 人未换电日终释放" },
      { id: "LG-006", poolId: "QP-2601", time: "2026-06-07 16:20", type: "回池", deltaDays: 18, balanceAfter: 227, operator: "系统", ref: "U2111", reason: "离职回池 resign" },
      { id: "LG-007", poolId: "QP-2601", time: "2026-05-20 15:00", type: "退款", deltaDays: -500, balanceAfter: 9500, operator: PAYEE_OPERATOR, ref: "协商单 REF-0520", reason: "运营商协商扣减未使用购买额度（线下已退款）" },
      { id: "LG-T04", poolId: "QP-2602", time: "2026-05-12 10:30", type: "购买入账", deltaDays: 0, balanceAfter: 2000, operator: PAYEE_OPERATOR, ref: "PO-202603-015", reason: "确认到账入账完成" }
    ];

    const channelContracts = [
      { id: "CC-SF-01", channelId: "CH-SF", channelName: "顺丰同城渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "人天池", wholesalePrice: 8.5, minDays: 1000, sites: ["浦东骑手驿站", "世博换电服务点"], status: "启用", validFrom: "2026-01-01", validTo: "2026-12-31" },
      { id: "CC-TEMP-01", channelId: "CH-TEMP", channelName: "临时渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "人天池", wholesalePrice: 8.5, minDays: 500, sites: ["浦东骑手驿站"], status: "启用", validFrom: "2026-03-01", validTo: "2026-12-31" },
      { id: "CC-CARD-01", channelId: "CH-CARD", channelName: "骑士卡渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "卡差价", wholesalePrice: 249, minDays: null, cardSkus: ["SKU-30D", "SKU-7D"], sites: ["浦东骑手驿站", "世博换电服务点", "陆家嘴分站"], status: "启用", validFrom: "2026-03-01", validTo: "2027-02-28", instantCommissionPayout: true, commissionRate: 0.09, instantCommissionEnabledAt: "2026-05-01" },
      { id: "CC-DELIV-01", channelId: "CH-DELIV", channelName: "闪送骑士卡", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "卡差价", wholesalePrice: 235, minDays: null, cardSkus: ["SKU-DEL-30D", "SKU-DEL-7D"], sites: ["浦东骑手驿站", "世博换电服务点"], status: "启用", validFrom: "2026-04-01", validTo: "2027-03-31", instantCommissionPayout: false, commissionRate: null },
      { id: "CC-RENT-01", channelId: "CH-RENT", channelName: "京东物流租赁渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "设备租赁", wholesalePrice: null, minDays: null, monthlyRent: 12000, dedicatedSiteId: "ST-SH-JD", dedicatedSiteName: "京东物流专属站", whitelistCount: 50, whitelistDefaultAccess: "paid", billingStatus: "6月已缴", crossNetworkEnabled: true, crossNetworkDepositPaid: true, crossNetworkDepositAmount: 20000, status: "启用", validFrom: "2026-04-01", validTo: "2027-03-31" },
      { id: "CC-ACT-01", channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, operatorLogo: "⚡", settlementMode: "激活码", wholesalePrice: 255, minDays: null, minCodes: 100, codeSkuName: "30天包月", codeValidityDays: 30, codeInventory: 420, codesRedeemed: 86, status: "启用", validFrom: "2026-05-01", validTo: "2027-04-30" }
    ];

    const channelSettlementModes = [
      { id: "CSM-DAY", channelId: "CH-SF", mode: "人天池", status: "启用", desc: "向签约运营商采购人天额度，换电或持电池均扣天", wholesalePrice: 8.5, poolId: "QP-2601", activeRiders: 6 },
      { id: "CSM-CARD", channelId: "CH-CARD", mode: "卡差价", status: "启用", desc: "推广链接分销 · 用户直购 · 佣金即时分账", cardSku: "包月30天卡", officialPrice: 299, channelPrice: 279, commissionPerOrder: 25, commissionRate: 0.09, instantCommissionPayout: true, linkOrders: 85, monthCommission: 2125, linkClicks: 3420 },
      { id: "CSM-DELIV", channelId: "CH-DELIV", mode: "卡差价", status: "启用", desc: "推广链接分销 · 用户直购 · 佣金结算", cardSku: "包月30天卡", officialPrice: 299, channelPrice: 269, commissionPerOrder: 30, linkOrders: 38, monthCommission: 1140, linkClicks: 980 },
      { id: "CSM-RENT", channelId: "CH-RENT", mode: "设备租赁", status: "启用", desc: "租赁设备+月租 · 白名单免费/付费 · 可跨网", monthlyRent: 12000, devicesCovered: 8, whitelistCount: 50, dedicatedSite: "京东物流专属站", billingStatus: "6月已缴", nextDue: "2026-07-01", monthSwaps: 428, pkgOrdersMonth: 12, crossNetworkEnabled: true },
      { id: "CSM-ACT", channelId: "CH-ACT", mode: "激活码", status: "启用", desc: "批发激活码 · 骑手核销获套餐 · 不经平台收款", codeSkuName: "30天包月", wholesalePrice: 255, codeValidityDays: 30, codeInventory: 420, codesRedeemed: 86, codesIssued: 320, monthRedemptions: 42 }
    ];

    const channelActivationOrders = [
      { id: "AC-202605-001", channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR,
        skuName: "30天包月码", qty: 500, unitPrice: 255, amount: 127500, validityDays: 30,
        payChannel: "offline", payMethod: "对公转账", orderStatus: "已完成", payStatus: "已付款",
        createdAt: "2026-05-08 10:00", payTime: "2026-05-09 11:30", confirmedBy: "张经理", confirmedAt: "2026-05-09 11:30",
        codesMinted: 500, mintStatus: "已发码" },
      { id: "AC-202605-003", channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR,
        skuName: "7天体验码", qty: 50, unitPrice: 65, amount: 3250, validityDays: 7,
        payChannel: "offline", payMethod: "对公转账", orderStatus: "已完成", payStatus: "已付款",
        createdAt: "2026-05-20 14:00", payTime: "2026-05-21 10:00", confirmedBy: "张经理", confirmedAt: "2026-05-21 10:00",
        codesMinted: 50, mintStatus: "已发码" },
      { id: "AC-202606-002", channelId: "CH-ACT", channelName: "蜂鸟激活码渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR,
        skuName: "7天体验码", qty: 20, unitPrice: 65, amount: 1300, validityDays: 7,
        payChannel: "offline", payMethod: "对公转账", orderStatus: "待确认到账", payStatus: "待付款",
        createdAt: "2026-06-11 09:20", payTime: null, offlineVoucher: "凭证已上传", confirmedBy: null, confirmedAt: null,
        codesMinted: 0, mintStatus: "未发码" }
    ];

    /* 演示样本：完整 500/50 张不落库，仅展示代表性码；确认待确认单 AC-202606-002 时会按 qty 全量造码 */
    const channelActivationCodes = [
      { id: "CODE-001", channelId: "CH-ACT", code: "FN30-A8K2-M9P7", serialNo: 1, skuName: "30天包月", validityDays: 30, wholesalePrice: 255, status: "已核销", batchId: "AC-202605-001", issuedTo: "骑手A", issuedAt: "2026-06-01 10:00", redeemedAt: "2026-06-10 09:30", redeemedBy: "138****5001", userId: "U-ACT-01", pkgOrderId: "SUB-ACT-001" },
      { id: "CODE-002", channelId: "CH-ACT", code: "FN30-B3L8-N2Q4", serialNo: 2, skuName: "30天包月", validityDays: 30, wholesalePrice: 255, status: "已发放", batchId: "AC-202605-001", issuedTo: "地推批次-06", issuedAt: "2026-06-05 15:20", redeemedAt: null, redeemedBy: null, userId: null, pkgOrderId: null },
      { id: "CODE-003", channelId: "CH-ACT", code: "FN30-C5M1-P8R6", serialNo: 3, skuName: "30天包月", validityDays: 30, wholesalePrice: 255, status: "未发放", batchId: "AC-202605-001", issuedTo: null, issuedAt: null, redeemedAt: null, redeemedBy: null, userId: null, pkgOrderId: null },
      { id: "CODE-004", channelId: "CH-ACT", code: "FN7D-D2N9-Q1S3", serialNo: 1, skuName: "7天体验", validityDays: 7, wholesalePrice: 65, status: "已核销", batchId: "AC-202605-003", issuedTo: "试用活动", issuedAt: "2026-05-22 09:00", redeemedAt: "2026-06-08 14:20", redeemedBy: "139****5002", userId: "U-ACT-02", pkgOrderId: "SUB-ACT-002" },
      { id: "CODE-005", channelId: "CH-ACT", code: "FN30-E7P4-R5T8", serialNo: 4, skuName: "30天包月", validityDays: 30, wholesalePrice: 255, status: "已作废", batchId: "AC-202605-001", issuedTo: "—", issuedAt: null, redeemedAt: null, redeemedBy: null, userId: null, pkgOrderId: null, voidReason: "印刷错误", voidRequestedAt: "2026-06-02 11:00", voidRequestedBy: "蜂鸟激活码渠道", voidConfirmedAt: "2026-06-02 16:00", voidConfirmedBy: "张经理" },
      { id: "CODE-006", channelId: "CH-ACT", code: "FN30-F1Q6-S2U9", serialNo: 5, skuName: "30天包月", validityDays: 30, wholesalePrice: 255, status: "待作废", batchId: "AC-202605-001", issuedTo: null, issuedAt: null, redeemedAt: null, redeemedBy: null, userId: null, pkgOrderId: null, voidReason: "地推物料作废未发出", voidRequestedAt: "2026-06-12 10:30", voidRequestedBy: "蜂鸟激活码渠道", voidConfirmedAt: null, voidConfirmedBy: null }
    ];

    const channelSalePackages = [
      { id: "PKG-30D", channelId: "CH-CARD", skuId: "SKU-30D", name: "包月30天卡", officialPrice: 299, channelPrice: 279, commissionPerOrder: 25, validityDays: 30, status: "启用" },
      { id: "PKG-7D", channelId: "CH-CARD", skuId: "SKU-7D", name: "7天卡", officialPrice: 89, channelPrice: 79, commissionPerOrder: 8, validityDays: 7, status: "启用" },
      { id: "PKG-DEL-30D", channelId: "CH-DELIV", skuId: "SKU-DEL-30D", name: "包月30天卡", officialPrice: 299, channelPrice: 269, commissionPerOrder: 30, validityDays: 30, status: "启用" },
      { id: "PKG-DEL-7D", channelId: "CH-DELIV", skuId: "SKU-DEL-7D", name: "7天卡", officialPrice: 89, channelPrice: 75, commissionPerOrder: 7, validityDays: 7, status: "启用" }
    ];
    const channelLinkSkus = channelSalePackages;

    const channelPromoLinks = [
      { id: "LNK-C001", channelId: "CH-CARD", packageId: "PKG-30D", skuId: "SKU-30D", purpose: "App 首页 Banner", linkCode: "qsk-30d-home", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-CARD&sku=SKU-30D&lnk=qsk-30d-home", clicks: 820, conversions: 28, status: "启用", createdAt: "2026-03-01" },
      { id: "LNK-C002", channelId: "CH-CARD", packageId: "PKG-30D", skuId: "SKU-30D", purpose: "短信召回活动", linkCode: "qsk-30d-sms", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-CARD&sku=SKU-30D&lnk=qsk-30d-sms", clicks: 560, conversions: 18, status: "启用", createdAt: "2026-04-15" },
      { id: "LNK-C003", channelId: "CH-CARD", packageId: "PKG-30D", skuId: "SKU-30D", purpose: "社群福利帖", linkCode: "qsk-30d-wx", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-CARD&sku=SKU-30D&lnk=qsk-30d-wx", clicks: 800, conversions: 16, status: "启用", createdAt: "2026-05-20" },
      { id: "LNK-C004", channelId: "CH-CARD", packageId: "PKG-7D", skuId: "SKU-7D", purpose: "新客试用入口", linkCode: "qsk-7d-trial", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-CARD&sku=SKU-7D&lnk=qsk-7d-trial", clicks: 1240, conversions: 23, status: "启用", createdAt: "2026-03-01" },
      { id: "LNK-D001", channelId: "CH-DELIV", packageId: "PKG-DEL-30D", skuId: "SKU-DEL-30D", purpose: "闪送 App 内嵌", linkCode: "ssk-30d-app", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-DELIV&sku=SKU-DEL-30D&lnk=ssk-30d-app", clicks: 680, conversions: 28, status: "启用", createdAt: "2026-04-01" },
      { id: "LNK-D002", channelId: "CH-DELIV", packageId: "PKG-DEL-7D", skuId: "SKU-DEL-7D", purpose: "地推扫码", linkCode: "ssk-7d-qr", linkUrl: "wxmp://OP-SX/pages/landing/index?op=OP-SX&ch=CH-DELIV&sku=SKU-DEL-7D&lnk=ssk-7d-qr", clicks: 300, conversions: 10, status: "启用", createdAt: "2026-05-01" }
    ];
    const channelCardSkus = channelSalePackages;

    const channelLinkOrders = [
      { id: "LO-260501", channelId: "CH-CARD", linkId: "LNK-C001", linkPurpose: "App 首页 Banner", linkCode: "qsk-30d-home", skuId: "SKU-30D", riderName: "骑手M1", phone: "138****2101", userId: "U-L101", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-05-03 10:12", status: "已清分", platformFee: 2.79, operatorNet: 251.1, pkgValidTo: "2026-06-03" },
      { id: "LO-260515", channelId: "CH-CARD", linkId: "LNK-C002", linkPurpose: "短信召回活动", linkCode: "qsk-30d-sms", skuId: "SKU-30D", riderName: "骑手M2", phone: "139****2102", userId: "U-L102", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-05-15 14:20", status: "已清分", platformFee: 2.79, operatorNet: 251.1, pkgValidTo: "2026-06-15" },
      { id: "LO-260520", channelId: "CH-CARD", linkId: "LNK-C004", linkPurpose: "新客试用入口", linkCode: "qsk-7d-trial", skuId: "SKU-7D", riderName: "骑手M3", phone: "137****2103", userId: "U-L103", skuName: "7天卡", officialPrice: 89, paidPrice: 79, commission: 7.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-05-20 08:05", status: "已清分", platformFee: 0.79, operatorNet: 71.1, pkgValidTo: "2026-05-27" },
      { id: "LO-260601", channelId: "CH-CARD", linkId: "LNK-C001", linkPurpose: "App 首页 Banner", linkCode: "qsk-30d-home", skuId: "SKU-30D", riderName: "骑手A", phone: "138****2001", userId: "U-L001", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-06-01 09:12", status: "已清分", platformFee: 2.79, operatorNet: 251.1, pkgValidTo: "2026-07-01" },
      { id: "LO-260605", channelId: "CH-CARD", linkId: "LNK-C002", linkPurpose: "短信召回活动", linkCode: "qsk-30d-sms", skuId: "SKU-30D", riderName: "骑手B", phone: "139****2002", userId: "U-L002", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-06-05 14:20", status: "已清分", platformFee: 2.79, operatorNet: 251.1, pkgValidTo: "2026-07-05" },
      { id: "LO-260608", channelId: "CH-CARD", linkId: "LNK-C004", linkPurpose: "新客试用入口", linkCode: "qsk-7d-trial", skuId: "SKU-7D", riderName: "骑手C", phone: "137****2003", userId: "U-L003", skuName: "7天卡", officialPrice: 89, paidPrice: 79, commission: 7.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-06-08 08:05", status: "已清分", platformFee: 0.79, operatorNet: 71.1, pkgValidTo: "2026-06-15" },
      { id: "LO-260610", channelId: "CH-CARD", linkId: "LNK-C003", linkPurpose: "社群福利帖", linkCode: "qsk-30d-wx", skuId: "SKU-30D", riderName: "刘骑士", phone: "138****3001", userId: "U3001", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25.11, commissionRate: 0.09, commissionSettlement: "即时分账", channelTagged: true, payTime: "2026-06-10 16:30", status: "已清分", platformFee: 2.79, operatorNet: 251.1, pkgValidTo: "2026-07-10" },
      { id: "LO-260612", channelId: "CH-CARD", linkId: "LNK-C002", linkPurpose: "短信召回活动", linkCode: "qsk-30d-sms", skuId: "SKU-30D", riderName: "骑手D", phone: "136****2004", userId: "U-L004", skuName: "包月30天卡", officialPrice: 299, paidPrice: 279, commission: 25, commissionRate: null, commissionSettlement: "线下待结", channelTagged: true, payTime: "2026-06-12 11:08", status: "已清分", platformFee: 2.79, operatorNet: 251.21, pkgValidTo: "2026-07-12" },
      { id: "LO-260611", channelId: "CH-DELIV", linkId: "LNK-D001", linkPurpose: "闪送 App 内嵌", linkCode: "ssk-30d-app", skuId: "SKU-DEL-30D", riderName: "闪送骑手D", phone: "136****4001", userId: "U-D001", skuName: "包月30天卡", officialPrice: 299, paidPrice: 269, commission: 30, commissionSettlement: "线下待结", channelTagged: true, payTime: "2026-06-11 10:00", status: "已清分", platformFee: 2.69, operatorNet: 266.31, pkgValidTo: "2026-07-11" }
    ];
    const channelCardRetailOrders = channelLinkOrders;

    const platformMarketingCampaigns = [
      {
        id: "CMP-2607-01", name: "暑期拉新", startAt: "2026-07-01", endAt: "2026-08-31", status: "进行中",
        skuPrices: [
          { skuId: "SKU-30D", skuName: "包月30天卡", officialPrice: 299, couponAmount: 40, activityPrice: 259 },
          { skuId: "SKU-7D", skuName: "7天卡", officialPrice: 89, couponAmount: 14, activityPrice: 75 }
        ]
      }
    ];

    const platformMarketingAgreements = [
      { id: "PMA-SX-01", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, campaignId: "CMP-2607-01", campaignName: "暑期拉新", skuId: "SKU-30D", skuName: "包月30天卡", marketingServiceFee: 25, status: "已启用", confirmedAt: "2026-06-28" },
      { id: "PMA-SX-02", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, campaignId: "CMP-2607-01", campaignName: "暑期拉新", skuId: "SKU-7D", skuName: "7天卡", marketingServiceFee: 8, status: "已启用", confirmedAt: "2026-06-28" },
      { id: "PMA-LJZ-01", operatorId: "OP-LJZ", operatorName: "陆家嘴联营", campaignId: "CMP-2607-01", campaignName: "暑期拉新", skuId: "SKU-30D", skuName: "包月30天卡", marketingServiceFee: 28, status: "待确认", confirmedAt: null }
    ];

    const platformMarketingLinks = [
      { id: "LNK-P001", campaignId: "CMP-2607-01", channelId: "PLATFORM", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, packageId: "PKG-30D", skuId: "SKU-30D", purpose: "抖音·绿色出行", linkCode: "plt-sx-30d", linkUrl: "wxmp://brand/pages/landing/index?ch=PLATFORM&campaign=CMP-2607-01&sku=SKU-30D&op=OP-SX&lnk=plt-sx-30d", clicks: 4280, conversions: 62, status: "启用", createdAt: "2026-07-01" },
      { id: "LNK-P002", campaignId: "CMP-2607-01", channelId: "PLATFORM", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, packageId: "PKG-30D", skuId: "SKU-30D", purpose: "地铁灯箱·绿色出行", linkCode: "plt-sx-metro", linkUrl: "wxmp://brand/pages/landing/index?ch=PLATFORM&campaign=CMP-2607-01&sku=SKU-30D&op=OP-SX&lnk=plt-sx-metro", clicks: 1560, conversions: 18, status: "启用", createdAt: "2026-07-02" },
      { id: "LNK-P003", campaignId: "CMP-2607-01", channelId: "PLATFORM", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, packageId: "PKG-7D", skuId: "SKU-7D", purpose: "短信试用·绿色出行", linkCode: "plt-sx-7d", linkUrl: "wxmp://brand/pages/landing/index?ch=PLATFORM&campaign=CMP-2607-01&sku=SKU-7D&op=OP-SX&lnk=plt-sx-7d", clicks: 890, conversions: 11, status: "启用", createdAt: "2026-07-01" }
    ];

    const platformMarketingOrders = [
      {
        id: "PMO-26061201", channelId: "PLATFORM", campaignId: "CMP-2607-01", linkCode: "plt-sx-30d", linkPurpose: "抖音·绿色出行",
        skuId: "SKU-30D", riderName: "周骑手", phone: "138****5101", userId: "U-P501", skuName: "包月30天卡",
        officialPrice: 299, couponAmount: 40, couponId: "CPN-SUMMER-40", paidPrice: 259, platformFee: 2.59, marketingServiceFee: 25,
        paymentArchitecture: "operator_collect", lockedOperatorId: "OP-SX", lockedOperatorName: PAYEE_OPERATOR,
        payTime: "2026-06-12 09:30", status: "服务中", refundStatus: null, pkgValidTo: "2026-07-12"
      },
      {
        id: "PMO-26061101", channelId: "PLATFORM", campaignId: "CMP-2607-01", linkCode: "plt-sx-metro", linkPurpose: "地铁灯箱·绿色出行",
        skuId: "SKU-30D", riderName: "吴骑手", phone: "139****5102", userId: "U-P502", skuName: "包月30天卡",
        officialPrice: 299, couponAmount: 40, couponId: "CPN-SUMMER-40", paidPrice: 259, platformFee: 2.59, marketingServiceFee: 25,
        paymentArchitecture: "operator_collect", lockedOperatorId: "OP-SX", lockedOperatorName: PAYEE_OPERATOR,
        payTime: "2026-06-11 10:05", status: "服务中", refundStatus: null, pkgValidTo: "2026-07-11"
      },
      {
        id: "PMO-26061001", channelId: "PLATFORM", campaignId: "CMP-2607-01", linkCode: "plt-sx-30d", linkPurpose: "抖音·绿色出行",
        skuId: "SKU-30D", riderName: "郑骑手", phone: "137****5103", userId: "U-P503", skuName: "包月30天卡",
        officialPrice: 299, couponAmount: 40, couponId: "CPN-SUMMER-40", paidPrice: 259, platformFee: 2.59, marketingServiceFee: 25,
        paymentArchitecture: "operator_collect", lockedOperatorId: "OP-SX", lockedOperatorName: PAYEE_OPERATOR,
        payTime: "2026-06-10 11:20", status: "服务中", refundStatus: null, pkgValidTo: "2026-07-10"
      },
      {
        id: "PMO-26060901", channelId: "PLATFORM", campaignId: "CMP-2607-01", linkCode: "plt-sx-7d", linkPurpose: "短信试用·绿色出行",
        skuId: "SKU-7D", riderName: "冯骑手", phone: "136****5104", userId: "U-P504", skuName: "7天卡",
        officialPrice: 89, couponAmount: 14, couponId: "CPN-SUMMER-14", paidPrice: 75, platformFee: 0.75, marketingServiceFee: 8,
        paymentArchitecture: "operator_collect", lockedOperatorId: "OP-SX", lockedOperatorName: PAYEE_OPERATOR,
        payTime: "2026-06-09 07:50", status: "服务中", refundStatus: null, pkgValidTo: "2026-06-16"
      },
      {
        id: "PMO-26060801", channelId: "PLATFORM", campaignId: "CMP-2607-01", linkCode: "plt-sx-30d", linkPurpose: "抖音·绿色出行",
        skuId: "SKU-30D", riderName: "陈骑手", phone: "135****5105", userId: "U-P505", skuName: "包月30天卡",
        officialPrice: 299, couponAmount: 40, couponId: "CPN-SUMMER-40", paidPrice: 259, platformFee: 2.59, marketingServiceFee: 25,
        paymentArchitecture: "operator_collect", lockedOperatorId: "OP-SX", lockedOperatorName: PAYEE_OPERATOR,
        payTime: "2026-06-08 15:00", status: "已退款", refundStatus: "运营商原路退", refundTime: "2026-06-09 10:00", refundAmount: 259
      }
    ];

    const platformMarketingSettlements = [
      { id: "PMS-001", orderId: "PMO-26061101", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, paid: 259, couponAmount: 40, platformFee: 2.59, marketingFee: 25, settleAt: "2026-06-11 10:05", status: "已记账" },
      { id: "PMS-002", orderId: "PMO-26061001", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, paid: 259, couponAmount: 40, platformFee: 2.59, marketingFee: 25, settleAt: "2026-06-10 11:20", status: "已记账" },
      { id: "PMS-003", orderId: "PMO-26060901", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, paid: 75, couponAmount: 14, platformFee: 0.75, marketingFee: 8, settleAt: "2026-06-09 07:50", status: "已记账" }
    ];

    const platformMarketingStatements = [
      { id: "PST-202606-SX", month: "2026-06", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, orderCount: 4, couponTotal: 134, marketingFeeTotal: 83, paidTotal: 852, status: "待确认" }
    ];

    function operatorEnrolledInPlatformMarketing(operatorId, campaignId, skuId) {
      return platformMarketingAgreements.some(a =>
        a.operatorId === operatorId && a.campaignId === campaignId && a.skuId === skuId && a.status === "已启用"
      );
    }

    function platformMarketingFeeFor(operatorId, campaignId, skuId) {
      const a = platformMarketingAgreements.find(x =>
        x.operatorId === operatorId && x.campaignId === campaignId && x.skuId === skuId && x.status === "已启用"
      );
      return a ? a.marketingServiceFee : null;
    }

    const channelLeaseSummary = [
      { channelId: "CH-RENT", monthlyRent: 12000, devicesCovered: 8, cabinets: 5, batteries: 3, whitelistCount: 50, dedicatedSiteId: "ST-SH-JD", dedicatedSiteName: "京东物流专属站", nextDue: "2026-07-01", billingStatus: "6月已缴", monthSwaps: 428, operatorId: "OP-SX", operatorName: PAYEE_OPERATOR }
    ];
    const channelRentPoolData = channelLeaseSummary;
    const channelRentDevices = [
      { channelId: "CH-RENT", sn: "CAB-JD-001", type: "换电柜", site: "京东物流专属站", siteId: "ST-SH-JD", status: "在租", swapCount: 156 },
      { channelId: "CH-RENT", sn: "CAB-JD-002", type: "换电柜", site: "京东物流专属站", siteId: "ST-SH-JD", status: "在租", swapCount: 132 },
      { channelId: "CH-RENT", sn: "CAB-JD-003", type: "换电柜", site: "京东物流专属站", siteId: "ST-SH-JD", status: "在租", swapCount: 98 },
      { channelId: "CH-RENT", sn: "CAB-22050", type: "换电柜", site: "浦东骑手驿站", siteId: "ST-SH-01", status: "在租", swapCount: 42 },
      { channelId: "CH-RENT", sn: "CAB-33001", type: "换电柜", site: "陆家嘴分站", siteId: "ST-SH-04", status: "维护中", swapCount: 0 },
      { channelId: "CH-RENT", sn: "BAT-JD-050", type: "电池", site: "京东物流专属站", siteId: "ST-SH-JD", status: "在租", swapCount: 88 },
      { channelId: "CH-RENT", sn: "BAT-JD-021", type: "电池", site: "京东物流专属站", siteId: "ST-SH-JD", status: "在租", swapCount: 76 },
      { channelId: "CH-RENT", sn: "BAT-SH-1001", type: "电池", site: "浦东骑手驿站", siteId: "ST-SH-01", status: "在租", swapCount: 64 }
    ];
    /** 设备租赁渠道跨网策略（视为小型运营商，userOwner=渠道） */
    const channelSwapPolicy = {
      "CH-RENT": {
        crossNetworkEnabled: true, crossNetworkDepositPaid: true, crossNetworkDepositAmount: 20000,
        depositBalance: 18000, creditLimit: 150000, used: 12.5, available: 149987.5, crossSwapEnabled: true,
        hostOperatorId: "OP-SX"
      }
    };
    const channelInterOpLedger = [
      { id: "CIO-001", channelId: "CH-RENT", swapId: "SW-LEASE-CROSS-01", date: "2026-06-11", site: "陆家嘴分站",
        payerChannelId: "CH-RENT", payeeOperatorId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-11", status: "已清分" },
      { id: "CIO-002", channelId: "CH-RENT", swapId: "SW-LEASE-CROSS-02", date: "2026-06-12", site: "陆家嘴分站",
        payerChannelId: "CH-RENT", payeeOperatorId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-12", status: "待日清" }
    ];
    const channelBatteryHolders = [
      { channelId: "CH-RENT", userId: "U4001", userName: "张配送", phone: "139****4001", batterySn: "BAT-JD-050", soc: 78, since: "2026-06-11 08:20", site: "京东物流专属站", status: "使用中" },
      { channelId: "CH-RENT", userId: "U4002", userName: "李配送", phone: "138****4002", batterySn: "BAT-JD-021", soc: 92, since: "2026-06-12 14:05", site: "京东物流专属站", status: "使用中" },
      { channelId: "CH-RENT", userId: "U4003", userName: "王夜配", phone: "137****4003", batterySn: null, soc: null, since: null, site: "—", status: "未持有" },
      { channelId: "CH-RENT", userId: "U4004", userName: "赵夜配", phone: "136****4004", batterySn: null, soc: null, since: null, site: "—", status: "已移除" }
    ];
    const channelLeaseWhitelist = [
      { id: "U4001", channelId: "CH-RENT", name: "张配送", phone: "139****4001", whitelistAccess: "paid", pkgStatus: "有效", swaps: 42, status: "启用", addedAt: "2026-01-15", addedBy: "渠道管理员", lastSwap: "今日 11:20" },
      { id: "U4002", channelId: "CH-RENT", name: "李配送", phone: "138****4002", whitelistAccess: "paid", pkgStatus: "有效", swaps: 35, status: "启用", addedAt: "2026-02-01", addedBy: "渠道管理员", lastSwap: "今日 09:15" },
      { id: "U4003", channelId: "CH-RENT", name: "王夜配", phone: "137****4003", whitelistAccess: "paid", pkgStatus: "未购", swaps: 0, status: "启用", addedAt: "2026-03-10", addedBy: "渠道管理员", lastSwap: "—" },
      { id: "U4005", channelId: "CH-RENT", name: "陈配送", phone: "135****4005", whitelistAccess: "free", pkgStatus: "—", swaps: 18, status: "启用", addedAt: "2026-04-01", addedBy: "渠道管理员", lastSwap: "昨日 20:10" },
      { id: "U4004", channelId: "CH-RENT", name: "赵夜配", phone: "136****4004", whitelistAccess: "paid", pkgStatus: "已失效", swaps: 0, status: "已移除", addedAt: "2026-01-20", addedBy: "渠道管理员", lastSwap: "—" }
    ];
    const channelLeasePkgSkus = [
      { channelId: "CH-RENT", id: "LP-30", name: "30天畅换 · 白名单专享", price: 299, validityDays: 30, status: "上架", updatedAt: "2026-06-01" },
      { channelId: "CH-RENT", id: "LP-7", name: "7天体验套餐", price: 89, validityDays: 7, status: "上架", updatedAt: "2026-06-01" }
    ];
    const channelLeasePkgOrders = [
      { id: "LC-260610-01", channelId: "CH-RENT", userId: "U4001", userName: "张配送", phone: "139****4001", skuName: "30天畅换 · 白名单专享", amount: 299, payTime: "2026-06-10 09:12", status: "已支付", subMch: "1678901234***" },
      { id: "LC-260605-02", channelId: "CH-RENT", userId: "U4002", userName: "李配送", phone: "138****4002", skuName: "30天畅换 · 白名单专享", amount: 299, payTime: "2026-06-05 18:40", status: "已支付", subMch: "1678901234***" }
    ];
    const channelRentRiders = channelLeaseWhitelist;
    const channelRentLedger = [
      { id: "RL-001", channelId: "CH-RENT", time: "2026-06-01 10:00", type: "月租入账", delta: 12000, ref: "MO-260601", operator: "渠道财务", note: "6月设备月租 · 8 台" },
      { id: "RL-002", channelId: "CH-RENT", time: "2026-06-09 23:59", type: "换电服务", delta: 0, ref: "白名单 428 次", operator: "系统", note: "白名单用户 · 不扣费" },
      { id: "RL-003", channelId: "CH-RENT", time: "2026-05-01 09:30", type: "月租入账", delta: 12000, ref: "MO-260501", operator: "渠道财务", note: "5月设备月租" },
      { id: "RL-004", channelId: "CH-RENT", time: "2026-04-15 14:00", type: "增租设备", delta: 0, ref: "增 CAB-22050", operator: "运营商", note: "新增 1 柜（月租仍按签约统一价 ¥12000）" }
    ];

    const platformDepositStandard = { battery: 3000, cabinet: 15000, updatedAt: "2026-06-01", updatedBy: "平台管理员" };

    const creditTierConfig = [
      { tier: "优", scoreMin: 85, scoreMax: 100, deductRatio: 100 },
      { tier: "良", scoreMin: 70, scoreMax: 84, deductRatio: 60 },
      { tier: "中", scoreMin: 55, scoreMax: 69, deductRatio: 30 },
      { tier: "差", scoreMin: 0, scoreMax: 54, deductRatio: 0 }
    ];

    const channelDepositProofs = [
      { id: "DP-260601", channelId: "CH-SF", amount: 6000, transferRef: "20260601123456", transferDate: "2026-06-01", status: "已通过", submitTime: "2026-06-01 10:00", reviewedBy: "绿色出行", reviewTime: "2026-06-01 15:30" },
      { id: "DP-260612", channelId: "CH-RENT", amount: 50000, transferRef: "20260612111222", transferDate: "2026-06-12", status: "待审核", submitTime: "2026-06-12 09:00", reviewedBy: null, reviewTime: null }
    ];

    const channelCreditProfiles = [
      { channelId: "CH-SF", creditScore: 82, creditLevel: "良", creditLimit: 108000, platformCreditLimit: 108000, operatorOverride: null,
        requiredDeposit: 18000, paidDeposit: 18000, creditedAmount: 108000, gap: 0,
        perDeviceDeposit: { cabinet: 15000, battery: 3000 }, ridersOnBook: 6,
        channelUserDepositPolicy: "渠道用户默认免押，押金算在渠道", alert: null, updatedAt: "2026-06-10", evalBy: "平台管理员" },
      { channelId: "CH-RENT", creditScore: 88, creditLevel: "优", creditLimit: 150000, platformCreditLimit: 150000, operatorOverride: null,
        requiredDeposit: 150000, paidDeposit: 0, creditedAmount: 150000, gap: 0,
        perDeviceDeposit: { cabinet: 15000, battery: 3000 }, ridersOnBook: 50, devicesOnBook: { cabinets: 5, batteries: 3 },
        channelUserDepositPolicy: "白名单用户免押，押金算在渠道", alert: null, updatedAt: "2026-06-10", evalBy: "平台管理员" },
      { channelId: "CH-ACT", creditScore: 80, creditLevel: "良", creditLimit: 80000, platformCreditLimit: 80000, operatorOverride: null,
        requiredDeposit: 12000, paidDeposit: 12000, creditedAmount: 80000, gap: 0,
        perDeviceDeposit: { cabinet: 15000, battery: 3000 }, ridersOnBook: 86,
        channelUserDepositPolicy: "激活码用户按个人用户押金/免押规则", alert: null, updatedAt: "2026-06-10", evalBy: "平台管理员" }
    ];

    const multiPartyCollectionExplore = {
      status: "探索中",
      summary: "平台 / 资方 / 运营商多主体合并收款（D14 探索原型）",
      routes: [
        { role: "平台", share: "1% 技术服务费", account: "1900000001***", note: "支付时分账" },
        { role: "资方", share: "设备租金份额", account: "1219****3366", note: "租金确认后解冻清分（目标态）" },
        { role: "运营商", share: "经营收入份额", account: "2088123456***", note: "实时清分可提现" }
      ]
    };

    const channelCardSalesOrders = [
      { id: "CSO-260601", channelId: "CH-CARD", channelName: "骑士卡渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, skuName: "包月30天卡", qty: 50, unitPrice: 249, amount: 12450, payMethod: "对公转账", orderStatus: "已完成", payStatus: "已付款", createdAt: "2026-06-01 09:00", payTime: "2026-06-01 11:00", period: "2026-06" },
      { id: "CSO-260610", channelId: "CH-DELIV", channelName: "闪送骑士卡", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, skuName: "7天卡", qty: 20, unitPrice: 65, amount: 1300, payMethod: "在线支付", orderStatus: "待支付", payStatus: "待支付", createdAt: "2026-06-10 14:00", payTime: null, period: "2026-06" }
    ];
    const channelRentTopupOrders = [
      { id: "MO-260601", channelId: "CH-RENT", channelName: "京东物流租赁渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR,
        amount: 12000, devicesCovered: 8, payMethod: "对公转账", orderStatus: "已完成", payStatus: "已付款",
        createdAt: "2026-06-01 09:30", payTime: "2026-06-01 10:00", period: "2026-06", confirmedBy: "张经理" },
      { id: "MO-260712", channelId: "CH-RENT", channelName: "京东物流租赁渠道", operatorId: "OP-SX", operatorName: PAYEE_OPERATOR,
        amount: 12000, devicesCovered: 8, payMethod: "对公转账", orderStatus: "待确认到账", payStatus: "待付款",
        createdAt: "2026-06-28 10:00", payTime: null, period: "2026-07", confirmedBy: null, offlineVoucher: "20260628123456" }
    ];

    const operatorPkgPrices = [
      { id: "OP-P-01", operatorId: "OP-SX", city: "上海", pkg: "包月30天", pkgType: "monthly", validityHours: null, retailPrice: 299, status: "生效", updatedAt: "2026-05-01" },
      { id: "OP-P-03", operatorId: "OP-SX", city: "上海", pkg: "7天套餐", pkgType: "weekly", validityHours: null, retailPrice: 89, status: "生效", updatedAt: "2026-05-10" },
      { id: "OP-P-04", operatorId: "OP-SX", city: "上海", pkg: "1天套餐", pkgType: "daily", validityHours: 24, retailPrice: 29, status: "生效", updatedAt: "2026-06-01" },
      { id: "OP-P-05", operatorId: "OP-SX", city: "上海", pkg: "单次换电", pkgType: "single", validityHours: 24, retailPrice: 9.9, status: "生效", updatedAt: "2026-06-01" },
      { id: "OP-P-06", operatorId: "OP-SX", city: "上海", pkg: "次卡10次", pkgType: "times", validityHours: null, retailPrice: 89, status: "生效", updatedAt: "2026-04-15" },
      { id: "OP-P-07", operatorId: "OP-SX", city: "上海", pkg: "30天畅换", pkgType: "monthly", validityHours: null, retailPrice: 329, status: "生效", updatedAt: "2026-05-15" }
    ];

    /** 同城价格分区：站点挂区 → 区价覆盖城市底价（可高可低）；未配 SKU 继承底价 */
    const operatorPriceZones = [
      {
        id: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", name: "偏远站区",
        status: "启用", siteIds: ["ST-SH-LG", "ST-SH-05"],
        remark: "郊区/偏远站点共用；购此区价后全市可换电",
        updatedAt: "2026-07-16"
      }
    ];

    const operatorZonePkgPrices = [
      { id: "OZ-P-01", zoneId: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", pkg: "包月30天", retailPrice: 259, status: "生效", updatedAt: "2026-07-16" },
      { id: "OZ-P-02", zoneId: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", pkg: "7天套餐", retailPrice: 69, status: "生效", updatedAt: "2026-07-16" },
      { id: "OZ-P-03", zoneId: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", pkg: "1天套餐", retailPrice: 19, status: "生效", updatedAt: "2026-07-16" },
      { id: "OZ-P-04", zoneId: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", pkg: "单次换电", retailPrice: 6.9, status: "生效", updatedAt: "2026-07-16" },
      { id: "OZ-P-05", zoneId: "PZ-SH-REMOTE", operatorId: "OP-SX", city: "上海", pkg: "30天畅换", retailPrice: 349, status: "生效", updatedAt: "2026-07-16" }
    ];

    const operatorDayQuotaPrices = [
      { id: "OP-Q-01", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name, wholesalePrice: 8.5, minDays: 1000, status: "生效", validTo: "2026-12-31" },
      { id: "OP-Q-02", operatorId: "OP-SX", channelId: "*", channelName: "默认批发价", wholesalePrice: 9.0, minDays: 500, status: "生效", validTo: "2026-12-31" },
      { id: "OP-Q-03", operatorId: "OP-SX", channelId: "CH-TEMP", channelName: "临时渠道", wholesalePrice: 8.5, minDays: 500, status: "生效", validTo: "2026-12-31" }
    ];

    const channelSalesOrders = [
      {
        id: "PO-202601-088", channelId: "CH-SF", channelName: ENT.channel.name,
        operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, poolId: "QP-2601",
        days: 10000, unitPrice: 8.5, amount: 85000,
        payChannel: "offline", payMethod: "对公转账",
        orderStatus: "已完成", payStatus: "已付款",
        createdAt: "2026-01-05 09:30", payTime: "2026-01-05 10:00",
        confirmedBy: "张经理", confirmedAt: "2026-01-05 10:00", paymentNo: null
      },
      {
        id: "PO-202606-012", channelId: "CH-SF", channelName: ENT.channel.name,
        operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, poolId: "QP-2601",
        days: 500, unitPrice: 8.5, amount: 4250,
        payChannel: "online", payMethod: "支付宝扫码",
        orderStatus: "已完成", payStatus: "已付款",
        createdAt: "2026-06-01 13:58", payTime: "2026-06-01 14:02",
        paymentNo: "ALI2088123456001", confirmedBy: null, confirmedAt: null
      },
      {
        id: "PO-202606-020", channelId: "CH-SF", channelName: ENT.channel.name,
        operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, poolId: "QP-2601",
        days: 2000, unitPrice: 8.5, amount: 17000,
        payChannel: "offline", payMethod: "对公转账",
        orderStatus: "待确认到账", payStatus: "待付款",
        createdAt: "2026-06-08 11:00", payTime: null,
        offlineVoucher: "转账凭证已上传", paymentNo: null, confirmedBy: null, confirmedAt: null
      },
      {
        id: "PO-202606-088", channelId: "CH-SF", channelName: ENT.channel.name,
        operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, poolId: null,
        days: 300, unitPrice: 8.5, amount: 2550,
        payChannel: "online", payMethod: "微信扫码",
        orderStatus: "待支付", payStatus: "待支付",
        createdAt: "2026-06-10 14:20", payTime: null,
        paymentNo: "WX-PAY-PENDING-088", confirmedBy: null, confirmedAt: null
      },
      {
        id: "PO-202606-089", channelId: "CH-SF", channelName: ENT.channel.name,
        operatorId: "OP-SX", operatorName: PAYEE_OPERATOR, poolId: null,
        days: 150, unitPrice: 8.5, amount: 1275,
        payChannel: "online", payMethod: "微信扫码",
        orderStatus: "支付中", payStatus: "支付中",
        createdAt: "2026-06-10 15:05", payTime: null,
        paymentNo: "WX-PAY-PROCESS-089", confirmedBy: null, confirmedAt: null
      }
    ];

    const operatorCreditAccounts = [
      { operatorId: "OP-SX", depositBalance: 12500, creditLimit: 5000, used: 0, available: 5000, crossSwapEnabled: true, owed: 0 },
      { operatorId: "OP-LJZ", depositBalance: 0, creditLimit: 2000, used: 1980, available: 20, crossSwapEnabled: true, owed: 1980 },
      { operatorId: "OP-BJ", depositBalance: 0, creditLimit: 3000, used: 3100, available: 0, crossSwapEnabled: false, owed: 3100 }
    ];

    const operatorAdmissionTierConfig = [
      { code: "A", name: "战略", minDeposit: 50000, minDepositLabel: null, creditCap: 100000, crossNetworkDefault: true, remark: "平台重点招商 · 融资参考优" },
      { code: "B", name: "标准", minDeposit: 20000, minDepositLabel: null, creditCap: 50000, crossNetworkDefault: true, remark: "默认新入网 · 融资参考" },
      { code: "C", name: "审慎", minDeposit: 10000, minDepositLabel: null, creditCap: 10000, crossNetworkDefault: false, remark: "需加保或担保 · 融资参考" },
      { code: "D", name: "观察", minDeposit: 0, minDepositLabel: "全额预存", creditCap: 0, crossNetworkDefault: false, remark: "仅本站，无授信 · 融资参考弱" }
    ];

    const operatorCreditProfiles = [
      { operatorId: "OP-SX", tierCode: "A", status: "已定档", assignedAt: "2025-03-01", assignedBy: "平台管理员", nextReviewAt: "2026-03-01", assignReason: "入网审批：战略联营示范" },
      { operatorId: "OP-LJZ", tierCode: "B", status: "已定档", assignedAt: "2025-06-15", assignedBy: "平台管理员", nextReviewAt: "2026-06-15", assignReason: "入网审批：标准档" },
      { operatorId: "OP-BJ", tierCode: "C", status: "已定档", assignedAt: "2025-11-01", assignedBy: "平台管理员", nextReviewAt: "2026-11-01", assignReason: "入网审批：审慎档，跨网默认关" }
    ];

    let operatorCreditTierLogs = [
      { id: "OCL-001", operatorId: "OP-SX", fromTier: null, toTier: "A", reason: "入网审批通过", by: "平台管理员", at: "2025-03-01 10:00" },
      { id: "OCL-002", operatorId: "OP-LJZ", fromTier: null, toTier: "B", reason: "入网审批通过", by: "平台管理员", at: "2025-06-15 14:30" },
      { id: "OCL-003", operatorId: "OP-BJ", fromTier: null, toTier: "C", reason: "入网审批：资质一般", by: "平台管理员", at: "2025-11-01 09:00" }
    ];

    const orderAuditEvents = [
      { id: "AE-001", time: "2026-06-20 14:32", operatorId: "OP-SX", channelId: "CH-SF", userPhone: "138****2001", userId: "U-DP-01", eventType: "确认消耗", summary: "人天池 QP-2601 · -1 人天", refType: "swap", refId: "SW260620001", by: "系统", before: "可用 186 人天", after: "可用 185 人天" },
      { id: "AE-002", time: "2026-06-18 09:10", operatorId: "OP-SX", channelId: null, userPhone: "138****1028", userId: "U1028", eventType: "服务冻结", summary: "套餐 SUB260524001", refType: "package", refId: "SUB260524001", by: "骑手申请", before: "服务中", after: "已冻结" },
      { id: "AE-003", time: "2026-06-10 09:30", operatorId: "OP-SX", channelId: "CH-ACT", userPhone: "138****5001", userId: "U-ACT-01", eventType: "激活码核销", summary: "FN30-A8K2-M9P7 · 30天包月", refType: "activation", refId: "CODE-001", by: "系统", before: "未开通", after: "服务中至 2026-07-10" },
      { id: "AE-003", time: "2026-06-15 16:20", operatorId: "OP-SX", channelId: null, userPhone: "139****1041", userId: "U1041", eventType: "中途完结", summary: "申请提前结束 · 待退款", refType: "serviceChange", refId: "SC26061501", by: "骑手申请", before: "已冻结", after: "中途完结" },
      { id: "AE-004", time: "2026-06-01 11:00", operatorId: "OP-SX", channelId: null, userPhone: "138****1028", userId: "U1028", eventType: "订单创建", summary: "包月30天 · ¥299", refType: "package", refId: "SUB260524001", by: "系统", before: "—", after: "服务中" },
      { id: "AE-005", time: "2026-06-10 16:30", operatorId: "OP-SX", channelId: "CH-CARD", userPhone: "138****3001", userId: "U3001", eventType: "链接购卡", summary: "经推广链接 qsk-30d 购包月30天卡 · LO-260610", refType: "package", refId: "LO-260610", by: "用户直购", before: "—", after: "服务中 · 渠道标记" },
      { id: "AE-006", time: "2026-06-10 17:00", operatorId: "OP-LJZ", channelId: null, userPhone: "137****7702", userId: "U-LJZ-01", eventType: "跨网换电", summary: "引用换电单 SW260610044", refType: "swap", refId: "SW260610044", by: "系统", before: "—", after: "成功" }
    ];

    const deviceAlerts = [
      { id: "AL-001", alertType: "eject_fail", severity: "高", deviceSn: "CAB-22018", operatorId: "OP-SX", siteName: "浦东骑手驿站", status: "待处理", message: "换电流程结束但未检测到电池弹出（格口 7）", swapOrderId: "SW260620001", raisedAt: "2026-06-20 14:33" },
      { id: "AL-002", alertType: "cabinet_offline", severity: "高", deviceSn: "CAB-22044", operatorId: "OP-LJZ", siteName: "陆家嘴分站", status: "处理中", message: "心跳超时 18 分钟", swapOrderId: null, raisedAt: "2026-06-19 08:12", handledBy: "李站长" },
      { id: "AL-003", alertType: "door_fault", severity: "中", deviceSn: "CAB-22021", operatorId: "OP-SX", siteName: "世博换电服务点", status: "已关闭", message: "3 号仓门异常开启", swapOrderId: null, raisedAt: "2026-06-17 22:05", handledBy: "张经理", handleNote: "现场复位" },
      { id: "AL-004", alertType: "cabinet_offline", severity: "高", deviceSn: "CAB-22019", operatorId: "OP-SX", siteName: "浦东骑手驿站", status: "待处理", message: "心跳超时 25 分钟", swapOrderId: "SW2606140912", raisedAt: "2026-06-14 09:15" }
    ];

    const iccidProfiles = [
      { iccid: "8986001111222333444", msisdn: "147****8801", carrier: "移动", packageName: "30M/月", expireDate: "2026-07-15", status: "即将到期", boundDeviceType: "cabinet", boundDeviceSn: "CAB-22018", operatorId: "OP-SX" },
      { iccid: "8986005555666677888", msisdn: "147****8802", carrier: "联通", packageName: "100M/月", expireDate: "2026-12-01", status: "正常", boundDeviceType: "cabinet", boundDeviceSn: "CAB-22021", operatorId: "OP-SX" },
      { iccid: "8986007777888899001", msisdn: "147****8804", carrier: "移动", packageName: "50M/月", expireDate: "2026-05-28", status: "已逾期", boundDeviceType: "cabinet", boundDeviceSn: "CAB-22019", operatorId: "OP-SX" },
      { iccid: "8986009999000011112", msisdn: "147****8803", carrier: "电信", packageName: "50M/月", expireDate: "2026-05-20", status: "已逾期", boundDeviceType: "cabinet", boundDeviceSn: "CAB-22044", operatorId: "OP-LJZ" },
      { iccid: "898607B91025D0531404", msisdn: "147****8805", carrier: "移动", packageName: "30M/月", expireDate: "2026-11-30", status: "正常", boundDeviceType: "cabinet", boundDeviceSn: "CAB-22050", operatorId: "OP-SX" }
    ];

    const iccidChangeLogs = [
      { id: "ICL-001", iccid: "8986001111222333444", changeType: "绑定", fromDeviceSn: null, toDeviceSn: "CAB-22018", operatorId: "OP-SX", by: "平台管理员", at: "2025-03-01 10:00", remark: "新柜入网" }
    ];

    const cabinetMoveLogs = [
      { id: "CM-260601", sn: "CAB-22021", fromSite: "浦东骑手驿站", toSite: "世博换电服务点", operatorId: "OP-SX", operatorName: "李小运维", remark: "浦东点位饱和，迁至世博站", movedAt: "2026-06-01 14:30" }
    ];

    const platformClearingReceiveAccount = {
      bankName: "招商银行股份有限公司上海张江支行",
      accountName: "智格超能（上海）科技有限公司",
      accountNo: "1219 0666 0000 6600",
      transferRemark: "附言请填写：运营商ID + 保证金充值（例：OP-SX 保证金充值）"
    };

    let depositRechargeOrders = [
      { id: "DR-20260720-010", operatorId: "OP-HZ", amount: 8000, transferRef: "20260720556677", payerAccount: "6222****3301", transferDate: "2026-07-20", status: "待确认", submitTime: "2026-07-20 09:15", confirmTime: null, confirmedBy: null, remark: "新入网首期保证金" },
      { id: "DR-20260719-009", operatorId: "OP-SX", amount: 2000, transferRef: "20260719443322", payerAccount: "3100****8821", transferDate: "2026-07-19", status: "待确认", submitTime: "2026-07-19 14:30", confirmTime: null, confirmedBy: null, remark: "跨网余额不足预警补充" },
      { id: "DR-20260718-008", operatorId: "OP-BJ", amount: 6000, transferRef: "20260718998877", payerAccount: "6217****5501", transferDate: "2026-07-18", status: "待确认", submitTime: "2026-07-18 11:00", confirmTime: null, confirmedBy: null, remark: "7月保证金补缴" },
      { id: "DR-20260717-007", operatorId: "OP-LJZ", amount: 5000, transferRef: "20260717887766", payerAccount: "2088999***", transferDate: "2026-07-17", status: "待确认", submitTime: "2026-07-17 10:20", confirmTime: null, confirmedBy: null, remark: "恢复跨网服务" },
      { id: "DR-20260716-006", operatorId: "OP-SX", amount: 3000, transferRef: "20260716776655", payerAccount: "3100****8821", transferDate: "2026-07-16", status: "已确认", submitTime: "2026-07-16 09:00", confirmTime: "2026-07-16 14:30", confirmedBy: "平台财务", remark: "7月追加" },
      { id: "DR-20260714-005", operatorId: "OP-BJ", amount: 4000, transferRef: "20260714665544", payerAccount: "6217****5501", transferDate: "2026-07-14", status: "已确认", submitTime: "2026-07-14 15:00", confirmTime: "2026-07-14 17:00", confirmedBy: "平台财务", remark: "日清划扣后补充" },
      { id: "DR-20260712-004", operatorId: "OP-LJZ", amount: 2000, transferRef: "20260712554433", payerAccount: "2088999***", transferDate: "2026-07-12", status: "已驳回", submitTime: "2026-07-12 11:30", confirmTime: "2026-07-12 16:00", confirmedBy: "平台财务", remark: "续费", rejectReason: "转账金额与申请不一致" },
      { id: "DR-20260710-003", operatorId: "OP-HZ", amount: 3000, transferRef: "20260710443322", payerAccount: "6222****3301", transferDate: "2026-07-10", status: "已确认", submitTime: "2026-07-10 10:00", confirmTime: "2026-07-10 15:30", confirmedBy: "平台财务", remark: "试运营保证金" },
      { id: "DR-20260611-002", operatorId: "OP-SX", amount: 5000, transferRef: "20260611098765", payerAccount: "3100****8821", transferDate: "2026-06-11", status: "已确认", submitTime: "2026-06-11 09:30", confirmTime: "2026-06-11 14:00", confirmedBy: "平台财务", remark: "补足跨网清分" },
      { id: "DR-20260608-001", operatorId: "OP-SX", amount: 10000, transferRef: "20260608123456", payerAccount: "3100****8821", transferDate: "2026-06-08", status: "已确认", submitTime: "2026-06-08 10:20", confirmTime: "2026-06-08 15:00", confirmedBy: "平台财务", remark: "首期保证金" },
      { id: "DR-20260605-000", operatorId: "OP-LJZ", amount: 8000, transferRef: "20260605332211", payerAccount: "2088999***", transferDate: "2026-06-05", status: "已确认", submitTime: "2026-06-05 09:45", confirmTime: "2026-06-05 16:20", confirmedBy: "平台财务", remark: "入网保证金" },
      { id: "DR-20260601-A01", operatorId: "OP-BJ", amount: 5000, transferRef: "20260601221100", payerAccount: "6217****5501", transferDate: "2026-06-01", status: "已确认", submitTime: "2026-06-01 08:30", confirmTime: "2026-06-01 11:00", confirmedBy: "平台财务", remark: "入网保证金" },
      { id: "DR-20260528-A02", operatorId: "OP-SX", amount: 15000, transferRef: "20260528110099", payerAccount: "3100****8821", transferDate: "2026-05-28", status: "已确认", submitTime: "2026-05-28 10:00", confirmTime: "2026-05-28 14:30", confirmedBy: "平台财务", remark: "季度预缴" },
      { id: "DR-20260520-A03", operatorId: "OP-LJZ", amount: 2000, transferRef: "20260520009988", payerAccount: "2088999***", transferDate: "2026-05-20", status: "已驳回", submitTime: "2026-05-20 11:00", confirmTime: "2026-05-20 15:00", confirmedBy: "平台财务", remark: "日常补充", rejectReason: "付款户与注册不符" }
    ];

    let depositLedger = [
      { id: "DL-001", operatorId: "OP-SX", time: "2026-01-05 15:00", type: "对公充值", delta: 10000, balanceAfter: 10000, ref: "DR-20260105-001", by: "平台财务" },
      { id: "DL-002", operatorId: "OP-SX", time: "2026-06-01 10:00", type: "对公充值", delta: 3000, balanceAfter: 13000, ref: "线下补录", by: "平台财务" },
      { id: "DL-003", operatorId: "OP-SX", time: "2026-06-08 23:59", type: "日清划扣", delta: -0.9, balanceAfter: 12999.1, ref: "IOB-2026-06-08", by: "系统" },
      { id: "DL-004", operatorId: "OP-SX", time: "2026-06-09 08:30", type: "平台费代扣", delta: -0.085, balanceAfter: 12999.015, ref: "PF-004", by: "系统" },
      { id: "DL-005", operatorId: "OP-SX", time: "2026-06-09 23:59", type: "日清划扣", delta: -499.015, balanceAfter: 12500, ref: "IOB-2026-06-09", by: "系统" },
      { id: "DL-006", operatorId: "OP-LJZ", time: "2026-05-20 12:00", type: "对公充值", delta: 2000, balanceAfter: 2000, ref: "DR-20260520-001", by: "平台财务" },
      { id: "DL-007", operatorId: "OP-LJZ", time: "2026-06-09 23:59", type: "日清划扣", delta: -2000, balanceAfter: 0, ref: "IOB-2026-06-09-LJZ", by: "系统" },
      { id: "DL-008", operatorId: "OP-LJZ", time: "2026-06-10 23:59", type: "平台费代扣", delta: -0.712, balanceAfter: -0.712, ref: "PF-006", by: "系统" },
      { id: "DL-009", operatorId: "OP-BJ", time: "2026-05-15 12:00", type: "对公充值", delta: 5000, balanceAfter: 5000, ref: "DR-20260515-BJ", by: "平台财务" },
      { id: "DL-010", operatorId: "OP-BJ", time: "2026-06-09 23:59", type: "日清划扣", delta: -5000, balanceAfter: 0, ref: "IOB-2026-06-09-BJ", by: "系统" },
      { id: "DL-011", operatorId: "OP-BJ", time: "2026-06-10 23:59", type: "平台费代扣", delta: -5.38, balanceAfter: -5.38, ref: "PFB-202606-BJ", by: "系统" }
    ];

    const platformOperators = [
      { id: "OP-SX", name: "绿色出行", logo: "⚡", brandColor: "#1677ff", city: "上海", status: "在营", contactName: "张经理", contactPhone: "138****8001", loginAccount: "13800001000", email: "zhang@example.com", address: "上海市浦东新区银城中路", onboardDate: "2025-03-01", mchWx: "1900000123***", mchAli: "2088123456***", remark: "首版示范运营商" },
      { id: "OP-LJZ", name: "陆家嘴联营", city: "上海", status: "在营", contactName: "李站长", contactPhone: "139****6601", loginAccount: "13800006601", email: "li@example.com", address: "上海市浦东新区陆家嘴环路", onboardDate: "2025-06-15", mchWx: "1900000456***", mchAli: "2088765432***", remark: "" },
      { id: "OP-BJ", name: "滨江联营", city: "上海", status: "在营", contactName: "王运维", contactPhone: "137****7702", loginAccount: "13800007702", email: "wang@example.com", address: "上海市浦东新区滨江大道", onboardDate: "2025-11-01", mchWx: "1900000789***", mchAli: "2088987654***", remark: "信用额度已用尽，跨网已停" },
      { id: "OP-HZ", name: "西湖换电", city: "杭州", status: "在营", contactName: "陈经理", contactPhone: "135****8800", loginAccount: "13800008800", email: "chen@example.com", address: "杭州市西湖区文三路", onboardDate: "2026-06-01", mchWx: "1900000999***", mchAli: "2088999888***", remark: "新入网 · 待定档" }
    ];

    /** 平台管理员维护：各运营商平台技术服务费抽成比例（C 端支付分账 / B 端确认消耗可分别配置） */
    const operatorPlatformFeeRates = {
      "OP-SX": { cEndRate: 0.01, bEndRate: 0.01, effectiveFrom: "2025-03-01", status: "生效", updatedAt: "2025-03-01", updatedBy: "平台管理员", remark: "标准费率" },
      "OP-LJZ": { cEndRate: 0.008, bEndRate: 0.01, effectiveFrom: "2025-06-15", status: "生效", updatedAt: "2026-01-10", updatedBy: "平台管理员", remark: "联营优惠 · C 端 0.8%" },
      "OP-BJ": { cEndRate: 0.012, bEndRate: 0.012, effectiveFrom: "2025-11-01", status: "生效", updatedAt: "2025-11-01", updatedBy: "平台管理员", remark: "新入网较高费率" },
      "OP-HZ": { cEndRate: 0.005, bEndRate: 0.005, effectiveFrom: "2026-06-01", status: "生效", updatedAt: "2026-06-01", updatedBy: "平台管理员", remark: "杭州拓新扶持期" }
    };

    const channelActivationRedemptions = [
      { id: "AR-001", channelId: "CH-ACT", codeId: "CODE-001", code: "FN30-A8K2-M9P7", userId: "U-ACT-01", userName: "骑手A", phone: "138****5001", skuName: "30天包月", validityDays: 30, redeemedAt: "2026-06-10 09:30", pkgValidTo: "2026-07-10", platformFeeBase: platformAccrualDayPrice() * 30, platformFee: calcPlatformFeeAmount(platformAccrualDayPrice() * 30, "OP-SX", "激活码核销"), operatorId: "OP-SX" },
      { id: "AR-002", channelId: "CH-ACT", codeId: "CODE-004", code: "FN7D-D2N9-Q1S3", userId: "U-ACT-02", userName: "骑手B", phone: "139****5002", skuName: "7天体验", validityDays: 7, redeemedAt: "2026-06-08 14:20", pkgValidTo: "2026-06-15", platformFeeBase: platformAccrualDayPrice() * 7, platformFee: calcPlatformFeeAmount(platformAccrualDayPrice() * 7, "OP-SX", "激活码核销"), operatorId: "OP-SX" }
    ];

    const platformLeasingCompanies = [
      { id: "LEASE-HD", name: "华东设备租赁公司", city: "上海", status: "在营", contactName: "赵资产", contactPhone: "021-5888****", onboardDate: "2024-06-01", licenseNo: "91310000MA1****", remark: "首版主要出租方（演示默认登录）" },
      { id: "LEASE-HS", name: "沪苏设备租赁有限公司", city: "上海", status: "在营", contactName: "钱租赁", contactPhone: "021-6888****", onboardDate: "2026-01-15", licenseNo: "91310000MA2****", remark: "Mock 第二家；已绑定绿色出行，待签约" }
    ];

    let platformLeaseBindings = [
      { id: "LB-001", lessorId: "LEASE-HD", operatorId: "OP-SX", status: "启用", boundAt: "2024-12-20", boundBy: "平台管理员", remark: "" },
      { id: "LB-002", lessorId: "LEASE-HD", operatorId: "OP-LJZ", status: "启用", boundAt: "2025-05-28", boundBy: "平台管理员", remark: "" },
      { id: "LB-003", lessorId: "LEASE-HS", operatorId: "OP-SX", status: "启用", boundAt: "2026-03-01", boundBy: "平台管理员", remark: "同一运营商可绑定多家租赁公司" }
    ];

    /** IoT 平台设备主数据（类型/城市/规格由 SN 查询；导入时只需填运营商） */
    const platformDeviceInventory = [
      { sn: "CAB-NEW-001", type: "cabinet", city: "上海", specs: "12 仓", source: "物联网平台" },
      { sn: "CAB-NEW-002", type: "cabinet", city: "杭州", specs: "8 仓", source: "物联网平台" },
      { sn: "CAB-NEW-003", type: "cabinet", city: "上海", specs: "12 仓", source: "物联网平台" },
      { sn: "BAT-NEW-001", type: "battery", city: "上海", specs: "60V30Ah", source: "物联网平台" },
      { sn: "BAT-NEW-002", type: "battery", city: "上海", specs: "60V30Ah", source: "物联网平台" }
    ];

    const platformChannels = [
      {
        id: "CH-SF", name: "顺丰同城渠道", city: "上海", status: "在营", settlementMode: "人天池",
        contactName: "陈渠道", contactPhone: "139****3100", loginAccount: "13900003100",
        onboardDate: "2026-01-01", createdByOperatorId: "OP-SX", createdByOperatorName: PAYEE_OPERATOR,
        signedOperators: ["绿色出行"],
        paySummary: "人天额度批发",
        poolCount: 1, purchasedDays: 10500, availableDays: 185, consumedDays: 9803,
        staffCount: 2, riderCount: 6, teamCount: 2, monthConsume: 186
      },
      {
        id: "CH-CARD", name: "骑士卡渠道", city: "上海", status: "在营", settlementMode: "卡差价",
        contactName: "王卡务", contactPhone: "139****3201", loginAccount: "13900003201",
        onboardDate: "2026-03-01", createdByOperatorId: "OP-SX", createdByOperatorName: PAYEE_OPERATOR,
        signedOperators: ["绿色出行"],
        paySummary: "推广链接分销",
        poolCount: 0, purchasedDays: 0, availableDays: 0, consumedDays: 0,
        linkOrders: 85, monthCommission: 2125, linkClicks: 3420, staffCount: 1, riderCount: 85, teamCount: 0, monthConsume: 0
      },
      {
        id: "CH-DELIV", name: "闪送骑士卡", city: "上海", status: "在营", settlementMode: "卡差价",
        contactName: "李卡务", contactPhone: "139****3210", loginAccount: "13900003210",
        onboardDate: "2026-04-01", createdByOperatorId: "OP-SX", createdByOperatorName: PAYEE_OPERATOR,
        signedOperators: ["绿色出行"],
        paySummary: "推广链接分销",
        poolCount: 0, purchasedDays: 0, availableDays: 0, consumedDays: 0,
        linkOrders: 38, monthCommission: 1140, linkClicks: 980, staffCount: 1, riderCount: 38, teamCount: 0, monthConsume: 0
      },
      {
        id: "CH-RENT", name: "京东物流租赁渠道", city: "上海", status: "在营", settlementMode: "设备租赁",
        contactName: "赵租金", contactPhone: "139****3301", loginAccount: "13900003301",
        onboardDate: "2026-04-01", createdByOperatorId: "OP-SX", createdByOperatorName: PAYEE_OPERATOR,
        signedOperators: ["绿色出行"],
        paySummary: "设备月租 B2B",
        poolCount: 0, purchasedDays: 0, availableDays: 0, consumedDays: 0,
        whitelistCount: 50, dedicatedSite: "京东物流专属站", billingStatus: "6月已缴",
        rentDevices: 8, staffCount: 1, riderCount: 50, teamCount: 2, monthSwaps: 428
      },
      {
        id: "CH-ACT", name: "蜂鸟激活码渠道", city: "上海", status: "在营", settlementMode: "激活码",
        contactName: "周码务", contactPhone: "139****3401", loginAccount: "13900003401",
        onboardDate: "2026-05-01", createdByOperatorId: "OP-SX", createdByOperatorName: PAYEE_OPERATOR,
        signedOperators: ["绿色出行"],
        paySummary: "激活码批发",
        poolCount: 0, purchasedDays: 0, availableDays: 0, consumedDays: 0,
        codeInventory: 420, codesRedeemed: 86, monthRedemptions: 42,
        staffCount: 1, riderCount: 86, teamCount: 0, monthConsume: 0
      }
    ];

    const platformMerchantAccount = {
      entityName: ENT.platform.name,
      wxMch: "1900000001***", aliMch: "2088000001***",
      settleBank: "招商银行上海张江支行", settleAccount: "1219****6688",
      balance: 28560.42, frozen: 120.00
    };

    const platformAccountMonthly = [
      { month: "2026-06", cEndSplit: 45.20, bEndAccrual: 12.75, l1Clearing: 0, payCount: 128, consumeFeeCount: 42, interOpCount: 8 },
      { month: "2026-05", cEndSplit: 41.80, bEndAccrual: 11.40, l1Clearing: 0, payCount: 118, consumeFeeCount: 39, interOpCount: 7 },
      { month: "2026-04", cEndSplit: 36.20, bEndAccrual: 9.85, l1Clearing: 0, payCount: 105, consumeFeeCount: 35, interOpCount: 5 }
    ];

    /** 运营商自主换电范围（可与平台信用额度停跨网叠加） */
    const operatorSwapPolicy = {
      "OP-SX": { crossNetworkEnabled: false },
      "OP-LJZ": { crossNetworkEnabled: false },
      "OP-BJ": { crossNetworkEnabled: false }
    };

    function swapPolicyForOperator(operatorId) {
      return operatorSwapPolicy[operatorId] || { crossNetworkEnabled: false };
    }

    function siteRecordById(id) {
      return sites.find(s => s.id === id);
    }

    function operatorDeductMode(acct) {
      if (!acct) return "—";
      return acct.depositBalance > 0 ? "保证金" : "信用额度";
    }

    const INTER_OP_MOCK_TODAY = "2026-06-12";

    const interOpLedger = [
      { id: "IO-001", swapId: "SW-CROSS-DEMO", date: "2026-06-09", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-09", status: "待日清" },
      { id: "IO-002", swapId: "SW2605241201", date: "2026-05-24", site: "浦东骑手驿站",
        payerId: "OP-SX", payeeCabinetId: "OP-SX", payeeBatteryId: "OP-SX",
        cabinetFee: 0, batteryFee: 0, feeType: "本站换电", clearBatch: "—", status: "无需结算" },
      { id: "IO-003", swapId: "SW2606090830", date: "2026-06-09", site: "浦东骑手驿站",
        payerId: "OP-SX", payeeCabinetId: "OP-SX", payeeBatteryId: "OP-SX",
        cabinetFee: 0, batteryFee: 0, feeType: "本站换电", clearBatch: "DAY-2026-06-09", status: "无需结算" },
      { id: "IO-004", swapId: "SW-CHANNEL-CROSS", date: "2026-06-09", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-09", status: "待日清" },
      { id: "IO-005", swapId: "SW260612-CROSS", date: "2026-06-12", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-12", status: "待日清" },
      { id: "IO-006", swapId: "SW260611-CROSS", date: "2026-06-11", site: "陆家嘴分站",
        payerId: "OP-SX", payeeCabinetId: "OP-LJZ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: 0,
        feeType: "柜机使用费", clearBatch: "DAY-2026-06-11", status: "已清分" },
      { id: "IO-007", swapId: "SW260610-CROSS", date: "2026-06-10", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-BJ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: 0,
        feeType: "柜机使用费", clearBatch: "DAY-2026-06-10", status: "已清分" },
      { id: "IO-008", swapId: "SW260608-IN", date: "2026-06-08", site: "浦东骑手驿站",
        payerId: "OP-LJZ", payeeCabinetId: "OP-SX", payeeBatteryId: "OP-SX",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-08", status: "已清分" },
      { id: "IO-009", swapId: "SW260607-CROSS", date: "2026-06-07", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-07", status: "已清分" },
      { id: "IO-010", swapId: "SW260605-CROSS", date: "2026-06-05", site: "滨江换电站",
        payerId: "OP-SX", payeeCabinetId: "OP-BJ", payeeBatteryId: "OP-LJZ",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: l1UnifiedPricing.batteryFee,
        feeType: "柜机使用费+电池使用费", clearBatch: "DAY-2026-06-05", status: "已清分" },
      { id: "IO-011", swapId: "SW260603-IN", date: "2026-06-03", site: "世博换电服务点",
        payerId: "OP-BJ", payeeCabinetId: "OP-SX", payeeBatteryId: "OP-SX",
        cabinetFee: l1UnifiedPricing.cabinetFee, batteryFee: 0,
        feeType: "柜机使用费", clearBatch: "DAY-2026-06-03", status: "已清分" }
    ];

    const interOpDailyBills = [
      { id: "IOB-2026-06-12", date: "2026-06-12", operatorId: "OP-SX", platformPayOut: 0.6, platformPayIn: 0, net: -0.6, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-12 " + INTER_OP_CLEAR_TIME, status: "待日清" },
      { id: "IOB-2026-06-11", date: "2026-06-11", operatorId: "OP-SX", platformPayOut: 0.5, platformPayIn: 0, net: -0.5, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-11 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-10", date: "2026-06-10", operatorId: "OP-SX", platformPayOut: 0.5, platformPayIn: 0, net: -0.5, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-10 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-09", date: "2026-06-09", operatorId: "OP-SX", platformPayOut: 1.2, platformPayIn: 0, net: -1.2, swapCount: 2, deductSource: "保证金", clearedAt: "2026-06-09 " + INTER_OP_CLEAR_TIME, status: "待日清" },
      { id: "IOB-2026-06-08", date: "2026-06-08", operatorId: "OP-SX", platformPayOut: 1.2, platformPayIn: 0.3, net: -0.9, swapCount: 3, deductSource: "保证金", clearedAt: "2026-06-08 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-07", date: "2026-06-07", operatorId: "OP-SX", platformPayOut: 0.6, platformPayIn: 0, net: -0.6, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-07 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-06", date: "2026-06-06", operatorId: "OP-SX", platformPayOut: 0, platformPayIn: 0.5, net: 0.5, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-06 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-05", date: "2026-06-05", operatorId: "OP-SX", platformPayOut: 0.6, platformPayIn: 0, net: -0.6, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-05 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-04", date: "2026-06-04", operatorId: "OP-SX", platformPayOut: 1.2, platformPayIn: 0.3, net: -0.9, swapCount: 2, deductSource: "保证金", clearedAt: "2026-06-04 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-03", date: "2026-06-03", operatorId: "OP-SX", platformPayOut: 0, platformPayIn: 0.5, net: 0.5, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-03 " + INTER_OP_CLEAR_TIME, status: "已清分" },
      { id: "IOB-2026-06-09-BJ", date: "2026-06-09", operatorId: "OP-BJ", platformPayOut: 0, platformPayIn: 0.5, net: 0.5, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-09 " + INTER_OP_CLEAR_TIME, status: "待日清" },
      { id: "IOB-2026-06-09-LJZ", date: "2026-06-09", operatorId: "OP-LJZ", platformPayOut: 0, platformPayIn: 0.1, net: 0.1, swapCount: 1, deductSource: "保证金", clearedAt: "2026-06-09 " + INTER_OP_CLEAR_TIME, status: "待日清" }
    ];

    const interOpPeriodBills = [
      { id: "IOB-W2026-W23", operatorId: "OP-SX", period: "2026-W23", type: "周", days: 7, platformPayOut: 8.4, platformPayIn: 2.1, net: -6.3, status: "已汇总" },
      { id: "IOB-M2026-06", operatorId: "OP-SX", period: "2026-06", type: "月", days: 30, platformPayOut: 186.4, platformPayIn: 42.0, net: -144.4, status: "已汇总" },
      { id: "IOB-M2026-06-LJZ", operatorId: "OP-LJZ", period: "2026-06", type: "月", days: 30, platformPayOut: 0.6, platformPayIn: 3.2, net: 2.6, status: "已汇总" },
      { id: "IOB-M2026-06-BJ", operatorId: "OP-BJ", period: "2026-06", type: "月", days: 30, platformPayOut: 0, platformPayIn: 1.5, net: 1.5, status: "待汇总" }
    ];

    const platformFeeAccruals = [
      { id: "PF-001", date: "2026-06-09", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name,
        poolId: "QP-2601", swapId: "SW2606090830", riderId: "U2101", days: 1, basePrice: platformAccrualDayPrice(), contractWholesalePrice: 8.5, feeRate: PLATFORM_FEE_RATE,
        feeAmount: Math.round(platformAccrualDayPrice() * PLATFORM_FEE_RATE * 1000) / 1000, trigger: "确认消耗-换电", feeTarget: "额度售卖方U", status: "待代扣", deductPath: "保证金代扣" },
      { id: "PF-002", date: "2026-06-09", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name,
        poolId: "QP-2601", swapId: "SW2606091430", riderId: "U2110", days: 1, basePrice: platformAccrualDayPrice(), contractWholesalePrice: 8.5, feeRate: PLATFORM_FEE_RATE,
        feeAmount: Math.round(platformAccrualDayPrice() * PLATFORM_FEE_RATE * 1000) / 1000, trigger: "确认消耗-换电", feeTarget: "额度售卖方U", status: "已代扣", deductPath: "保证金代扣" },
      { id: "PF-003", date: "2026-06-08", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name,
        poolId: "QP-2601", swapId: "SW2605241140", riderId: "U2102", days: 1, basePrice: platformAccrualDayPrice(), contractWholesalePrice: 8.5, feeRate: PLATFORM_FEE_RATE,
        feeAmount: Math.round(platformAccrualDayPrice() * PLATFORM_FEE_RATE * 1000) / 1000, trigger: "确认消耗-换电", feeTarget: "额度售卖方U", status: "已代扣", deductPath: "保证金代扣" },
      { id: "PF-004", date: "2026-06-09", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name,
        poolId: "QP-2601", swapId: null, riderId: "U2106", days: 1, basePrice: platformAccrualDayPrice(), contractWholesalePrice: 8.5, feeRate: PLATFORM_FEE_RATE,
        feeAmount: Math.round(platformAccrualDayPrice() * PLATFORM_FEE_RATE * 1000) / 1000, trigger: "确认消耗-持有电池", feeTarget: "额度售卖方U", status: "已代扣", deductPath: "保证金代扣", note: "当日无换电·持电池确认" },
      { id: "PF-004b", date: "2026-06-02", operatorId: "OP-SX", channelId: "CH-SF", channelName: ENT.channel.name,
        poolId: "QP-2601", swapId: null, riderId: "U2112", days: 1, basePrice: platformAccrualDayPrice(), contractWholesalePrice: 8.5, feeRate: PLATFORM_FEE_RATE,
        feeAmount: Math.round(platformAccrualDayPrice() * PLATFORM_FEE_RATE * 1000) / 1000, trigger: "确认消耗-持有电池", feeTarget: "额度售卖方U", status: "已代扣", deductPath: "保证金代扣", note: "当日无换电·持电池确认" },
      { id: "PF-005", date: "2026-06-03", operatorId: "OP-SX", channelId: null, channelName: "—",
        poolId: null, swapId: null, riderId: "U2201", ref: "SUB260610088", days: 0, basePrice: 89, contractWholesalePrice: null, feeRate: PLATFORM_FEE_RATE,
        feeAmount: 0.89, trigger: "支付成功", feeTarget: "运营商", status: "已代扣", deductPath: "支付通道分账" },
      { id: "PF-006", date: "2026-06-10", operatorId: "OP-LJZ", channelId: null, channelName: "—",
        poolId: null, swapId: "SW2605240912", riderId: "U3321", days: 0, basePrice: 89, contractWholesalePrice: null, feeRate: PLATFORM_FEE_RATE,
        feeAmount: 0.89, trigger: "支付成功", feeTarget: "运营商", status: "待代扣", deductPath: "保证金代扣" },
      { id: "PF-007", date: "2026-06-10", operatorId: "OP-SX", channelId: "CH-ACT", channelName: "蜂鸟激活码渠道",
        poolId: null, swapId: null, riderId: "U-ACT-01", ref: "FN30-A8K2-M9P7", days: 30, basePrice: platformAccrualDayPrice() * 30, contractWholesalePrice: 255, feeRate: PLATFORM_FEE_RATE,
        feeAmount: calcPlatformFeeAmount(platformAccrualDayPrice() * 30, "OP-SX", "激活码核销"), trigger: "激活码核销", feeTarget: "额度售卖方U", status: "待代扣", deductPath: "保证金代扣" }
    ];

    function refreshPlatformFeeAccruals() {
      platformFeeAccruals.forEach(a => {
        const t = String(a.trigger || "");
        const isBEnd = t === "确认消耗" || t.startsWith("确认消耗") || t === "激活码核销" || !!a.poolId;
        a.feeRate = isBEnd ? operatorBEndFeeRate(a.operatorId) : operatorCEndFeeRate(a.operatorId);
        a.feeAmount = Math.round(a.basePrice * a.feeRate * 1000) / 1000;
      });
    }
    refreshPlatformFeeAccruals();

    const platformFeeBills = [
      { id: "PFB-202606", operatorId: "OP-SX", month: "2026-06", accrued: 12.75, deducted: 8.50, owed: 4.25, status: "部分欠费", prepayBalance: 120.00 },
      { id: "PFB-202606-LJZ", operatorId: "OP-LJZ", month: "2026-06", accrued: 0.712, deducted: 0, owed: 0.712, status: "待代扣", prepayBalance: 0 },
      { id: "PFB-202605-BJ", operatorId: "OP-BJ", month: "2026-05", accrued: 2.99, deducted: 2.99, owed: 0, status: "已结清", prepayBalance: 15.00 },
      { id: "PFB-202606-BJ", operatorId: "OP-BJ", month: "2026-06", accrued: 5.38, deducted: 0, owed: 5.38, status: "全额欠费", prepayBalance: 0 }
    ];

    const PF_DEFAULTS = {
      overview: { range: "30" },
      drillSwap: { operatorId: "全部", site: "全部", range: "7", dateFrom: "", dateTo: "" },
      overviewPower: { dateFrom: "2026-06-01", dateTo: "2026-06-15", range: "30", site: "全部" },
      overviewSiteBusy: { date: "2026-06-15" },
      overviewExpense: { month: "2026-06", siteId: "全部" },
      siteExpenses: { dateFrom: "2026-06-01", dateTo: "2026-06-30", range: "month" },
      sites: { siteName: "", city: "全部", status: "全部" },
      sitePartners: { keyword: "", siteId: "全部" },
      partnerLedger: { keyword: "", siteId: "全部", dateFrom: "", dateTo: "" },
      devices: { sn: "", site: "全部", online: "全部" },
      devices_cabinet: { deviceId: "", sn: "", deviceName: "", site: "全部", online: "全部", powerStatus: "全部", deviceStatus: "全部" },
      devices_battery: { sn: "", site: "全部", location: "全部" },
      orders_package: { orderId: "", phone: "", payFrom: "", payTo: "", status: "全部", serviceState: "全部" },
      orders_user_deposit: { orderId: "", phone: "", payFrom: "", payTo: "", depositType: "全部", status: "全部" },
      orders_swap: { swapId: "", phone: "", timeFrom: "", timeTo: "", status: "全部", entitlementType: "全部" },
      orders_service: { type: "全部", status: "全部", phone: "", orderId: "" },
      orderFreeze: { orderId: "", phone: "", type: "全部", status: "全部" },
      flows_receipt: { orderId: "", flowType: "全部", timeFrom: "", timeTo: "" },
      flows_accrual: { type: "全部", dateFrom: "", dateTo: "", orderId: "", settle: "全部" },
      flows_payout: { status: "全部", period: "" },
      users: { userId: "", phone: "", site: "全部", serviceState: "全部", pkgService: "全部", depositKind: "全部", depositStatus: "全部" },
      employees: { keyword: "", roleType: "全部", status: "全部" },
      leaseAgreements: { contractId: "", party: "", status: "全部" },
      leaseCollect: { month: "", lessee: "", collectStatus: "全部" },
      leaseRent: { month: "2026-06", contractId: "" },
      dayPool_pools: { poolId: "", status: "全部" },
      dayPool_teams: { keyword: "", poolId: "全部" },
      dayPool_rules: { poolId: "全部", teamId: "全部", status: "全部" },
      dayPool_riders: { teamId: "全部", keyword: "", status: "全部", quotaStatus: "全部" },
      dayPool_allocations_riders: { keyword: "", teamId: "全部", poolId: "全部", quotaStatus: "全部" },
      dayPool_allocations_logs: { poolId: "全部", type: "全部", keyword: "", dateFrom: "", dateTo: "" },
      dayPool_consume: { dateFrom: "2026-06-08", dateTo: "2026-06-09", teamId: "全部" },
      dayPool_retail: { city: "全部" },
      dayPool_exceptions: { type: "全部", status: "全部" },
      dayPool_ledger: { poolId: "全部", type: "全部" },
      operators: { keyword: "", status: "全部", city: "全部" },
      interOp: { range: "7" },
      interOp_ledger: { type: "全部", dateFrom: "", dateTo: "", range: "7", site: "全部", status: "全部", direction: "全部", swapId: "" },
      interOp_daily: { type: "全部", dateFrom: "", dateTo: "", range: "7", status: "全部" },
      interOp_period: { type: "全部", dateFrom: "", dateTo: "", status: "全部" },
      platformFee_cEnd: { type: "全部", dateFrom: "", dateTo: "", status: "全部" },
      platformFee_bEnd: { type: "全部", dateFrom: "", dateTo: "", status: "全部" },
      depositAccount_ledger: { type: "全部", dateFrom: "", dateTo: "" },
      depositManage_ledger: { type: "全部", dateFrom: "", dateTo: "", operatorId: "全部" },
      depositManage_pending: { operatorId: "全部", dateFrom: "", dateTo: "" },
      operators_list: { keyword: "", status: "全部", city: "全部" },
      operators_withdrawReview: { operatorId: "全部", status: "全部" },
      operators_feeRate: { keyword: "", status: "全部" },
      l1Pricing_crossNet: {},
      l1Pricing_dayPrice: {},
      l1Pricing_sms: { keyword: "" },
      deviceBinding: { type: "全部", keyword: "" },
      platformUsers: { keyword: "", operatorId: "全部", userType: "全部", userStatus: "全部", depositKind: "全部", depositStatus: "全部" },
      platformUsers_info: { keyword: "", operatorId: "全部", userType: "全部", userStatus: "全部", depositKind: "全部", depositStatus: "全部" },
      platformUsers_depositStats: { operatorId: "全部" },
      platformUsers_serviceChange: { scId: "", orderId: "", phone: "", operatorId: "全部", type: "全部", status: "全部" },
      platformOrders_package: { orderId: "", phone: "", operatorId: "全部", serviceState: "全部" },
      platformOrders_swap: { swapId: "", phone: "", operatorId: "全部", status: "全部" },
      platformOrders_channel: { orderId: "", channelId: "全部", payChannel: "全部", orderStatus: "全部", payStatus: "全部" },
      platformDevices_ledger: { keyword: "", type: "全部", operatorId: "全部", bindStatus: "全部" },
      platformDevices_import: {},
      platformDevices_pending: { keyword: "", type: "全部" },
      platformChannels_list: { keyword: "", status: "全部" },
      platformMarketing_campaigns: { status: "全部", keyword: "" },
      platformMarketing_agreements: { operatorId: "全部", status: "全部" },
      platformMarketing_links: { campaignId: "全部", status: "全部" },
      platformMarketing_pending: { activationStatus: "全部", keyword: "" },
      platformMarketing_settlements: { operatorId: "全部", month: "" },
      platformMarketing_statements: { month: "2026-06", operatorId: "全部", status: "全部" },
      platformFlows_userPay: { orderId: "", flowType: "全部", operatorId: "全部" },
      platformFlows_interOp: { operatorId: "全部", dateFrom: "", dateTo: "" },
      platformFlows_platformFee: { operatorId: "全部", trigger: "全部", dateFrom: "", dateTo: "" },
      platformAccounts: { month: "2026-06" },
      refundManage: { refundId: "", orderId: "", phone: "", type: "全部", status: "全部", applyFrom: "", applyTo: "" },
      orderAudit: { keyword: "", eventType: "全部", dateFrom: "", dateTo: "" },
      commissionStatement: { month: "last6" }
    };

