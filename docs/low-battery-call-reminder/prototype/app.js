(function (root) {
  'use strict';

  if (!root || !root.document || !root.ReminderState) {
    return;
  }

  var document = root.document;
  var core = root.ReminderState;
  var state = core.createInitialState();
  var activeScenario = 'default';
  var toastTimer = null;

  var screenRoot = document.getElementById('screen-root');
  var overlayRoot = document.getElementById('overlay-root');
  var miniTitle = document.getElementById('mini-title');
  var miniHeader = document.getElementById('mini-header');
  var backButton = document.querySelector('.back-button');
  var tabBar = document.getElementById('tab-bar');
  var toast = document.getElementById('toast');
  var statusTitle = document.getElementById('status-title');
  var statusPill = document.getElementById('status-pill');
  var stateList = document.getElementById('state-list');
  var eventLogBody = document.getElementById('event-log-body');
  var eventCount = document.getElementById('event-count');
  var statusTime = document.getElementById('status-time');
  var phoneBezel = document.querySelector('.phone-bezel');

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function currentTimeLabel() {
    var now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');
  }

  function eventTimeLabel() {
    var now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0');
  }

  function permissionLabel(permission) {
    if (permission === 'granted') {
      return '已允许（仅写入）';
    }
    if (permission === 'denied') {
      return '已拒绝';
    }
    return '待询问';
  }

  function toneClass(tone) {
    if (tone === 'success') {
      return 'success';
    }
    if (tone === 'warning') {
      return 'warning';
    }
    if (tone === 'error') {
      return 'error';
    }
    if (tone === 'info') {
      return 'info';
    }
    return 'neutral';
  }

  function showToast(message) {
    root.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = root.setTimeout(function () {
      toast.classList.remove('show');
    }, 2200);
  }

  function copyReminderNumber() {
    var number = state.contact.formattedNumber;
    if (root.navigator.clipboard && root.navigator.clipboard.writeText) {
      root.navigator.clipboard.writeText(number).then(function () {
        showToast('提醒号码已复制');
      }).catch(function () {
        fallbackCopy(number);
      });
      return;
    }
    fallbackCopy(number);
  }

  function fallbackCopy(text) {
    var field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    try {
      document.execCommand('copy');
      showToast('提醒号码已复制');
    } catch (error) {
      showToast('请手动记录：' + text);
    }
    document.body.removeChild(field);
  }

  function dispatch(event) {
    event.at = event.at || eventTimeLabel();
    state = core.transition(state, event);
    activeScenario = '';
    render();
  }

  function setActiveScenario(name) {
    activeScenario = name;
    document.querySelectorAll('[data-scenario]').forEach(function (button) {
      button.classList.toggle('active', button.dataset.scenario === name);
    });
  }

  function makeSavedState(screen) {
    return core.createInitialState({
      tab: screen === 'home' ? 'home' : 'mine',
      screen: screen || 'reminder-settings',
      permission: 'granted',
      saveStatus: 'saved',
      promptedNumberVersion: 'v1',
      savedNumberVersion: 'v1',
      eventLog: [
        {
          time: '14:32:00',
          event: 'low_battery_contact_system_result',
          result: 'saved',
          properties: 'system_mode=unknown&number_version=v1'
        },
        {
          time: '14:31:45',
          event: 'low_battery_contact_permission_result',
          result: 'allowed',
          properties: 'scope=addPhoneContact&number_version=v1'
        },
        {
          time: '14:31:40',
          event: 'low_battery_contact_save_click',
          result: 'success',
          properties: 'entry=first_pickup&previous_status=not_saved&number_version=v1'
        }
      ]
    });
  }

  function loadScenario(name) {
    switch (name) {
      case 'default':
        state = core.createInitialState();
        break;

      case 'first-pickup':
        state = core.transition(
          core.createInitialState({ hasBattery: false, soc: 0 }),
          { type: 'FIRST_PICKUP_SUCCESS', at: eventTimeLabel() }
        );
        break;

      case 'existing-swap':
        state = core.transition(
          core.createInitialState({
            hasBattery: true,
            soc: 18,
            promptedNumberVersion: null,
            savedNumberVersion: null
          }),
          { type: 'SWAP_SUCCESS', at: eventTimeLabel() }
        );
        break;

      case 'manual-settings':
        state = core.transition(
          core.createInitialState(),
          { type: 'OPEN_REMINDER', at: eventTimeLabel() }
        );
        break;

      case 'saved':
        state = makeSavedState('reminder-settings');
        break;

      case 'call-saved':
        state = core.transition(
          makeSavedState('home'),
          { type: 'SIMULATE_LOW_CALL', at: eventTimeLabel(), soc: 12 }
        );
        break;

      case 'permission-denied':
        state = core.createInitialState({
          tab: 'mine',
          screen: 'reminder-settings',
          overlay: 'permission-help',
          permission: 'denied',
          saveStatus: 'permission_denied',
          eventLog: [
            {
              time: '14:30:00',
              event: 'low_battery_contact_permission_result',
              result: 'denied',
              properties: 'scope=addPhoneContact&number_version=v1'
            }
          ]
        });
        break;

      case 'system-cancelled':
        state = core.createInitialState({
          tab: 'mine',
          screen: 'reminder-settings',
          permission: 'granted',
          saveStatus: 'system_cancelled',
          eventLog: [
            {
              time: '14:31:00',
              event: 'low_battery_contact_system_result',
              result: 'cancelled',
              properties: 'system_mode=unknown&number_version=v1'
            }
          ]
        });
        break;

      case 'save-failed':
        state = core.transition(
          core.createInitialState({
            tab: 'mine',
            screen: 'reminder-settings',
            permission: 'granted',
            saveStatus: 'prompting'
          }),
          {
            type: 'SAVE_FAILED',
            errorCode: 'system_error',
            at: eventTimeLabel()
          }
        );
        break;

      case 'number-updated':
        state = core.transition(
          makeSavedState('reminder-settings'),
          {
            type: 'NUMBER_UPDATED',
            numberVersion: 'v2',
            formattedNumber: '021-6105-2066',
            dialableNumber: '02161052066',
            showOverlay: true,
            at: eventTimeLabel()
          }
        );
        break;

      case 'no-battery':
        state = core.createInitialState({
          hasBattery: false,
          soc: 0,
          estimatedMinutes: 0
        });
        break;

      case 'config-error':
        state = core.createInitialState({
          tab: 'mine',
          screen: 'reminder-settings',
          overlay: 'config-error',
          configAvailable: false,
          saveStatus: 'config_error',
          eventLog: [
            {
              time: '14:33:00',
              event: 'reminder_number_config_load',
              result: 'failed',
              properties: 'reason=network_error'
            }
          ]
        });
        break;

      case 'unsupported':
        state = core.createInitialState({
          tab: 'mine',
          screen: 'reminder-settings',
          overlay: 'unsupported',
          apiSupported: false,
          saveStatus: 'unsupported',
          eventLog: [
            {
              time: '14:33:00',
              event: 'add_phone_contact_capability_check',
              result: 'failed',
              properties: 'reason=api_unsupported'
            }
          ]
        });
        break;

      case 'call-unsaved':
        state = core.transition(
          core.createInitialState(),
          { type: 'SIMULATE_LOW_CALL', at: eventTimeLabel(), soc: 12 }
        );
        break;

      case 'guest':
        state = core.createInitialState({
          loggedIn: false,
          hasBattery: false,
          soc: 0,
          estimatedMinutes: 0,
          tab: 'mine',
          screen: 'mine'
        });
        break;

      case 'pickup-failed':
        state = core.transition(
          core.createInitialState({ hasBattery: false, soc: 0, estimatedMinutes: 0 }),
          { type: 'PICKUP_FAILED', at: eventTimeLabel() }
        );
        break;

      case 'battery-error':
        state = core.transition(
          core.createInitialState(),
          { type: 'BATTERY_LOAD_FAILED', at: eventTimeLabel() }
        );
        break;

      default:
        state = core.createInitialState();
        name = 'default';
        break;
    }

    setActiveScenario(name);
    render();
  }

  function outOfScope(html, compact) {
    return [
      '<div class="out-of-scope', compact ? ' is-compact' : '', '" aria-hidden="true">',
        '<div class="out-of-scope-frost">', html, '</div>',
        '<span class="out-of-scope-label">本期不涉及</span>',
      '</div>'
    ].join('');
  }

  function reminderCard(status) {
    var action = status.key === 'permission_denied' ? 'restore-permission' : 'open-reminder';
    return [
      '<article class="surface-card reminder-card">',
        '<div class="reminder-head">',
          '<span class="reminder-icon" aria-hidden="true">☎</span>',
          '<div class="reminder-copy">',
            '<strong>低电来电提醒</strong>',
            '<p>', escapeHtml(status.description), '</p>',
          '</div>',
          '<span class="status-tag ', toneClass(status.tone), '">', escapeHtml(status.title), '</span>',
        '</div>',
        '<div class="reminder-footer">',
          '<span>', escapeHtml(state.contact.formattedNumber), '</span>',
          '<button class="inline-action" type="button" data-action="', action, '">查看设置 ›</button>',
        '</div>',
      '</article>'
    ].join('');
  }

  function renderHome(status) {
    if (!state.loggedIn) {
      return [
        '<div class="screen-page">',
          '<div class="welcome-row">',
            '<div><h2>智格换电</h2><p>登录后查看电量和低电提醒</p></div>',
            outOfScope('<span class="location-pill">⌖ 上海市</span>', true),
          '</div>',
          '<section class="empty-state surface-card">',
            '<div class="empty-illustration" aria-hidden="true">☺</div>',
            '<h2>请先登录</h2>',
            '<p>低电提醒号码保存、电池状态和换电服务都需要登录后使用。</p>',
            '<button class="primary-button" type="button" data-action="login">微信一键登录</button>',
          '</section>',
        '</div>'
      ].join('');
    }

    if (state.batteryLoadError) {
      return [
        '<div class="screen-page">',
          '<div class="welcome-row">',
            '<div><h2>下午好，骑手</h2><p>当前服务：绿色出行</p></div>',
            outOfScope('<span class="location-pill">⌖ 上海市</span>', true),
          '</div>',
          '<section class="error-state surface-card">',
            '<div class="error-illustration" aria-hidden="true">!</div>',
            '<h2>电池状态加载失败</h2>',
            '<p>无法判断当前电量，暂不展示低电操作。请检查网络后重试。</p>',
            '<button class="primary-button" type="button" data-action="retry-battery">重新加载</button>',
          '</section>',
        '</div>'
      ].join('');
    }
    if (!state.hasBattery) {
      return [
        '<div class="screen-page">',
          '<div class="welcome-row">',
            '<div><h2>下午好，骑手</h2><p>安全出行，及时换电</p></div>',
            outOfScope('<span class="location-pill">⌖ 上海市</span>', true),
          '</div>',
          '<section class="empty-state surface-card">',
            '<div class="empty-illustration" aria-hidden="true">🔋</div>',
            '<h2>暂无在用电池</h2>',
            '<p>领取电池后，这里会展示实时电量和低电提醒保障状态。</p>',
            '<button class="primary-button" type="button" data-action="trigger-first-pickup">模拟首次领电</button>',
          '</section>',
          '<div class="section-heading"><h3>提醒保障</h3></div>',
          '<div class="quick-grid">',
            outOfScope('<button class="quick-button" type="button" data-action="show-toast" data-message="已打开站点地图"><span>⌖</span><span>附近站点</span></button>', true),
            outOfScope('<button class="quick-button" type="button" data-action="show-toast" data-message="请扫描柜机二维码"><span>▣</span><span>扫码领电</span></button>', true),
            '<button class="quick-button" type="button" data-action="open-reminder"><span>☎</span><span>来电提醒</span></button>',
          '</div>',
        '</div>'
      ].join('');
    }

    var batteryClass = state.soc <= 15 ? 'critical' : (state.soc <= 30 ? 'low' : '');
    var levelText = state.soc <= 15 ? '电量过低' : (state.soc <= 30 ? '电量偏低' : '电量正常');
    var bannerClass = state.soc <= 15 ? ' danger' : '';

    return [
      '<div class="screen-page">',
        '<div class="welcome-row">',
          '<div><h2>下午好，骑手</h2><p>当前服务：绿色出行</p></div>',
          outOfScope('<span class="location-pill">⌖ 上海市</span>', true),
        '</div>',
        '<article class="battery-card ', batteryClass, '">',
          '<div class="card-topline">',
            '<span class="card-label"><i class="battery-dot"></i>在用电池</span>',
            '<span class="battery-sn">BAT-SH-1028</span>',
          '</div>',
          '<div class="battery-main">',
            '<div class="soc-gauge" style="--soc:', state.soc, '">',
              '<span class="soc-value">', state.soc, '<small>%</small></span>',
            '</div>',
            '<div class="battery-summary">',
              '<strong>', levelText, '</strong>',
              '<p>预计可用 ', state.estimatedMinutes, ' 分钟<br>最近更新：刚刚</p>',
            '</div>',
          '</div>',
          '<div class="battery-actions">',
            '<span>48V 30Ah · 已持有 3 天</span>',
            outOfScope('<button class="card-link" type="button" data-action="show-toast" data-message="已打开附近换电站">去换电 ›</button>', true),
          '</div>',
        '</article>',
        '<div class="alert-banner', bannerClass, '">',
          '<span class="alert-icon" aria-hidden="true">!</span>',
          '<span>', state.soc <= 15
            ? '电量已低于安全阈值，请尽快换电。智格可能通过低电专线联系你。'
            : '电量偏低，建议提前规划换电，避免配送途中断电。', '</span>',
        '</div>',
        '<div class="section-heading"><h3>提醒保障</h3><span>识别低电来电</span></div>',
        reminderCard(status),
        '<div class="quick-grid" style="margin-top:12px">',
          outOfScope('<button class="quick-button" type="button" data-action="show-toast" data-message="已打开扫码换电"><span>▣</span><span>扫码换电</span></button>', true),
          outOfScope('<button class="quick-button" type="button" data-action="show-toast" data-message="已打开附近站点"><span>⌖</span><span>附近站点</span></button>', true),
          '<button class="quick-button" type="button" data-action="simulate-low-call"><span>☎</span><span>模拟来电</span></button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderOrders() {
    var page;
    if (!state.loggedIn) {
      page = [
        '<div class="screen-page">',
          '<section class="empty-state">',
            '<div class="empty-illustration" aria-hidden="true">▤</div>',
            '<h2>登录后查看订单</h2>',
            '<p>游客只能看到订单入口，不能查看本人换电记录。</p>',
            '<button class="primary-button" type="button" data-action="login">微信一键登录</button>',
          '</section>',
        '</div>'
      ].join('');
      return outOfScope(page);
    }

    var tab = state.orderSubTab || 'swap';
    var body;
    if (tab === 'purchase') {
      body = [
        '<article class="surface-card order-item">',
          '<div class="order-item-head"><span>SUB260524001</span><span>已支付</span></div>',
          '<p>30天畅换 · ¥398<br>套餐 ¥299 + 押金 ¥99<br>服务：绿色出行 · 2026-05-01</p>',
        '</article>'
      ].join('');
    } else if (tab === 'return') {
      body = [
        '<section class="empty-state compact">',
          '<div class="empty-illustration" aria-hidden="true">📋</div>',
          '<h2>暂无退租记录</h2>',
          '<p>当前没有退租订单。</p>',
        '</section>'
      ].join('');
    } else {
      body = [
        '<p class="page-kicker">以下为演示用户的 Mock 订单</p>',
        '<article class="surface-card order-item">',
          '<div class="order-item-head"><span>SW2609091428</span><span>换电成功</span></div>',
          '<p>浦东骑手驿站<br>2026-09-09 14:28 · BAT-SH-1028<br>权益：30 天畅换</p>',
        '</article>',
        '<article class="surface-card order-item">',
          '<div class="order-item-head"><span>SW2609072016</span><span>换电成功</span></div>',
          '<p>世纪大道换电站<br>2026-09-07 20:16 · BAT-SH-0986<br>权益：30 天畅换</p>',
        '</article>'
      ].join('');
    }

    page = [
      '<div class="screen-page">',
        '<div class="order-tabs">',
          '<button type="button" class="', tab === 'swap' ? 'active' : '', '" data-action="switch-order-tab" data-subtab="swap">换电订单</button>',
          '<button type="button" class="', tab === 'purchase' ? 'active' : '', '" data-action="switch-order-tab" data-subtab="purchase">服务购买</button>',
          '<button type="button" class="', tab === 'return' ? 'active' : '', '" data-action="switch-order-tab" data-subtab="return">退租订单</button>',
        '</div>',
        body,
      '</div>'
    ].join('');
    return outOfScope(page);
  }

  function renderMine(status) {
    if (!state.loggedIn) {
      return [
        '<div class="screen-page">',
          '<section class="profile-card">',
            '<span class="avatar" aria-hidden="true">☺</span>',
            '<div class="profile-copy"><strong>未登录</strong><span>登录后可保存低电提醒号码</span></div>',
          '</section>',
          '<section class="empty-state surface-card" style="min-height:220px;margin-top:14px">',
            '<h2>请先登录</h2>',
            '<p>游客可查看功能说明，保存通讯录需要登录后操作。</p>',
            '<button class="primary-button" type="button" data-action="login">微信一键登录</button>',
          '</section>',
        '</div>'
      ].join('');
    }
    return [
      '<div class="screen-page">',
        '<section class="profile-card">',
          '<span class="avatar" aria-hidden="true">骑</span>',
          '<div class="profile-copy"><strong>张骑手</strong><span>138****1028 · 已实名认证</span></div>',
        '</section>',
        outOfScope([
          '<section class="service-mini-card">',
            '<div><strong>', state.hasBattery ? '30 天畅换' : '暂未持有电池', '</strong>',
              '<span>', state.hasBattery ? '剩余 18 天 · 持有电池' : '登录后可领取电池并保存低电提醒', '</span></div>',
            '<span class="service-status">', state.hasBattery ? '服务中' : '待领取', '</span>',
          '</section>'
        ].join('')),
        '<div class="section-heading"><h3>安全与提醒</h3></div>',
        '<div class="menu-list">',
          '<button class="menu-row" type="button" data-action="open-reminder">',
            '<span class="menu-icon" aria-hidden="true">☎</span>',
            '<span class="menu-copy"><strong>来电提醒</strong><small>智格-电量过低提醒</small></span>',
            '<span class="status-tag ', toneClass(status.tone), '">', escapeHtml(status.title), '</span>',
          '</button>',
        '</div>',
        outOfScope([
          '<div class="section-heading"><h3>常用功能</h3></div>',
          '<div class="menu-list">',
            '<button class="menu-row" type="button" data-action="show-toast" data-message="消息通知设置为原有功能">',
              '<span class="menu-icon" aria-hidden="true">♢</span>',
              '<span class="menu-copy"><strong>消息通知</strong><small>服务消息与系统通知</small></span>',
              '<span class="menu-arrow">›</span>',
            '</button>',
            '<button class="menu-row" type="button" data-action="show-toast" data-message="已打开服务协议">',
              '<span class="menu-icon" aria-hidden="true">§</span>',
              '<span class="menu-copy"><strong>服务协议</strong><small>协议与隐私政策</small></span>',
              '<span class="menu-arrow">›</span>',
            '</button>',
            '<button class="menu-row" type="button" data-action="show-toast" data-message="客服 400-607-2666">',
              '<span class="menu-icon" aria-hidden="true">?</span>',
              '<span class="menu-copy"><strong>联系客服</strong><small>8:00－24:00</small></span>',
              '<span class="menu-arrow">›</span>',
            '</button>',
          '</div>'
        ].join('')),
      '</div>'
    ].join('');
  }

  function settingsAction(status) {
    if (status.key === 'config_error') {
      return '<button class="primary-button full-button" type="button" data-action="retry-config">重试加载</button>';
    }
    if (status.key === 'unsupported') {
      return '<button class="primary-button full-button" type="button" data-action="copy-number">复制号码</button>';
    }
    if (status.key === 'permission_denied') {
      return '<button class="primary-button full-button" type="button" data-action="restore-permission">查看开启方法</button>';
    }
    return '<button class="primary-button full-button" type="button" data-action="start-save">' +
      escapeHtml(status.action) + '</button>';
  }

  function renderReminderSettings(status) {
    var updateNotice = status.key === 'outdated'
      ? '<div class="alert-banner"><span class="alert-icon">新</span><span>提醒号码已更新。请保存新号码；旧联系人需在手机通讯录中自行删除。</span></div>'
      : '';
    var numberValue = state.configAvailable ? state.contact.formattedNumber : '暂未获取';
    var versionValue = state.configAvailable ? state.currentNumberVersion : '—';

    return [
      '<div class="screen-page">',
        '<section class="settings-hero">',
          '<div class="settings-hero-icon" aria-hidden="true">☎</div>',
          '<h2>低电来电提醒</h2>',
          '<p>把固定低电专线存入通讯录，来电时更容易识别，不影响正常换电服务。</p>',
        '</section>',
        updateNotice,
        '<section class="surface-card status-card">',
          '<div class="status-row">',
            '<div><strong>当前状态</strong><p>', escapeHtml(status.description), '</p></div>',
            '<span class="status-tag ', toneClass(status.tone), '">', escapeHtml(status.title), '</span>',
          '</div>',
        '</section>',
        '<dl class="surface-card contact-detail">',
          '<div class="detail-row"><dt>联系人名称</dt><dd>', escapeHtml(state.contact.name), '</dd></div>',
          '<div class="detail-row"><dt>提醒号码</dt><dd>', escapeHtml(numberValue), '</dd></div>',
          '<div class="detail-row"><dt>号码来源</dt><dd>', escapeHtml(state.contact.source), '</dd></div>',
          '<div class="detail-row"><dt>号码版本</dt><dd>', escapeHtml(versionValue), '</dd></div>',
        '</dl>',
        '<div class="privacy-note"><span aria-hidden="true">♢</span><span><strong>仅写入，不读取</strong><br>微信只会打开系统联系人保存页，智格不会读取你的通讯录。</span></div>',
        '<div class="button-stack">',
          settingsAction(status),
          '<button class="plain-button full-button" type="button" data-action="simulate-low-call">查看来电显示效果</button>',
        '</div>',
        '<p class="micro-copy">“已保存”以本次系统返回结果为准；如果之后删除联系人，可再次保存。</p>',
      '</div>'
    ].join('');
  }

  function renderPickupSuccess(status) {
    var isSwap = state.resultKind === 'swap';
    var reminderSection;
    var actionButtons;
    if (!state.configAvailable) {
      reminderSection = [
        '<div class="alert-banner">',
          '<span class="alert-icon" aria-hidden="true">!</span>',
          '<span>提醒号码暂未配置，本次不展示保存入口，不影响电池领取结果。</span>',
        '</div>'
      ].join('');
      actionButtons = '<button class="primary-button full-button" type="button" data-action="go-home">返回首页</button>';
    } else {
      reminderSection = [
        '<section class="surface-card result-reminder">',
          '<span class="reminder-icon" aria-hidden="true">☎</span>',
          '<div class="reminder-copy"><strong>别错过低电提醒电话</strong><p>', escapeHtml(status.description), '</p></div>',
          '<span class="status-tag ', toneClass(status.tone), '">', escapeHtml(status.title), '</span>',
        '</section>'
      ].join('');
      actionButtons = [
        '<button class="primary-button full-button" type="button" data-action="start-save">保存提醒号码</button>',
        '<button class="plain-button full-button" type="button" data-action="go-home">返回首页</button>'
      ].join('');
    }

    return [
      '<div class="pickup-result">',
        '<div class="result-mark" aria-hidden="true">✓</div>',
        '<h2>', isSwap ? '换电成功' : '领取电池成功', '</h2>',
        '<p>', isSwap ? '新电池已取出，请确认安装牢固' : '柜门已关闭，请确认电池安装牢固', '</p>',
        '<section class="surface-card pickup-detail">',
          '<div><span>电池编号</span><strong>BAT-SH-1028</strong></div>',
          '<div><span>领取电量</span><strong>82%</strong></div>',
          '<div><span>站点</span><strong>浦东骑手驿站</strong></div>',
          '<div><span>领取时间</span><strong>14:28</strong></div>',
        '</section>',
        reminderSection,
        '<div class="button-stack" style="margin-top:14px">',
          actionButtons,
        '</div>',
      '</div>'
    ].join('');
  }

  function renderPickupFailed() {
    return [
      '<div class="pickup-result fail">',
        '<div class="result-mark fail" aria-hidden="true">×</div>',
        '<h2>领取电池失败</h2>',
        '<p>柜门未按预期打开，本次未领取成功，因此不引导保存低电提醒号码。</p>',
        '<div class="button-stack" style="margin-top:18px">',
          '<button class="primary-button full-button" type="button" data-action="trigger-first-pickup">重新扫码领取</button>',
          '<button class="plain-button full-button" type="button" data-action="go-home">返回首页</button>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderLogin() {
    return [
      '<div class="login-page">',
        '<div class="login-hero">',
          '<div class="login-logo" aria-hidden="true">智</div>',
          '<h2>智格换电</h2>',
          '<p>安全出行 放心骑行</p>',
        '</div>',
        '<button class="primary-button full-button" type="button" data-action="login">微信一键登录</button>',
        '<p class="micro-copy">登录后可保存“智格-电量过低提醒”。拒绝通讯录权限不影响换电。</p>',
        '<div class="agree-row">',
          outOfScope('<span>☑</span><span>同意《隐私政策》《智格换电服务协议》</span>', true),
        '</div>',
      '</div>'
    ].join('');
  }

  function renderCallDemo() {
    var saved = Boolean(state.callDisplayName);
    var displayTitle = saved ? state.callDisplayName : state.contact.formattedNumber;
    var secondary = saved ? state.contact.formattedNumber : '陌生号码';
    var statusCopy = '正在呼入…';
    var actions = [
      '<button class="call-action decline" type="button" data-action="decline-call"><span>☎</span><span>拒绝</span></button>',
      '<button class="call-action answer" type="button" data-action="answer-call"><span>☎</span><span>接听</span></button>'
    ].join('');

    if (state.callStatus === 'connected') {
      statusCopy = '00:18';
      actions = '<button class="call-action end" type="button" data-action="end-call"><span>☎</span><span>挂断</span></button>';
    } else if (state.callStatus === 'declined') {
      statusCopy = '已拒绝来电';
      actions = '<button class="return-app" type="button" data-action="return-app">返回智格小程序</button>';
    } else if (state.callStatus === 'ended') {
      statusCopy = '通话已结束 · 00:18';
      actions = '<button class="return-app" type="button" data-action="return-app">返回智格小程序</button>';
    }

    return [
      '<section class="call-screen">',
        '<span class="call-label">低电提醒专线来电</span>',
        '<div class="call-avatar" aria-hidden="true">智</div>',
        '<h2>', escapeHtml(displayTitle), '</h2>',
        '<div class="call-number">', escapeHtml(secondary), '</div>',
        '<div class="call-reason">原型情境：BAT-SH-1028 电量 ', state.soc, '% 触发外呼</div>',
        '<div class="call-status-copy">', statusCopy, '</div>',
        '<div class="call-actions">', actions, '</div>',
      '</section>'
    ].join('');
  }

  function renderScreen(status) {
    if (state.screen === 'orders') {
      return renderOrders();
    }
    if (state.screen === 'mine') {
      return renderMine(status);
    }
    if (state.screen === 'reminder-settings') {
      return renderReminderSettings(status);
    }
    if (state.screen === 'pickup-success') {
      return renderPickupSuccess(status);
    }
    if (state.screen === 'pickup-failed') {
      return renderPickupFailed();
    }
    if (state.screen === 'login') {
      return renderLogin();
    }
    if (state.screen === 'call-demo') {
      return renderCallDemo();
    }
    return renderHome(status);
  }

  function renderIntroOverlay(status) {
    var title = status.key === 'outdated' ? '保存新的低电提醒号码' : '别错过低电提醒电话';
    var description = status.key === 'outdated'
      ? '号码已更新。保存新号码后，后续低电来电会继续显示联系人名称。'
      : '保存后，电量不足来电会显示联系人名称，更容易识别。';
    return [
      '<div class="scrim align-end" role="dialog" aria-modal="true" aria-labelledby="intro-title">',
        '<section class="bottom-sheet">',
          '<div class="sheet-handle" aria-hidden="true"></div>',
          '<div class="sheet-hero">',
            '<span class="sheet-icon" aria-hidden="true">☎</span>',
            '<div class="sheet-copy"><h2 id="intro-title">', title, '</h2><p>', description, '</p></div>',
          '</div>',
          '<div class="sheet-contact">',
            '<div><strong>', escapeHtml(state.contact.name), '</strong><span>', escapeHtml(state.contact.formattedNumber), '</span></div>',
            '<span class="write-only-tag">仅写入</span>',
          '</div>',
          '<div class="button-stack">',
            '<button class="primary-button full-button" type="button" data-action="start-save">保存提醒号码</button>',
            '<button class="plain-button full-button" type="button" data-action="dismiss-intro">暂不保存</button>',
          '</div>',
          '<p class="micro-copy">不会读取你的联系人；拒绝后仍可正常换电。</p>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderPermissionOverlay() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="permission-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="dialog-app-icon" aria-hidden="true">智</div>',
            '<h2 id="permission-title">“智格换电”申请使用你的通讯录</h2>',
            '<p>用于将低电提醒专线写入手机通讯录，不会读取已有联系人。</p>',
            '<div class="permission-name">使用你的通讯录（仅写入）</div>',
          '</div>',
          '<div class="dialog-actions">',
            '<button type="button" data-action="deny-permission">拒绝</button>',
            '<button class="confirm" type="button" data-action="allow-permission">允许</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderPermissionHelp() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="permission-help-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="warning-mark" aria-hidden="true">!</div>',
            '<h2 id="permission-help-title">通讯录写入权限未开启</h2>',
            '<p>请在微信的小程序设置中允许“使用你的通讯录（仅写入）”。不授权也不影响换电。</p>',
          '</div>',
          '<div class="dialog-actions">',
            '<button type="button" data-action="close-overlay">稍后处理</button>',
            '<button class="confirm" type="button" data-action="restore-permission">去设置</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderContactChoice() {
    return [
      '<div class="scrim align-end" role="dialog" aria-modal="true" aria-labelledby="choice-title">',
        '<section class="bottom-sheet choice-sheet">',
          '<div class="sheet-handle" aria-hidden="true"></div>',
          '<h2 id="choice-title">保存到手机通讯录</h2>',
          '<p>以下页面由手机系统提供；你可以新建联系人，或把号码添加到已有联系人。</p>',
          '<button class="choice-button" type="button" data-action="choose-new">',
            '<span class="choice-symbol">＋</span>',
            '<span><strong>新建联系人</strong><small>使用预填的名称和提醒号码</small></span>',
            '<span class="choice-arrow">›</span>',
          '</button>',
          '<button class="choice-button" type="button" data-action="choose-existing">',
            '<span class="choice-symbol">♙</span>',
            '<span><strong>添加到已有联系人</strong><small>适合避免重复联系人</small></span>',
            '<span class="choice-arrow">›</span>',
          '</button>',
          '<button class="plain-button full-button" type="button" data-action="cancel-system-save">取消</button>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderSystemContact() {
    var merge = state.contactMode === 'merge';
    var modeField = merge
      ? [
          '<div class="form-field">',
            '<label for="existing-contact">已有联系人</label>',
            '<select id="existing-contact" name="existingContact">',
              '<option value="">请选择联系人</option>',
              '<option value="service">智格换电客服</option>',
              '<option value="work">工作联系人</option>',
            '</select>',
          '</div>'
        ].join('')
      : '';

    return [
      '<section class="system-screen" role="dialog" aria-modal="true" aria-labelledby="system-contact-title">',
        '<div class="system-status"><span>14:28</span><span>5G　◒</span></div>',
        '<header class="system-nav">',
          '<button type="button" data-action="cancel-system-save">取消</button>',
          '<strong id="system-contact-title">', merge ? '添加到联系人' : '新建联系人', '</strong>',
          '<button type="button" data-action="confirm-system-save">完成</button>',
        '</header>',
        '<div class="system-body">',
          '<div class="system-avatar" aria-hidden="true">智</div>',
          '<form class="system-form" id="system-contact-form" novalidate>',
            modeField,
            '<div class="form-field"><label for="contact-name">姓名</label><input id="contact-name" name="name" value="', escapeHtml(state.contact.name), '" required></div>',
            '<div class="form-field"><label for="contact-phone">手机</label><input id="contact-phone" name="phone" value="', escapeHtml(state.contact.formattedNumber), '" inputmode="tel" required></div>',
            '<div class="form-field"><label for="contact-company">公司</label><input id="contact-company" name="organization" value="', escapeHtml(state.contact.organization), '"></div>',
            '<div class="form-field"><label for="contact-remark">备注</label><input id="contact-remark" name="remark" value="', escapeHtml(state.contact.remark), '"></div>',
          '</form>',
          '<p class="form-error" id="system-form-error" role="alert"></p>',
          '<p class="system-footnote">系统通讯录模拟页 · 字段可编辑<br>正式页面样式与交互由 iOS / Android / 鸿蒙控制</p>',
        '</div>',
      '</section>'
    ].join('');
  }

  function renderSuccessOverlay() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="success-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="success-mark" aria-hidden="true">✓</div>',
            '<h2 id="success-title">提醒号码已保存</h2>',
            '<p>以后低电来电将优先显示“智格-电量过低提醒”；实际显示以手机系统为准。</p>',
          '</div>',
          '<div class="dialog-actions one"><button class="confirm" type="button" data-action="close-success">知道了</button></div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderUnsupportedOverlay() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="unsupported-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="error-mark" aria-hidden="true">×</div>',
            '<h2 id="unsupported-title">当前微信版本暂不支持</h2>',
            '<p>你可以复制 ', escapeHtml(state.contact.formattedNumber), '，再前往手机通讯录手动新建联系人。</p>',
          '</div>',
          '<div class="dialog-actions">',
            '<button type="button" data-action="close-overlay">关闭</button>',
            '<button class="confirm" type="button" data-action="copy-number">复制号码</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderConfigErrorOverlay() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="config-error-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="error-mark" aria-hidden="true">!</div>',
            '<h2 id="config-error-title">提醒号码加载失败</h2>',
            '<p>为了避免写入错误号码，本次不能继续保存。请检查网络后重试。</p>',
          '</div>',
          '<div class="dialog-actions">',
            '<button type="button" data-action="close-overlay">稍后处理</button>',
            '<button class="confirm" type="button" data-action="retry-config">重试</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderSaveErrorOverlay() {
    return [
      '<div class="scrim" role="dialog" aria-modal="true" aria-labelledby="save-error-title">',
        '<section class="dialog-card">',
          '<div class="dialog-body">',
            '<div class="error-mark" aria-hidden="true">!</div>',
            '<h2 id="save-error-title">联系人保存失败</h2>',
            '<p>手机系统未完成写入，请稍后重试。已有联系人和换电服务不受影响。</p>',
          '</div>',
          '<div class="dialog-actions">',
            '<button type="button" data-action="close-overlay">稍后处理</button>',
            '<button class="confirm" type="button" data-action="start-save">重新保存</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderNumberUpdateOverlay() {
    return [
      '<div class="scrim align-end" role="dialog" aria-modal="true" aria-labelledby="number-update-title">',
        '<section class="bottom-sheet">',
          '<div class="sheet-handle" aria-hidden="true"></div>',
          '<div class="sheet-hero">',
            '<span class="sheet-icon" aria-hidden="true">新</span>',
            '<div class="sheet-copy"><h2 id="number-update-title">低电提醒号码已更新</h2><p>请保存新号码。旧联系人需在手机通讯录中自行删除。</p></div>',
          '</div>',
          '<div class="sheet-contact">',
            '<div><strong>', escapeHtml(state.contact.name), '</strong><span>新号码 ', escapeHtml(state.contact.formattedNumber), '</span></div>',
            '<span class="write-only-tag">', escapeHtml(state.currentNumberVersion), '</span>',
          '</div>',
          '<div class="button-stack">',
            '<button class="primary-button full-button" type="button" data-action="start-save">更新提醒号码</button>',
            '<button class="plain-button full-button" type="button" data-action="close-overlay">稍后处理</button>',
          '</div>',
        '</section>',
      '</div>'
    ].join('');
  }

  function renderOverlay(status) {
    if (state.overlay === 'intro') {
      return renderIntroOverlay(status);
    }
    if (state.overlay === 'permission') {
      return renderPermissionOverlay();
    }
    if (state.overlay === 'permission-help') {
      return renderPermissionHelp();
    }
    if (state.overlay === 'contact-choice') {
      return renderContactChoice();
    }
    if (state.overlay === 'system-contact') {
      return renderSystemContact();
    }
    if (state.overlay === 'success') {
      return renderSuccessOverlay();
    }
    if (state.overlay === 'unsupported') {
      return renderUnsupportedOverlay();
    }
    if (state.overlay === 'config-error') {
      return renderConfigErrorOverlay();
    }
    if (state.overlay === 'save-error') {
      return renderSaveErrorOverlay();
    }
    if (state.overlay === 'number-update') {
      return renderNumberUpdateOverlay();
    }
    return '';
  }

  function renderHeader() {
    var titles = {
      home: '智格换电',
      orders: '订单',
      mine: '我的',
      login: '登录',
      'reminder-settings': '来电提醒',
      'pickup-success': '领取结果',
      'pickup-failed': '领取结果',
      'call-demo': ''
    };
    var canGoBack = ['reminder-settings', 'pickup-success', 'pickup-failed', 'login'].indexOf(state.screen) >= 0;
    miniTitle.textContent = titles[state.screen] || '智格换电';
    backButton.classList.toggle('is-hidden', !canGoBack);
    miniHeader.classList.toggle('is-hidden', state.screen === 'call-demo');
    var hideTabs = ['reminder-settings', 'pickup-success', 'pickup-failed', 'call-demo', 'login'].indexOf(state.screen) >= 0;
    tabBar.classList.toggle('is-hidden', hideTabs);
    phoneBezel.classList.toggle('without-tabs', hideTabs);

    document.querySelectorAll('[data-tab]').forEach(function (button) {
      button.classList.toggle('active', button.dataset.tab === state.tab);
      button.classList.toggle('is-out-of-scope-tab', button.dataset.tab === 'orders');
    });
  }

  function renderInspector(status) {
    statusTitle.textContent = status.title;
    statusPill.textContent = status.key;
    statusPill.className = 'status-pill ' + toneClass(status.tone);
    stateList.innerHTML = [
      '<div><dt>登录状态</dt><dd>', escapeHtml(state.loggedIn ? '已登录' : '未登录'), '</dd></div>',
      '<div><dt>联系人</dt><dd>', escapeHtml(state.contact.name), '</dd></div>',
      '<div><dt>提醒号码</dt><dd>', escapeHtml(state.configAvailable ? state.contact.formattedNumber : '未加载'), '</dd></div>',
      '<div><dt>号码版本</dt><dd>', escapeHtml(state.currentNumberVersion || '—'), '</dd></div>',
      '<div><dt>已保存版本</dt><dd>', escapeHtml(state.savedNumberVersion || '—'), '</dd></div>',
      '<div><dt>通讯录权限</dt><dd>', escapeHtml(permissionLabel(state.permission)), '</dd></div>',
    ].join('');

    eventCount.textContent = state.eventLog.length + ' 条';
    eventLogBody.innerHTML = state.eventLog.map(function (item) {
      var resultClass = ['failed', 'denied'].indexOf(item.result) >= 0 ? item.result : '';
      return [
        '<tr>',
          '<td>', escapeHtml(item.time), '</td>',
          '<td><span class="event-name">', escapeHtml(item.event), '</span><span class="event-result ', resultClass, '">', escapeHtml(item.result), '</span></td>',
          '<td class="event-properties">', escapeHtml(item.properties), '</td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function render() {
    var status = core.deriveReminderStatus(state);
    statusTime.textContent = currentTimeLabel();
    renderHeader();
    screenRoot.innerHTML = renderScreen(status);
    overlayRoot.innerHTML = renderOverlay(status);
    renderInspector(status);
    setActiveScenario(activeScenario);
  }

  function validateSystemContactForm() {
    var form = document.getElementById('system-contact-form');
    var error = document.getElementById('system-form-error');
    if (!form || !error) {
      return false;
    }

    var name = form.elements.name.value.trim();
    var phone = form.elements.phone.value.replace(/\D/g, '');
    var existing = form.elements.existingContact;
    if (state.contactMode === 'merge' && existing && !existing.value) {
      error.textContent = '请选择要添加号码的已有联系人';
      existing.focus();
      return false;
    }
    if (!name) {
      error.textContent = '联系人名称不能为空';
      form.elements.name.focus();
      return false;
    }
    if (phone.length < 8) {
      error.textContent = '请输入有效的提醒号码';
      form.elements.phone.focus();
      return false;
    }
    error.textContent = '';
    return true;
  }

  function handleBack() {
    if (state.screen === 'reminder-settings' || state.screen === 'login') {
      dispatch({ type: 'RETURN_FROM_DETAIL' });
      return;
    }
    dispatch({ type: 'NAVIGATE_TAB', tab: 'home' });
  }

  function handleAction(action, element) {
    switch (action) {
      case 'reset-demo':
        loadScenario('default');
        showToast('演示状态已重置');
        break;

      case 'back':
        handleBack();
        break;

      case 'go-home':
        dispatch({ type: 'NAVIGATE_TAB', tab: 'home' });
        break;

      case 'trigger-first-pickup':
        dispatch({ type: 'FIRST_PICKUP_SUCCESS' });
        break;

      case 'login':
        dispatch({
          type: 'LOGIN',
          entry: 'wechat',
          screen: state.hasBattery ? 'home' : 'mine',
          tab: state.hasBattery ? 'home' : 'mine'
        });
        showToast('登录成功');
        break;

      case 'switch-order-tab':
        dispatch({ type: 'SWITCH_ORDER_TAB', subTab: element.dataset.subtab || 'swap' });
        break;

      case 'retry-battery':
        dispatch({ type: 'RETRY_BATTERY' });
        showToast('已重新加载电池状态');
        break;

      case 'open-reminder':
        dispatch({ type: 'OPEN_REMINDER' });
        break;

      case 'start-save':
        dispatch({
          type: 'START_SAVE',
          entry: state.screen === 'pickup-success'
            ? (state.resultKind === 'swap' ? 'swap_success' : 'first_pickup')
            : 'settings'
        });
        break;

      case 'dismiss-intro':
        dispatch({ type: 'DISMISS_INTRO' });
        showToast('可在“我的－来电提醒”中再次保存');
        break;

      case 'allow-permission':
        dispatch({ type: 'PERMISSION_ALLOWED' });
        break;

      case 'deny-permission':
        dispatch({ type: 'PERMISSION_DENIED' });
        break;

      case 'restore-permission':
        dispatch({ type: 'PERMISSION_RESTORED' });
        showToast('已模拟开启通讯录仅写入权限');
        break;

      case 'choose-new':
        dispatch({ type: 'CHOOSE_NEW' });
        break;

      case 'choose-existing':
        dispatch({ type: 'CHOOSE_EXISTING' });
        break;

      case 'confirm-system-save':
        if (validateSystemContactForm()) {
          dispatch({ type: 'SAVE_CONFIRMED' });
        }
        break;

      case 'cancel-system-save':
        dispatch({ type: 'SYSTEM_CANCELLED' });
        showToast('未完成保存，可稍后重试');
        break;

      case 'close-success':
        dispatch({ type: 'CLOSE_SUCCESS' });
        break;

      case 'close-overlay':
        state.overlay = null;
        activeScenario = '';
        render();
        break;

      case 'copy-number':
        copyReminderNumber();
        break;

      case 'retry-config':
        dispatch({ type: 'CONFIG_RESTORED' });
        showToast('已重新加载官方提醒号码');
        break;

      case 'simulate-low-call':
        dispatch({ type: 'SIMULATE_LOW_CALL', soc: 12 });
        break;

      case 'answer-call':
        dispatch({ type: 'ANSWER_CALL' });
        break;

      case 'decline-call':
        dispatch({ type: 'DECLINE_CALL' });
        break;

      case 'end-call':
        dispatch({ type: 'END_CALL' });
        break;

      case 'return-app':
        dispatch({ type: 'RETURN_FROM_CALL' });
        break;

      case 'show-toast':
        showToast(element.dataset.message || '该功能为原有业务入口');
        break;

      case 'noop':
        showToast('小程序系统菜单为示意');
        break;

      default:
        break;
    }
  }

  document.addEventListener('click', function (event) {
    var scenarioButton = event.target.closest('[data-scenario]');
    if (scenarioButton) {
      loadScenario(scenarioButton.dataset.scenario);
      return;
    }

    var tabButton = event.target.closest('[data-tab]');
    if (tabButton) {
      dispatch({ type: 'NAVIGATE_TAB', tab: tabButton.dataset.tab });
      return;
    }

    var actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      handleAction(actionButton.dataset.action, actionButton);
    }
  });

  statusTime.textContent = currentTimeLabel();
  root.setInterval(function () {
    statusTime.textContent = currentTimeLabel();
  }, 60000);

  render();
}(typeof window !== 'undefined' ? window : null));
