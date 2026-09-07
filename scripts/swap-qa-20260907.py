#!/usr/bin/env python3
"""Swap platform QA crawl 2026-09-07: login, dual-role traverse, dialogs, safe writes."""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

ROOT = Path("/Users/liujie/Documents/project-AI/原型-外卖")
SHOT = ROOT / "docs" / "qa-shots-2026-09-07"
SHOT.mkdir(parents=True, exist_ok=True)
OUT = Path(f"/tmp/swap-qa-20260907-{os.environ.get('QA_ROLE', 'all')}.json")

LOGIN_URL = "https://auth-center.test.ccjycx.cn/login?requestedApp=PLATFORM"
PHONE = "13800000005"
PASSWORD = "Swap@2026"
QA_TAG = "QA-20260907"

EXTRACT_JS = r"""
() => {
  const clean = t => (t||'').replace(/\s+/g,' ').trim();
  const inputs = [...document.querySelectorAll('input,textarea,select')].map(el => ({
    tag: el.tagName.toLowerCase(),
    type: el.type || '',
    placeholder: el.placeholder || '',
    name: el.name || el.getAttribute('aria-label') || '',
    disabled: !!el.disabled,
    readonly: !!el.readOnly,
    value: (el.value || '').slice(0,80),
    role: el.getAttribute('role') || '',
  })).slice(0,80);
  const rows = [...document.querySelectorAll('.el-table__body-wrapper tbody tr, .el-table__body tbody tr')]
    .filter(tr => !tr.classList.contains('el-table__placeholder'))
    .slice(0, 8)
    .map(tr => [...tr.querySelectorAll('td')].map(td => clean(td.innerText)).slice(0, 16));
  return {
    title: document.title,
    url: location.href,
    headings: [...document.querySelectorAll('h1,h2,h3,.page-title')].map(el=>clean(el.innerText)).filter(Boolean).slice(0,12),
    menus: [...new Set([...document.querySelectorAll('.el-menu-item,.el-sub-menu__title')].map(el=>clean(el.innerText)).filter(t=>t&&t.length<40))].slice(0,80),
    tableHeaders: [...new Set([...document.querySelectorAll('thead th,.el-table__header th')].map(el=>clean(el.innerText)).filter(Boolean))].slice(0,40),
    tableRows: rows,
    labels: [...new Set([...document.querySelectorAll('label,.el-form-item__label')].map(el=>clean(el.innerText)).filter(Boolean))].slice(0,60),
    buttons: [...new Set([...document.querySelectorAll('button,.el-button')].map(el=>clean(el.innerText)).filter(t=>t&&t.length<40))].slice(0,50),
    inputs,
    alerts: [...document.querySelectorAll('.el-alert,.el-message,.el-notification')].map(el=>clean(el.innerText)).filter(Boolean).slice(0,12),
    emptyHints: [...document.querySelectorAll('.el-empty,[class*=empty]')].map(el=>clean(el.innerText)).filter(Boolean).slice(0,6),
    dialogs: [...document.querySelectorAll('.el-dialog,.el-drawer')].filter(el => {
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && el.offsetParent !== null;
    }).map(el => ({
      title: clean((el.querySelector('.el-dialog__title,.el-drawer__title')||{}).innerText||''),
      text: clean(el.innerText).slice(0,1600),
    })).slice(0,4),
    mentions: {
      weijieru: (document.body.innerText.match(/未接入|暂未接入|功能暂未/g)||[]).length,
      danweiFen: (document.body.innerText.match(/单位[：: ]*分/g)||[]).length,
      mock: (document.body.innerText.match(/Mock|待开发/g)||[]).length,
      zeroPrice: (document.body.innerText.match(/¥0\.00/g)||[]).length,
    },
    bodyPreview: clean(document.body.innerText).slice(0,2500),
  };
}
"""


def slug(text: str) -> str:
    s = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "_", text).strip("_")
    return s[:36] or "page"


def shot(page, name: str) -> str:
    path = SHOT / f"{name}.png"
    page.screenshot(path=str(path), full_page=False)
    return str(path)


def extract(page) -> dict:
    try:
        return page.evaluate(EXTRACT_JS)
    except Exception as e:
        return {"error": str(e), "url": page.url, "title": page.title()}


def wait_idle(page, ms=1200):
    try:
        page.wait_for_load_state("networkidle", timeout=8000)
    except PwTimeout:
        pass
    page.wait_for_timeout(ms)


def close_overlays(page):
    for _ in range(4):
        vis = page.locator(".el-dialog:visible, .el-drawer:visible, .el-message-box:visible")
        if vis.count() == 0:
            break
        cancel = page.locator(
            ".el-dialog:visible button:has-text('取消'), "
            ".el-drawer:visible button:has-text('取消'), "
            ".el-message-box:visible button:has-text('取消')"
        )
        if cancel.count():
            try:
                cancel.first.click(timeout=1500)
                page.wait_for_timeout(300)
                continue
            except Exception:
                pass
        page.keyboard.press("Escape")
        page.wait_for_timeout(250)
    # close message toasts
    try:
        page.evaluate("() => document.querySelectorAll('.el-message__closeBtn').forEach(b=>b.click())")
    except Exception:
        pass


def click_text(page, text: str, timeout=4000) -> bool:
    loc = page.get_by_text(text, exact=True)
    try:
        if loc.count():
            loc.first.click(timeout=timeout)
            return True
    except Exception:
        pass
    loc2 = page.locator(f"text={text}")
    try:
        if loc2.count():
            loc2.first.click(timeout=timeout)
            return True
    except Exception:
        pass
    return False


def expand_menus(page):
    for _ in range(3):
        titles = page.locator(".el-sub-menu__title")
        n = titles.count()
        for i in range(n):
            try:
                el = titles.nth(i)
                parent = el.locator("xpath=ancestor::*[contains(@class,'el-sub-menu')][1]")
                cls = parent.get_attribute("class") or ""
                if "is-opened" not in cls:
                    el.click(timeout=1500)
                    page.wait_for_timeout(200)
            except Exception:
                continue


def leaf_menus(page) -> list[str]:
    return page.evaluate(
        """() => {
          const clean = t => (t||'').replace(/\\s+/g,' ').trim();
          return [...new Set([...document.querySelectorAll('.el-menu-item')]
            .map(el => clean(el.innerText))
            .filter(t => t && t.length < 30))];
        }"""
    )


def login(page, report):
    page.goto(LOGIN_URL, wait_until="domcontentloaded", timeout=45000)
    wait_idle(page, 1500)
    report["steps"].append({"name": "login_page", "snap": extract(page), "shot": shot(page, "00_login")})
    page.locator("input").nth(0).fill(PHONE)
    page.locator("input[type=password]").fill(PASSWORD)
    page.get_by_role("button", name="登录").click()
    wait_idle(page, 2500)
    report["steps"].append({"name": "after_login", "snap": extract(page), "shot": shot(page, "01_subjects")})


def pick_subject(page, report, keyword: str, shot_name: str):
    clicked = False
    target = "平台管理系统" if keyword == "平台" else "运营商工作台"
    # prefer exact card title
    for sel in [page.get_by_text(target, exact=True), page.locator("button, .el-card").filter(has_text=target)]:
        try:
            if sel.count():
                sel.first.click(timeout=5000)
                clicked = True
                break
        except Exception:
            continue
    if not clicked:
        click_text(page, target)
    wait_idle(page, 3500)
    report["steps"].append({"name": f"enter_{keyword}", "snap": extract(page), "shot": shot(page, shot_name)})


def open_first_dialog(page, names: list[str]) -> dict | None:
    for name in names:
        btn = page.locator("button, .el-button, a").filter(has_text=name)
        try:
            if btn.count() == 0:
                continue
            # skip disabled
            for i in range(min(btn.count(), 4)):
                b = btn.nth(i)
                cls = b.get_attribute("class") or ""
                if "is-disabled" in cls:
                    continue
                b.click(timeout=2500)
                page.wait_for_timeout(800)
                snap = extract(page)
                if snap.get("dialogs"):
                    return {"opened": name, "snap": snap}
                # maybe a drawer
                if "el-drawer" in (snap.get("bodyPreview") or "") or snap.get("labels"):
                    if page.locator(".el-dialog:visible, .el-drawer:visible").count():
                        return {"opened": name, "snap": snap}
        except Exception as e:
            return {"opened": name, "error": str(e)}
    return None


def sample_row_action(page, action_names: list[str]) -> dict | None:
    for name in action_names:
        link = page.locator(".el-table__body-wrapper .el-button, .el-table__body .el-button, .el-table a").filter(
            has_text=name
        )
        try:
            if link.count() == 0:
                continue
            link.first.click(timeout=2500)
            page.wait_for_timeout(900)
            return {"opened": name, "snap": extract(page), "shot": shot(page, f"act_{slug(name)}_{int(time.time())%10000}")}
        except Exception as e:
            return {"opened": name, "error": str(e)}
    return None


def click_save(page, writes, step: str, shot_name: str):
    save = page.locator(
        ".el-dialog:visible button, .el-drawer:visible button, .el-message-box:visible button"
    ).filter(has_text=re.compile("确定|保存|提交"))
    if save.count() == 0:
        writes.append({"step": step, "note": "no save button"})
        return
    btn = save.first
    try:
        disabled = btn.is_disabled()
    except Exception:
        disabled = False
    if disabled:
        writes.append(
            {
                "step": step,
                "note": "save_disabled",
                "snap": extract(page),
                "shot": shot(page, shot_name),
            }
        )
        return
    try:
        btn.click(timeout=2500)
        page.wait_for_timeout(1200)
        writes.append({"step": step, "snap": extract(page), "shot": shot(page, shot_name)})
    except Exception as e:
        writes.append({"step": step, "error": str(e), "snap": extract(page), "shot": shot(page, shot_name)})


def crawl_role(page, report, role: str, prefix: str):
    expand_menus(page)
    page.wait_for_timeout(400)
    expand_menus(page)
    items = leaf_menus(page)
    report[f"{role}_menus"] = items
    pages = []
    for i, item in enumerate(items):
        expand_menus(page)
        ok = click_text(page, item)
        wait_idle(page, 1400)
        snap = extract(page)
        path = shot(page, f"{prefix}_{i+10:02d}_{slug(item)}")
        entry = {"menu": item, "clicked": ok, "screenshot": path, **snap, "dialogs_opened": []}

        # open create / edit / detail dialogs
        dlg = open_first_dialog(
            page,
            ["新建协议", "新增套餐价", "新增", "新建", "添加", "新增型号", "批量导入", "发起提现申请", "说明"],
        )
        if dlg:
            dname = slug(dlg.get("opened") or "dlg")
            dshot = shot(page, f"{prefix}_dlg_{slug(item)}_{dname}")
            dlg["screenshot"] = dshot
            entry["dialogs_opened"].append(dlg)
            close_overlays(page)

        act = sample_row_action(page, ["查看", "详情", "编辑", "编辑草稿", "历史记录", "实名信息"])
        if act:
            act_name = slug(act.get("opened") or "act")
            if "shot" not in act:
                act["screenshot"] = shot(page, f"{prefix}_row_{slug(item)}_{act_name}")
            else:
                act["screenshot"] = act.get("shot")
            entry["row_action"] = act
            close_overlays(page)

        pages.append(entry)
    report[f"{role}_pages"] = pages
    return pages


def try_write_platform(page, report):
    writes = []

    def go(menu):
        expand_menus(page)
        click_text(page, menu)
        wait_idle(page, 1200)

    # Battery model create
    go("电池型号管理")
    close_overlays(page)
    if click_text(page, "新增") or click_text(page, "新建") or click_text(page, "新增型号"):
        page.wait_for_timeout(700)
        writes.append({"step": "open_battery_model_new", "snap": extract(page), "shot": shot(page, "W_P_battery_model_new")})
        # fill visible text inputs
        try:
            inputs = page.locator(".el-dialog:visible input:not([disabled]), .el-drawer:visible input:not([disabled])")
            n = inputs.count()
            values = [f"QA{int(time.time())%100000}", f"{QA_TAG}型号", "48", "20"]
            for i in range(min(n, 6)):
                el = inputs.nth(i)
                t = (el.get_attribute("type") or "text").lower()
                if t in ("text", "number", ""):
                    try:
                        el.fill(values[i] if i < len(values) else "1")
                    except Exception:
                        pass
            writes.append({"step": "filled_battery_model", "snap": extract(page)})
            click_save(page, writes, "save_battery_model", "W_P_battery_model_save")
        except Exception as e:
            writes.append({"step": "battery_model_error", "error": str(e)})
        close_overlays(page)

    # Agreement new - capture validation, do not publish
    go("协议配置")
    close_overlays(page)
    if click_text(page, "新建协议"):
        page.wait_for_timeout(700)
        writes.append({"step": "open_agreement_new", "snap": extract(page), "shot": shot(page, "W_P_agreement_new")})
        click_save(page, writes, "agreement_empty_save", "W_P_agreement_empty_save")
        close_overlays(page)

    # Operator new - empty submit for validation
    go("运营商列表")
    close_overlays(page)
    if click_text(page, "新增") or click_text(page, "新建运营商") or click_text(page, "新建"):
        page.wait_for_timeout(800)
        writes.append({"step": "open_operator_new", "snap": extract(page), "shot": shot(page, "W_P_operator_new")})
        click_save(page, writes, "operator_empty_save", "W_P_operator_empty_save")
        close_overlays(page)

    # Alert SMS new
    go("预警短信")
    close_overlays(page)
    if click_text(page, "新增") or click_text(page, "新建"):
        page.wait_for_timeout(700)
        writes.append({"step": "open_alert_new", "snap": extract(page), "shot": shot(page, "W_P_alert_new")})
        close_overlays(page)

    report["platform_writes"] = writes


def try_write_operator(page, report):
    writes = []

    def go(menu):
        expand_menus(page)
        click_text(page, menu)
        wait_idle(page, 1200)

    go("个人套餐价")
    close_overlays(page)
    if click_text(page, "新增套餐价"):
        page.wait_for_timeout(800)
        writes.append({"step": "open_package_new", "snap": extract(page), "shot": shot(page, "W_O_package_new")})
        click_save(page, writes, "package_empty_save", "W_O_package_empty_save")
        close_overlays(page)

    go("渠道分销价")
    close_overlays(page)
    writes.append({"step": "channel_price_list", "snap": extract(page), "shot": shot(page, "W_O_channel_price")})
    if click_text(page, "编辑"):
        page.wait_for_timeout(800)
        writes.append({"step": "channel_price_edit", "snap": extract(page), "shot": shot(page, "W_O_channel_price_edit")})
        close_overlays(page)

    go("站点信息")
    close_overlays(page)
    if click_text(page, "新增") or click_text(page, "新建站点") or click_text(page, "新建"):
        page.wait_for_timeout(800)
        writes.append({"step": "open_site_new", "snap": extract(page), "shot": shot(page, "W_O_site_new")})
        try:
            inputs = page.locator(".el-dialog:visible input:not([disabled]), .el-drawer:visible input:not([disabled])")
            if inputs.count():
                inputs.first.fill(f"{QA_TAG}站点")
            click_save(page, writes, "site_save", "W_O_site_save")
        except Exception as e:
            writes.append({"step": "site_error", "error": str(e)})
        close_overlays(page)

    go("押金设置")
    writes.append({"step": "deposit_page", "snap": extract(page), "shot": shot(page, "W_O_deposit")})
    if click_text(page, "编辑"):
        page.wait_for_timeout(700)
        writes.append({"step": "deposit_edit", "snap": extract(page), "shot": shot(page, "W_O_deposit_edit")})
        close_overlays(page)

    report["operator_writes"] = writes


def switch_to_subjects(page, report):
    # try header switch, else navigate
    if not click_text(page, "切换账号") and not click_text(page, "切换主体") and not click_text(page, "切换"):
        page.goto("https://auth-center.test.ccjycx.cn/subjects?requestedApp=PLATFORM", timeout=30000)
    wait_idle(page, 2000)
    # if still in admin, force navigate
    if "auth-center" not in page.url and "subjects" not in page.url:
        page.goto("https://auth-center.test.ccjycx.cn/subjects?requestedApp=PLATFORM", timeout=30000)
        wait_idle(page, 2000)
    report["steps"].append({"name": "back_subjects", "snap": extract(page), "shot": shot(page, "50_subjects_again")})


def main():
    report = {"steps": [], "created": [], "errors": []}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            channel="chrome",
            headless=True,
            args=["--disable-dev-shm-usage", "--no-first-run"],
        )
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="zh-CN")
        page = context.new_page()
        page.set_default_timeout(8000)
        try:
            mode = os.environ.get("QA_ROLE", "all")
            login(page, report)
            if mode in ("all", "platform"):
                pick_subject(page, report, "平台", "02_platform_home")
                crawl_role(page, report, "platform", "P")
                try:
                    try_write_platform(page, report)
                except Exception as e:
                    report["errors"].append({"platform_writes": str(e), "url": page.url})
                    close_overlays(page)
            if mode == "all":
                switch_to_subjects(page, report)
            if mode in ("all", "operator"):
                pick_subject(page, report, "运营商", "51_operator_home")
                crawl_role(page, report, "operator", "O")
                try:
                    try_write_operator(page, report)
                except Exception as e:
                    report["errors"].append({"operator_writes": str(e), "url": page.url})
                    close_overlays(page)
        except Exception as e:
            report["errors"].append({"fatal": str(e), "url": page.url})
            try:
                shot(page, "ZZ_fatal")
            except Exception:
                pass
        finally:
            context.close()
            browser.close()
    OUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    summary = {
        "out": str(OUT),
        "shots": str(SHOT),
        "platform_pages": len(report.get("platform_pages") or []),
        "operator_pages": len(report.get("operator_pages") or []),
        "platform_menus": report.get("platform_menus"),
        "operator_menus": report.get("operator_menus"),
        "errors": report.get("errors"),
        "fatal_url": (report.get("errors") or [{}])[-1].get("url") if report.get("errors") else None,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
