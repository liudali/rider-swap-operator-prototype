(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.ReminderState = api;
  }
  return api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var REMINDER_CONTACT = Object.freeze({
    name: '智格-电量过低提醒',
    formattedNumber: '021-6105-1028',
    dialableNumber: '02161051028',
    numberVersion: 'v1',
    organization: '智格换电',
    remark: '低电提醒专用外呼号码',
    source: '外呼服务商固定号码'
  });

  var STATUS_COPY = {
    ready: {
      key: 'ready',
      title: '可添加',
      description: '添加后，低电来电会优先显示联系人名称。小程序无法查看通讯录里是否已有该联系人。',
      tone: 'neutral',
      action: '添加到通讯录'
    },
    prompting: {
      key: 'prompting',
      title: '添加中',
      description: '请在系统联系人页面确认',
      tone: 'info',
      action: '继续添加'
    },
    permission_denied: {
      key: 'permission_denied',
      title: '未授权写入',
      description: '开启仅写入权限后可继续添加，不会读取通讯录',
      tone: 'warning',
      action: '查看开启方法'
    },
    unsupported: {
      key: 'unsupported',
      title: '当前微信版本暂不支持',
      description: '可复制号码后前往手机通讯录手动新建',
      tone: 'error',
      action: '复制号码'
    },
    config_error: {
      key: 'config_error',
      title: '提醒号码加载失败',
      description: '暂时无法获取官方提醒号码，请稍后重试',
      tone: 'error',
      action: '重试加载'
    }
  };

  function cloneContact(contact) {
    var source = contact || REMINDER_CONTACT;
    return {
      name: source.name,
      formattedNumber: source.formattedNumber,
      dialableNumber: source.dialableNumber,
      numberVersion: source.numberVersion,
      organization: source.organization,
      remark: source.remark,
      source: source.source
    };
  }

  function createInitialState(overrides) {
    var state = {
      tab: 'home',
      screen: 'home',
      overlay: null,
      loggedIn: true,
      hasBattery: true,
      batteryLoadError: false,
      orderSubTab: 'swap',
      pickupFailed: false,
      resultKind: null,
      soc: 18,
      estimatedMinutes: 32,
      permission: 'prompt',
      swapPromptShown: false,
      firstPowerEventAt: null,
      nowAt: '2026-09-09T14:28:00+08:00',
      currentNumberVersion: REMINDER_CONTACT.numberVersion,
      apiSupported: true,
      configAvailable: true,
      contactMode: 'new',
      contact: cloneContact(REMINDER_CONTACT),
      callDisplayName: null,
      callStatus: 'idle',
      settingsOriginScreen: null,
      settingsOriginTab: null,
      detailStack: [],
      callOriginScreen: null,
      callOriginTab: null,
      lastWriteResult: null,
      eventLog: [
        {
          time: '14:28:00',
          event: 'prototype_loaded',
          result: 'success',
          properties: 'scenario=default'
        }
      ]
    };
    var source = overrides || {};
    Object.keys(source).forEach(function (key) {
      if (key === 'contact') {
        state.contact = cloneContact(source.contact);
      } else if (key === 'eventLog') {
        state.eventLog = source.eventLog.slice();
      } else if (key === 'detailStack') {
        state.detailStack = (source.detailStack || []).map(function (item) {
          return { screen: item.screen, tab: item.tab };
        });
      } else {
        state[key] = source[key];
      }
    });
    return state;
  }

  function cloneState(state) {
    return createInitialState(state);
  }

  var MINE_ENTRY_DAYS = 7;

  function dateKey(iso) {
    return String(iso || '').slice(0, 10);
  }

  function calendarDaysBetween(startAt, nowAt) {
    var start = dateKey(startAt);
    var now = dateKey(nowAt);
    if (!start || !now) {
      return null;
    }
    var startMs = Date.parse(start + 'T00:00:00+08:00');
    var nowMs = Date.parse(now + 'T00:00:00+08:00');
    if (isNaN(startMs) || isNaN(nowMs)) {
      return null;
    }
    return Math.round((nowMs - startMs) / 86400000);
  }

  function stampFromEvent(state, event) {
    if (event && event.at && String(event.at).indexOf('T') >= 0) {
      return event.at;
    }
    return state.nowAt || '2026-09-09T14:28:00+08:00';
  }

  function markFirstPowerEvent(state, event) {
    if (!state.firstPowerEventAt) {
      state.firstPowerEventAt = stampFromEvent(state, event);
    }
  }

  function shouldAutoPrompt(state) {
    return Boolean(
      state.loggedIn &&
      state.configAvailable &&
      state.apiSupported &&
      !state.swapPromptShown
    );
  }

  function shouldShowMineEntry(state) {
    if (!state.loggedIn || !state.firstPowerEventAt) {
      return false;
    }
    var days = calendarDaysBetween(state.firstPowerEventAt, state.nowAt);
    return days !== null && days >= 0 && days < MINE_ENTRY_DAYS;
  }

  function mineEntryElapsedDays(state) {
    return calendarDaysBetween(state.firstPowerEventAt, state.nowAt);
  }

  function remainingMineEntryDays(state) {
    var elapsed = mineEntryElapsedDays(state);
    if (elapsed === null || elapsed < 0) {
      return null;
    }
    return Math.max(0, MINE_ENTRY_DAYS - elapsed);
  }

  function deriveReminderStatus(state) {
    if (!state.configAvailable) {
      return STATUS_COPY.config_error;
    }
    if (!state.apiSupported) {
      return STATUS_COPY.unsupported;
    }
    if (state.permission === 'denied') {
      return STATUS_COPY.permission_denied;
    }
    if (state.overlay && ['permission', 'contact-choice', 'system-contact'].indexOf(state.overlay) >= 0) {
      return STATUS_COPY.prompting;
    }
    return STATUS_COPY.ready;
  }

  function appendEvent(state, event, result, properties) {
    var nextLog = state.eventLog.slice();
    nextLog.unshift({
      time: event.at || '14:28:00',
      event: event.name || event.type.toLowerCase(),
      result: result || 'success',
      properties: properties || '—'
    });
    state.eventLog = nextLog.slice(0, 16);
    return state;
  }

  function pushDetail(state, screen, tab) {
    var stack = (state.detailStack || []).slice();
    stack.push({ screen: screen, tab: tab || 'mine' });
    state.detailStack = stack;
  }

  function transition(currentState, event) {
    var state = cloneState(currentState);
    var status;
    var oldVersion;
    var skipReason;

    switch (event.type) {
      case 'NAVIGATE_TAB':
        state.tab = event.tab;
        state.screen = event.tab;
        state.overlay = null;
        state.pickupFailed = false;
        return appendEvent(state, event, 'success', 'tab=' + event.tab);

      case 'SWITCH_ORDER_TAB':
        state.tab = 'orders';
        state.screen = 'orders';
        state.orderSubTab = event.subTab || 'swap';
        return appendEvent(state, event, 'success', 'order_tab=' + state.orderSubTab);

      case 'LOGIN':
        state.loggedIn = true;
        state.screen = event.screen || 'mine';
        state.tab = event.tab || 'mine';
        state.overlay = null;
        return appendEvent(state, event, 'success', 'entry=' + (event.entry || 'mine'));

      case 'OPEN_REMINDER':
        if (!state.loggedIn) {
          state.tab = 'mine';
          state.screen = 'login';
          state.overlay = null;
          return appendEvent(state, event, 'blocked', 'reason=not_logged_in');
        }
        if (state.screen !== 'reminder-settings') {
          pushDetail(state, state.screen, state.tab);
        }
        state.tab = 'mine';
        state.screen = 'reminder-settings';
        state.overlay = null;
        status = deriveReminderStatus(state);
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_settings_view' },
          'success',
          'capability=' + status.key +
            '&number_version=' + state.currentNumberVersion
        );

      case 'OPEN_APP_SETTINGS':
        if (!state.loggedIn) {
          state.tab = 'mine';
          state.screen = 'login';
          state.overlay = null;
          return appendEvent(state, event, 'blocked', 'reason=not_logged_in');
        }
        if (state.screen !== 'app-settings') {
          pushDetail(state, state.screen, state.tab);
        }
        state.tab = 'mine';
        state.screen = 'app-settings';
        state.overlay = null;
        return appendEvent(state, event, 'success', 'entry=mine');

      case 'RETURN_FROM_DETAIL':
        if (state.screen === 'login') {
          state.screen = 'mine';
          state.tab = 'mine';
          state.overlay = null;
          return state;
        }
        var prev = (state.detailStack || []).slice();
        var origin = prev.pop() || { screen: 'mine', tab: 'mine' };
        state.detailStack = prev;
        state.screen = origin.screen;
        state.tab = origin.tab || 'mine';
        state.overlay = null;
        return state;

      case 'FIRST_PICKUP_SUCCESS':
        if (!state.loggedIn) {
          state.screen = 'login';
          state.tab = 'mine';
          return appendEvent(state, event, 'blocked', 'reason=not_logged_in');
        }
        state.tab = 'home';
        state.screen = 'pickup-success';
        state.hasBattery = true;
        state.batteryLoadError = false;
        state.pickupFailed = false;
        state.resultKind = 'pickup';
        state.soc = 82;
        state.estimatedMinutes = 286;
        markFirstPowerEvent(state, event);
        state.overlay = null;
        return appendEvent(state, event, 'skipped', 'reason=pickup_no_prompt');

      case 'SWAP_SUCCESS':
        if (!state.loggedIn) {
          state.screen = 'login';
          state.tab = 'mine';
          return appendEvent(state, event, 'blocked', 'reason=not_logged_in');
        }
        state.tab = 'home';
        state.screen = 'pickup-success';
        state.hasBattery = true;
        state.batteryLoadError = false;
        state.pickupFailed = false;
        state.resultKind = 'swap';
        state.soc = 82;
        state.estimatedMinutes = 286;
        markFirstPowerEvent(state, event);
        if (shouldAutoPrompt(state)) {
          state.overlay = 'intro';
          state.swapPromptShown = true;
          return appendEvent(
            state,
            { type: event.type, at: event.at, name: 'low_battery_contact_prompt_view' },
            'shown',
            'entry=swap_success&user_once=1&number_version=' + state.currentNumberVersion
          );
        }
        state.overlay = null;
        skipReason = !state.configAvailable
          ? 'config_unavailable'
          : (!state.apiSupported ? 'api_unsupported' : 'already_prompted');
        return appendEvent(state, event, 'skipped', 'reason=' + skipReason);

      case 'PICKUP_FAILED':
        state.tab = 'home';
        state.screen = 'pickup-failed';
        state.overlay = null;
        state.pickupFailed = true;
        return appendEvent(state, event, 'failed', 'reason=cabinet_timeout');

      case 'BATTERY_LOAD_FAILED':
        state.batteryLoadError = true;
        state.screen = 'home';
        state.tab = 'home';
        return appendEvent(state, event, 'failed', 'reason=battery_status_timeout');

      case 'RETRY_BATTERY':
        state.batteryLoadError = false;
        state.screen = 'home';
        state.tab = 'home';
        return appendEvent(state, event, 'success', 'source=retry');

      case 'OPEN_INTRO':
        if (!state.configAvailable) {
          state.overlay = 'config-error';
          return appendEvent(state, event, 'failed', 'reason=config_unavailable');
        }
        state.overlay = 'intro';
        return appendEvent(state, event, 'shown', 'entry=' + (event.entry || 'manual'));

      case 'DISMISS_INTRO':
        state.overlay = null;
        return appendEvent(state, event, 'cancelled', 'action=later');

      case 'START_SAVE':
        if (!state.loggedIn) {
          state.screen = 'login';
          state.tab = 'mine';
          state.overlay = null;
          return appendEvent(state, event, 'blocked', 'reason=not_logged_in');
        }
        status = deriveReminderStatus(state);
        if (!state.configAvailable) {
          state.overlay = 'config-error';
          return appendEvent(
            state,
            event,
            'failed',
            'reason=config_unavailable&capability=' + status.key +
              '&number_version=' + state.currentNumberVersion
          );
        }
        if (!state.apiSupported) {
          state.overlay = 'unsupported';
          return appendEvent(
            state,
            event,
            'failed',
            'reason=api_unsupported&capability=' + status.key +
              '&number_version=' + state.currentNumberVersion
          );
        }
        if (state.permission === 'denied') {
          state.overlay = 'permission-help';
        } else {
          state.overlay = state.permission === 'granted'
            ? 'contact-choice'
            : 'permission';
        }
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_save_click' },
          'success',
          'entry=' + (event.entry || 'manual') +
            '&capability=' + status.key +
            '&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_ALLOWED':
        state.permission = 'granted';
        state.overlay = 'contact-choice';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_permission_result' },
          'allowed',
          'scope=addPhoneContact&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_DENIED':
        state.permission = 'denied';
        state.overlay = 'permission-help';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_permission_result' },
          'denied',
          'scope=addPhoneContact&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_RESTORED':
        state.permission = 'granted';
        state.overlay = 'contact-choice';
        return appendEvent(state, event, 'allowed', 'source=settings');

      case 'CHOOSE_NEW':
        state.contactMode = 'new';
        state.overlay = 'system-contact';
        return appendEvent(state, event, 'success', 'mode=new');

      case 'CHOOSE_EXISTING':
        state.contactMode = 'merge';
        state.overlay = 'system-contact';
        return appendEvent(state, event, 'success', 'mode=merge');

      case 'BACK_TO_CONTACT_CHOICE':
        state.overlay = 'contact-choice';
        return state;

      case 'SYSTEM_CANCELLED':
        state.lastWriteResult = 'cancelled';
        state.screen = 'reminder-settings';
        state.tab = 'mine';
        state.overlay = null;
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_system_result' },
          'cancelled',
          'system_mode=unknown&number_version=' + state.currentNumberVersion
        );

      case 'SAVE_FAILED':
        state.lastWriteResult = 'failed';
        state.screen = 'reminder-settings';
        state.tab = 'mine';
        state.overlay = 'save-error';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_system_result' },
          'failed',
          'error_code=' + (event.errorCode || 'unknown') +
            '&number_version=' + state.currentNumberVersion +
            '&system_mode=unknown'
        );

      case 'SAVE_CONFIRMED':
        state.lastWriteResult = 'api_success';
        state.screen = 'reminder-settings';
        state.tab = 'mine';
        state.overlay = 'success';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_system_result' },
          'api_success',
          'system_mode=unknown&number_version=' + state.currentNumberVersion
        );

      case 'CLOSE_SUCCESS':
        state.overlay = null;
        return state;

      case 'API_UNSUPPORTED':
        state.apiSupported = false;
        state.overlay = 'unsupported';
        return appendEvent(state, event, 'failed', 'reason=api_unsupported');

      case 'CONFIG_ERROR':
        state.configAvailable = false;
        state.overlay = 'config-error';
        return appendEvent(state, event, 'failed', 'reason=config_unavailable');

      case 'CONFIG_RESTORED':
        state.configAvailable = true;
        state.overlay = null;
        return appendEvent(state, event, 'success', 'number_version=' + state.currentNumberVersion);

      case 'NUMBER_UPDATED':
        oldVersion = state.currentNumberVersion;
        state.currentNumberVersion = event.numberVersion || 'v2';
        state.contact = cloneContact({
          name: REMINDER_CONTACT.name,
          formattedNumber: event.formattedNumber || '021-6105-2066',
          dialableNumber: event.dialableNumber || '02161052066',
          numberVersion: event.numberVersion || 'v2',
          organization: REMINDER_CONTACT.organization,
          remark: REMINDER_CONTACT.remark,
          source: REMINDER_CONTACT.source
        });
        state.screen = 'reminder-settings';
        state.tab = 'mine';
        state.overlay = event.showOverlay ? 'number-update' : null;
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_update_view' },
          'shown',
          'old_version=' + (oldVersion || 'none') +
            '&new_version=' + state.currentNumberVersion
        );

      case 'SIMULATE_LOW_CALL':
        state.callOriginScreen = state.screen;
        state.callOriginTab = state.tab;
        state.screen = 'call-demo';
        state.overlay = null;
        state.soc = event.soc || 12;
        state.callStatus = 'ringing';
        state.callDisplayName = event.assumeName === false ? null : state.contact.name;
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_call_result' },
          'ringing',
          'demo_assume_name=' + String(event.assumeName !== false) +
            '&number_version=' + state.currentNumberVersion
        );

      case 'RETURN_FROM_CALL':
        state.screen = state.callOriginScreen || 'home';
        state.tab = state.callOriginTab || 'home';
        state.overlay = null;
        state.callStatus = 'idle';
        state.callDisplayName = null;
        return state;

      case 'ANSWER_CALL':
        state.callStatus = 'connected';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_call_result' },
          'answered',
          'ring_seconds=4&number_version=' + state.currentNumberVersion
        );

      case 'DECLINE_CALL':
        state.callStatus = 'declined';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_call_result' },
          'declined',
          'ring_seconds=4&number_version=' + state.currentNumberVersion
        );

      case 'END_CALL':
        state.callStatus = 'ended';
        return appendEvent(
          state,
          event,
          'success',
          'duration_seconds=18&number_version=' + state.currentNumberVersion
        );

      case 'RESET_DEMO':
        return createInitialState();

      default:
        return state;
    }
  }

  return {
    REMINDER_CONTACT: REMINDER_CONTACT,
    STATUS_COPY: STATUS_COPY,
    createInitialState: createInitialState,
    transition: transition,
    shouldAutoPrompt: shouldAutoPrompt,
    shouldShowMineEntry: shouldShowMineEntry,
    mineEntryElapsedDays: mineEntryElapsedDays,
    remainingMineEntryDays: remainingMineEntryDays,
    MINE_ENTRY_DAYS: MINE_ENTRY_DAYS,
    deriveReminderStatus: deriveReminderStatus
  };
}));
