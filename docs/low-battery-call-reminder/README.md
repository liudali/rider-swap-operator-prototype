# 低电外呼提醒方案

独立交付项目，聚焦方案一：通过微信小程序引导骑手把固定低电外呼号码保存为“智格-电量过低提醒”。

## 交付物

```text
低电外呼提醒方案/
├── README.md
├── acceptance-criteria.md
├── decisions/
│   ├── counter.json
│   └── decision-001.md
├── docs/
│   ├── PRD.md
│   └── superpowers/plans/
├── prototype/
│   ├── index.html
│   ├── styles.css
│   ├── state.js
│   └── app.js
└── tests/
    ├── reminder-state.jxa.js
    ├── reminder-state.test.cjs
    └── prototype_contract_test.py
```

## 在线预览

GitHub Pages：

```text
https://liudali.github.io/rider-swap-operator-prototype/low-battery-call-reminder/
```

- 原型：https://liudali.github.io/rider-swap-operator-prototype/low-battery-call-reminder/prototype/index.html
- 文档：https://liudali.github.io/rider-swap-operator-prototype/low-battery-call-reminder/docs/index.html

## 查看原型

本地启动（推荐）：

```bash
cd 低电外呼提醒方案
python3 main.py
```

打开：

```text
http://127.0.0.1:8776/prototype/index.html
http://127.0.0.1:8776/docs/index.html
```

也可由编排入口启动：

```bash
cd 原型
python3 serve.py 低电外呼提醒
```

直接打开静态文件：

```bash
open prototype/index.html
```

## 建议体验顺序

1. 左侧选择「换电成功弹一次」，看主动弹窗；
2. 点「暂不添加」，再选「再次换电」，确认不再弹；
3. 选「首次领取电池」，确认不弹窗，但开始 7 天入口；
4. 选「我的页 7 天入口」直接添加；再选「第 8 天我的页」确认入口已进设置；
5. 分别体验微信允许/拒绝、新建/合并联系人；
6. 对比「添加后来电效果」和「未添加时来电」（均为演示假设）。

## 自动检查

macOS 内置 JavaScriptCore 状态测试：

```bash
osascript -l JavaScript \
  "$PWD/tests/reminder-state.jxa.js" \
  "$PWD/prototype/state.js"
```

页面契约测试：

```bash
python3 -m unittest tests/prototype_contract_test.py
```

如果开发环境安装了 Node.js，也可运行等价状态测试：

```bash
node --test tests/reminder-state.test.cjs
```

## Mock 边界

- 原型不调用真实 `wx.addPhoneContact`；
- 微信授权弹窗、系统联系人页和系统来电页均为交互模拟；
- `021-6105-1028`、`021-6105-2066` 仅为 Mock 号码，不可用于生产；
- 正式号码必须由服务端下发，并同时下发 `numberVersion`；
- 小程序不维护“已保存 / 未保存”产品状态；系统页结果只做一次性反馈。
- 弹窗按用户记录 `swapPromptShown`（仅换电成功展示一次）；我的页入口按 `firstPowerEventAt` 展示 7 个自然日。不记录 `savedNumberVersion`。

## 开发接入要点

1. 用户点击后才调用 `wx.addPhoneContact`；
2. 参数使用服务端当前号码，禁止客户端硬编码兜底写入；
3. 按用户保存 `swapPromptShown` 与 `firstPowerEventAt`（建议服务端）；不得写入或展示“已保存”产品状态；
4. 拒绝和取消不影响换电主流程；
5. 号码更新时只在设置页展示新号码，不因此再弹一次，不尝试删除旧联系人；
6. 埋点不得上传通讯录内容；
7. 正式上线以 `acceptance-criteria.md` 的发布门槛为准。
