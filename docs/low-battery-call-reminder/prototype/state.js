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
    not_saved: {
      key: 'not_saved',
      title: '未保存',
      description: '保存后，低电来电会优先显示联系人名称',
      tone: 'neutral',
      action: '保存到通讯录'
    },
    prompting: {
      key: 'prompting',
      title: '保存中',
      description: '请在系统联系人页面确认保存',
      tone: 'info',
      action: '继续保存'
    },
    permission_denied: {
      key: 'permission_denied',
      title: '未授权通讯录',
      description: '开启仅写入权限后可继续保存',
      tone: 'warning',
      action: '查看开启方法'
    },
    system_cancelled: {
      key: 'system_cancelled',
      title: '未完成保存',
      description: '你已取消系统联系人保存，可随时重试',
      tone: 'warning',
      action: '重新保存'
    },
    save_failed: {
      key: 'save_failed',
      title: '保存失败',
      description: '系统未完成联系人写入，请稍后重试',
      tone: 'error',
      action: '重新保存'
    },
    saved: {
      key: 'saved',
      title: '已保存',
      description: '低电来电将优先显示“智格-电量过低提醒”',
      tone: 'success',
      action: '重新保存'
    },
    outdated: {
      key: 'outdated',
      title: '号码已更新',
      description: '请保存新号码；旧联系人需在系统通讯录中自行删除',
      tone: 'warning',
      action: '更新提醒号码'
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
      saveStatus: 'not_saved',
      promptedNumberVersion: null,
      savedNumberVersion: null,
      currentNumberVersion: REMINDER_CONTACT.numberVersion,
      apiSupported: true,
      configAvailable: true,
      contactMode: 'new',
      contact: cloneContact(REMINDER_CONTACT),
      callDisplayName: null,
      callStatus: 'idle',
      settingsOriginScreen: null,
      settingsOriginTab: null,
      callOriginScreen: null,
      callOriginTab: null,
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
      } else {
        state[key] = source[key];
      }
    });
    return state;
  }

  function cloneState(state) {
    return createInitialState(state);
  }

  function shouldAutoPrompt(state) {
    return Boolean(
      state.loggedIn &&
      state.configAvailable &&
      state.apiSupported &&
      state.currentNumberVersion &&
      state.promptedNumberVersion !== state.currentNumberVersion &&
      state.savedNumberVersion !== state.currentNumberVersion
    );
  }

  function deriveReminderStatus(state) {
    if (!state.configAvailable) {
      return STATUS_COPY.config_error;
    }
    if (!state.apiSupported || state.saveStatus === 'unsupported') {
      return STATUS_COPY.unsupported;
    }
    if (
      state.savedNumberVersion &&
      state.savedNumberVersion !== state.currentNumberVersion
    ) {
      return STATUS_COPY.outdated;
    }
    if (
      state.saveStatus === 'saved' &&
      state.savedNumberVersion === state.currentNumberVersion
    ) {
      return STATUS_COPY.saved;
    }
    return STATUS_COPY[state.saveStatus] || STATUS_COPY.not_saved;
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

  function transition(currentState, event) {
    var state = cloneState(currentState);
    var status;

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
          state.settingsOriginScreen = state.screen;
          state.settingsOriginTab = state.tab;
        }
        state.tab = 'mine';
        state.screen = 'reminder-settings';
        state.overlay = null;
        status = deriveReminderStatus(state);
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_settings_view' },
          'success',
          'save_status=' + status.key +
            '&number_version=' + state.currentNumberVersion
        );

      case 'RETURN_FROM_DETAIL':
        if (state.screen === 'login') {
          state.screen = 'mine';
          state.tab = 'mine';
          state.overlay = null;
          return state;
        }
        state.screen = state.settingsOriginScreen || 'mine';
        state.tab = state.settingsOriginTab || 'mine';
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
        if (shouldAutoPrompt(state)) {
          state.overlay = 'intro';
          state.promptedNumberVersion = state.currentNumberVersion;
          return appendEvent(
            state,
            { type: event.type, at: event.at, name: 'low_battery_contact_prompt_view' },
            'shown',
            'entry=first_pickup&number_version=' + state.currentNumberVersion
          );
        }
        state.overlay = null;
        return appendEvent(state, event, 'skipped', 'reason=already_prompted_or_saved');

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
        if (shouldAutoPrompt(state)) {
          state.overlay = 'intro';
          state.promptedNumberVersion = state.currentNumberVersion;
          return appendEvent(
            state,
            { type: event.type, at: event.at, name: 'low_battery_contact_prompt_view' },
            'shown',
            'entry=swap_success&number_version=' + state.currentNumberVersion
          );
        }
        state.overlay = null;
        return appendEvent(state, event, 'skipped', 'reason=already_prompted_or_saved');

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
          state.saveStatus = 'config_error';
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
          state.saveStatus = 'config_error';
          state.overlay = 'config-error';
          return appendEvent(
            state,
            event,
            'failed',
            'reason=config_unavailable&previous_status=' + status.key +
              '&number_version=' + state.currentNumberVersion
          );
        }
        if (!state.apiSupported) {
          state.saveStatus = 'unsupported';
          state.overlay = 'unsupported';
          return appendEvent(
            state,
            event,
            'failed',
            'reason=api_unsupported&previous_status=' + status.key +
              '&number_version=' + state.currentNumberVersion
          );
        }
        if (state.permission === 'denied') {
          state.overlay = 'permission-help';
        } else {
          state.saveStatus = 'prompting';
          state.overlay = state.permission === 'granted'
            ? 'contact-choice'
            : 'permission';
        }
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_save_click' },
          'success',
          'entry=' + (event.entry || 'manual') +
            '&previous_status=' + status.key +
            '&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_ALLOWED':
        state.permission = 'granted';
        state.saveStatus = 'prompting';
        state.overlay = 'contact-choice';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_permission_result' },
          'allowed',
          'scope=addPhoneContact&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_DENIED':
        state.permission = 'denied';
        state.saveStatus = state.savedNumberVersion === state.currentNumberVersion
          ? 'saved'
          : 'permission_denied';
        state.overlay = 'permission-help';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_permission_result' },
          'denied',
          'scope=addPhoneContact&number_version=' + state.currentNumberVersion
        );

      case 'PERMISSION_RESTORED':
        state.permission = 'granted';
        state.saveStatus = 'prompting';
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
        state.saveStatus = state.savedNumberVersion === state.currentNumberVersion
          ? 'saved'
          : 'system_cancelled';
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
        state.saveStatus = state.savedNumberVersion === state.currentNumberVersion
          ? 'saved'
          : 'save_failed';
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
        state.saveStatus = 'saved';
        state.savedNumberVersion = state.currentNumberVersion;
        state.screen = 'reminder-settings';
        state.tab = 'mine';
        state.overlay = 'success';
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_system_result' },
          'saved',
          'system_mode=unknown&number_version=' + state.currentNumberVersion
        );

      case 'CLOSE_SUCCESS':
        state.overlay = null;
        return state;

      case 'API_UNSUPPORTED':
        state.apiSupported = false;
        state.saveStatus = 'unsupported';
        state.overlay = 'unsupported';
        return appendEvent(state, event, 'failed', 'reason=api_unsupported');

      case 'CONFIG_ERROR':
        state.configAvailable = false;
        state.saveStatus = 'config_error';
        state.overlay = 'config-error';
        return appendEvent(state, event, 'failed', 'reason=config_unavailable');

      case 'CONFIG_RESTORED':
        state.configAvailable = true;
        if (!state.savedNumberVersion) {
          state.saveStatus = 'not_saved';
        } else if (state.savedNumberVersion === state.currentNumberVersion) {
          state.saveStatus = 'saved';
        }
        state.overlay = null;
        return appendEvent(state, event, 'success', 'number_version=' + state.currentNumberVersion);

      case 'NUMBER_UPDATED':
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
        if (event.showOverlay) {
          state.promptedNumberVersion = state.currentNumberVersion;
        }
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_contact_update_view' },
          'shown',
          'old_version=' + (state.savedNumberVersion || 'none') +
            '&new_version=' + state.currentNumberVersion
        );

      case 'SIMULATE_LOW_CALL':
        status = deriveReminderStatus(state);
        state.callOriginScreen = state.screen;
        state.callOriginTab = state.tab;
        state.screen = 'call-demo';
        state.overlay = null;
        state.soc = event.soc || 12;
        state.callStatus = 'ringing';
        state.callDisplayName = status.key === 'saved' ? state.contact.name : null;
        return appendEvent(
          state,
          { type: event.type, at: event.at, name: 'low_battery_call_result' },
          'ringing',
          'contact_saved=' + String(status.key === 'saved') +
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
    deriveReminderStatus: deriveReminderStatus
  };
}));
