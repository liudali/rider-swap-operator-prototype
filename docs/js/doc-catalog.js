/**
 * 产品文档目录（文档页与右侧搜索面板共用）
 * 真源：docs/*.md → sync 后镜像到 prototype/docs/md 与 documentation/md
 */
(function (global) {
  const DOC_GROUPS = [
    {
      title: "结构与清单",
      items: [
        { file: "功能结构与业务流程.md", label: "功能结构与业务流程" },
        { file: "角色与功能清单.md", label: "角色与功能清单" },
        { file: "业务整体预览图.md", label: "业务整体预览图" },
        { file: "用户-运营商归属模型.md", label: "用户 · 运营商归属模型" }
      ]
    },
    {
      title: "产品需求",
      items: [
        { file: "PRD.md", label: "后台 PRD" },
        { file: "产品变更记录.md", label: "产品变更记录" },
        { file: "原型变更记录.md", label: "原型变更记录" },
        { file: "站点经营分析-Mock字段清单.md", label: "站点经营分析 · Mock 字段" },
        { file: "骑手端PRD.md", label: "骑手端 PRD" },
        { file: "user-stories.md", label: "用户故事" },
        { file: "acceptance-criteria.md", label: "验收标准" },
        { file: "业务文档写作规范.md", label: "业务文档写作规范" },
        { file: "最小埋点清单.md", label: "最小埋点清单" },
        { file: "设计评审报告.md", label: "设计评审报告" },
        { file: "2026-06-16会议对齐决议.md", label: "会议对齐决议" },
        { file: "需求评审决策记录.md", label: "需求评审决策记录" },
        { file: "税筹与分账结构参考方案.md", label: "税筹参考方案" },
        { file: "税收-待讨论.md", label: "税收 · 待讨论" },
        { file: "平台营销-PRD.md", label: "平台营销 PRD" },
        { file: "融资管理-PRD.md", label: "融资管理 PRD" }
      ]
    },
    {
      title: "业务与结算",
      items: [
        { file: "换电场景与运营商结算.md", label: "换电场景与运营商结算" },
        { file: "合作模式与分账.md", label: "合作模式与分账" },
        { file: "运营商提现规则.md", label: "运营商提现规则" },
        { file: "换电范围策略.md", label: "换电范围策略" },
        { file: "天数池.md", label: "人天额度池" },
        { file: "渠道结算模式规则.md", label: "渠道结算模式规则" },
        { file: "渠道信用评估方案.md", label: "渠道信用评估方案" },
        { file: "渠道骑手可换电校验.md", label: "渠道骑手可换电校验" },
        { file: "个人套餐定价与退款.md", label: "个人套餐定价与退款" },
        { file: "骑手电池押金.md", label: "骑手电池押金" },
        { file: "运营商信用评估方案.md", label: "运营商信用评估" }
      ]
    },
    {
      title: "竞品与任务",
      items: [
        { file: "站点合伙人.md", label: "站点合伙人" },
        { file: "站点合伙人-Mock字段清单.md", label: "站点合伙人 · Mock 字段" },
        { file: "站点合伙人-待定.md", label: "站点合伙人 · 历史索引" },
        { file: "合伙人站点分佣.md", label: "合伙人站点分佣" },
        { file: "竞品功能清单.md", label: "竞品功能清单" },
        { file: "竞品借鉴决策记录.md", label: "竞品借鉴决策" },
        { file: "竞品借鉴-待评审拍板.md", label: "竞品借鉴 · 拍板决议" },
        { file: "任务-订单变更审计.md", label: "任务 · 订单变更审计" },
        { file: "任务-设备告警与ICCID.md", label: "任务 · 设备告警与 ICCID" },
        { file: "任务-美团类SDK对接.md", label: "任务 · 美团类 SDK" }
      ]
    },
    {
      title: "待确认",
      items: [
        { file: "待考虑内容.md", label: "待考虑内容" }
      ]
    }
  ];

  /** 页面上下文别名：key → 额外检索词（OR 预匹配） */
  const VIEW_DOC_KEYWORDS = {
    overview: ["总览", "KPI", "繁忙度", "用电量"],
    sites: ["站点", "场费", "电费"],
    sitePartners: ["站点合伙人", "分润", "开户"],
    siteExpenses: ["站点支出", "场费", "电费", "账单"],
    devices: ["设备", "电柜", "电池", "SOH"],
    orderService: ["订单", "套餐", "换电"],
    orderPackage: ["套餐", "购买订单", "包月"],
    orderSwap: ["换电订单", "三元组", "消耗"],
    orderUserDeposit: ["押金", "退押", "实付", "用户押金"],
    orderFreeze: ["冻结", "解冻"],
    orderAudit: ["变更记录", "审计"],
    refundManage: ["退款", "退订", "冷却期"],
    flows: ["流水", "分账", "入账"],
    users: ["用户", "骑手", "押金"],
    employees: ["员工", "权限"],
    pricing: ["定价", "押金设置", "套餐价", "电池型号"],
    channelSales: ["渠道", "签约", "批发"],
    dayPool: ["额度池", "人天", "分配", "消耗"],
    channelSettlement: ["结算模式", "链接类", "设备租赁", "激活码"],
    channelCredit: ["渠道信用", "额度"],
    channelLinks: ["套餐与链接", "分销价"],
    channelOrders: ["购卡", "链接类"],
    commissionStatement: ["佣金", "对账"],
    rentPool: ["月租", "设备租赁"],
    rentDevices: ["租赁设备"],
    leaseBatteryHold: ["电池持有"],
    leaseWhitelist: ["白名单"],
    leasePkgPricing: ["白名单套餐", "电池型号"],
    leasePkgOrders: ["白名单订单", "白名单套餐"],
    channelInterOp: ["跨网", "往来账"],
    activationCodes: ["激活码"],
    activationRecords: ["核销"],
    accounts: ["收款账户", "对公"],
    platformService: ["平台服务", "保证金", "服务费"],
    depositAccount: ["服务保证金", "充值"],
    interOp: ["往来账", "跨网结算"],
    platformFee: ["平台服务费", "分账"],
    operators: ["运营商管理", "提现"],
    operatorCreditEval: ["信用评估", "定档"],
    depositManage: ["保证金管理"],
    deviceBinding: ["设备绑定"],
    l1Pricing: ["统价", "人天标准价"],
    platformUsers: ["用户管理", "押金"],
    platformOrders: ["订单管理"],
    platformDevices: ["设备管理"],
    platformChannels: ["渠道商管理"],
    platformMarketing: ["营销", "补贴"],
    platformFlows: ["流水管理"],
    platformAccounts: ["平台账户"],
    platformLeasing: ["租赁公司"],
    leaseAgreements: ["租赁协议", "设备清单"],
    leaseCollect: ["租金收缴"],
    leaseRent: ["月租金"],
    financeManage: ["融资", "放款", "资产包"],
    financeDrawdown: ["放款申请"],
    partnerOverview: ["合伙人", "分润"],
    partnerBindings: ["我的站点", "分润比例"],
    partnerLedger: ["分润明细"],
    partnerWithdraw: ["提现结算"],
    partnerAccount: ["收款账户"]
  };

  /**
   * 当前页优先推荐的业务设定文档（上下文预匹配置顶）
   * 只列规则/设定真源，不含变更记录、会议纪要、竞品清单
   */
  const VIEW_DOC_PREFER = {
    overview: ["功能结构与业务流程.md", "角色与功能清单.md", "PRD.md"],
    sites: ["站点合伙人.md", "PRD.md"],
    sitePartners: ["站点合伙人.md", "合伙人站点分佣.md", "站点合伙人-Mock字段清单.md"],
    siteExpenses: ["站点合伙人.md", "PRD.md"],
    devices: ["PRD.md", "功能结构与业务流程.md"],
    orderPackage: ["个人套餐定价与退款.md", "PRD.md"],
    orderSwap: ["换电场景与运营商结算.md", "换电范围策略.md", "渠道骑手可换电校验.md"],
    orderUserDeposit: ["骑手电池押金.md", "个人套餐定价与退款.md"],
    orderFreeze: ["个人套餐定价与退款.md"],
    orderAudit: ["PRD.md", "功能结构与业务流程.md"],
    refundManage: ["个人套餐定价与退款.md", "骑手电池押金.md"],
    flows: ["合作模式与分账.md", "换电场景与运营商结算.md", "运营商提现规则.md"],
    users: ["用户-运营商归属模型.md", "骑手电池押金.md", "骑手端PRD.md"],
    employees: ["角色与功能清单.md", "PRD.md"],
    pricing: ["个人套餐定价与退款.md", "骑手电池押金.md", "换电范围策略.md", "渠道结算模式规则.md"],
    channelSales: ["渠道结算模式规则.md", "合作模式与分账.md", "渠道信用评估方案.md"],
    dayPool: ["天数池.md", "渠道结算模式规则.md"],
    channelSettlement: ["渠道结算模式规则.md", "合作模式与分账.md", "天数池.md"],
    channelCredit: ["渠道信用评估方案.md", "渠道结算模式规则.md"],
    channelLinks: ["渠道结算模式规则.md", "个人套餐定价与退款.md"],
    channelOrders: ["渠道结算模式规则.md"],
    commissionStatement: ["渠道结算模式规则.md", "合作模式与分账.md"],
    rentPool: ["渠道结算模式规则.md", "合作模式与分账.md"],
    rentDevices: ["渠道结算模式规则.md"],
    leaseBatteryHold: ["渠道结算模式规则.md"],
    leaseWhitelist: ["渠道结算模式规则.md", "渠道骑手可换电校验.md"],
    leasePkgPricing: ["渠道结算模式规则.md", "个人套餐定价与退款.md"],
    leasePkgOrders: ["渠道结算模式规则.md"],
    channelInterOp: ["换电场景与运营商结算.md", "渠道结算模式规则.md"],
    activationCodes: ["渠道结算模式规则.md"],
    activationRecords: ["渠道结算模式规则.md"],
    accounts: ["运营商提现规则.md", "合作模式与分账.md"],
    platformService: ["运营商信用评估方案.md", "合作模式与分账.md", "运营商提现规则.md"],
    depositAccount: ["运营商信用评估方案.md", "合作模式与分账.md"],
    interOp: ["换电场景与运营商结算.md", "渠道结算模式规则.md"],
    platformFee: ["合作模式与分账.md", "渠道结算模式规则.md"],
    operators: ["运营商提现规则.md", "运营商信用评估方案.md", "用户-运营商归属模型.md"],
    operatorCreditEval: ["运营商信用评估方案.md"],
    depositManage: ["运营商信用评估方案.md", "合作模式与分账.md"],
    deviceBinding: ["PRD.md", "功能结构与业务流程.md"],
    l1Pricing: ["渠道结算模式规则.md", "天数池.md", "换电场景与运营商结算.md"],
    platformUsers: ["用户-运营商归属模型.md", "骑手电池押金.md", "骑手端PRD.md"],
    platformOrders: ["PRD.md"],
    platformDevices: ["PRD.md", "功能结构与业务流程.md"],
    platformChannels: ["渠道结算模式规则.md", "渠道信用评估方案.md"],
    platformMarketing: ["平台营销-PRD.md"],
    platformFlows: ["合作模式与分账.md", "运营商提现规则.md"],
    platformAccounts: ["合作模式与分账.md"],
    platformLeasing: ["融资管理-PRD.md", "合作模式与分账.md"],
    leaseAgreements: ["融资管理-PRD.md"],
    leaseCollect: ["融资管理-PRD.md"],
    leaseRent: ["融资管理-PRD.md"],
    financeManage: ["融资管理-PRD.md"],
    financeDrawdown: ["融资管理-PRD.md"],
    partnerOverview: ["站点合伙人.md", "合伙人站点分佣.md"],
    partnerBindings: ["站点合伙人.md", "合伙人站点分佣.md"],
    partnerLedger: ["合伙人站点分佣.md", "站点合伙人.md"],
    partnerWithdraw: ["站点合伙人.md", "运营商提现规则.md"],
    partnerAccount: ["站点合伙人.md"]
  };

  /**
   * 不参与进页关键词预匹配 / 相关文档推荐（仍可在文档目录手动打开）
   * 含：变更流水、验收与评审、竞品与拍板、任务专篇、待讨论等
   */
  const CONTEXT_DEMOTE_FILES = [
    "产品变更记录.md",
    "原型变更记录.md",
    "acceptance-criteria.md",
    "最小埋点清单.md",
    "设计评审报告.md",
    "2026-06-16会议对齐决议.md",
    "需求评审决策记录.md",
    "税筹与分账结构参考方案.md",
    "税收-待讨论.md",
    "竞品功能清单.md",
    "竞品借鉴决策记录.md",
    "竞品借鉴-待评审拍板.md",
    "任务-订单变更审计.md",
    "任务-设备告警与ICCID.md",
    "任务-美团类SDK对接.md",
    "待考虑内容.md",
    "user-stories.md",
    "站点合伙人-待定.md",
    "业务文档写作规范.md"
  ];

  const CONTEXT_BUSINESS_GROUPS = ["业务与结算", "产品需求", "结构与清单"];

  function allDocs() {
    return DOC_GROUPS.flatMap(g => g.items.map(it => ({ ...it, group: g.title })));
  }

  function isContextDemoted(file) {
    return CONTEXT_DEMOTE_FILES.includes(file);
  }

  function isBusinessGroup(group) {
    return CONTEXT_BUSINESS_GROUPS.includes(group);
  }

  function isPrototypePath() {
    return /\/prototype(\/|$)/.test(location.pathname);
  }

  /** md 文件绝对 URL（相对当前页面） */
  function docFileUrl(file) {
    const parts = String(file).split("/").map(encodeURIComponent);
    const base = isPrototypePath()
      ? new URL("docs/md/", location.href)
      : new URL("documentation/md/", location.href);
    return new URL(parts.join("/"), base).href;
  }

  /** 独立文档页入口（含 ?file=） */
  function docsViewerUrl(file, anchor) {
    const page = isPrototypePath() ? "docs/index.html" : "documentation/index.html";
    let url = page + "?file=" + encodeURIComponent(file);
    if (anchor) url += "#" + encodeURIComponent(anchor);
    return new URL(url, location.href).href;
  }

  /** 文档页内相对 md/ 的 URL（docs/index.html 专用） */
  function docFileUrlFromDocsPage(file) {
    const parts = String(file).split("/").map(encodeURIComponent);
    return new URL("md/" + parts.join("/"), location.href).href;
  }

  /** 当前页对使用者的含义说明（角色场景下的业务释义） */
  const VIEW_PAGE_MEANING = {
    overview: "当前登录角色的经营总览，看核心指标与站点或设备概况，用于日常巡检而非下钻改数。",
    orderService: "订单与服务总入口：购买订单、换电、用户押金、冻结、变更记录与退款等子页。",
    accounts: "运营商或渠道的收款子商户与结算卡配置；未绑定结算卡不可提现。",
    activationCodes: "激活码模式下渠道批发码库存；一码一用，核销后向签约运营商计提平台服务费。",
    activationRecords: "激活码核销开通套餐的历史记录；用户不经平台在线付款。",
    channelCredit: "渠道商在统管押金模式下的信用评估、额度抵扣与缺口补缴凭证。",
    channelInterOp: "设备租赁渠道开通跨网后的往来清算摘要；跨网费由渠道承担相关规则。",
    channelLinks: "链接类分销渠道的推广链接与二维码生成；用户按专享价直购，渠道不可改价。",
    channelOrders: "链接类渠道带来的用户购卡成交记录，含归因来源与支付清分结果。",
    channelSales: "运营商维护签约渠道、渠道订单与已售权益；平台侧另有只读监管。",
    channelSettlement: "当前渠道主体适用的结算模式说明，含人天池、链接类、设备租赁与激活码的关键规则入口。",
    commissionStatement: "链接类渠道佣金月度对账；默认线下结算，可选支付时及时到付。",
    dayPool: "渠道商向签约运营商买来的人天库存总入口；下面各 Tab 分别管池台账、骑手、分配与消耗。",
    dayPool_alloc: "本页把池里的人天分给（或收回）具体骑手；分配后服务开通。池余额与预警在「额度池」列表看。",
    dayPool_alloc_logs: "本页是分配/收回操作流水，用于审计谁在何时给谁加减了多少天。",
    dayPool_consume: "本页按日看骑手是否确认消耗人天（换电或持电池），以及团队汇总；对应每日预占确认结果。",
    dayPool_exceptions: "本页处理预占失败、余额不足等异常批次，支持手动或续费后重试。",
    dayPool_ledger: "本页是额度池的全链路变动明细（采购入账、分配、预占/确认、回池、调账等），用来对账追溯，不是改余额的操作台。",
    dayPool_pools: "本页是「池库存台账」：按签约运营商查看总购、赠送、预占、已消耗与可用余额，并对低余额预警；点开单池看详情/续费。给人配天数请去「额度分配」，本页不配额度。",
    dayPool_retail: "二期演示：人天相关零售价组合；非一期主路径。",
    dayPool_riders: "本页登记渠道骑手并编入团队、查看在职与剩余额度；零额度骑手会在此聚焦。给人加减天数仍在「额度分配」。",
    dayPool_teams: "本页维护骑手团队，并绑定消耗哪个额度池；同运营商下多团队可共用一池。",
    depositAccount: "运营商向平台缴纳的服务保证金账户与充值申请；与骑手电池押金不是同一笔钱。",
    depositManage: "平台侧保证金专户、运营商充值确认与信用额度调整；调额不得高于档位封顶。",
    deviceBinding: "平台将物联网设备绑定至运营商的唯一入口；未绑定前运营商不可接入该设备。",
    devices: "运营商名下换电柜与电池台账，含告警处置与物联网卡摘要；设备须先经平台绑定归属。",
    employees: "当前主体下的运营员工账号与菜单权限，数据范围仅限所属主体。",
    financeDrawdown: "资方侧放款申请的尽调、登记放款与还款确认；运营商不可自行登记放款。",
    financeManage: "运营商以柜电资产向资方申请融资放款的二期台账，含授信、资产包与还款日历。",
    flows: "运营商资金视角的实收、清分与提现申请；清分不等于提现，三台账不可混看。",
    interOp: "跨运营商换电产生的平台代收代付往来明细；运营商只见平台侧，不见对手方名称。",
    l1Pricing: "平台发布的跨网服务费与人天标准日值统价；运营商只读，改价不追溯历史。",
    leaseAgreements: "资方与运营商设备租赁协议及关联设备清单；须平台先建立绑定关系。",
    leaseBatteryHold: "设备租赁渠道名下骑手当前持有电池的只读台账。",
    leaseCollect: "资方按账期跟踪各承租方租金收缴进度与逾期情况。",
    leasePkgOrders: "白名单付费用户购买渠道套餐的订单记录；运营商退款管理不处理该笔。",
    leasePkgPricing: "设备租赁渠道自定的白名单套餐定价；款进渠道子商户，平台支付成功抽成。",
    leaseRent: "运营商向资方缴纳设备月租金的跟踪；须手动扫码或对公打款，不做自动扣款。",
    leaseWhitelist: "设备租赁专属站点的白名单用户维护；区分免费白名单与须购套餐的付费白名单。",
    operatorCreditEval: "平台对运营商的入网定档与年度复审；决定建议保证金、信用封顶与跨网默认。",
    operators: "平台对运营商主体的治理入口，含清分账户摘要、提现审核与准入档位展示。",
    orderAudit: "跨模块订单与服务生命周期审计时间线，把冻结、消耗、换电、退款等动作串成一条故事。",
    orderFreeze: "个人套餐服务的冻结与解冻记录；满足规则时系统自动生效，本页只读追溯。",
    orderPackage: "个人用户购买的包月或次卡订单台账；可查支付与服务状态，改价只影响新单，退款请到「退款管理」。",
    orderSwap: "骑手每次换电行为记录，含权益来源与三方归属；用于核对换电与跨网计费，不是购卡订单。",
    orderUserDeposit: "骑手电池押金的实付与退押台账，与套餐订单解耦；同一用户可因换运营商产生多笔。退押审批在「退款管理」。",
    partnerAccount: "合伙人分型开户资料与收款账户维护；未开户不可绑站与提现。",
    partnerBindings: "合伙人查看各绑定站点的当前分润比例；比例由运营商配置，本人不可修改。",
    partnerLedger: "合伙人分润明细，来源于个人用户确认收入按站比例切分的记录。",
    partnerOverview: "站点合伙人只读经营总览，看累计与本月分润及绑定站点摘要。",
    partnerWithdraw: "合伙人向运营商发起分润提现申请；须已开户，由运营商审核打款。",
    platformAccounts: "平台自有收款商户与本月营收构成汇总。",
    platformChannels: "挂在运营商管理下的渠道商只读监管；平台不新增或编辑渠道主体。",
    platformDevices: "全平台设备台账、全量告警与物联网卡维护；仅平台可批量导入与绑定。",
    platformFee: "平台向本运营商计提的技术服务费账单，含个人支付分账与渠道人天确认消耗计提。",
    platformFlows: "全平台用户支付、运营商间跨网设备费与平台提成的流水监管。",
    platformLeasing: "平台维护设备租赁公司与运营商绑定关系；绑定后资方方可对该运营商放款。",
    platformMarketing: "平台向自愿参与运营商投放立减券获客的二期能力；用户款进锁定运营商。",
    platformOrders: "全平台套餐、换电与渠道批发订单的只读查询与监管。",
    platformService: "运营商侧平台服务总入口：保证金、平台服务费与往来账等子页。",
    platformUsers: "全平台骑手用户监管视图，含服务运营商、押金方式与持有电池摘要。",
    pricing: "运营商侧定价与规则配置入口，含套餐价、押金、渠道专享价、换电范围与人天批发价。",
    refundManage: "个人套餐退订、中途完结与押金退押的申请、审核与执行台，不是流水查询页。",
    rentDevices: "设备租赁模式下渠道租用的柜机与电池清单，增删设备不改月租除非重签。",
    rentPool: "设备租赁模式下渠道向运营商支付统一月租的账单与履约状态。",
    siteExpenses: "站点场费与电费等经营成本账单；属于运营商付给场地方的成本，不是骑手套餐流水。",
    sitePartners: "站点合伙人档案、分型开户与分润绑定；影响个人用户收入的站点切分。",
    sites: "本运营商名下站点档案与经营配置入口，含信息维护、场费电费与合伙人绑定。",
    users: "本运营商侧骑手档案摘要，含在押押金、信用免押与套餐服务状态。",
  };

  /** 本页做什么 / 不做什么（补充 meaning，避免只念路径） */
  const VIEW_PAGE_SCOPE = {
    overview: {
      does: "看本角色核心经营指标、站点或设备概况与待办摘要。",
      notDoes: "不在此办理业务变更；下钻请到对应专页。"
    },
    orderService: {
      does: "从子 Tab 进入购买订单、换电、押金、冻结、审计或退款办理。",
      notDoes: "本入口本身不改价、不分配人天。"
    },
    dayPool: {
      does: "进入额度池、骑手、分配、消耗等子页管理人天库存。",
      notDoes: "具体操作请下钻到对应 Tab，本入口仅总览导航。"
    },
    accounts: {
      does: "维护进件子商户与默认结算卡，供清分入账与提现使用。",
      notDoes: "不在此审核提现或调整保证金。"
    },
    activationCodes: {
      does: "申请批发激活码、标记发放，并查看库存与作废状态。",
      notDoes: "一码不可重复使用；作废须运营商确认且无在线退款。"
    },
    activationRecords: {
      does: "查激活码核销开通套餐的历史与用户归属。",
      notDoes: "用户不经平台在线付款，也不在此补发新码。"
    },
    channelCredit: {
      does: "看渠道信用额度、应押抵扣与缺口，并提交线下打款凭证。",
      notDoes: "不适用于链接分销（用户直购走个人押金规则）。"
    },
    channelInterOp: {
      does: "查看租赁渠道跨网换电产生的平台代收代付摘要。",
      notDoes: "不见对手运营商名称，也不在此手工日清。"
    },
    channelLinks: {
      does: "生成推广链接与二维码，查看点击与成交统计。",
      notDoes: "不可改专享价（在运营商「渠道分销价」配置）。"
    },
    channelOrders: {
      does: "查经本渠道链接成交的购卡订单与归因来源。",
      notDoes: "不处理退款（运营商「退款管理」）或改佣金规则。"
    },
    channelSales: {
      does: "签约渠道、查看批发订单与已售额度池，并可调渠道信用额度。",
      notDoes: "不在此替渠道分配人天或登记骑手（渠道侧办理）。"
    },
    channelSettlement: {
      does: "查看本渠道签约的结算模式说明与对应规则入口。",
      notDoes: "不在此切换结算模式或代替运营商审批发单。"
    },
    commissionStatement: {
      does: "按月对账链接类渠道应得佣金与已结状态。",
      notDoes: "不办理人天池批发结算或跨网设备费清分。"
    },
    dayPool_alloc: {
      does: "把池人天分给/收回骑手，分配后开通服务。",
      notDoes: "不在此看池总库存预警（回「额度池」列表）。"
    },
    dayPool_alloc_logs: {
      does: "查分配与收回操作流水。",
      notDoes: "不在此直接改分配结果。"
    },
    dayPool_consume: {
      does: "按日核对预占是否确认为消耗，及团队汇总。",
      notDoes: "不在此采购或分配人天。"
    },
    dayPool_exceptions: {
      does: "处理预占失败、余额不足等异常批次，可重试。",
      notDoes: "不在此采购额度或给人分配。"
    },
    dayPool_ledger: {
      does: "按流水对账：采购、分配、预占/确认、回池、调账。",
      notDoes: "不在此直接改池余额或给人分配。"
    },
    dayPool_pools: {
      does: "看各池库存与可用余额、低余额预警；点开单池看详情与续费入口。",
      notDoes: "不给人配天数（去「额度分配」）；不查变动流水（去「额度明细」）。"
    },
    dayPool_retail: {
      does: "二期演示人天相关零售价组合。",
      notDoes: "非一期主路径，不替代批发采购。"
    },
    dayPool_riders: {
      does: "登记骑手、编团队、看剩余额度与零额度聚焦。",
      notDoes: "不在此加减天数（去「额度分配」）。"
    },
    dayPool_teams: {
      does: "维护骑手团队并绑定消耗池。",
      notDoes: "不在此给人加减天数（去「额度分配」）。"
    },
    depositAccount: {
      does: "查看服务保证金余额与信用摘要，并提交对公充值申请。",
      notDoes: "不管理骑手电池押金，也不能自行调高信用封顶。"
    },
    depositManage: {
      does: "平台确认运营商保证金充值、手工调额与变动账本。",
      notDoes: "调信用额度不得超过该运营商档位封顶。"
    },
    deviceBinding: {
      does: "平台将物联网设备绑定至指定运营商，绑定后运营商方可管理。",
      notDoes: "运营商不可自行绑定未归属设备。"
    },
    devices: {
      does: "看本主体柜机与电池台账，处置告警并查看物联网卡摘要。",
      notDoes: "不在此绑定新设备归属（平台「设备绑定」）。"
    },
    employees: {
      does: "维护员工账号与菜单权限，控制可见模块与数据范围。",
      notDoes: "不替代经营主体登录，也不跨主体管理账号。"
    },
    financeDrawdown: {
      does: "二期：资方录入授信、尽调批次、登记放款并确认还款工单。",
      notDoes: "不做银行自动核销；运营商不可在此登记放款。"
    },
    financeManage: {
      does: "二期：运营商组资产包、提交放款申请、看授信占用与还款日历。",
      notDoes: "不能自行登记放款或跳过资方尽调。"
    },
    flows: {
      does: "看资金实收、清分明细与提现申请及占用额度。",
      notDoes: "不在此做支付清分或审核提现（平台审）。"
    },
    interOp: {
      does: "查跨网设备服务费的平台代收代付明细与日清批次。",
      notDoes: "不见对手方名称，也不在此改跨网统价。"
    },
    l1Pricing: {
      does: "平台维护跨网服务费与人天标准日值及城市覆盖与预警短信。",
      notDoes: "运营商只读；改价不追溯已发生换电与人天计提。"
    },
    leaseAgreements: {
      does: "资方查看与运营商的租赁协议及关联设备清单。",
      notDoes: "与融资借据链路分离；直租租金轨道已移除，以融资台账为准。"
    },
    leaseBatteryHold: {
      does: "只读查看白名单骑手当前持有哪块电池。",
      notDoes: "不在此强制还电或改白名单资格。"
    },
    leaseCollect: {
      does: "资方按账期跟踪租金收缴进度、方式与逾期。",
      notDoes: "不做银行流水自动核销或发票总账。"
    },
    leasePkgOrders: {
      does: "查白名单用户购渠道套餐的成交记录。",
      notDoes: "运营商不在此审退该笔（渠道侧或约定流程处理）。"
    },
    leasePkgPricing: {
      does: "配置白名单用户可购的渠道自定套餐与零售价。",
      notDoes: "不改运营商个人套餐价；款不进运营商子商户。"
    },
    leaseRent: {
      does: "查看与登记运营商月租金缴纳；支持扫码或对公打款工单。",
      notDoes: "不做自动扣款；欠费停服规则见设备租赁专文。"
    },
    leaseWhitelist: {
      does: "维护专属站白名单用户，区分免费与须购套餐的付费类型。",
      notDoes: "不含团队编制；非白名单用户不可在该专属站取电。"
    },
    operatorCreditEval: {
      does: "平台配置档位政策、审批定档与升降档，并留变更记录。",
      notDoes: "不限制可签渠道家数，也不替代保证金日清规则。"
    },
    operators: {
      does: "平台查看与治理运营商主体、清分账户、提现审核入口与档位摘要。",
      notDoes: "不在此编辑运营商个人套餐定价或操作渠道额度池。"
    },
    orderAudit: {
      does: "按用户或单号串读套餐、人天、换电、退款等关键变更时间线。",
      notDoes: "不替代各业务模块自己的订单列表，也不写入新事件。"
    },
    orderFreeze: {
      does: "查个人套餐冻结与解冻的时间线及操作人。",
      notDoes: "不在此直接办理冻结（骑手端或业务规则触发）。"
    },
    orderPackage: {
      does: "查个人套餐订单的支付、服务期与价格快照；跳转关联换电与退款。",
      notDoes: "不在此发起退款或改套餐价（分别去「退款管理」「定价管理」）。"
    },
    orderSwap: {
      does: "查每次换电的时间、站点、权益来源与跨网费用构成。",
      notDoes: "不在此修改换电结果或手工扣减人天。"
    },
    orderUserDeposit: {
      does: "查骑手电池押金实付与退押状态。",
      notDoes: "不在此发起退押审批（去「退款管理」）。"
    },
    partnerAccount: {
      does: "合伙人维护个人或公司开户资料与收款账户。",
      notDoes: "未开户不可绑站、不可提现；类型建档后不可改。"
    },
    partnerBindings: {
      does: "合伙人只读查看各站当前分润比例与绑定关系。",
      notDoes: "不能自行改比例或新增绑定（运营商在站点配置）。"
    },
    partnerLedger: {
      does: "合伙人按站与日期查本人分润切分行。",
      notDoes: "不含渠道人天、跨网费或设备租赁白名单收入。"
    },
    partnerOverview: {
      does: "合伙人只看累计与本月分润、绑定站摘要与最近分润。",
      notDoes: "不能改比例、站点或定价设备。"
    },
    partnerWithdraw: {
      does: "合伙人向运营商发起分润提现并跟踪审核状态。",
      notDoes: "不由平台审核；须已开户且绑定收款账户。"
    },
    platformAccounts: {
      does: "查看平台自有收款商户与本月营收构成。",
      notDoes: "不含运营商子商户余额或骑手押金。"
    },
    platformChannels: {
      does: "只读监管各运营商下挂渠道主体与经营摘要。",
      notDoes: "平台不新增或编辑渠道主体（运营商「渠道销售」维护）。"
    },
    platformDevices: {
      does: "全平台设备台账、批量导入、全量告警与物联网卡维护。",
      notDoes: "不在此替运营商处置本主体告警（运营商「我的设备」）。"
    },
    platformFee: {
      does: "查平台向本运营商计提的技术服务费，含个人支付与渠道消耗两类。",
      notDoes: "不含跨网设备费（在「运营商往来账」）或合伙人切分。"
    },
    platformFlows: {
      does: "监管全平台用户支付、跨网日清与平台提成流水。",
      notDoes: "不在此替运营商申请提现或确认保证金充值。"
    },
    platformLeasing: {
      does: "维护租赁公司档案及其与运营商的绑定关系。",
      notDoes: "绑定前资方不可对该运营商发起放款或签约。"
    },
    platformMarketing: {
      does: "二期：平台建活动、签运营商、发带锁定运营商的推广链与对账。",
      notDoes: "平台不代收用户套餐款；与渠道分销链接类并行不互替。"
    },
    platformOrders: {
      does: "全平台只读查套餐、换电与渠道批发订单及三元组摘要。",
      notDoes: "不在此审核退款或分配渠道人天。"
    },
    platformService: {
      does: "从保证金、服务费、往来账等子页进入平台服务相关办理。",
      notDoes: "不在此改统价或绑定设备。"
    },
    platformUsers: {
      does: "全平台查用户信息、服务运营商、押金方式与持有电池。",
      notDoes: "不在此办理退款或改运营商定价。"
    },
    pricing: {
      does: "配置套餐通用价与新人价、押金金额、换电范围与渠道专享价。",
      notDoes: "不在此改已购订单价格或处理退款。"
    },
    refundManage: {
      does: "办理冷静期、中途完结与押金退押的审核与执行。",
      notDoes: "不在此查押金实付流水明细（去「用户押金」）。"
    },
    rentDevices: {
      does: "查看渠道租用的柜机与电池清单及在服状态。",
      notDoes: "增删设备不自动改月租，也不在此做融资资产替换。"
    },
    rentPool: {
      does: "查看设备租赁月租账单与欠费停服状态。",
      notDoes: "不在此修改统一月租金额（须重签协议）。"
    },
    siteExpenses: {
      does: "登记与跟踪站点场费、电费等周期账单及支付状态。",
      notDoes: "不计入个人用户套餐收入，也不做合伙人分润切分。"
    },
    sitePartners: {
      does: "建合伙人档案、完成开户，并查看分润绑定一览与明细。",
      notDoes: "不在此改站点基础信息（去「站点管理」）。"
    },
    sites: {
      does: "维护站点信息与场费电费，并从站点入口配置合伙人比例。",
      notDoes: "不在此处理骑手订单或设备远程运维。"
    },
    users: {
      does: "查本运营商骑手档案、押金摘要与服务状态，可按押金类型筛选。",
      notDoes: "不在此办理退押或改归属运营商。"
    },
  };

  /**
   * 来源与前置（全量：与 VIEW_PAGE_MEANING 对齐）
   * links.key 为 doc 面板 viewKey，点击跳转原型页
   */
  const VIEW_PAGE_LINEAGE = {
    dayPool_pools: {
      upstream: "渠道向签约运营商采购人天额度后，在此形成各池库存台账。",
      sources: "批发采购单、续费入账、平台调账。",
      downstream: "团队绑定消耗池 → 分配给骑手 → 每日预占与确认消耗。",
      links: [
        { key: "dayPool_teams", label: "骑手团队" },
        { key: "dayPool_ledger", label: "额度明细" },
        { key: "dayPool_alloc", label: "额度分配" }
      ]
    },
    dayPool_ledger: {
      upstream: "池内每一笔变动均来自采购、分配、预占/确认、回池或调账动作。",
      sources: "额度池列表、额度分配、消耗确认与异常重试。",
      downstream: "对账追溯；不直接改余额。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "dayPool_alloc", label: "额度分配" },
        { key: "dayPool_consume", label: "消耗确认" }
      ]
    },
    dayPool_riders: {
      upstream: "渠道骑手须先登记并编入团队，团队决定消耗哪个池。",
      sources: "渠道录入、团队绑定关系。",
      downstream: "额度分配开通服务；零额度骑手在此聚焦。",
      links: [
        { key: "dayPool_teams", label: "骑手团队" },
        { key: "dayPool_alloc", label: "额度分配" },
        { key: "dayPool_pools", label: "额度池列表" }
      ]
    },
    dayPool_teams: {
      upstream: "团队是骑手组织单元，并绑定本团队消耗的人天额度池。",
      sources: "渠道维护团队与池绑定。",
      downstream: "骑手登记、消耗确认按团队汇总。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "dayPool_riders", label: "骑手列表" },
        { key: "dayPool_consume", label: "消耗确认" }
      ]
    },
    dayPool_alloc: {
      upstream: "池有余额且骑手已登记在编，方可在此加减人天。",
      sources: "额度池可用余额、骑手档案。",
      downstream: "骑手服务开通/收回；写入分配流水与额度明细。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "dayPool_riders", label: "骑手列表" },
        { key: "dayPool_alloc_logs", label: "分配流水" }
      ]
    },
    dayPool_alloc_logs: {
      upstream: "每次在「额度分配」上的分配或收回操作。",
      sources: "额度分配页操作记录。",
      downstream: "同步记入额度明细，供对账审计。",
      links: [
        { key: "dayPool_alloc", label: "额度分配" },
        { key: "dayPool_ledger", label: "额度明细" }
      ]
    },
    dayPool_consume: {
      upstream: "每日对骑手换电/持电池行为做预占，需在此确认是否消耗人天。",
      sources: "团队绑定池、换电/持电池行为、预占批次。",
      downstream: "池余额扣减；失败批次进入异常处理。",
      links: [
        { key: "dayPool_teams", label: "骑手团队" },
        { key: "dayPool_exceptions", label: "异常处理" },
        { key: "dayPool_ledger", label: "额度明细" }
      ]
    },
    dayPool_exceptions: {
      upstream: "预占失败、余额不足等异常批次从消耗确认链路产生。",
      sources: "消耗确认预占结果。",
      downstream: "手动重试或续费/分配后回到主路径。",
      links: [
        { key: "dayPool_consume", label: "消耗确认" },
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "dayPool_alloc", label: "额度分配" }
      ]
    },
    dayPool_retail: {
      upstream: "二期：人天相关零售价组合配置。",
      sources: "平台/运营商定价策略。",
      downstream: "零售售卖演示；不替代批发采购主路径。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" }
      ]
    },
    orderPackage: {
      upstream: "个人用户在 C 端或渠道链接购买包月/次卡，支付成功后写入。",
      sources: "支付成功订单、定价配置。",
      downstream: "换电权益生效；可能触发冻结或退款申请。",
      links: [
        { key: "orderSwap", label: "换电订单" },
        { key: "orderFreeze", label: "冻结记录" },
        { key: "refundManage", label: "退款管理" }
      ]
    },
    orderSwap: {
      upstream: "骑手持有效套餐在站点换电时产生。",
      sources: "购买订单权益、换电行为日志。",
      downstream: "消耗核对、跨网结算；记入变更记录。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderAudit", label: "变更记录" }
      ]
    },
    orderUserDeposit: {
      upstream: "购套餐同笔实付或单独缴纳电池押金时入账。",
      sources: "支付流水；与套餐订单解耦。",
      downstream: "退押审批与执行在「退款管理」。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "refundManage", label: "退款管理" }
      ]
    },
    orderFreeze: {
      upstream: "个人套餐服务因规则触发冻结或解冻。",
      sources: "订单状态、系统自动判定。",
      downstream: "解冻后恢复换电；事件写入变更记录。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderAudit", label: "变更记录" }
      ]
    },
    orderAudit: {
      upstream: "订单与服务全生命周期中的关键动作聚合。",
      sources: "购卡、换电、冻结、退款等各模块事件。",
      downstream: "审计追溯一条时间线故事。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderSwap", label: "换电订单" },
        { key: "refundManage", label: "退款管理" }
      ]
    },
    refundManage: {
      upstream: "用户申请退订/中途完结，或押金退押需审核执行。",
      sources: "购买订单、用户押金台账。",
      downstream: "审核通过后退款执行；记入变更记录。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderUserDeposit", label: "用户押金" },
        { key: "orderAudit", label: "变更记录" }
      ]
    },
    overview: {
      upstream: "登录后默认入口，汇总本角色可见的经营与待办。",
      sources: "各业务模块指标聚合。",
      downstream: "发现异常后下钻到对应专页办理。",
      links: [
        { key: "flows", label: "资金流水" },
        { key: "devices", label: "我的设备" },
        { key: "orderService", label: "订单与服务" }
      ]
    },
    orderService: {
      upstream: "运营商侧个人用户订单与服务办理总入口。",
      sources: "C 端购卡、换电、押金与退款申请。",
      downstream: "各子 Tab 分别查流水或办理审核。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderUserDeposit", label: "用户押金" },
        { key: "refundManage", label: "退款管理" }
      ]
    },
    dayPool: {
      upstream: "人天池渠道签约运营商后，在此管理人天库存全链路。",
      sources: "批发采购、渠道运营动作。",
      downstream: "采购入账 → 登记分配 → 每日消耗确认。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "dayPool_riders", label: "骑手列表" },
        { key: "dayPool_alloc", label: "额度分配" }
      ]
    },
    accounts: {
      upstream: "主体须完成支付进件方可收清分款。",
      sources: "微信支付子商户进件、结算卡绑定。",
      downstream: "清分入账后可在「资金流水」提现。",
      links: [
        { key: "flows", label: "资金流水" },
        { key: "channelLinks", label: "套餐与链接" }
      ]
    },
    activationCodes: {
      upstream: "激活码模式渠道向运营商批发码库存。",
      sources: "运营商确认到账后的批发单。",
      downstream: "码发放给用户 → 核销开通 → 计提平台费。",
      links: [
        { key: "activationRecords", label: "核销记录" },
        { key: "channelSettlement", label: "结算模式" },
        { key: "channelCredit", label: "渠道信用" }
      ]
    },
    activationRecords: {
      upstream: "用户输入有效激活码核销时产生。",
      sources: "激活码库存、用户开通请求。",
      downstream: "套餐开通、平台服务费计提、变更记录。",
      links: [
        { key: "activationCodes", label: "激活码库存" },
        { key: "orderAudit", label: "变更记录" }
      ]
    },
    channelCredit: {
      upstream: "统管押金模式下渠道须评估信用与缺口补缴。",
      sources: "平台押金标准、骑手规模、线下打款凭证。",
      downstream: "信用抵扣生效；缺口久未补缴可升级提醒。",
      links: [
        { key: "channelSettlement", label: "结算模式" },
        { key: "channelSales", label: "渠道销售" }
      ]
    },
    channelInterOp: {
      upstream: "设备租赁渠道开通跨网换电后产生往来。",
      sources: "跨网换电清分、平台日清批次。",
      downstream: "渠道承担相关跨网费；保证金/信用扣款。",
      links: [
        { key: "rentPool", label: "月租账单" },
        { key: "interOp", label: "运营商往来账" }
      ]
    },
    channelLinks: {
      upstream: "运营商授权套餐并配置渠道专享价后，渠道可生成推广链。",
      sources: "定价管理·渠道分销价、授权套餐列表。",
      downstream: "用户购卡 → 渠道订单 → 佣金对账。",
      links: [
        { key: "channelOrders", label: "渠道订单" },
        { key: "commissionStatement", label: "佣金对账" },
        { key: "pricing", label: "定价管理" }
      ]
    },
    channelOrders: {
      upstream: "用户经本渠道推广链接/二维码成交购卡。",
      sources: "24h 归因窗口内的支付成功订单。",
      downstream: "佣金对账；退款走运营商退款管理。",
      links: [
        { key: "channelLinks", label: "套餐与链接" },
        { key: "commissionStatement", label: "佣金对账" },
        { key: "orderPackage", label: "购买订单" }
      ]
    },
    channelSales: {
      upstream: "运营商与渠道签约并维护批发关系。",
      sources: "渠道合同、批发订单、已售权益。",
      downstream: "渠道侧登记骑手/购额度；平台只读监管。",
      links: [
        { key: "dayPool_pools", label: "额度池列表" },
        { key: "channelCredit", label: "渠道信用" },
        { key: "platformChannels", label: "渠道商管理" }
      ]
    },
    channelSettlement: {
      upstream: "渠道主体签约时确定结算模式（人天池/链接/租赁/激活码）。",
      sources: "渠道合同与模式规则专文。",
      downstream: "决定后续菜单与押金、批发、佣金路径。",
      links: [
        { key: "dayPool", label: "人天额度池" },
        { key: "channelLinks", label: "套餐与链接" },
        { key: "rentPool", label: "月租账单" }
      ]
    },
    commissionStatement: {
      upstream: "链接类渠道用户购卡清分后，按月汇总应得佣金。",
      sources: "渠道订单、即时分账或线下结算标记。",
      downstream: "渠道确认对账；不涉及人天池批发结算。",
      links: [
        { key: "channelOrders", label: "渠道订单" },
        { key: "channelLinks", label: "套餐与链接" },
        { key: "accounts", label: "收款账户" }
      ]
    },
    depositAccount: {
      upstream: "运营商入网定档后须向平台缴纳服务保证金。",
      sources: "对公充值申请、平台确认到账。",
      downstream: "保证金用于跨网扣款；信用额度在档位封顶内。",
      links: [
        { key: "platformService", label: "平台服务" },
        { key: "interOp", label: "运营商往来账" },
        { key: "operatorCreditEval", label: "信用评估" }
      ]
    },
    depositManage: {
      upstream: "运营商提交保证金充值后，平台侧确认与调账。",
      sources: "充值申请、银行流水、档位配置。",
      downstream: "账户余额更新；变动记入保证金账本。",
      links: [
        { key: "depositAccount", label: "服务保证金" },
        { key: "operatorCreditEval", label: "信用评估" }
      ]
    },
    deviceBinding: {
      upstream: "物联网设备入库后须绑定归属运营商。",
      sources: "平台设备台账、绑定操作。",
      downstream: "运营商可在「我的设备」管理与处置告警。",
      links: [
        { key: "platformDevices", label: "设备管理" },
        { key: "devices", label: "我的设备" }
      ]
    },
    devices: {
      upstream: "设备经平台绑定归属本运营商后方可接入。",
      sources: "物联网上报、平台绑定关系。",
      downstream: "换电服务依赖在线柜机；告警需处置。",
      links: [
        { key: "deviceBinding", label: "设备绑定" },
        { key: "sites", label: "站点管理" }
      ]
    },
    employees: {
      upstream: "经营主体创建员工并授予菜单权限。",
      sources: "主体管理员维护。",
      downstream: "员工登录后仅见授权模块与数据范围。",
      links: []
    },
    financeDrawdown: {
      upstream: "运营商提交资产包放款申请并通过尽调。",
      sources: "融资台账、授信项目、资产包。",
      downstream: "资方登记放款 → 运营商还款日历更新。",
      links: [
        { key: "financeManage", label: "融资管理" },
        { key: "platformLeasing", label: "租赁公司" }
      ]
    },
    financeManage: {
      upstream: "运营商以柜电资产向资方申请融资（二期）。",
      sources: "资产池、授信占用、尽调批次。",
      downstream: "放款后进入还款跟踪；不可自行登记放款。",
      links: [
        { key: "financeDrawdown", label: "放款申请" },
        { key: "leaseAgreements", label: "租赁协议" }
      ]
    },
    flows: {
      upstream: "用户支付清分、跨网与其他资金动作汇总。",
      sources: "支付成功、日清分账、提现申请。",
      downstream: "实收、清分明细与提现是三本账，分别查看。",
      links: [
        { key: "accounts", label: "收款账户" },
        { key: "orderPackage", label: "购买订单" },
        { key: "platformFee", label: "平台服务费" }
      ]
    },
    interOp: {
      upstream: "骑手跨运营商换电产生平台代收代付。",
      sources: "换电三元组、跨网统价、日清批次。",
      downstream: "从保证金/信用扣款；不见对手方名称。",
      links: [
        { key: "depositAccount", label: "服务保证金" },
        { key: "l1Pricing", label: "平台统价" },
        { key: "orderSwap", label: "换电订单" }
      ]
    },
    l1Pricing: {
      upstream: "平台维护跨网与人天标准价，运营商只读。",
      sources: "平台统价配置、城市覆盖。",
      downstream: "影响跨网计费与人天池计提基数；不追溯历史。",
      links: [
        { key: "interOp", label: "运营商往来账" },
        { key: "dayPool_pools", label: "额度池列表" }
      ]
    },
    leaseAgreements: {
      upstream: "平台建立租赁公司与运营商绑定后签署协议。",
      sources: "租赁协议、设备清单。",
      downstream: "月租金跟踪、放款与资产包关联。",
      links: [
        { key: "platformLeasing", label: "租赁公司" },
        { key: "leaseRent", label: "月租金" },
        { key: "financeManage", label: "融资管理" }
      ]
    },
    leaseBatteryHold: {
      upstream: "租赁渠道骑手持电池状态同步。",
      sources: "换电/持有行为、渠道设备归属。",
      downstream: "跨网往来与持电规则校验。",
      links: [
        { key: "rentDevices", label: "租赁设备" },
        { key: "channelInterOp", label: "渠道往来账" }
      ]
    },
    leaseCollect: {
      upstream: "资方按账期向承租运营商/渠道收缴租金。",
      sources: "租赁协议、账期计划。",
      downstream: "逾期跟踪；运营商在「月租金」侧履约。",
      links: [
        { key: "leaseRent", label: "月租金" },
        { key: "leaseAgreements", label: "租赁协议" }
      ]
    },
    leasePkgOrders: {
      upstream: "付费白名单用户购买渠道套餐。",
      sources: "白名单套餐价、渠道子商户收款。",
      downstream: "款进渠道；运营商退款管理不处理该笔。",
      links: [
        { key: "leasePkgPricing", label: "白名单套餐价" },
        { key: "leaseWhitelist", label: "白名单" }
      ]
    },
    leasePkgPricing: {
      upstream: "设备租赁渠道配置白名单专享套餐价。",
      sources: "运营商授权、电池型号与定价。",
      downstream: "白名单用户购卡 → 白名单订单。",
      links: [
        { key: "leaseWhitelist", label: "白名单" },
        { key: "leasePkgOrders", label: "白名单订单" }
      ]
    },
    leaseRent: {
      upstream: "运营商/渠道按租赁协议承担设备月租。",
      sources: "租赁设备清单、账期。",
      downstream: "手动扫码或对公打款履约；不做自动扣款。",
      links: [
        { key: "rentPool", label: "月租账单" },
        { key: "rentDevices", label: "租赁设备" }
      ]
    },
    leaseWhitelist: {
      upstream: "租赁专属站点须维护可换电白名单用户。",
      sources: "渠道运营录入、套餐购买（付费白名单）。",
      downstream: "持电台账与换电校验。",
      links: [
        { key: "leasePkgPricing", label: "白名单套餐价" },
        { key: "leaseBatteryHold", label: "持电台账" }
      ]
    },
    operatorCreditEval: {
      upstream: "运营商入网与年度复审定档。",
      sources: "经营数据、平台档位规则。",
      downstream: "建议保证金、信用封顶、跨网默认值。",
      links: [
        { key: "depositAccount", label: "服务保证金" },
        { key: "operators", label: "运营商管理" }
      ]
    },
    operators: {
      upstream: "平台治理运营商主体与准入。",
      sources: "入网资料、清分账户、提现申请。",
      downstream: "定档、保证金、渠道监管、提现审核。",
      links: [
        { key: "operatorCreditEval", label: "信用评估" },
        { key: "depositManage", label: "保证金管理" },
        { key: "platformChannels", label: "渠道商管理" }
      ]
    },
    partnerAccount: {
      upstream: "站点合伙人须分型开户并绑收款账户。",
      sources: "合伙人档案、开户资料。",
      downstream: "绑站、分润提现的前置条件。",
      links: [
        { key: "sitePartners", label: "站点合伙人" },
        { key: "partnerWithdraw", label: "提现结算" }
      ]
    },
    partnerBindings: {
      upstream: "运营商在站点配置合伙人及分润比例。",
      sources: "站点合伙人绑定、比例设定。",
      downstream: "个人用户收入按站切分 → 分润明细。",
      links: [
        { key: "sitePartners", label: "站点合伙人" },
        { key: "partnerLedger", label: "分润明细" }
      ]
    },
    partnerLedger: {
      upstream: "个人用户确认收入按站点合伙人比例切分。",
      sources: "清分结果、站点绑定关系。",
      downstream: "合伙人发起提现 → 运营商审核。",
      links: [
        { key: "partnerBindings", label: "我的站点" },
        { key: "partnerWithdraw", label: "提现结算" }
      ]
    },
    partnerOverview: {
      upstream: "合伙人登录后只看与己相关的分润摘要。",
      sources: "分润切分、绑定站点。",
      downstream: "下钻分润明细或发起提现。",
      links: [
        { key: "partnerLedger", label: "分润明细" },
        { key: "partnerBindings", label: "我的站点" }
      ]
    },
    partnerWithdraw: {
      upstream: "合伙人已开户且有待提分润时可申请。",
      sources: "分润明细累计、收款账户。",
      downstream: "运营商审核打款；不是平台审。",
      links: [
        { key: "partnerAccount", label: "收款账户" },
        { key: "partnerLedger", label: "分润明细" }
      ]
    },
    platformAccounts: {
      upstream: "平台自有收款商户汇总视角。",
      sources: "各商户交易、提成构成。",
      downstream: "监管营收构成；不含运营商子商户余额。",
      links: [
        { key: "platformFlows", label: "流水管理" },
        { key: "platformFee", label: "平台服务费" }
      ]
    },
    platformChannels: {
      upstream: "运营商签约的渠道主体在平台侧只读监管。",
      sources: "运营商「渠道销售」维护的数据镜像。",
      downstream: "平台看不替运营商编辑渠道。",
      links: [
        { key: "channelSales", label: "渠道销售" },
        { key: "operators", label: "运营商管理" }
      ]
    },
    platformDevices: {
      upstream: "全平台设备入库与归属治理。",
      sources: "物联网、批量导入、绑定操作。",
      downstream: "运营商「我的设备」只见已绑定设备。",
      links: [
        { key: "deviceBinding", label: "设备绑定" },
        { key: "devices", label: "我的设备" }
      ]
    },
    platformFee: {
      upstream: "平台向运营商计提技术服务费。",
      sources: "个人支付分账、渠道人天确认消耗等触发。",
      downstream: "计入平台服务账单；与骑手押金无关。",
      links: [
        { key: "platformService", label: "平台服务" },
        { key: "flows", label: "资金流水" },
        { key: "dayPool_consume", label: "消耗确认" }
      ]
    },
    platformFlows: {
      upstream: "全平台资金流水监管视角。",
      sources: "用户支付、跨网设备费、平台提成。",
      downstream: "对账与审计；不在此办理业务。",
      links: [
        { key: "platformOrders", label: "订单管理" },
        { key: "platformAccounts", label: "平台账户" }
      ]
    },
    platformLeasing: {
      upstream: "平台维护租赁公司与运营商绑定。",
      sources: "租赁公司档案、绑定关系。",
      downstream: "绑定后资方可对该运营商放款/收租。",
      links: [
        { key: "leaseAgreements", label: "租赁协议" },
        { key: "financeDrawdown", label: "放款申请" }
      ]
    },
    platformMarketing: {
      upstream: "二期：平台Campaign与运营商签约参与。",
      sources: "活动配置、推广链、成交订单。",
      downstream: "用户款进锁定运营商；与链接类分销并行。",
      links: [
        { key: "channelLinks", label: "套餐与链接" },
        { key: "platformOrders", label: "订单管理" }
      ]
    },
    platformOrders: {
      upstream: "全平台订单只读监管。",
      sources: "套餐、换电、渠道批发订单。",
      downstream: "不在此审核退款或分配人天。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderSwap", label: "换电订单" },
        { key: "channelSales", label: "渠道销售" }
      ]
    },
    platformService: {
      upstream: "运营商侧平台服务（保证金/服务费/往来）总入口。",
      sources: "充值、计提、跨网日清。",
      downstream: "各子 Tab 分别查账与申请。",
      links: [
        { key: "depositAccount", label: "服务保证金" },
        { key: "platformFee", label: "平台服务费" },
        { key: "interOp", label: "运营商往来账" }
      ]
    },
    platformUsers: {
      upstream: "全平台骑手用户监管视图。",
      sources: "各运营商用户档案、押金与服务状态。",
      downstream: "不在此办理退款或改定价。",
      links: [
        { key: "users", label: "用户管理" },
        { key: "orderUserDeposit", label: "用户押金" }
      ]
    },
    pricing: {
      upstream: "运营商配置售价、押金、换电范围与渠道价。",
      sources: "平台统价只读部分、本地定价策略。",
      downstream: "影响新单价格；已购订单不改价。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "channelLinks", label: "套餐与链接" },
        { key: "dayPool_pools", label: "额度池列表" }
      ]
    },
    rentDevices: {
      upstream: "设备租赁模式下渠道租用的柜机与电池。",
      sources: "租赁协议、设备清单。",
      downstream: "在服状态影响换电；增删不改月租除非重签。",
      links: [
        { key: "rentPool", label: "月租账单" },
        { key: "leaseWhitelist", label: "白名单" }
      ]
    },
    rentPool: {
      upstream: "租赁模式渠道按协议向运营商付统一月租。",
      sources: "租赁设备规模、账期账单。",
      downstream: "履约状态跟踪；与融资资产包可关联。",
      links: [
        { key: "rentDevices", label: "租赁设备" },
        { key: "channelSettlement", label: "结算模式" }
      ]
    },
    siteExpenses: {
      upstream: "站点场费与电费等经营成本。",
      sources: "场地方合同、抄表/账单录入。",
      downstream: "运营商付给场地方；与骑手套餐流水无关。",
      links: [
        { key: "sites", label: "站点管理" },
        { key: "sitePartners", label: "站点合伙人" }
      ]
    },
    sitePartners: {
      upstream: "站点配置合伙人开户与分润绑定。",
      sources: "合伙人档案、站点绑定与比例。",
      downstream: "影响个人用户收入的站点切分。",
      links: [
        { key: "sites", label: "站点管理" },
        { key: "partnerLedger", label: "分润明细" }
      ]
    },
    sites: {
      upstream: "运营商名下换电站点档案与经营配置。",
      sources: "建站信息、场费电费、合伙人绑定。",
      downstream: "公众开放站可购套餐换电；渠道专属站规则不同。",
      links: [
        { key: "sitePartners", label: "站点合伙人" },
        { key: "siteExpenses", label: "站点支出" },
        { key: "devices", label: "我的设备" }
      ]
    },
    users: {
      upstream: "支付成功后用户商业归属写入运营商。",
      sources: "购卡、押金、服务状态。",
      downstream: "退押走退款管理；归属不绑定具体站点。",
      links: [
        { key: "orderPackage", label: "购买订单" },
        { key: "orderUserDeposit", label: "用户押金" },
        { key: "platformUsers", label: "用户管理" }
      ]
    }
  };

  /**
   * 本页精选规则卡（优先于关键词碎片抽取）
   * summary 须可朗读；file/heading 供溯源
   */
  const VIEW_PAGE_RULES = {
    overview: [
      { summary: "总览用于日常巡检核心指标，如下单金额、活跃用户、设备在线与待办摘要。", file: "功能结构与业务流程.md", heading: "能力地图（按登录身份）" },
      { summary: "支付成功即清分，包月按日摊销只做报表，换电成功不再二次打款。", file: "功能结构与业务流程.md", heading: "支付成功后钱怎么走（白话）" },
      { summary: "资金实收、清分明细、提现与收入摊销是三本账，不可混在一个列表里看。", file: "功能结构与业务流程.md", heading: "核心流程索引（白话结论）" },
      { summary: "运营商总览可有保证金或信用低余额、设备告警等待办提醒。", file: "换电场景与运营商结算.md", heading: "后台落在哪" },
    ],
    orderService: [
      { summary: "订单与服务按子页办理：购买订单、换电、用户押金、冻结、变更记录与退款管理。", file: "功能结构与业务流程.md", heading: "能力地图（按登录身份）" },
      { summary: "退款不在购买订单列表直接办理，统一走退款管理。", file: "个人套餐定价与退款.md", heading: "后台落在哪" },
    ],
    accounts: [
      { summary: "收款账户须完成进件并绑定默认结算卡，否则不可发起提现。", file: "角色与功能清单.md", heading: "运营商功能表" },
      { summary: "架构下个人套餐款清分进入运营商子商户，提现须另走申请审核。", file: "合作模式与分账.md", heading: "C 端清分（已定）" },
      { summary: "链接类渠道若开佣金及时到付，须先开通渠道收款子商户。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
    ],
    activationCodes: [
      { summary: "渠道批发激活码须运营商确认到账后入库，一码一用，核销后开通套餐。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
      { summary: "用户输入激活码开通时不经平台在线付款。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
      { summary: "码核销成功时平台按标准人天价乘以码服务人天向签约运营商计提服务费。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
      { summary: "作废须运营商确认，无在线退款路径。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
    ],
    activationRecords: [
      { summary: "本页展示激活码核销开通套餐的历史，含用户归属运营商。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
      { summary: "平台服务费在码核销成功时计提，与批发单价无关。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
      { summary: "一码只能核销一次，重复输入应被拒绝。", file: "渠道结算模式规则.md", heading: "模式四：激活码（二期）" },
    ],
    channelCredit: [
      { summary: "人天池、设备租赁与激活码模式下骑手押金责任算在渠道商，链接分销不适用。", file: "渠道信用评估方案.md", heading: "适用 / 不适用" },
      { summary: "平台统一押金标准，信用额度按应押总额与等级抵扣比例计算，运营商可手工改最终额度。", file: "渠道信用评估方案.md", heading: "押金标准（平台统一）" },
      { summary: "渠道线下打款后提交凭证，由运营商审核通过后销账。", file: "渠道信用评估方案.md", heading: "缺口补缴" },
      { summary: "一期默认不因押金缺口阻断换电，连续久未补缴可升级提醒平台。", file: "渠道信用评估方案.md", heading: "缺口补缴" },
      { summary: "押金与渠道批发采购款分开，不从批发款里自动扣押金。", file: "渠道信用评估方案.md", heading: "适用 / 不适用" },
    ],
    channelInterOp: [
      { summary: "设备租赁渠道可选开通跨网，跨网设备费按租赁专规由渠道承担相关部分。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "跨网清分一律经平台日清，渠道只见平台代收代付摘要。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
      { summary: "扣款顺序为保证金优先，保证金为零才占用信用额度。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
    ],
    channelLinks: [
      { summary: "渠道生成推广链接或二维码后用户不可改价，按运营商配置的专享价购买。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "首次点击有效链接起二十四小时内购买该渠道授权套餐均享专享价并记渠道来源。", file: "渠道结算模式规则.md", heading: "24 小时归因窗口" },
      { summary: "窗口内再点同渠道其他链接不重置窗口；点到其他渠道链接则按最后触达重置。", file: "渠道结算模式规则.md", heading: "24 小时归因窗口" },
      { summary: "支付成功款进运营商子商户，平台实时分出技术服务费，可选佣金及时到付渠道。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
    ],
    channelOrders: [
      { summary: "本页展示经本渠道链接成交的用户购卡记录，含首触链接与渠道归因。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "链接购套餐不扣人天池，押金按个人用户交押或信用免押规则办理。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "过期未支付恢复正式零售价，从未点渠道链接的用户无渠道标记也无佣金。", file: "渠道结算模式规则.md", heading: "24 小时归因窗口" },
      { summary: "用户商业归属仍为售卖套餐的签约运营商，渠道标记只用于佣金统计。", file: "用户-运营商归属模型.md", heading: "支付与归属（架构 B）" },
    ],
    channelSales: [
      { summary: "渠道与运营商签约时四选一结算模式：人天池、链接类、设备租赁或激活码。", file: "渠道结算模式规则.md", heading: "一句话" },
      { summary: "一期每个渠道先只签一家运营商；用户跨网能力继承该运营商换电范围。", file: "渠道结算模式规则.md", heading: "共性规则" },
      { summary: "人天池批发款采购时已结清，运营商可在已售额度池做线下协商后的额度调减。", file: "天数池.md", heading: "钱与平台费" },
      { summary: "运营商可在签约详情调整渠道信用额度，但须留原因留痕。", file: "渠道信用评估方案.md", heading: "谁干什么" },
      { summary: "平台对渠道主体只读监管，新增与编辑由运营商在渠道销售办理。", file: "角色与功能清单.md", heading: "平台管理员" },
    ],
    channelSettlement: [
      { summary: "人天池模式下渠道先批发买人天再分给骑手，确认消耗时平台按标准人天价计提。", file: "渠道结算模式规则.md", heading: "模式一：人天额度池（一期）" },
      { summary: "链接类模式下用户经推广链直购套餐，支付成功实时清分，默认佣金线下月结。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "设备租赁与激活码属二期模式，白名单与核销规则各见对应专页。", file: "渠道结算模式规则.md", heading: "四模式对照（白话）" },
      { summary: "人天不足时不再引导骑手自费买应急套餐，只能还电并联系渠道续配。", file: "渠道结算模式规则.md", heading: "共性规则" },
    ],
    commissionStatement: [
      { summary: "链接类渠道默认佣金线下月结，平台提供月度佣金对账。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "若开启佣金及时到付，支付成功时同步分出渠道佣金至渠道子商户。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
      { summary: "人天池与激活码模式不走链接佣金对账，各自按批发或核销规则结算。", file: "渠道结算模式规则.md", heading: "四模式对照（白话）" },
    ],
    dayPool: [
      { summary: "人天池是渠道向运营商批发买来的 B 端额度库存，不是骑手自购的个人套餐。", file: "天数池.md", heading: "一句话" },
      { summary: "一签约运营商一个池；分配、消耗、异常分 Tab 办理。", file: "天数池.md", heading: "后台落在哪" },
    ],
    dayPool_alloc: [
      { summary: "管理员把池里的人天分给骑手后，服务立刻开通（从分配日起算）。", file: "天数池.md", heading: "分配与开通" },
      { summary: "能分配多少只受池可用余额与骑手个人剩余约束；已取消团队周期额度上限。", file: "天数池.md", heading: "池里有什么、谁管" },
      { summary: "骑手离职时未用完天数必须退回池子，且不向骑手退款。", file: "天数池.md", heading: "骑手离职 / 解绑" },
    ],
    dayPool_alloc_logs: [
      { summary: "分配与收回操作须留流水，用于审计谁在何时给谁加减了多少天。", file: "天数池.md", heading: "后台落在哪" },
      { summary: "骑手离职未用完天数回池须有回池记录。", file: "天数池.md", heading: "骑手离职 / 解绑" },
    ],
    dayPool_consume: [
      { summary: "当日有成功换电，或未换电但持有电池 → 确认消耗 1 人天；同日多次换电不重复扣。", file: "天数池.md", heading: "每天怎么扣人天" },
      { summary: "无换电且未持电池 → 日终释放预占，不算消耗。", file: "天数池.md", heading: "每天怎么扣人天" },
    ],
    dayPool_exceptions: [
      { summary: "池余额不够时整批预占失败，不允许透支或部分预占。", file: "天数池.md", heading: "每天怎么扣人天" },
      { summary: "异常批次可手动或续费后自动重试。", file: "天数池.md", heading: "后台落在哪" },
      { summary: "预占失败仍持电池时只能还电不能换电。", file: "天数池.md", heading: "额度不够或预占失败时" },
    ],
    dayPool_ledger: [
      { summary: "额度明细记录采购、分配、预占/确认、回池、调账等变动，用于对账，不在此直接改余额。", file: "天数池.md", heading: "后台落在哪" },
      { summary: "一运营商一池；多池仅出现在签约了第二家及以上运营商时。", file: "天数池.md", heading: "池里有什么、谁管" },
    ],
    dayPool_pools: [
      { summary: "同一渠道对同一运营商只有一个额度池；续费/增购加在这个池上，不另开第二池。", file: "天数池.md", heading: "池里有什么、谁管" },
      { summary: "本页看各池的总购、赠送、预占、已消耗与可用余额；余额过低会预警。给人配天数请到「额度分配」。", file: "天数池.md", heading: "后台落在哪" },
      { summary: "每天 0 点对在职有额度骑手预占 1 人天；当天有换电或仍持电池则确认消耗，否则释放预占。", file: "天数池.md", heading: "每天怎么扣人天" },
      { summary: "池余额不够覆盖当天全部应预占骑手时，整批预占失败，不允许透支、不做部分预占。", file: "天数池.md", heading: "每天怎么扣人天" },
      { summary: "渠道批发款在采购时已结清；骑手确认消耗时运营商不再按消耗收款，平台按标准人天价计提 1%。", file: "天数池.md", heading: "钱与平台费" },
      { summary: "额度池不支持在线退款；须与运营商线下谈妥后，再在已售额度池做额度扣减。", file: "天数池.md", heading: "钱与平台费" },
      { summary: "个人剩余为 0 或预占失败仍持电池时，只能还电不能换电，需渠道续配。", file: "天数池.md", heading: "额度不够或预占失败时" },
    ],
    dayPool_retail: [
      { summary: "零售价为二期演示能力，非一期人天池主路径。", file: "天数池.md", heading: "后台落在哪" },
    ],
    dayPool_riders: [
      { summary: "渠道骑手须登记并编入团队；团队绑定消耗池后，换电才从对应池扣人天。", file: "天数池.md", heading: "池里有什么、谁管" },
      { summary: "零额度或预占失败的在职持电骑手进入待还电，扫码只能还不能换。", file: "天数池.md", heading: "额度不够或预占失败时" },
    ],
    dayPool_teams: [
      { summary: "每个团队必须绑定一个消耗池；同一运营商下多团队可共用同一池。", file: "天数池.md", heading: "池里有什么、谁管" },
      { summary: "没有团队周期额度上限；能控的只有池余额与骑手个人剩余。", file: "天数池.md", heading: "池里有什么、谁管" },
    ],
    depositAccount: [
      { summary: "服务保证金用于跨网设备费与部分代扣的优先扣款，与骑手电池押金无关。", file: "换电场景与运营商结算.md", heading: "费用分层（互不替代）" },
      { summary: "运营商对公转账后在此提交充值申请，平台在保证金管理确认入账。", file: "换电场景与运营商结算.md", heading: "保证金怎么充" },
      { summary: "信用额度用尽且保证金为零时，平台自动关闭该运营商全部用户跨网换电。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
      { summary: "运营商只能只读查看准入档位与信用政策摘要，不能自行调高信用封顶。", file: "运营商信用评估方案.md", heading: "与现有模块" },
    ],
    depositManage: [
      { summary: "运营商对公打款后提交充值申请，平台核对到账后确认计入保证金余额。", file: "换电场景与运营商结算.md", heading: "保证金怎么充" },
      { summary: "平台手工调整信用额度时不得超过该运营商准入档位封顶。", file: "运营商信用评估方案.md", heading: "与现有模块" },
      { summary: "跨网日清优先扣保证金，保证金为零才记信用欠费。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
      { summary: "变动账本记录充值、调额与日清扣款，供对账追溯。", file: "换电场景与运营商结算.md", heading: "后台落在哪" },
    ],
    deviceBinding: [
      { summary: "仅平台可将物联网设备绑定至运营商，未绑定设备不能被运营商接入。", file: "角色与功能清单.md", heading: "主要风险（白话）" },
      { summary: "批量导入须先选择目标运营商再录入设备序列号。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "绑定后运营商方可把设备分配至站点并产生换电与告警数据。", file: "PRD.md", heading: "商业分工" },
    ],
    devices: [
      { summary: "设备须先经平台绑定归属运营商，运营商方可接入站点并产生换电订单。", file: "角色与功能清单.md", heading: "主要风险（白话）" },
      { summary: "告警以物联网上报为准，运营商可接单处置、关单留痕，不另建第二套设备系统。", file: "任务-设备告警与ICCID.md", heading: "一句话" },
      { summary: "未正常弹电池类告警可关联换电单跳转，便于客诉核查。", file: "任务-设备告警与ICCID.md", heading: "未正常弹电池" },
      { summary: "物联网卡逾期一期默认仅预警不停柜，平台维护全网卡台账。", file: "任务-设备告警与ICCID.md", heading: "物联网卡（ICCID）" },
      { summary: "同一设备同一类未关闭告警只更新时间，不重复开新行。", file: "任务-设备告警与ICCID.md", heading: "处置怎么走" },
    ],
    employees: [
      { summary: "员工登录后菜单与数据按勾选权限裁剪，只见所属主体的设备与订单。", file: "功能结构与业务流程.md", heading: "员工登录" },
      { summary: "经营主体与员工登录分离，渠道员工不能获得运营商全量菜单。", file: "角色与功能清单.md", heading: "图例" },
      { summary: "员工模块属二期交付范围，一期菜单边界以角色清单为准。", file: "角色与功能清单.md", heading: "一期菜单边界（白话真源）" },
    ],
    financeDrawdown: [
      { summary: "资方录入主体总授信，运营商不能自行登记放款。", file: "融资管理-PRD.md", heading: "授信怎么理解" },
      { summary: "尽调驳回会释放拟占用额度，运营商可修改资产包后再提交。", file: "融资管理-PRD.md", heading: "资产与批次状态（白话）" },
      { summary: "登记放款是唯一生成正式协议、借据与还款计划的入口。", file: "融资管理-PRD.md", heading: "主链路（白话）" },
      { summary: "还款须运营商提交工单、资方确认，不是运营商直接入账。", file: "融资管理-PRD.md", heading: "资方菜单（放款申请）" },
    ],
    financeManage: [
      { summary: "融资管理属二期内部台账，资方线下批授信后录入，不做银行自动核销。", file: "融资管理-PRD.md", heading: "一句话" },
      { summary: "运营商组资产包提交放款申请，资方尽调通过后登记放款才生成借据。", file: "融资管理-PRD.md", heading: "主链路（白话）" },
      { summary: "授信总额等于可用加已占用加拟占用，默认非循环，还清也不自动释放。", file: "融资管理-PRD.md", heading: "授信怎么理解" },
      { summary: "运营商提交还款工单，资方确认后计入实还；循环额度整笔还清才释放占用。", file: "融资管理-PRD.md", heading: "主链路（白话）" },
      { summary: "提现侧本月融资待还预留扣减亦属二期，一期不扣减可提现余额。", file: "运营商提现规则.md", heading: "可提现余额（一期）" },
    ],
    flows: [
      { summary: "支付成功后资金实收与清分明细同时入账，清分状态为已清分，这与提现是分开的两件事。", file: "合作模式与分账.md", heading: "双台账（不要混在一个列表）" },
      { summary: "可提现余额等于已清分累计减已提现再减待审与处理中占用，一期不扣融资待还预留。", file: "运营商提现规则.md", heading: "可提现余额（一期）" },
      { summary: "运营商须提交提现申请并经平台审核通过后，才会打到绑定结算账户。", file: "运营商提现规则.md", heading: "提现怎么走" },
      { summary: "包月收入按服务日摊销记入收入台账，与资金实收和清分列表分开，不可混列。", file: "功能结构与业务流程.md", heading: "核心流程索引（白话结论）" },
      { summary: "设备租赁白名单套餐款进渠道子商户，不适用运营商提现审核流程。", file: "运营商提现规则.md", heading: "谁适用" },
    ],
    interOp: [
      { summary: "跨网设备服务费每日日清，优先从付款方服务保证金划扣。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
      { summary: "保证金为零时才占用信用额度记账，信用也用光则停该运营商用户跨网。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
      { summary: "运营商往来账只见平台代收或代付，不见对手方运营商名称。", file: "换电场景与运营商结算.md", heading: "一句话" },
      { summary: "柜机与电池跨网费独立判断，例如柜同网电池异网则只付电池费。", file: "换电场景与运营商结算.md", heading: "跨网费怎么算（每次换电成功）" },
    ],
    l1Pricing: [
      { summary: "跨网柜机使用费与电池使用费由平台统一定价，运营商只读。", file: "换电场景与运营商结算.md", heading: "跨网费怎么算（每次换电成功）" },
      { summary: "人天标准日值是渠道消耗计提基数，也是运营商默认批发单价初始值。", file: "PRD.md", heading: "术语：人天标准日值" },
      { summary: "平台改统价不追溯已发生换电与已确认消耗。", file: "PRD.md", heading: "关键已确认原则（细则见专文）" },
      { summary: "可按城市覆盖全网默认值，预警短信配置亦在本模块。", file: "角色与功能清单.md", heading: "平台统价" },
    ],
    leaseAgreements: [
      { summary: "租赁协议关联设备清单，一运营商可与多家租赁公司分别签约。", file: "融资管理-PRD.md", heading: "谁登录、干什么" },
      { summary: "须平台先建立资方与运营商绑定，未绑定前不可发起签约。", file: "融资管理-PRD.md", heading: "主链路（白话）" },
      { summary: "设备直租租金轨道已移除，资产融资以融资管理借据链路为准。", file: "融资管理-PRD.md", heading: "明确不做" },
    ],
    leaseBatteryHold: [
      { summary: "本页只读展示白名单骑手当前持有哪块电池，供渠道运营核对。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "停服或欠月租时用户不可取新电，若仍持电池则通常只允许还电。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    leaseCollect: [
      { summary: "资方按账期跟踪各承租方租金收缴进度、方式与逾期。", file: "融资管理-PRD.md", heading: "谁登录、干什么" },
      { summary: "不做银行流水自动核销，登记依赖人工或工单确认。", file: "融资管理-PRD.md", heading: "明确不做" },
      { summary: "逾期可先标红提醒，违约金公式文档有约定但首期原型不自动计息。", file: "融资管理-PRD.md", heading: "违约金（文档约定，系统暂不自动算）" },
    ],
    leasePkgOrders: [
      { summary: "本页记录白名单付费用户购买渠道套餐的成交订单。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "运营商退款管理不处理白名单套餐订单，按渠道侧或约定流程处理。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "支付成功平台从实付中抽取技术服务费，款不进运营商子商户。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    leasePkgPricing: [
      { summary: "白名单套餐由渠道自定售价与规格，可含电池型号约束。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "用户购白名单套餐款进渠道子商户，支付成功平台按实付抽成。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "不扣人天池；与运营商个人套餐定价相互独立。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    leaseRent: [
      { summary: "运营商向资方缴月租须手动扫码或对公打款，系统不做自动扣款。", file: "融资管理-PRD.md", heading: "明确不做" },
      { summary: "租金收缴进度在资方侧跟踪，与融资还款工单是不同链路。", file: "融资管理-PRD.md", heading: "明确不做" },
      { summary: "欠租可能导致停服或协议状态变更，按租赁专规处理。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    leaseWhitelist: [
      { summary: "白名单由渠道自行维护，扁平名单无团队编制。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "白名单免费类型在月租已覆盖时可免购套餐换电；付费类型须买渠道自定白名单套餐。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "非白名单用户扫码专属站会被拦截。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "欠月租停服时不可取电，仍可还电。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    operatorCreditEval: [
      { summary: "平台给运营商定战略、标准、审慎或观察四档，决定最低保证金建议、信用封顶与跨网默认。", file: "运营商信用评估方案.md", heading: "四档政策包" },
      { summary: "定档后初始化信用上限，可调低但不得超过档位封顶；降档时若超额自动压顶。", file: "运营商信用评估方案.md", heading: "入网与复审" },
      { summary: "自定档日起每十二个月须复审，维持、升档或降档均须写原因留痕。", file: "运营商信用评估方案.md", heading: "入网与复审" },
      { summary: "观察档不设信用透支，跨网与部分代扣须全额预存。", file: "运营商信用评估方案.md", heading: "四档政策包" },
      { summary: "本模块定档历史与订单变更审计不是同一功能。", file: "任务-订单变更审计.md", heading: "和别的模块的边界" },
    ],
    operators: [
      { summary: "平台创建运营商主体后须完成信用定档，未定档应标红提示。", file: "运营商信用评估方案.md", heading: "入网与复审" },
      { summary: "运营商提现申请在本模块审核，通过后打到运营商绑定结算账户。", file: "运营商提现规则.md", heading: "提现怎么走" },
      { summary: "平台不按档位限制运营商可签渠道家数。", file: "运营商信用评估方案.md", heading: "入网与复审" },
      { summary: "平台不在此编辑运营商个人套餐定价或操作渠道人天分配。", file: "角色与功能清单.md", heading: "平台管理员" },
    ],
    orderAudit: [
      { summary: "变更记录把套餐创建、冻结、消耗、跨网与退款等关键动作串成统一时间线，方便客服与对账解释。", file: "任务-订单变更审计.md", heading: "一句话" },
      { summary: "运营商只能看本运营商相关事件，渠道商只能看本渠道成员相关事件。", file: "任务-订单变更审计.md", heading: "谁能看、看到什么范围" },
      { summary: "本页只读聚合展示，业务发生时由各模块写入审计事件，不替代各订单列表。", file: "任务-订单变更审计.md", heading: "和别的模块的边界" },
      { summary: "一期记录个人套餐生命周期、渠道人天分配与消耗，以及跨网换电引用。", file: "任务-订单变更审计.md", heading: "一期记哪些事" },
      { summary: "关联单号可跳转到换电单、套餐单或退款管理，便于还原当时发生了什么。", file: "任务-订单变更审计.md", heading: "页面怎么用" },
    ],
    orderFreeze: [
      { summary: "骑手申请冻结个人套餐时须未持有电池；冻结期间不可换电，计时暂停。", file: "功能结构与业务流程.md", heading: "套餐状态（白话）" },
      { summary: "解冻后服务有效期顺延冻结天数，骑手自行解冻无需运营商审批。", file: "个人套餐定价与退款.md", heading: "归纳" },
      { summary: "冻结期间建议暂停包月收入确认，恢复后继续按日摊销。", file: "功能结构与业务流程.md", heading: "套餐状态（白话）" },
      { summary: "渠道人天订单不适用个人套餐冻结规则，离职回池走人天池专规。", file: "天数池.md", heading: "骑手离职 / 解绑" },
    ],
    orderPackage: [
      { summary: "个人套餐按运营商、城市和套餐维度定价，不按站点分别定价；已购订单沿用下单时价格快照。", file: "个人套餐定价与退款.md", heading: "怎么定价" },
      { summary: "按天套餐从支付成功当日起算自然日，含首尾；按次卡以次数用完或有效期先到为准。", file: "个人套餐定价与退款.md", heading: "卖什么套餐（v1）" },
      { summary: "支付成功后用户商业归属即为售卖套餐的运营商，也是清分与退款主体。", file: "用户-运营商归属模型.md", heading: "支付与归属（架构 B）" },
      { summary: "渠道人天骑手不再靠应急自费套餐换电；本页订单均为个人直购或链接购套餐。", file: "个人套餐定价与退款.md", heading: "已取消" },
      { summary: "个人用户支付成功时平台从实付中实时分出约百分之一的技术服务费。", file: "合作模式与分账.md", heading: "C 端清分（已定）" },
    ],
    orderSwap: [
      { summary: "每次换电须记清用户归属、柜机归属与电池归属；任一不同即可能产生跨网设备服务费。", file: "换电场景与运营商结算.md", heading: "一句话" },
      { summary: "跨网柜机费与电池费由用户归属运营商经平台日清代付，运营商之间不私下结算。", file: "换电场景与运营商结算.md", heading: "跨网费怎么算（每次换电成功）" },
      { summary: "个人套餐用户跨网换电允许，但须双方运营商均开启跨网且未被信用停跨网。", file: "换电范围策略.md", heading: "扫码时怎么判（顺序）" },
      { summary: "渠道人天骑手跨网规则与个人用户相同，权益仍从额度售卖方运营商扣减人天。", file: "换电场景与运营商结算.md", heading: "两类用户" },
      { summary: "同运营商内任意站点均可换电，用户不绑定主站点。", file: "换电范围策略.md", heading: "两个概念" },
    ],
    orderUserDeposit: [
      { summary: "用户押金页只看实付押金流水，与套餐单无强绑定；同一用户可有多笔。", file: "骑手电池押金.md", heading: "后台落在哪" },
      { summary: "退押走退款管理；自动/手动模式可与套餐退款分开设置。", file: "骑手电池押金.md", heading: "怎么退押" },
      { summary: "押金不参与平台抽成和站点分润。", file: "骑手电池押金.md", heading: "钱怎么分" },
    ],
    partnerAccount: [
      { summary: "建档时选定个人或公司类型后锁定，两类开户字段不同。", file: "站点合伙人.md", heading: "个人还是公司（建档锁定）" },
      { summary: "开户状态为已开户后才可绑站与提现；演示中待开户主体仍不可操作。", file: "站点合伙人.md", heading: "个人还是公司（建档锁定）" },
      { summary: "收款账户信息与站点合伙人档案绑定，用于运营商审核后代付。", file: "站点合伙人.md", heading: "后台落在哪" },
    ],
    partnerBindings: [
      { summary: "合伙人只能查看各绑定站点当前比例，不能自行修改。", file: "站点合伙人.md", heading: "后台落在哪" },
      { summary: "同一人绑多站时各站比例独立，例如浦东与世博可不同。", file: "站点合伙人.md", heading: "绑定与比例" },
      { summary: "比例由运营商在站点管理合伙人抽屉配置，变更立即生效。", file: "合伙人站点分佣.md", heading: "何时生效" },
    ],
    partnerLedger: [
      { summary: "分润明细按站点与个人用户已确认可分配收入切分，渠道人天不算基数。", file: "合伙人站点分佣.md", heading: "什么收入算、什么不算" },
      { summary: "先切平台百分之一，再按各合伙人比例切，尾差归运营商。", file: "合伙人站点分佣.md", heading: "怎么算金额（白话）" },
      { summary: "改比例立即生效，变更前已确认的分润不回溯。", file: "合伙人站点分佣.md", heading: "何时生效" },
      { summary: "退款时按原切分行冲正。", file: "合伙人站点分佣.md", heading: "计提基数（白话）" },
    ],
    partnerOverview: [
      { summary: "合伙人总览展示累计与本月分润、绑定站点摘要与最近分润记录。", file: "站点合伙人.md", heading: "后台落在哪" },
      { summary: "合伙人不能修改站点、比例、定价或设备，只能只读查看与申请提现。", file: "角色与功能清单.md", heading: "站点合伙人" },
      { summary: "分润只切个人用户已确认收入，渠道人天与跨网费不算。", file: "合伙人站点分佣.md", heading: "什么收入算、什么不算" },
    ],
    partnerWithdraw: [
      { summary: "合伙人须完成分型开户后才能发起提现，向运营商申请代付。", file: "站点合伙人.md", heading: "验收（白话）" },
      { summary: "提现由运营商审核打款，不是平台审核。", file: "站点合伙人.md", heading: "后台落在哪" },
      { summary: "待开户状态的合伙人不可绑站也不可提现。", file: "站点合伙人.md", heading: "个人还是公司（建档锁定）" },
    ],
    platformAccounts: [
      { summary: "平台账户展示平台自有微信与支付宝等收款商户。", file: "角色与功能清单.md", heading: "平台账户" },
      { summary: "本月营收构成汇总个人端与渠道端技术服务费，不含运营商子商户余额。", file: "合作模式与分账.md", heading: "归纳" },
      { summary: "平台收约百分之一技术服务费，不参与骑手套餐运营分成。", file: "PRD.md", heading: "角色（白话）" },
    ],
    platformChannels: [
      { summary: "渠道商管理挂在运营商管理下，平台对渠道主体与经营摘要只读。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "渠道主体新增与编辑由签约运营商在渠道销售维护。", file: "角色与功能清单.md", heading: "平台管理员" },
      { summary: "一期每个渠道先只签一家运营商，结算模式四选一。", file: "渠道结算模式规则.md", heading: "共性规则" },
    ],
    platformDevices: [
      { summary: "平台维护全平台柜机、电池与型号字典，含批量导入与绑定至运营商。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "全平台告警列表只读监管，处置由所属运营商在其设备页办理。", file: "任务-设备告警与ICCID.md", heading: "谁能做什么" },
      { summary: "物联网卡台账由平台维护到期日与绑定关系，换绑须留变更留痕。", file: "任务-设备告警与ICCID.md", heading: "物联网卡（ICCID）" },
    ],
    platformFee: [
      { summary: "个人用户支付成功时按实付计提约百分之一，在支付通道实时分出。", file: "合作模式与分账.md", heading: "平台 1% 两种触发" },
      { summary: "渠道人天确认消耗时按平台标准人天价向额度售卖方计提，与批发价无关。", file: "合作模式与分账.md", heading: "平台 1% 两种触发" },
      { summary: "跨网设备服务费、套餐应分与人天消耗是并行账目，互不替代。", file: "换电场景与运营商结算.md", heading: "费用分层（互不替代）" },
      { summary: "押金不参与平台抽成，也不参与站点合伙人分润。", file: "骑手电池押金.md", heading: "钱怎么分" },
    ],
    platformFlows: [
      { summary: "用户支付流水展示个人购套餐等实付与平台提成。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "运营商之间流水展示跨网设备服务费的日清汇总。", file: "换电场景与运营商结算.md", heading: "后台落在哪" },
      { summary: "禁止平台自建资金池代收再手工私分，资金经持牌通道清分。", file: "合作模式与分账.md", heading: "监管红线（必读）" },
      { summary: "平台提成包含个人支付分账与渠道人天确认消耗计提两类。", file: "合作模式与分账.md", heading: "平台 1% 两种触发" },
    ],
    platformLeasing: [
      { summary: "平台须先建立租赁公司与运营商绑定，绑定后资方方可对该运营商放款或签约。", file: "融资管理-PRD.md", heading: "谁登录、干什么" },
      { summary: "系统支持多家租赁公司并存，运营商可与不同出租方分别签约。", file: "PRD.md", heading: "角色（白话）" },
      { summary: "融资台账与渠道设备租赁是不同能力，勿混为同一月租轨道。", file: "融资管理-PRD.md", heading: "明确不做" },
    ],
    platformMarketing: [
      { summary: "平台营销属二期，用户经活动链购套餐须锁定参与运营商，款进该运营商。", file: "平台营销-PRD.md", heading: "一句话" },
      { summary: "优惠以立减券为主，实付等于原价减券面额，平台不代收用户套餐款。", file: "平台营销-PRD.md", heading: "钱怎么算（白话）" },
      { summary: "技术服务费按实付分账，营销服务费按协议另计月结，两者分开。", file: "平台营销-PRD.md", heading: "已确认的产品结论（白话）" },
      { summary: "二十四小时内最后触达归因，与渠道分销链接并行，被渠道链盖过则走专享价。", file: "平台营销-PRD.md", heading: "归因" },
      { summary: "券成本默认由锁定运营商承担，须在签约文案明示。", file: "平台营销-PRD.md", heading: "钱怎么算（白话）" },
    ],
    platformOrders: [
      { summary: "平台可全平台查询个人套餐、换电与渠道批发订单，含三元组与跨网费摘要。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "换电单须关联权益来源，区分个人套餐与渠道人天。", file: "换电场景与运营商结算.md", heading: "后台落在哪" },
      { summary: "平台不在此审核退款或替渠道分配人天。", file: "角色与功能清单.md", heading: "平台管理员" },
    ],
    platformService: [
      { summary: "平台服务含保证金账户、平台服务费与往来账等子能力，按子页办理。", file: "换电场景与运营商结算.md", heading: "后台落在哪" },
      { summary: "服务保证金与骑手电池押金不是同一笔钱。", file: "骑手电池押金.md", heading: "和「平台保证金」的区别" },
      { summary: "跨网日清优先扣保证金，保证金为零才记信用。", file: "换电场景与运营商结算.md", heading: "平台怎么清分" },
    ],
    platformUsers: [
      { summary: "平台可查用户服务运营商、套餐或人天状态、押金方式与是否持有电池。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "用户不绑定站点，商业归属等于售卖或收款的运营商。", file: "用户-运营商归属模型.md", heading: "一句话" },
      { summary: "持电状态下不可冻结个人套餐服务。", file: "角色与功能清单.md", heading: "平台管理员功能表" },
      { summary: "用户押金统计按运营商汇总在押、免押与退押中等，与本页用户信息互补。", file: "骑手电池押金.md", heading: "各后台落在哪" },
    ],
    pricing: [
      { summary: "通用套餐价按运营商、城市与套餐维护；保存后只影响新单，已购订单沿用快照。", file: "个人套餐定价与退款.md", heading: "怎么定价" },
      { summary: "新人价仅直购首购可享，每用户在该运营商下只用一次，中途退款不恢复新人资格。", file: "个人套餐定价与退款.md", heading: "怎么定价" },
      { summary: "链接分销、平台营销与激活码等非直购路径不适用新人价。", file: "个人套餐定价与退款.md", heading: "怎么定价" },
      { summary: "换电范围只需配置是否允许跨网；关闭后双向封闭，本运营商用户出不去、外人进不来。", file: "换电范围策略.md", heading: "运营商只配一个开关：允许跨网换电" },
      { summary: "链接类渠道专享价须不高于正式零售价，按渠道与套餐分别配置。", file: "渠道结算模式规则.md", heading: "模式二：链接类分销（骑士卡等 · 一期）" },
    ],
    refundManage: [
      { summary: "开通后三个自然日内可走冷静期退款，默认须运营商审核，不受自动退款开关影响。", file: "个人套餐定价与退款.md", heading: "开通冷静期（3 天）" },
      { summary: "中途退款须服务中、已还电且剩余至少一天或一次；渠道池订单不退给骑手。", file: "个人套餐定价与退款.md", heading: "中途退款" },
      { summary: "押金退还与套餐退款同一列表展示，但审核模式可与套餐退款分开配置。", file: "骑手电池押金.md", heading: "怎么退押" },
      { summary: "退款由运营商子商户原路退回，平台已收的技术服务费一般不退。", file: "合作模式与分账.md", heading: "C 端清分（已定）" },
      { summary: "若运营商已提现导致子商户余额不足，系统标记须垫付后再完成退款。", file: "运营商提现规则.md", heading: "归纳" },
    ],
    rentDevices: [
      { summary: "租赁设备清单展示渠道租用的柜机与电池，权属仍为签约运营商。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "增删租赁设备不自动改变月租金额，除非双方重新签约。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "专属站点不对公众开放，仅白名单用户在地图可见并可换电。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    rentPool: [
      { summary: "设备租赁模式下渠道向运营商付统一月租，增删设备不改月租除非重签协议。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "欠月租则停服，白名单用户不可取电但仍可还电，提示联系管理员续费。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
      { summary: "运营商停用渠道主体后，名单内不可取电，仍可还电。", file: "渠道结算模式规则.md", heading: "模式三：设备租赁（二期）" },
    ],
    siteExpenses: [
      { summary: "站点支出记录场费、电费等运营商付给场地方的成本账单。", file: "站点合伙人.md", heading: "和渠道商、站点支出的区别" },
      { summary: "站点支出不参与个人用户套餐清分，也不计入合伙人分润基数。", file: "合作模式与分账.md", heading: "站点合伙人" },
      { summary: "场地方可同时是合伙人拿分润，也可单独收场费电费，两笔账分开记。", file: "站点合伙人.md", heading: "和渠道商、站点支出的区别" },
    ],
    sitePartners: [
      { summary: "建档时选定个人或公司类型后锁定，须补齐开户资料才能绑站与提现。", file: "站点合伙人.md", heading: "个人还是公司（建档锁定）" },
      { summary: "同一站点所有合伙人比例合计不得超过百分之九十九，与平台百分之一凑满。", file: "站点合伙人.md", heading: "绑定与比例" },
      { summary: "同一人可绑多个站点，各站分润比例彼此独立。", file: "站点合伙人.md", heading: "绑定与比例" },
      { summary: "添加、调比例或解绑立即生效并留变更记录，已切分历史不回溯。", file: "站点合伙人.md", heading: "何时生效" },
      { summary: "合伙人提现由运营商审核代付，不是平台审核。", file: "站点合伙人.md", heading: "后台落在哪" },
    ],
    sites: [
      { summary: "同一运营商下任意公众开放站点均可购套餐与换电，用户不绑定主站点。", file: "换电范围策略.md", heading: "一句话" },
      { summary: "站点管理是配置合伙人的主入口，一站可绑多位合伙人并设各自比例。", file: "站点合伙人.md", heading: "绑定与比例" },
      { summary: "渠道专属站默认不对公众开放，一般也不参与站点合伙人分润。", file: "站点合伙人.md", heading: "渠道专属站" },
      { summary: "场费与电费属于运营商付给场地方的经营成本，与合伙人分润是不同账目。", file: "站点合伙人.md", heading: "和渠道商、站点支出的区别" },
    ],
    users: [
      { summary: "用户商业归属等于售卖或收款的运营商，支付成功后写入，不绑定具体站点。", file: "用户-运营商归属模型.md", heading: "一句话" },
      { summary: "列表可按电池押金类型筛选，区分实付在押、信用免押与渠道担保等。", file: "骑手电池押金.md", heading: "各后台落在哪" },
      { summary: "同一用户可因换运营商产生多笔实付押金，旧押退掉后再交新押。", file: "骑手电池押金.md", heading: "各后台落在哪" },
      { summary: "渠道人天骑手的权益归属为卖额度的运营商，渠道商本身不是用户归属方。", file: "换电场景与运营商结算.md", heading: "两类用户" },
    ],
  };

  function meaningForView(viewKey, pageTitle) {
    if (VIEW_PAGE_MEANING[viewKey]) return VIEW_PAGE_MEANING[viewKey];
    if (viewKey && viewKey.indexOf("dayPool_") === 0 && VIEW_PAGE_MEANING.dayPool) {
      return VIEW_PAGE_MEANING.dayPool;
    }
    const t = (pageTitle || "").trim();
    return t ? `本页用于查看与办理「${t}」相关业务设定与数据。` : "";
  }

  function scopeForView(viewKey) {
    if (VIEW_PAGE_SCOPE[viewKey]) return { ...VIEW_PAGE_SCOPE[viewKey] };
    return { does: "", notDoes: "" };
  }

  function lineageForView(viewKey) {
    const row = VIEW_PAGE_LINEAGE[viewKey];
    if (!row) return null;
    return {
      upstream: row.upstream || "",
      sources: row.sources || "",
      downstream: row.downstream || "",
      links: (row.links || []).map(l => ({ key: l.key, label: l.label }))
    };
  }

  function rulesForView(viewKey) {
    if (VIEW_PAGE_RULES[viewKey]) return VIEW_PAGE_RULES[viewKey].slice();
    if (viewKey && viewKey.indexOf("dayPool_") === 0 && VIEW_PAGE_RULES.dayPool) {
      return VIEW_PAGE_RULES.dayPool.slice();
    }
    return [];
  }

  function keywordsForView(viewKey, pageTitle) {
    const root = viewKey && viewKey.indexOf("dayPool_") === 0 ? "dayPool" : (viewKey && viewKey.split("_")[0]);
    const aliases = VIEW_DOC_KEYWORDS[viewKey] || VIEW_DOC_KEYWORDS[root] || [];
    const title = (pageTitle || "").trim();
    const set = new Set();
    if (title) set.add(title);
    aliases.forEach(a => { if (a) set.add(a); });
    return Array.from(set);
  }

  function preferredDocsForView(viewKey) {
    const root = viewKey && viewKey.indexOf("dayPool_") === 0 ? "dayPool" : "";
    const list = VIEW_DOC_PREFER[viewKey] || VIEW_DOC_PREFER[root] || [];
    return list.filter(f => f && !isContextDemoted(f));
  }

  /** 子 Tab / 页面展示名（路径上的「功能」） */
  const VIEW_FEATURE_LABEL = {
    overview: "经营总览",
    orderService: "订单与服务",
    accounts: "收款账户",
    activationCodes: "激活码库存",
    activationRecords: "核销记录",
    channelCredit: "渠道信用",
    channelInterOp: "渠道往来账",
    channelLinks: "套餐与链接",
    channelOrders: "渠道订单",
    channelSales: "渠道销售",
    channelSettlement: "结算模式",
    commissionStatement: "佣金对账",
    dayPool_alloc: "额度分配",
    dayPool_alloc_logs: "分配流水",
    dayPool_consume: "消耗确认",
    dayPool_exceptions: "异常处理",
    dayPool_ledger: "额度明细",
    dayPool_pools: "额度池列表",
    dayPool_retail: "零售价",
    dayPool_riders: "骑手列表",
    dayPool_teams: "骑手团队",
    depositAccount: "服务保证金",
    depositManage: "保证金管理",
    deviceBinding: "设备绑定",
    devices: "我的设备",
    employees: "员工权限",
    financeDrawdown: "放款申请",
    financeManage: "融资管理",
    flows: "资金流水",
    interOp: "运营商往来账",
    l1Pricing: "平台统价",
    leaseAgreements: "租赁协议",
    leaseBatteryHold: "持电台账",
    leaseCollect: "租金收缴",
    leasePkgOrders: "白名单订单",
    leasePkgPricing: "白名单套餐价",
    leaseRent: "月租金",
    leaseWhitelist: "白名单",
    operatorCreditEval: "信用评估",
    operators: "运营商管理",
    orderAudit: "变更记录",
    orderFreeze: "冻结记录",
    orderPackage: "购买订单",
    orderSwap: "换电订单",
    orderUserDeposit: "用户押金",
    partnerAccount: "收款账户",
    partnerBindings: "我的站点",
    partnerLedger: "分润明细",
    partnerOverview: "经营总览",
    partnerWithdraw: "提现结算",
    platformAccounts: "平台账户",
    platformChannels: "渠道商管理",
    platformDevices: "设备管理",
    platformFee: "平台服务费",
    platformFlows: "流水管理",
    platformLeasing: "租赁公司",
    platformMarketing: "平台营销",
    platformOrders: "订单管理",
    platformUsers: "用户管理",
    pricing: "定价管理",
    refundManage: "退款管理",
    rentDevices: "租赁设备",
    rentPool: "月租账单",
    siteExpenses: "站点支出",
    sitePartners: "站点合伙人",
    sites: "站点管理",
    users: "用户管理",
  };

  function featureLabelForView(viewKey, fallback) {
    return VIEW_FEATURE_LABEL[viewKey] || fallback || "";
  }

  global.DocCatalog = {
    DOC_GROUPS,
    VIEW_DOC_KEYWORDS,
    VIEW_DOC_PREFER,
    VIEW_PAGE_MEANING,
    VIEW_PAGE_RULES,
    VIEW_PAGE_SCOPE,
    VIEW_PAGE_LINEAGE,
    CONTEXT_DEMOTE_FILES,
    allDocs,
    preferredDocsForView,
    isContextDemoted,
    isBusinessGroup,
    meaningForView,
    scopeForView,
    lineageForView,
    rulesForView,
    featureLabelForView,
    docFileUrl,
    docsViewerUrl,
    docFileUrlFromDocsPage,
    keywordsForView,
    isPrototypePath
  };
})(typeof window !== "undefined" ? window : globalThis);
