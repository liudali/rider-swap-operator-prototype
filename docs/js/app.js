    const state = {
      role: "operator", loginKey: "entity:operator", channelEntityId: "CH-SF", leasingEntityId: "LEASE-HD", loginEmployeeId: null,
      view: "overview",
      deviceTab: "cabinet", orderTab: "package", flowTab: "receipt",
      platformOrderTab: "package", platformFlowTab: "userPay", platformDeviceTab: "ledger", platformChannelTab: "list", platformMarketingTab: "campaigns",
      operatorsTab: "list",
      l1PricingTab: "crossNet",
      platformUsersTab: "info",
      platformUsersPage: 1,
      platformUsersPageSize: 10,
      platformLeasingTab: "companies", depositTab: "pending", operatorCreditTab: "assignments",
      dayPoolTab: "pools", dayPoolSelectedId: "QP-2601", dayPoolConsumeSubTab: "rider",
      pricingTab: "pkg", channelSalesTab: "contracts", refundTab: "queue",
      employeeTab: "staff", pf: {},
      employeeForm: null, poolForm: null, pricingEditId: null, cardPricingEditId: null, quotaPricingEditId: null,
      operatorFormId: null, platformFeeRateEditId: null, leasingCompanyFormId: null, siteFormId: null, channelPartnerContractId: null, bindInventorySn: null,
      leaseFormId: null, leaseFormMode: null, followBillId: null, rentPayBillId: null,
      leaseAgreementsTab: "contracts", deviceListFormId: null, deviceReplaceListId: null,
      financeTab: "dashboard", financeSelectedAppId: "FDA-2606-01", financeAssetFilter: "全部", financeSelectedPackageId: "FAP-2606-01",
      channelLinkForm: null,
      siteExpenseTab: "sites",
      sitePartnersTab: "profiles",
      sitePartnerId: null,
      detailSiteExpenseId: null,
      detailSitePartnersId: null,
      detailSubId: null, detailSwapId: null, detailLeaseId: null, detailOperatorId: null, detailRefundId: null,
      cabinetDetailSn: null
    };

    let protoFormState = null;
    let protoConfirmState = null;

    function showProtoToast(msg, ms) {
      const el = document.querySelector("#protoToast");
      if (!el) return;
      el.textContent = String(msg).replace(/\n+/g, " · ");
      el.classList.add("show");
      clearTimeout(showProtoToast._hide);
      showProtoToast._hide = setTimeout(() => el.classList.remove("show"), ms ?? 2800);
    }

    function escProtoAttr(s) {
      return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
    }

    function renderProtoField(f) {
      const req = f.required !== false ? "required" : "";
      const ro = f.readonly ? "readonly" : "";
      if (f.type === "select") {
        return `<label>${escProtoAttr(f.label)}<select name="${escProtoAttr(f.name)}" ${req}>${(f.options || []).map(o => {
          const label = f.optionLabels?.[o] ?? o;
          return `<option value="${escProtoAttr(o)}"${o === f.value ? " selected" : ""}>${escProtoAttr(label)}</option>`;
        }).join("")}</select></label>`;
      }
      if (f.type === "textarea") {
        return `<label>${escProtoAttr(f.label)}<textarea name="${escProtoAttr(f.name)}" rows="${f.rows || 3}" ${req} ${ro}>${escProtoAttr(f.value || "")}</textarea></label>`;
      }
      return `<label>${escProtoAttr(f.label)}<input name="${escProtoAttr(f.name)}" type="${f.type || "text"}" value="${escProtoAttr(f.value ?? "")}" ${req} ${ro}></label>`;
    }

    function closeProtoForm() {
      protoFormState = null;
      const form = document.querySelector("#protoForm");
      if (form) { form.innerHTML = ""; form.style.display = ""; }
      const suc = document.querySelector("#protoFormSuccess");
      const err = document.querySelector("#protoFormError");
      if (suc) { suc.hidden = true; suc.textContent = ""; }
      if (err) { err.hidden = true; err.textContent = ""; }
      document.querySelector("#cancelProtoForm")?.removeAttribute("hidden");
      document.querySelector("#protoFormMask")?.classList.remove("open");
      document.querySelector("#protoFormModal")?.classList.remove("open");
      const submitBtn = document.querySelector("#submitProtoForm");
      if (submitBtn) submitBtn.textContent = "确定";
    }

    function openProtoForm({ title, fields, submitLabel, onSubmit }) {
      protoFormState = { onSubmit, phase: "form" };
      document.querySelector("#protoFormTitle").textContent = title || "填写信息";
      document.querySelector("#submitProtoForm").textContent = submitLabel || "确定";
      document.querySelector("#protoFormSuccess").hidden = true;
      document.querySelector("#protoFormError").hidden = true;
      document.querySelector("#cancelProtoForm")?.removeAttribute("hidden");
      const form = document.querySelector("#protoForm");
      form.style.display = "";
      form.innerHTML = (fields || []).map(renderProtoField).join("");
      document.querySelector("#protoFormMask").classList.add("open");
      document.querySelector("#protoFormModal").classList.add("open");
    }

    function submitProtoForm() {
      if (!protoFormState) return;
      if (protoFormState.phase === "done") {
        const after = protoFormState.afterClose;
        closeProtoForm();
        if (after) after();
        return;
      }
      const form = document.querySelector("#protoForm");
      if (!form.checkValidity()) { form.reportValidity(); return; }
      const data = Object.fromEntries(new FormData(form).entries());
      const errEl = document.querySelector("#protoFormError");
      const result = protoFormState.onSubmit(data);
      if (typeof result === "string") {
        errEl.textContent = result;
        errEl.hidden = false;
        return;
      }
      if (result && typeof result === "object" && result.successMessage) {
        form.style.display = "none";
        errEl.hidden = true;
        document.querySelector("#cancelProtoForm")?.setAttribute("hidden", "");
        const suc = document.querySelector("#protoFormSuccess");
        suc.textContent = result.successMessage;
        suc.hidden = false;
        document.querySelector("#submitProtoForm").textContent = "完成";
        protoFormState = { phase: "done", afterClose: result.afterClose };
        return;
      }
      const afterClose = result && result.afterClose;
      closeProtoForm();
      if (afterClose) afterClose();
    }

    function openProtoConfirm({ title, message, confirmLabel, onConfirm, onCancel }) {
      protoConfirmState = { onConfirm, onCancel };
      document.querySelector("#protoConfirmTitle").textContent = title || "确认";
      document.querySelector("#protoConfirmMessage").textContent = message || "";
      document.querySelector("#okProtoConfirm").textContent = confirmLabel || "确定";
      document.querySelector("#protoConfirmMask").classList.add("open");
      document.querySelector("#protoConfirmModal").classList.add("open");
    }

    function closeProtoConfirm(ok) {
      const cb = protoConfirmState;
      protoConfirmState = null;
      document.querySelector("#protoConfirmMask")?.classList.remove("open");
      document.querySelector("#protoConfirmModal")?.classList.remove("open");
      if (ok && cb?.onConfirm) cb.onConfirm();
      else if (!ok && cb?.onCancel) cb.onCancel();
    }

    function openProtoCopyUrl(url, title) {
      openProtoForm({
        title: title || "复制链接",
        fields: [{ name: "url", label: "链接", value: url, readonly: true }],
        submitLabel: "复制",
        onSubmit: (data) => {
          if (navigator.clipboard?.writeText) navigator.clipboard.writeText(data.url);
          return {
            successMessage: navigator.clipboard ? "已复制到剪贴板" : "请手动选中上方链接复制",
            afterClose: () => {}
          };
        }
      });
    }

    function initProtoDialogs() {
      document.querySelector("#closeProtoForm")?.addEventListener("click", closeProtoForm);
      document.querySelector("#cancelProtoForm")?.addEventListener("click", closeProtoForm);
      document.querySelector("#submitProtoForm")?.addEventListener("click", submitProtoForm);
      document.querySelector("#protoFormMask")?.addEventListener("click", closeProtoForm);
      document.querySelector("#cancelProtoConfirm")?.addEventListener("click", () => closeProtoConfirm(false));
      document.querySelector("#okProtoConfirm")?.addEventListener("click", () => closeProtoConfirm(true));
      document.querySelector("#protoConfirmMask")?.addEventListener("click", () => closeProtoConfirm(false));
      window.alert = showProtoToast;
    }

    function myEmployees() {
      return employeeStore[currentEntity().id] || [];
    }

    function myStaff() {
      return myEmployees().filter(e => e.roleType === "staff");
    }

    function entityNameById(entityId) {
      const op = platformOperators.find(o => o.id === entityId);
      if (op) return op.name;
      const lessor = platformLeasingCompanies.find(l => l.id === entityId);
      if (lessor) return lessor.name;
      if (CHANNEL_REGISTRY[entityId]) return CHANNEL_REGISTRY[entityId].name;
      const ch = platformChannels.find(c => c.id === entityId);
      if (ch) return ch.name;
      const role = ENTITY_ROLE[entityId];
      return role && ENT[role] ? ENT[role].name : entityId;
    }

    function channelEntityId() {
      if (state.role !== "channel") return null;
      return state.channelEntityId || "CH-SF";
    }

    function channelProfile() {
      const id = channelEntityId();
      return (id && CHANNEL_REGISTRY[id]) || CHANNEL_REGISTRY["CH-SF"];
    }

    function isCardChannel() {
      return isChannelRole() && channelProfile().settlementMode === "卡差价";
    }

    function cardContractForChannel(channelId) {
      return channelContracts.find(c => c.channelId === channelId && contractSettlementMode(c) === "卡差价");
    }

    function channelInstantCommissionEnabled(channelId) {
      const c = cardContractForChannel(channelId);
      return !!(c?.instantCommissionPayout && c.commissionRate > 0);
    }

    function channelHasPayoutAccount(channelId) {
      return paymentAccounts.some(a => a.entityId === channelId && a.status === "已开通");
    }

    function formatCommissionRate(rate) {
      if (rate == null || !Number.isFinite(rate)) return "—";
      return (rate * 100).toFixed(1).replace(/\.0$/, "") + "%";
    }

    function commissionSettlementLabel(channelId) {
      return channelInstantCommissionEnabled(channelId) ? "即时分账" : "线下待结";
    }

    function channelUsesCreditEval(channelId) {
      const contract = channelContracts.find(c => c.channelId === channelId);
      return contract ? contractSettlementMode(contract) !== "卡差价" : true;
    }

    function payMonthKey(payTime) {
      return (payTime || "").slice(0, 7);
    }

    function channelPackagesFor(cid) {
      return channelSalePackages.filter(p => p.channelId === cid);
    }

    function channelPromoLinksFor(cid, packageId) {
      let rows = channelPromoLinks.filter(l => l.channelId === cid);
      if (packageId) rows = rows.filter(l => l.packageId === packageId);
      return rows;
    }

    function packageLinkStats(packageId) {
      const links = channelPromoLinks.filter(l => l.packageId === packageId);
      return {
        linkCount: links.length,
        clicks: links.reduce((s, l) => s + l.clicks, 0),
        conversions: links.reduce((s, l) => s + l.conversions, 0)
      };
    }

    function filterChannelLinkOrders(rows) {
      const f = getPf();
      return rows.filter(o => {
        if (f.phone && !matchKw(o.phone, f.phone) && !matchKw(o.riderName, f.phone)) return false;
        if (f.skuId && f.skuId !== "全部" && o.skuId !== f.skuId) return false;
        if (f.linkPurpose && !matchKw(o.linkPurpose || o.linkCode, f.linkPurpose)) return false;
        if (!matchDateStr(o.payTime, f.payFrom, f.payTo)) return false;
        return true;
      });
    }

    function commissionMonthsForChannel(cid) {
      return [...new Set(channelLinkOrders.filter(o => o.channelId === cid).map(o => payMonthKey(o.payTime)))].sort().reverse();
    }

    function commissionMonthSummary(cid, month) {
      const orders = channelLinkOrders.filter(o => o.channelId === cid && payMonthKey(o.payTime) === month);
      return {
        month,
        orderCount: orders.length,
        totalPaid: orders.reduce((s, o) => s + o.paidPrice, 0),
        totalCommission: orders.reduce((s, o) => s + o.commission, 0),
        totalFee: orders.reduce((s, o) => s + o.platformFee, 0),
        orders
      };
    }

    function operatorIdForChannel(channelId) {
      const c = channelContracts.find(cc => cc.channelId === channelId && cc.status === "启用");
      return c?.operatorId || "OP-SX";
    }

    function buildPromoLinkUrl(channelId, skuId, linkCode) {
      const op = operatorIdForChannel(channelId);
      return `wxmp://${op}/pages/landing/index?op=${op}&ch=${channelId}&sku=${skuId}&lnk=${linkCode}`;
    }

    function renderFakeQrCells(seed) {
      let h = 0;
      for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
      const cells = [];
      for (let r = 0; r < 11; r++) {
        for (let c = 0; c < 11; c++) {
          const corner = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
          const finder = corner && ((r === 0 || r === 2 || c === 0 || c === 2) || (r === 8 || c === 8));
          const on = finder || ((h = (h * 1103515245 + 12345) | 0) & 3) === 0;
          cells.push(`<span class="${on ? "on" : ""}"></span>`);
        }
      }
      return cells.join("");
    }

    function openQrModal(link) {
      if (!link) return;
      document.querySelector("#noteTitle").textContent = "推广二维码 · " + link.purpose;
      document.querySelector("#noteBody").innerHTML = `
        <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
          <div class="qr-preview" aria-hidden="true">${renderFakeQrCells(link.linkCode)}</div>
          <div style="flex:1;min-width:220px">
            <p style="margin:0 0 8px;font-size:13px;color:var(--muted)">扫码打开<strong>运营商小程序</strong>（${operatorIdForChannel(link.channelId)}）<br>用户点击链接后 <strong>24h</strong> 内购套餐均享渠道专享价</p>
            <p style="word-break:break-all;font-size:12px;background:var(--surface-soft);padding:8px;border-radius:6px;margin:0">${link.linkUrl}</p>
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn primary" id="qrDownloadBtn">下载二维码（Mock）</button>
              <button type="button" class="btn" id="qrCopyBtn">复制链接</button>
            </div>
          </div>
        </div>`;
      document.querySelector("#noteModal").classList.add("open");
      document.querySelector("#noteMask").classList.add("open");
      document.querySelector("#qrDownloadBtn").onclick = () => window.alert("演示：已生成 PNG 二维码（" + link.linkCode + ".png）");
      document.querySelector("#qrCopyBtn").onclick = () => {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(link.linkUrl).then(() => showProtoToast("已复制小程序链接"));
        } else {
          openProtoCopyUrl(link.linkUrl, "复制小程序链接");
        }
      };
    }

    function slugLinkCode(text, pkg, channelId) {
      const base = (text || "link").trim().slice(0, 16).replace(/\s+/g, "-").toLowerCase().replace(/[^a-z0-9-]/g, "") || "link";
      const n = channelPromoLinks.filter(l => l.channelId === channelId && l.packageId === pkg.id).length + 1;
      return `${base}-${n}`;
    }

    function createPromoLink(channelId, packageId, purpose) {
      const pkg = channelSalePackages.find(p => p.id === packageId && p.channelId === channelId);
      const label = (purpose || "").trim();
      if (!pkg || !label) return false;
      const linkCode = slugLinkCode(label, pkg, channelId);
      channelPromoLinks.push({
        id: "LNK-" + Date.now().toString(36).slice(-6).toUpperCase(),
        channelId, packageId, skuId: pkg.skuId, purpose: label, linkCode,
        linkUrl: buildPromoLinkUrl(channelId, pkg.skuId, linkCode),
        clicks: 0, conversions: 0, status: "启用", createdAt: new Date().toISOString().slice(0, 10)
      });
      return true;
    }

    function platformAccountMonths() {
      return platformAccountMonthly.map(m => m.month).sort().reverse();
    }

    function selectedPlatformAccountMonth() {
      const f = getPf();
      const months = platformAccountMonths();
      return f.month && months.includes(f.month) ? f.month : (months[0] || "2026-06");
    }

    function platformAccountForMonth(month) {
      const row = platformAccountMonthly.find(m => m.month === month) || platformAccountMonthly[0];
      if (!row) {
        return { month, balance: platformMerchantAccount.balance, frozen: platformMerchantAccount.frozen,
          cEndSplit: 0, bEndAccrual: 0, l1Clearing: 0, payCount: 0, consumeFeeCount: 0, interOpCount: 0, total: 0 };
      }
      const total = Math.round((row.cEndSplit + row.bEndAccrual) * 100) / 100;
      return { ...row, total };
    }

    function isLeaseChannel() {
      return isChannelRole() && contractSettlementMode(channelProfile()) === "设备租赁";
    }
    const isRentChannel = isLeaseChannel;

    function isActivationChannel() {
      return isChannelRole() && contractSettlementMode(channelProfile()) === "激活码";
    }

    function isDayPoolChannel() {
      return isChannelRole() && channelProfile().settlementMode === "人天池";
    }

    function userOwnerForSwap(s) {
      if (s.userOwnerId) {
        return { id: s.userOwnerId, name: s.userOwnerName || entityNameById(s.userOwnerId) };
      }
      if (isChannelDaySwap(s)) {
        const pool = dayPools.find(p => p.id === s.poolId);
        const id = pool?.sellerId || "OP-SX";
        return { id, name: entityNameById(id) };
      }
      const pkg = s.subId ? packageOrders.find(p => p.id === s.subId) : null;
      if (pkg) return { id: pkg.deviceOwnerId, name: pkg.deviceOwnerName || entityNameById(pkg.deviceOwnerId) };
      return { id: null, name: "—" };
    }

    function ownerFromCabinetSn(sn) {
      const c = cabinets.find(x => x.sn === sn);
      return c ? { id: c.deviceOwnerId, name: c.deviceOwnerName } : null;
    }

    function ownerFromBatterySn(sn) {
      const b = batteries.find(x => x.sn === sn);
      return b ? { id: b.deviceOwnerId, name: b.deviceOwnerName } : null;
    }

    /** 换电单三元组 + 跨网设备服务费（U≠C/B 时产生） */
    function enrichSwapTriplet(s) {
      const u = userOwnerForSwap(s);
      const cab = ownerFromCabinetSn(s.cabinet?.sn)
        || (s.cabinetOwnerId ? { id: s.cabinetOwnerId, name: s.cabinetOwnerName || entityNameById(s.cabinetOwnerId) } : null)
        || (s.deviceOwnerId ? { id: s.deviceOwnerId, name: entityNameById(s.deviceOwnerId) } : { id: null, name: "—" });
      let bat = ownerFromBatterySn(s.batOut?.sn);
      if (!bat && s.batteryOwnerId) {
        bat = { id: s.batteryOwnerId, name: s.batteryOwnerName || entityNameById(s.batteryOwnerId) };
      }
      if (!bat && s.status === "成功") bat = cab;
      const cabinetFee = (u.id && cab.id && u.id !== cab.id) ? l1UnifiedPricing.cabinetFee : 0;
      const batteryFee = (u.id && bat?.id && u.id !== bat.id) ? l1UnifiedPricing.batteryFee : 0;
      return {
        userOwnerId: u.id, userOwnerName: u.name,
        cabinetOwnerId: cab.id, cabinetOwnerName: cab.name,
        batteryOwnerId: bat?.id || null, batteryOwnerName: bat?.name || "—",
        l1CabinetFee: cabinetFee, l1BatteryFee: batteryFee, l1Total: cabinetFee + batteryFee
      };
    }

    function swapVisibleToOperator(s) {
      const ownerId = isEntityLogin() ? currentEntity().id : currentEmployee().entityId;
      const t = enrichSwapTriplet(s);
      return t.userOwnerId === ownerId || t.cabinetOwnerId === ownerId || t.batteryOwnerId === ownerId
        || s.deviceOwnerId === ownerId;
    }

    function tripletOpCell(id, name) {
      if (!id) return "—";
      return `<small>${name || entityNameById(id)}</small><br><small style="color:var(--muted)">${id}</small>`;
    }

    function swapL1FeeCell(s) {
      if (s.status !== "成功") return "—";
      const t = enrichSwapTriplet(s);
      if (!t.l1Total) return `<small style="color:var(--muted)">无</small>`;
      const parts = [];
      if (t.l1CabinetFee) parts.push(`柜 ¥${t.l1CabinetFee.toFixed(2)}`);
      if (t.l1BatteryFee) parts.push(`电 ¥${t.l1BatteryFee.toFixed(2)}`);
      return `<strong>¥${t.l1Total.toFixed(2)}</strong><br><small style="color:var(--muted)">U 平台代付 ${parts.join(" + ")}</small>`;
    }

    function swapTripletDetailHtml(s) {
      const t = enrichSwapTriplet(s);
      const feeRows = [];
      if (t.l1CabinetFee) {
        feeRows.push(`<tr><td>柜机服务费</td><td>${t.userOwnerName} → ${t.cabinetOwnerName}</td><td>¥${t.l1CabinetFee.toFixed(2)}</td><td>平台代付</td></tr>`);
      }
      if (t.l1BatteryFee) {
        feeRows.push(`<tr><td>电池服务费</td><td>${t.userOwnerName} → ${t.batteryOwnerName}</td><td>¥${t.l1BatteryFee.toFixed(2)}</td><td>平台代付</td></tr>`);
      }
      const feeTable = feeRows.length ? `<table style="width:100%;font-size:12px;margin-top:8px"><thead><tr><th>费用项</th><th>方向</th><th>金额</th><th>清分</th></tr></thead><tbody>${feeRows.join("")}</tbody></table>`
        : `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">柜机、电池归属运营商与用户运营商相同，<strong>不产生</strong>运营商间设备服务费。</p>`;
      return `<section style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border)">
        <h4 style="margin:0 0 8px;font-size:13px">运营商归属 · 跨网设备服务费 ${noteBtn("orders_swap_triplet")}</h4>
        <div class="detail-grid">
          <div class="detail-item"><span>用户运营商 U</span><strong>${tripletOpCell(t.userOwnerId, t.userOwnerName)}</strong></div>
          <div class="detail-item"><span>柜机运营商 C</span><strong>${tripletOpCell(t.cabinetOwnerId, t.cabinetOwnerName)}</strong></div>
          <div class="detail-item"><span>电池运营商 B</span><strong>${tripletOpCell(t.batteryOwnerId, t.batteryOwnerName)}</strong></div>
          <div class="detail-item"><span>跨网服务费合计</span><strong>${t.l1Total ? "¥" + t.l1Total.toFixed(2) : "无"}</strong></div>
        </div>
        ${feeTable}
      </section>`;
    }

    function findEmployeeGlobal(empId) {
      for (const entityId of Object.keys(employeeStore)) {
        const row = (employeeStore[entityId] || []).find(e => e.id === empId);
        if (row) return { ...row, entityId };
      }
      return null;
    }

    function currentEmployee() {
      if (!state.loginEmployeeId) return null;
      return findEmployeeGlobal(state.loginEmployeeId);
    }

    function isEntityLogin() { return !state.loginEmployeeId; }
    function isStaffLogin() { const e = currentEmployee(); return e && e.roleType === "staff"; }
    function isTeamAdminLogin() { const e = currentEmployee(); return e && e.roleType === "team_admin"; }
    function isOrgAdminLogin() { return isTeamAdminLogin(); }
    function teamAdminScopeTeamId() {
      const e = currentEmployee();
      return e && e.roleType === "team_admin" ? e.teamId : null;
    }
    function orgAdminScopeOrgId() { return teamAdminScopeTeamId(); }
    function matchTeamScope(row) {
      const tid = teamAdminScopeTeamId();
      if (!tid || !row) return true;
      return row.teamId === tid || row.team === (dayPoolTeams.find(t => t.id === tid) || {}).name;
    }
    function matchOrgScope(row) { return matchTeamScope(row); }

    function employeePerms() {
      const e = currentEmployee();
      if (!e) return [];
      return e.permissions || [];
    }

    function employeeHasPerm(permId) {
      if (isEntityLogin()) return true;
      return employeePerms().includes(permId);
    }

    function viewsForEmployeeLogin() {
      const views = new Set();
      employeePerms().forEach(p => (PERM_VIEW_MAP[p] || []).forEach(v => views.add(v)));
      return [...views];
    }

    function getAllowedNavItems() {
      if (isEntityLogin()) {
        if (state.role === "sitePartner") return NAV.sitePartner || [];
        if (state.role === "channel") return CHANNEL_NAV[channelEntityId()] || NAV.channel;
        return NAV[state.role] || NAV.operator;
      }
      if (isOrgAdminLogin()) {
        return employeeHasPerm("day_pool.view") ? ["dayPool"] : [];
      }
      const allowed = new Set(viewsForEmployeeLogin());
      const base = NAV[state.role] || NAV.operator;
      const items = base.filter(v => allowed.has(v));
      return items.length ? items : ["overview"];
    }

    function canAccessView(view) {
      return getAllowedNavItems().includes(view);
    }

    function applyLoginKey(key) {
      state.loginKey = key;
      const [kind, id] = key.split(":");
      if (kind === "entity") {
        if (CHANNEL_REGISTRY[id]) {
          state.role = "channel";
          state.channelEntityId = id;
          state.leasingEntityId = null;
        } else if (platformLeasingCompanies.some(l => l.id === id)) {
          state.role = "leasing";
          state.leasingEntityId = id;
          state.channelEntityId = null;
          state.sitePartnerId = null;
        } else if (sitePartners.find(p => p.id === id)) {
          state.role = "sitePartner";
          state.sitePartnerId = id;
          state.channelEntityId = null;
          state.leasingEntityId = null;
        } else {
          state.role = id;
          state.channelEntityId = id === "channel" ? "CH-SF" : null;
          state.leasingEntityId = id === "leasing" ? "LEASE-HD" : null;
          state.sitePartnerId = null;
        }
        state.loginEmployeeId = null;
        return;
      }
      const emp = findEmployeeGlobal(id);
      if (!emp) return;
      state.loginEmployeeId = id;
      state.role = ENTITY_ROLE[emp.entityId] || "operator";
      if (state.role === "channel") state.channelEntityId = emp.entityId;
      if (state.role === "leasing") state.leasingEntityId = emp.entityId;
      if (emp.roleType === "team_admin") {
        state.view = "dayPool";
        state.dayPoolTab = "consume";
      }
    }

    function buildLoginSelectHtml() {
      const entityOpts = [
        ["platform", "平台管理员 · " + ENT.platform.name],
        ["operator", "运营商 · " + ENT.operator.name]
      ].map(([r, label]) => `<option value="entity:${r}">${label}</option>`).join("")
        + platformLeasingCompanies.map(l =>
          `<option value="entity:${l.id}">【二期】租赁公司 · ${l.name}</option>`
        ).join("")
        + Object.values(CHANNEL_REGISTRY).map(ch => {
          const p2 = ch.settlementMode === "激活码" || ch.settlementMode === "设备租赁";
          const prefix = p2 ? "【二期】" : "";
          return `<option value="entity:${ch.id}">${prefix}渠道商 · ${ch.name}（${ch.settlementMode}）</option>`;
        }).join("");
      let staffOpts = "";
      Object.keys(employeeStore).forEach(entityId => {
        (employeeStore[entityId] || []).forEach(e => {
          if (e.status !== "启用") return;
          const host = entityNameById(entityId);
          if (e.roleType === "staff") {
            staffOpts += `<option value="emp:${e.id}">${e.name} · ${e.jobTitle || "员工"}（${host}）</option>`;
          } else if (e.roleType === "team_admin") {
            staffOpts += `<option value="emp:${e.id}">${e.name} · 团队管理员（${e.jobTitle || "团队"} · ${host}）</option>`;
          }
        });
      });
      const partnerOpts = sitePartners.filter(p => p.status === "启用").map(p => {
        const op = entityNameById(p.operatorId);
        const type = p.partnerType || "个人";
        return `<option value="entity:${p.id}">站点合伙人 · ${p.name}（${type} · ${op}）</option>`;
      }).join("");
      return `<optgroup label="经营主体">${entityOpts}</optgroup>
        <optgroup label="站点合伙人">${partnerOpts || "<option disabled>—</option>"}</optgroup>
        <optgroup label="员工登录">${staffOpts || "<option disabled>—</option>"}</optgroup>`;
    }

    function currentEntity() {
      if (state.role === "sitePartner") {
        const p = sitePartners.find(x => x.id === (state.sitePartnerId || "SP-01"));
        if (!p) return ENT.sitePartner;
        const op = platformOperators.find(o => o.id === p.operatorId);
        return { id: p.id, name: p.name, type: "站点合伙人", partnerType: p.partnerType, operatorId: p.operatorId, operatorName: op?.name || p.operatorId };
      }
      if (state.role === "channel") {
        const id = state.channelEntityId || "CH-SF";
        return CHANNEL_REGISTRY[id] || ENT.channel;
      }
      if (state.role === "leasing") {
        const id = state.leasingEntityId || "LEASE-HD";
        return platformLeasingCompanies.find(l => l.id === id) || ENT.leasing;
      }
      return ENT[state.role] || ENT.operator;
    }

    function filterOwnRow(row) {
      if (!row || row.deviceOwnerId == null) return true;
      const e = currentEmployee();
      const ownerId = e ? e.entityId : currentEntity().id;
      return row.deviceOwnerId === ownerId;
    }

    function pfKey() {
      const orderViewPf = { orderPackage: "orders_package", orderSwap: "orders_swap", orderFreeze: "orderFreeze" };
      if (orderViewPf[state.view]) return orderViewPf[state.view];
      if (state.view === "refundManage") return "refundManage";
      if (state.view === "orders") return "orders_" + state.orderTab;
      if (state.view === "flows") return "flows_" + state.flowTab;
      if (state.view === "dayPool") return "dayPool_" + state.dayPoolTab;
      if (state.view === "platformUsers") return "platformUsers_" + state.platformUsersTab;
      if (state.view === "platformOrders") return "platformOrders_" + state.platformOrderTab;
      if (state.view === "operators") return "operators_" + (state.operatorsTab || "list");
      if (state.view === "l1Pricing") return "l1Pricing_" + (state.l1PricingTab || "crossNet");
      if (state.view === "platformFlows") return "platformFlows_" + state.platformFlowTab;
      if (state.view === "platformDevices") return "platformDevices_" + state.platformDeviceTab;
      if (state.view === "platformChannels") return "platformChannels_list";
      if (state.view === "platformMarketing") return "platformMarketing_" + state.platformMarketingTab;
      if (state.view === "deviceBinding") return "platformDevices_ledger";
      if (state.view === "devices") {
        if (state.deviceTab === "cabinet") return "devices_cabinet";
        if (state.deviceTab === "battery") return "devices_battery";
        return "devices";
      }
      return state.view;
    }

    function operatorLabel(id) {
      const op = platformOperators.find(o => o.id === id);
      return op ? op.name : id || "—";
    }

    function platformOperatorOptions() {
      return [{ v: "全部", t: "全部运营商" }].concat(platformOperators.map(o => ({ v: o.id, t: o.name })));
    }

    function leasingCompanyById(id) {
      return platformLeasingCompanies.find(l => l.id === id);
    }

    function lessorLabel(id) {
      return leasingCompanyById(id)?.name || id || "—";
    }

    function boundOperatorsForLessor(lessorId) {
      const opIds = new Set(platformLeaseBindings.filter(b => b.lessorId === lessorId && b.status === "启用").map(b => b.operatorId));
      return platformOperators.filter(o => o.status === "在营" && opIds.has(o.id));
    }

    function boundLessorsForOperator(operatorId) {
      const lessorIds = new Set(platformLeaseBindings.filter(b => b.operatorId === operatorId && b.status === "启用").map(b => b.lessorId));
      return platformLeasingCompanies.filter(l => l.status === "在营" && lessorIds.has(l.id));
    }

    function isLeaseBindingActive(lessorId, operatorId) {
      return platformLeaseBindings.some(b => b.lessorId === lessorId && b.operatorId === operatorId && b.status === "启用");
    }

    function userBatteryHoldBlocked(u, poolRider) {
      if (u.serviceState === "已冻结") return "已冻结·须先还电";
      if (u.serviceState === "中途完结") return "中途完结·已还电";
      const elig = u.poolEligibility || poolRider?.todayEligibility || poolRider?.quotaStatus;
      if (elig === "待首换开通" || elig === "待首换") return "待首换开通·未使用换电";
      return null;
    }

    function userLiveHeldBattery(u, poolRider) {
      const blocked = userBatteryHoldBlocked(u, poolRider);
      if (blocked) return { text: "未持有", hint: blocked, owner: "—" };
      const lastSwap = [...swapOrders].reverse().find(s => s.user === u.id && s.status === "成功");
      const bat = lastSwap?.batOut;
      if (!bat) return { text: "未持有", hint: "无换电记录", owner: "—" };
      const batRec = batteries.find(b => b.sn === bat.sn);
      return {
        text: `${bat.sn} · SOC ${bat.soc}%${batRec ? " · " + batRec.health : ""}`,
        hint: null,
        owner: batRec ? operatorLabel(batRec.deviceOwnerId) : "—"
      };
    }

    function activePersonalPackage(u) {
      const today = new Date().toISOString().slice(0, 10);
      return packageOrders.find(p =>
        p.user === u.id
        && (p.serviceState === "服务中" || p.status === "服务中")
        && p.validFrom <= today
        && p.validTo >= today
      );
    }

    function isPersonalPackageUser(u) {
      if (!u) return false;
      if (dayPoolRiders.some(r => r.id === u.id)) return false;
      return packageOrders.some(p => p.user === u.id);
    }

    function userCanApplyFreeze(u) {
      if (!isPersonalPackageUser(u)) return { ok: false, msg: "仅个人套餐用户可申请冻结" };
      const poolRider = dayPoolRiders.find(r => r.id === u.id);
      if ((u.serviceState || "") === "已冻结") return { ok: false, msg: "服务已冻结" };
      const held = userLiveHeldBattery(u, poolRider);
      if (held.hint === null && held.text !== "未持有") return { ok: false, msg: "请先归还电池后再申请冻结" };
      const pkg = activePersonalPackage(u);
      if (!pkg) return { ok: false, msg: "套餐不在有效期内，无法申请冻结" };
      return { ok: true, pkg };
    }

    function userCanApplyUnfreeze(u) {
      if (!isPersonalPackageUser(u)) return { ok: false, msg: "仅个人套餐用户可申请解冻" };
      if ((u.serviceState || "") !== "已冻结") return { ok: false, msg: "当前未处于冻结状态" };
      const pkg = packageOrders.find(p => p.user === u.id && (p.serviceState === "已冻结" || p.status === "已冻结"));
      if (!pkg) return { ok: false, msg: "未找到冻结中的套餐" };
      const today = new Date().toISOString().slice(0, 10);
      if (pkg.validTo < today) return { ok: false, msg: "套餐已过期，请申请退订" };
      return { ok: true, pkg };
    }

    function channelPayChannelLabel(o) {
      return o.payChannel === "online" ? "在线支付" : "线下支付";
    }

    function channelPayMethodLabel(o) {
      return o.payMethod || (o.payChannel === "online" ? "—" : "对公转账");
    }

    function channelPoActionCell(o, role) {
      return b2bOrderActionCell(o, role, "day");
    }

    function confirmChannelCardOrder(orderId) {
      window.alert("渠道分销模式无批发购卡订单（演示）");
      return false;
    }

    function confirmChannelRentOrder(orderId) {
      const o = channelRentTopupOrders.find(x => x.id === orderId);
      if (!o || o.orderStatus !== "待确认到账") return false;
      o.orderStatus = "已完成";
      o.payStatus = "已付款";
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      o.payTime = now;
      o.confirmedBy = currentEntity().name;
      const pool = channelRentPoolData.find(p => p.channelId === o.channelId);
      if (pool) {
        pool.balance += o.amount;
        pool.status = "正常";
        channelRentLedger.unshift({
          id: "RL-" + Date.now().toString().slice(-6), channelId: o.channelId, time: now,
          type: "预缴充值", delta: o.amount, balanceAfter: pool.balance, ref: o.id,
          operator: o.confirmedBy, note: o.period + " 月租缴纳"
        });
      }
      window.alert("演示：月租单 " + orderId + " 已确认到账，账期已生效");
      return true;
    }

    function confirmChannelActivationOrder(orderId) {
      const o = channelActivationOrders.find(x => x.id === orderId);
      if (!o || o.orderStatus !== "待确认到账") return false;
      o.orderStatus = "已完成";
      o.payStatus = "已付款";
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      o.payTime = now;
      o.confirmedBy = currentEntity().name;
      o.confirmedAt = now;
      const contract = channelContracts.find(c => c.channelId === o.channelId);
      if (contract) contract.codeInventory = (contract.codeInventory || 0) + o.qty;
      const ch = platformChannels.find(p => p.id === o.channelId);
      if (ch) ch.codeInventory = (ch.codeInventory || 0) + o.qty;
      window.alert("演示：激活码批发单 " + orderId + " 已确认到账，库存 +" + o.qty);
      return true;
    }

    function downloadCsv(filename, content) {
      const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }

    function openRentTopupForm() {
      const cid = channelEntityId();
      const pool = channelRentPoolData.find(p => p.channelId === cid);
      const contract = myChannelContracts().find(c => c.channelId === cid);
      const recv = platformClearingReceiveAccount;
      const suggest = pool?.monthlyRent || contract?.monthlyRent || 12000;
      document.querySelector("#rentTopupFormTitle").textContent = "月租缴纳 · " + (channelProfile()?.name || cid);
      document.querySelector("#rentTopupForm").innerHTML = `
        <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("channel_settlement_rent")} 对公转账至运营商收款专户，到账后由运营商确认入账。</p>
        <label>充值金额（元）<input name="amount" type="number" min="1" step="1" value="${suggest}" required></label>
        <label>覆盖账期<input name="period" value="${new Date().toISOString().slice(0, 7)}" placeholder="2026-07"></label>
        <label style="grid-column:1/-1">收款专户<textarea readonly rows="3" style="resize:vertical">${recv.bankName}\n${recv.accountName} · ${recv.accountNo}\n附言：${recv.transferRemark.replace("{operatorId}", contract?.operatorId || "OP-SX")}</textarea></label>
        <label>转账日期<input name="transferDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
        <label>银行流水号 *<input name="transferRef" placeholder="对公回单流水号" required></label>
        <label style="grid-column:1/-1">备注<textarea name="note" rows="2" placeholder="例：7月设备月租"></textarea></label>`;
      document.querySelector("#rentTopupModal").classList.add("open");
      document.querySelector("#rentTopupMask").classList.add("open");
    }

    function closeRentTopupForm() {
      document.querySelector("#rentTopupModal").classList.remove("open");
      document.querySelector("#rentTopupMask").classList.remove("open");
    }

    function saveRentTopupForm() {
      const cid = channelEntityId();
      const form = document.querySelector("#rentTopupForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) { window.alert("请输入有效充值金额"); return; }
      if (!data.transferRef?.trim()) { window.alert("请填写银行流水号"); return; }
      const contract = myChannelContracts()[0];
      const orderId = "MO-" + new Date().toISOString().slice(2, 10).replace(/-/g, "") + "-" + String(channelRentTopupOrders.length + 1).padStart(2, "0");
      channelRentTopupOrders.unshift({
        id: orderId, channelId: cid, channelName: channelProfile()?.name || cid,
        operatorId: contract?.operatorId || "OP-SX", operatorName: contract?.operatorName || PAYEE_OPERATOR,
        amount, devicesCovered: channelRentPoolData.find(p => p.channelId === cid)?.devicesCovered || 0,
        payMethod: "对公转账", orderStatus: "待确认到账", payStatus: "待付款",
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        payTime: null, period: data.period || new Date().toISOString().slice(0, 7),
        confirmedBy: null, offlineVoucher: data.transferRef.trim(),
        transferDate: data.transferDate, note: data.note?.trim() || ""
      });
      closeRentTopupForm();
      state.view = "rentPool";
      render();
      window.alert("充值申请已提交（" + orderId + "），请等待运营商确认到账后余额增加。");
    }

    function creditPoolFromChannelOrder(o) {
      const pool = ensurePoolForChannelOrder(o);
      pool.availableDays += o.days;
      pool.totalDays += o.days;
      pool.balancePct = pool.totalDays ? Math.round(pool.availableDays / pool.totalDays * 1000) / 10 : 0;
      if (pool.status === "待入账" || pool.status === "待配置") pool.status = "使用中";
      appendPoolLedger(pool, "购买入账", o.days, o.id, "采购到账 · PO");
    }

    function confirmChannelSalesOrder(poId) {
      const o = channelSalesOrders.find(x => x.id === poId);
      if (!o || o.orderStatus !== "待确认到账") return false;
      o.orderStatus = "已完成";
      o.payStatus = "已付款";
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      o.payTime = now;
      o.confirmedAt = now;
      o.confirmedBy = currentEntity().name;
      creditPoolFromChannelOrder(o);
      window.alert("演示：已确认线下到账，订单 " + poId + " 已完成");
      return true;
    }

    function riderBatteryDepositInfo(u) {
      const uid = u.id || u.userId;
      const leaseLike = (u.entitlement === "设备租赁白名单")
        || (u.pkg && /白名单|设备租赁/.test(String(u.pkg)));
      const poolLike = !!(u.poolId || u.poolEligibility)
        || (u.pkg && String(u.pkg).includes("人天池"))
        || (u.entitlement === "渠道人天");
      if (poolLike || leaseLike) {
        const chName = u.channelName || u.channel || ENT.channel?.name || "签约渠道";
        return {
          kind: "渠道担保",
          label: "渠道担保",
          amountHeld: 0,
          amountFace: 0,
          sub: leaseLike ? "设备租赁 · 押金算渠道" : `${chName} · 人天押金算渠道`,
          orderId: null,
          paidAt: null
        };
      }
      const pkgs = packageOrders.filter(p => p.user === uid);
      const pkg = pkgs.find(p => ["服务中", "已冻结", "中途完结"].includes(p.serviceState || p.status))
        || pkgs.find(p => p.depositPaid > 0 || p.depositWaiver)
        || pkgs[0];
      if (pkg?.depositWaiver) {
        const w = pkg.depositWaiver;
        return {
          kind: "信用免押",
          label: "信用免押",
          amountHeld: 0,
          amountFace: w.waivedAmount != null ? w.waivedAmount : (pkg.batteryDeposit || 0),
          sub: `${w.type || "信用"} ${w.score != null ? w.score + "分" : ""}`.trim(),
          orderId: pkg.id,
          paidAt: pkg.payTime
        };
      }
      if (pkg && (pkg.batteryDeposit == null || pkg.batteryDeposit === 0)) {
        return { kind: "无需", label: "无需押金", amountHeld: 0, amountFace: 0, sub: "本单无押", orderId: pkg.id, paidAt: pkg.payTime };
      }
      if (pkg && pkg.depositRefundStatus === "已退款") {
        return {
          kind: "已退",
          label: "已退押",
          amountHeld: 0,
          amountFace: pkg.batteryDeposit || 0,
          sub: pkg.depositRefundedAt ? `已原路退 · ${pkg.depositRefundedAt}` : "已原路退",
          orderId: pkg.id,
          paidAt: pkg.payTime
        };
      }
      const pendingDepRf = typeof refundRequests !== "undefined"
        ? refundRequests.find(r => r.orderId === pkg?.id && isDepositOnlyRefund(r) && r.status === "待审核")
        : null;
      if (pkg && (pkg.depositPaid || 0) >= (pkg.batteryDeposit || 0) && pkg.batteryDeposit > 0) {
        const st = pkg.serviceState || pkg.status;
        if (pendingDepRf || st === "中途完结" || pkg.payout === "待退款" || pkg.status === "待退款") {
          return {
            kind: "退押中",
            label: "退押中",
            amountHeld: pkg.batteryDeposit,
            amountFace: pkg.batteryDeposit,
            sub: pendingDepRf
              ? `实付 ¥${pkg.depositPaid} · 退款管理待审 ${pendingDepRf.id}`
              : `实付 ¥${pkg.depositPaid} · 原路退处理中`,
            orderId: pkg.id,
            paidAt: pkg.payTime
          };
        }
        if (st === "已完结" || pkg.status === "已完结") {
          return {
            kind: "已退",
            label: "已退押",
            amountHeld: 0,
            amountFace: pkg.batteryDeposit,
            sub: `曾实付 ¥${pkg.depositPaid}`,
            orderId: pkg.id,
            paidAt: pkg.payTime
          };
        }
        return {
          kind: "实付",
          label: "实付在押",
          amountHeld: pkg.batteryDeposit,
          amountFace: pkg.batteryDeposit,
          sub: `实收 ¥${pkg.depositPaid} · 同笔购套餐`,
          orderId: pkg.id,
          paidAt: pkg.payTime
        };
      }
      if (u.deposit) {
        if (String(u.deposit).includes("免押")) {
          return { kind: "信用免押", label: "信用免押", amountHeld: 0, amountFace: 99, sub: String(u.deposit), orderId: null, paidAt: null };
        }
        const m = String(u.deposit).match(/(\d+)/);
        const amt = m ? Number(m[1]) : 99;
        return { kind: "实付", label: "实付在押", amountHeld: amt, amountFace: amt, sub: String(u.deposit), orderId: null, paidAt: null };
      }
      return { kind: "无", label: "—", amountHeld: 0, amountFace: 0, sub: "未产生押金记录", orderId: null, paidAt: null };
    }

    function riderDepositCellHtml(dep) {
      if (!dep || dep.kind === "无") return "—";
      return `${tag(dep.label)}<br><small style="color:var(--muted)">${dep.sub || ""}</small>`;
    }

    function operatorRiderDepositStats(operatorId) {
      const scoped = operatorId
        ? users.filter(u => {
          const svc = u.poolId
            ? (dayPools.find(p => p.id === u.poolId)?.sellerId || u.deviceOwnerId)
            : u.deviceOwnerId;
          return svc === operatorId;
        })
        : users.slice();
      let heldAmount = 0, heldUsers = 0, creditUsers = 0, channelUsers = 0, refundingAmount = 0;
      scoped.forEach(u => {
        const d = riderBatteryDepositInfo(u);
        if (d.kind === "实付") { heldAmount += d.amountHeld; heldUsers += 1; }
        else if (d.kind === "退押中") { heldAmount += d.amountHeld; refundingAmount += d.amountHeld; heldUsers += 1; }
        else if (d.kind === "信用免押") creditUsers += 1;
        else if (d.kind === "渠道担保") channelUsers += 1;
      });
      return {
        users: scoped.length,
        heldAmount: Math.round(heldAmount * 100) / 100,
        heldUsers,
        creditUsers,
        channelUsers,
        refundingAmount: Math.round(refundingAmount * 100) / 100
      };
    }

    function platformDepositSummaryByOperator() {
      return platformOperators.map(op => {
        const st = operatorRiderDepositStats(op.id);
        return { op, ...st };
      });
    }

    function platformUserProfile(u) {
      const svcOpId = u.poolId
        ? (dayPools.find(p => p.id === u.poolId)?.sellerId || u.deviceOwnerId)
        : u.deviceOwnerId;
      const pkg = packageOrders.find(p => p.user === u.id && !["已完结"].includes(p.serviceState || p.status))
        || packageOrders.find(p => p.user === u.id);
      const poolRider = dayPoolRiders.find(r => r.id === u.id);
      const held = userLiveHeldBattery(u, poolRider);
      let userStatus = "正常";
      if (u.serviceState === "已冻结") userStatus = "冻结";
      else if (u.serviceState === "中途完结") userStatus = "注销中";
      else if (poolRider?.status === "离职") userStatus = "已离职";
      const userType = u.poolId ? "渠道成员" : "个人用户";
      const deposit = riderBatteryDepositInfo(u);
      return {
        ...u,
        userType,
        userStatus,
        serviceOperatorId: svcOpId,
        serviceOperatorName: operatorLabel(svcOpId),
        pkgName: pkg?.pkg || (u.poolId ? "人天权益" : "—"),
        pkgStatus: pkg ? (pkg.serviceState || pkg.status) : (u.poolEligibility || "—"),
        pkgPeriod: pkg ? `${pkg.validFrom} ~ ${pkg.validTo}` : "—",
        channelName: u.poolId ? ENT.channel.name : "—",
        poolQuota: poolRider ? `余 ${poolRider.remainingDays} 人天` : (u.poolEligibility ? u.poolEligibility : "—"),
        poolTeam: u.poolTeam || poolRider?.team || "—",
        heldBattery: held.text,
        heldBatteryHint: held.hint,
        batteryOwner: held.owner,
        depositKind: deposit.kind,
        depositLabel: deposit.label,
        depositHeld: deposit.amountHeld,
        depositSub: deposit.sub,
        depositOrderId: deposit.orderId
      };
    }

    function isChannelRole() { return state.role === "channel"; }
    function isOperatorRole() { return state.role === "operator"; }
    function isPlatformRole() { return state.role === "platform"; }
    function isSitePartnerRole() { return state.role === "sitePartner"; }

    function currentSitePartner() {
      if (!isSitePartnerRole()) return null;
      return sitePartners.find(p => p.id === (state.sitePartnerId || "SP-01")) || null;
    }

    function myPartnerBindings() {
      const p = currentSitePartner();
      if (!p) return [];
      return sitePartnerBindings.filter(b => b.partnerId === p.id && b.status === "生效");
    }

    function myPartnerSplitLines() {
      const p = currentSitePartner();
      if (!p) return [];
      return sitePartnerSplitLines.filter(l => l.partnerId === p.id);
    }

    function partnerAccruedTotal(partnerId) {
      const pid = partnerId || currentSitePartner()?.id;
      if (!pid) return 0;
      return sitePartnerSplitLines.filter(l => l.partnerId === pid).reduce((s, l) => s + (l.partnerAmount || 0), 0);
    }

    function partnerMonthAccrued(partnerId, month) {
      const pid = partnerId || currentSitePartner()?.id;
      const m = month || "2026-06";
      if (!pid) return 0;
      return sitePartnerSplitLines.filter(l => l.partnerId === pid && (l.date || "").startsWith(m)).reduce((s, l) => s + (l.partnerAmount || 0), 0);
    }

    function partnerWithdrawnTotal(partnerId) {
      const pid = partnerId || currentSitePartner()?.id;
      if (!pid) return 0;
      return sitePartnerWithdrawalRequests.filter(w => w.partnerId === pid && w.status === "已到账").reduce((s, w) => s + w.amount, 0);
    }

    function partnerPendingWithdrawTotal(partnerId) {
      const pid = partnerId || currentSitePartner()?.id;
      if (!pid) return 0;
      return sitePartnerWithdrawalRequests.filter(w => w.partnerId === pid && w.status === "待审核").reduce((s, w) => s + w.amount, 0);
    }

    function partnerWithdrawableBalance(partnerId) {
      const accrued = partnerAccruedTotal(partnerId);
      const withdrawn = partnerWithdrawnTotal(partnerId);
      const pending = partnerPendingWithdrawTotal(partnerId);
      return Math.max(0, +(accrued - withdrawn - pending).toFixed(2));
    }

    function myPartnerWithdrawals() {
      const p = currentSitePartner();
      if (!p) return [];
      return sitePartnerWithdrawalRequests.filter(w => w.partnerId === p.id);
    }

    function openPartnerWithdrawForm() {
      const p = currentSitePartner();
      if (!p) return;
      const avail = partnerWithdrawableBalance(p.id);
      if (avail <= 0) { showProtoToast("可提现余额不足"); return; }
      if (myPartnerWithdrawals().some(w => w.status === "待审核")) { showProtoToast("已有待审核申请"); return; }
      openProtoForm({
        title: "发起提现申请",
        fields: [
          { name: "amount", label: "提现金额（元）", type: "number", value: String(Math.min(avail, 100).toFixed(2)) }
        ],
        submitLabel: "提交至运营商",
        onSubmit: (data) => {
          const amount = parseFloat(data.amount);
          if (!Number.isFinite(amount) || amount <= 0) return "请输入有效金额";
          if (amount > avail + 0.009) return "不得超过可提现余额 ¥" + avail.toFixed(2);
          sitePartnerWithdrawalRequests.unshift({
            id: "SPW-" + Date.now().toString().slice(-6), partnerId: p.id, operatorId: p.operatorId,
            amount, applyTime: new Date().toISOString().slice(0, 16).replace("T", " "),
            reviewTime: null, reviewedBy: null, status: "待审核", paidTime: null,
            accountLabel: p.bankAccount || "—", rejectReason: null
          });
          return { successMessage: "已提交 · 等待运营商审核后代付", afterClose: () => render() };
        }
      });
    }

    function creditForOperator(operatorId) {
      return operatorCreditAccounts.find(a => a.operatorId === operatorId) || null;
    }

    function operatorCreditProfile(operatorId) {
      return operatorCreditProfiles.find(p => p.operatorId === operatorId) || null;
    }

    function admissionTierByCode(code) {
      return operatorAdmissionTierConfig.find(t => t.code === code) || null;
    }

    function tierLabel(code) {
      const t = admissionTierByCode(code);
      return t ? `${t.code} ${t.name}` : "—";
    }

    function formatMinDeposit(tier) {
      if (!tier) return "—";
      if (tier.minDepositLabel) return tier.minDepositLabel;
      return "¥" + tier.minDeposit.toLocaleString("zh-CN");
    }

    function formatMaxChannels(tier) {
      if (!tier) return "—";
      return "融资参考（不限渠道数）";
    }

    function operatorCreditCap(operatorId) {
      const prof = operatorCreditProfile(operatorId);
      if (!prof?.tierCode) return null;
      const tier = admissionTierByCode(prof.tierCode);
      return tier ? tier.creditCap : null;
    }

    function addMonths(dateStr, months) {
      const d = new Date(dateStr);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().slice(0, 10);
    }

    function assignOperatorTier(operatorId, tierCode, reason, by) {
      const tier = admissionTierByCode(tierCode);
      if (!tier) return "无效档位";
      let prof = operatorCreditProfile(operatorId);
      const fromTier = prof?.tierCode || null;
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const today = now.slice(0, 10);
      if (!prof) {
        prof = { operatorId, tierCode, status: "已定档", assignedAt: today, assignedBy: by, nextReviewAt: addMonths(today, 12), assignReason: reason };
        operatorCreditProfiles.push(prof);
      } else {
        prof.tierCode = tierCode;
        prof.status = "已定档";
        prof.assignedAt = today;
        prof.assignedBy = by;
        prof.nextReviewAt = addMonths(today, 12);
        prof.assignReason = reason;
      }
      const credit = creditForOperator(operatorId);
      if (credit) {
        if (credit.creditLimit > tier.creditCap) {
          credit.creditLimit = tier.creditCap;
          credit.available = Math.max(0, credit.creditLimit - credit.used);
        }
        if (tier.creditCap === 0) credit.crossSwapEnabled = false;
        else if (credit.depositBalance > 0 || credit.available > 0) credit.crossSwapEnabled = tier.crossNetworkDefault || credit.available > 0;
        else credit.crossSwapEnabled = credit.available > 0;
      }
      operatorCreditTierLogs.unshift({
        id: "OCL-" + Date.now(), operatorId, fromTier, toTier: tierCode, reason: reason || "定档", by, at: now
      });
      return null;
    }

    function dataPanelLink(view, extra) {
      const role = isPlatformRole() ? "platform" : isChannelRole() ? "channel" : "operator";
      const q = new URLSearchParams({ role, view: view || "overview", embed: "1", ...(extra || {}) });
      const url = new URL(DATA_PANEL_PATH, window.location.href);
      url.search = q.toString();
      return url.href;
    }

    function openDataPanel(view) {
      const labels = { trends: "趋势分析", details: "明细数据", overview: "数据概览" };
      const subs = {
        trends: "按日/周/月查看活跃量与换电趋势",
        details: "站点明细筛选与 CSV 导出",
        overview: "KPI 摘要与近 7 日走势"
      };
      document.querySelector("#dataPanelTitle").textContent = labels[view] || "数据面板";
      document.querySelector("#dataPanelSub").textContent = subs[view] || "运营数据可视化";
      document.querySelector("#dataPanelFrame").src = dataPanelLink(view);
      document.querySelector("#dataPanelMask").classList.add("open");
      document.querySelector("#dataPanelModal").classList.add("open");
    }

    function closeDataPanelModal() {
      document.querySelector("#dataPanelModal").classList.remove("open");
      document.querySelector("#dataPanelMask").classList.remove("open");
      document.querySelector("#dataPanelFrame").src = "about:blank";
    }

    function last7DayLabels() {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return `${d.getMonth() + 1}/${d.getDate()}`;
      });
    }

    function ymdLocal(d) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }

    function parseYmdLocal(s) {
      if (!s) return null;
      const [y, m, d] = String(s).split("-").map(Number);
      if (!y || !m || !d) return null;
      const dt = new Date(y, m - 1, d);
      dt.setHours(12, 0, 0, 0);
      return dt;
    }

    function getDrillSwapPf() {
      if (!state.pf.drillSwap) {
        state.pf.drillSwap = { operatorId: "全部", site: "全部", range: "7", dateFrom: "", dateTo: "" };
      }
      if (state.pf.drillSwap.operatorId == null) state.pf.drillSwap.operatorId = "全部";
      return state.pf.drillSwap;
    }

    function drillSwapOperatorOptions() {
      return [{ v: "全部", t: "全部运营商" }].concat(
        platformOperators.map(o => ({ v: o.id, t: o.name }))
      );
    }

    function drillSwapSiteOptions(ctx) {
      if (ctx === "platform") {
        const pf = getDrillSwapPf();
        const opId = pf.operatorId || "全部";
        const names = [...new Set(
          sites
            .filter(s => s.status === "在营" && (opId === "全部" || s.operatorId === opId))
            .map(s => s.name)
        )].sort();
        return ["全部", ...names];
      }
      if (ctx === "channel") {
        const c = myChannelContracts()[0];
        if (c?.dedicatedSiteName) return ["全部", c.dedicatedSiteName];
        if (Array.isArray(c?.sites) && c.sites.length && c.sites[0] !== "全部") {
          return ["全部", ...c.sites];
        }
        return ["全部"];
      }
      return ownSiteOptions();
    }

    function drillSwapDateList(pf) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      let to = new Date(today);
      let from;
      if (pf.range === "30") {
        from = new Date(today);
        from.setDate(from.getDate() - 29);
      } else if (pf.range === "custom") {
        from = parseYmdLocal(pf.dateFrom) || (() => { const d = new Date(today); d.setDate(d.getDate() - 6); return d; })();
        to = parseYmdLocal(pf.dateTo) || new Date(today);
        if (to > today) to = new Date(today);
        if (from > to) from = new Date(to);
        const spanDays = Math.round((to - from) / 86400000) + 1;
        if (spanDays > 31) {
          from = new Date(to);
          from.setDate(from.getDate() - 30);
        }
      } else {
        from = new Date(today);
        from.setDate(from.getDate() - 6);
      }
      const list = [];
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) list.push(new Date(d));
      return list;
    }

    function mockDailySwapSeries(site, dates, operatorId) {
      const siteKey = site || "全部";
      const opKey = operatorId || "全部";
      return dates.map(d => {
        const key = opKey + ":" + siteKey + ":" + ymdLocal(d);
        let h = 2166136261;
        for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
        const base = (opKey === "全部" && siteKey === "全部") ? 42
          : (opKey !== "全部" && siteKey === "全部") ? 18
          : 14;
        const weekend = (d.getDay() === 0 || d.getDay() === 6) ? 6 : 0;
        return base + ((h >>> 0) % 19) + weekend;
      });
    }

    function smoothLinePath(points) {
      if (!points.length) return "";
      if (points.length === 1) return `M${points[0].x},${points[0].y}`;
      let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i], p1 = points[i + 1];
        const mx = (p0.x + p1.x) / 2;
        d += ` C${mx.toFixed(1)},${p0.y.toFixed(1)} ${mx.toFixed(1)},${p1.y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
      }
      return d;
    }

    function renderSparkChart(values, labels, color, allowNegative, opts) {
      if (allowNegative && typeof allowNegative === "object") {
        opts = allowNegative;
        allowNegative = false;
      }
      opts = opts || {};
      const compact = !!opts.compact;
      const lbs = labels || last7DayLabels();
      const n = Math.max(values.length, 1);
      const W = compact
        ? Math.min(720, Math.max(280, 32 + n * 22))
        : Math.min(920, Math.max(360, 48 + n * 28));
      const H = opts.height || (compact ? 88 : (n > 14 ? 148 : 128));
      const pl = opts.pl ?? (compact ? 34 : 42);
      const pr = opts.pr ?? 12;
      const pt = opts.pt ?? (compact ? 10 : 18);
      const pb = opts.pb ?? (compact ? 20 : 28);
      const vmax = Math.max(...values, 0);
      const vmin = Math.min(...values, 0);
      const pad = Math.max(1, Math.round((vmax - vmin) * 0.12) || 1);
      const max = vmax + pad;
      const min = allowNegative ? vmin - pad : Math.max(0, vmin - pad);
      const span = max - min || 1;
      const iw = W - pl - pr, ih = H - pt - pb;
      const c = color || "#0d9488";
      const uid = "sg" + Math.random().toString(36).slice(2, 9);
      const coords = values.map((v, i) => {
        const x = pl + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
        const y = pt + ih - ((v - min) / span) * ih;
        return { x, y, v };
      });
      const linePath = smoothLinePath(coords);
      const areaPath = coords.length
        ? `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(pt + ih).toFixed(1)} L${coords[0].x.toFixed(1)},${(pt + ih).toFixed(1)} Z`
        : "";
      const gridY = [0, 0.33, 0.66, 1].map(t => {
        const raw = min + span * (1 - t);
        const val = Math.abs(raw) >= 100 ? Math.round(raw)
          : Math.abs(raw) >= 10 ? raw.toFixed(1)
          : Math.abs(raw) >= 1 ? raw.toFixed(2)
          : raw.toFixed(3);
        const y = pt + ih * t;
        return `<line class="spark-grid" x1="${pl}" y1="${y}" x2="${W - pr}" y2="${y}"/>
          <text class="spark-axis" x="${pl - 8}" y="${y + 3.5}" text-anchor="end">${val}</text>`;
      }).join("");
      const last = coords.length - 1;
      const labelStep = n > 20 ? Math.ceil(n / 8) : n > 12 ? 2 : 1;
      const par = opts.stretch ? "none" : "xMidYMid meet";
      const unit = opts.unit || "";
      const hoverHtml = coords.map((p, i) => {
        const prevX = i === 0 ? pl : (coords[i - 1].x + p.x) / 2;
        const nextX = i === last ? W - pr : (p.x + coords[i + 1].x) / 2;
        const boxW = Math.max(72, String(lbs[i] || "").length * 7 + String(p.v).length * 7 + 18);
        const tx = Math.max(pl + boxW / 2, Math.min(W - pr - boxW / 2, p.x));
        const ty = Math.max(18, p.y - 22);
        const label = lbs[i] || "";
        const value = `${p.v}${unit}`;
        return `<g class="spark-hover">
          <rect class="spark-hit" x="${prevX}" y="${pt}" width="${Math.max(1, nextX - prevX)}" height="${ih}"/>
          <line class="spark-hover-line" x1="${p.x}" y1="${pt}" x2="${p.x}" y2="${pt + ih}"/>
          <circle class="spark-hover-dot" cx="${p.x}" cy="${p.y}" r="4" stroke="${c}"/>
          <g class="spark-tooltip" transform="translate(${tx},${ty})">
            <rect class="spark-tooltip-bg" x="${-boxW / 2}" y="-14" width="${boxW}" height="20" rx="5"/>
            <text class="spark-tooltip-text" text-anchor="middle" y="0">${label} · ${value}</text>
          </g>
        </g>`;
      }).join("");
      return `<div class="spark-chart-wrap" style="--spark-color:${c}">
        <svg class="spark-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="${par}" aria-hidden="true">
          <defs>
            <linearGradient id="${uid}-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${c}" stop-opacity=".18"/>
              <stop offset="85%" stop-color="${c}" stop-opacity=".04"/>
              <stop offset="100%" stop-color="${c}" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="${uid}-line" x1="${pl}" y1="0" x2="${W - pr}" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${c}" stop-opacity=".55"/>
              <stop offset="50%" stop-color="${c}"/>
              <stop offset="100%" stop-color="${c}" stop-opacity=".85"/>
            </linearGradient>
          </defs>
          ${gridY}
          ${areaPath ? `<path d="${areaPath}" fill="url(#${uid}-area)"/>` : ""}
          ${linePath ? `<path class="spark-line" d="${linePath}" stroke="url(#${uid}-line)"/>` : ""}
          ${coords.map((p, i) => `<g>
            <circle class="spark-dot${i === last ? " spark-dot-last" : ""}" cx="${p.x}" cy="${p.y}" r="3.5" stroke="${c}"><title>${lbs[i] || ""}：${p.v}</title></circle>
            ${i === last ? `<circle class="spark-dot-last-inner" cx="${p.x}" cy="${p.y}" fill="${c}"/>` : ""}
          </g>`).join("")}
          ${hoverHtml}
          ${lbs.map((lb, i) => {
            if (i !== last && i !== 0 && i % labelStep !== 0) return "";
            const x = pl + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
            const active = i === last;
            return `<text class="spark-axis" x="${x}" y="${H - 8}" text-anchor="middle" font-weight="${active ? "600" : "400"}" fill="${active ? c : "#94a3b8"}">${lb}</text>`;
          }).join("")}
        </svg>
      </div>`;
    }

    function renderDataDrillPanel(ctx) {
      const pf = getDrillSwapPf();
      const isPlatform = ctx === "platform";
      if (isPlatform) {
        const opOpts = drillSwapOperatorOptions();
        if (!opOpts.some(o => o.v === pf.operatorId)) pf.operatorId = "全部";
      }
      const siteOpts = drillSwapSiteOptions(ctx);
      if (!siteOpts.includes(pf.site)) pf.site = "全部";
      const dates = drillSwapDateList(pf);
      const labels = dates.map(d => `${d.getMonth() + 1}/${d.getDate()}`);
      const series = mockDailySwapSeries(pf.site, dates, isPlatform ? pf.operatorId : "全部");
      const sum = series.reduce((s, v) => s + v, 0);
      const color = ctx === "platform" ? "#2563eb" : ctx === "channel" ? "#7c3aed" : "#0d9488";
      const customFrom = pf.dateFrom || ymdLocal(dates[0]);
      const customTo = pf.dateTo || ymdLocal(dates[dates.length - 1]);
      const showCustom = pf.range === "custom";
      const opFilter = isPlatform ? `<label class="filter-inline">
              <span>运营商</span>
              <select data-drill-swap="operatorId">${drillSwapOperatorOptions().map(o =>
                `<option value="${o.v}"${o.v === pf.operatorId ? " selected" : ""}>${o.t}</option>`
              ).join("")}</select>
            </label>` : "";
      return `<section class="panel swap-orders-panel">
        ${panelHead("换电订单数", isPlatform ? "可按运营商下钻" : "", "data_drill_panel")}
        <div class="panel-body">
          <div class="filter-inline-bar">
            ${opFilter}
            <label class="filter-inline">
              <span>站点</span>
              <select data-drill-swap="site">${siteOpts.map(s =>
                `<option value="${s}"${s === pf.site ? " selected" : ""}>${s === "全部" ? "全部站点" : s}</option>`
              ).join("")}</select>
            </label>
            <label class="filter-inline">
              <span>时间</span>
              <select data-drill-swap="range">
                <option value="7"${pf.range === "7" ? " selected" : ""}>近 7 天</option>
                <option value="30"${pf.range === "30" ? " selected" : ""}>近 30 天</option>
                <option value="custom"${pf.range === "custom" ? " selected" : ""}>自定义</option>
              </select>
            </label>
            ${showCustom ? `<label class="filter-inline filter-inline-range">
              <span>起止</span>
              <input type="date" data-drill-swap="dateFrom" value="${customFrom}">
              <span class="range-sep">~</span>
              <input type="date" data-drill-swap="dateTo" value="${customTo}">
            </label>` : ""}
          </div>
          ${showCustom ? `<p class="drill-range-tip">最多 31 天</p>` : ""}
          <div class="swap-orders-sum-row">
            <div class="swap-orders-sum-left">
              <strong>${sum}<em> 单</em></strong>
              <span class="swap-orders-minmax">最高 ${Math.max(...series)} · 最低 ${Math.min(...series)}</span>
            </div>
          </div>
          <div class="swap-orders-chart">
            ${renderSparkChart(series, labels, color, false, {
              compact: true,
              stretch: true,
              height: 220,
              pl: 40,
              pr: 12,
              pt: 12,
              pb: 28,
              unit: "单"
            })}
          </div>
        </div>
      </section>`;
    }

    function myOrderAuditEvents() {
      if (isPlatformRole()) return orderAuditEvents;
      if (isChannelRole()) {
        const cid = channelEntityId();
        return orderAuditEvents.filter(e => e.channelId === cid);
      }
      return orderAuditEvents.filter(e => e.operatorId === currentEntity().id);
    }

    function navigateAuditRef(type, id) {
      closeDrawer();
      if (isPlatformRole()) {
        if (type === "swap") {
          state.view = "platformOrders";
          state.platformOrderTab = "swap";
          state.detailSwapId = id;
          state.detailSubId = null;
          getPf().swapId = id;
          return;
        }
        if (type === "package") {
          state.view = "platformOrders";
          state.platformOrderTab = "package";
          state.detailSubId = id;
          state.detailSwapId = null;
          getPf().orderId = id;
          return;
        }
        if (type === "serviceChange" || type === "refund") {
          state.view = "platformUsers";
          state.platformUsersTab = "serviceChange";
          state.detailSubId = null;
          state.detailSwapId = null;
          const pf = getPf();
          if (type === "serviceChange") {
            pf.scId = id;
          } else {
            const rf = refundRequests.find(x => x.id === id);
            pf.scId = rf?.scId || "";
            pf.orderId = rf?.orderId || "";
          }
          return;
        }
      }
      if (type === "swap") {
        state.view = "orderSwap";
        state.orderTab = "swap";
        state.detailSwapId = id;
        state.detailSubId = null;
      } else if (type === "package") {
        state.view = "orderPackage";
        state.orderTab = "package";
        state.detailSubId = id;
        state.detailSwapId = null;
      } else if (type === "refund") {
        state.view = "refundManage";
        state.refundTab = "queue";
        state.detailRefundId = id;
        getPf().refundId = id;
      } else if (type === "serviceChange") {
        state.detailSubId = null;
        state.detailSwapId = null;
        const sc = serviceChangeRequests.find(x => x.id === id);
        if (sc && sc.type === "中途完结") {
          state.view = "refundManage";
          state.refundTab = "queue";
          const rf = refundRequests.find(r => r.scId === id);
          state.detailRefundId = rf?.id || null;
          getPf().refundId = rf?.id || "";
        } else {
          state.view = "orderAudit";
          getPf().keyword = id;
          state.detailRefundId = null;
        }
      }
    }

    function alertTypeLabel(t) {
      return { eject_fail: "未正常弹电池", cabinet_offline: "柜机离线", door_fault: "门禁异常", eject_wrong_slot: "弹错格口" }[t] || t;
    }

    function myDeviceAlerts() {
      if (isPlatformRole()) return deviceAlerts;
      return deviceAlerts.filter(a => a.operatorId === currentEntity().id);
    }

    function pendingDeviceAlertCount() {
      return myDeviceAlerts().filter(a => a.status === "待处理").length;
    }

    function currentLoginSummary() {
      const emp = currentEmployee();
      if (emp) {
        return {
          displayName: emp.name,
          roleLabel: "员工登录 · " + (emp.jobTitle || "运营"),
          entity: entityNameById(emp.entityId),
          account: emp.phone || emp.id,
          loginAt: "演示会话"
        };
      }
      const ent = currentEntity();
      const r = ROLE[state.role];
      const ch = isChannelRole() ? channelProfile() : null;
      return {
        displayName: ch ? ch.name : (ent.name || r.name),
        roleLabel: ch ? `${r.type} · ${ch.settlementMode}` : r.type,
        entity: ch ? ch.name : (ent.name || r.name),
        account: state.loginKey.replace("entity:", "").replace("emp:", ""),
        loginAt: "演示会话"
      };
    }

    function closeUserMenu() {
      document.querySelector("#userMenu")?.classList.remove("open");
    }

    function toggleUserMenu() {
      document.querySelector("#userMenu")?.classList.toggle("open");
    }

    function navigateToDeviceAlerts() {
      closeUserMenu();
      if (!canAccessView("devices")) {
        window.alert("当前身份无「我的设备」菜单");
        return;
      }
      state.view = "devices";
      state.deviceTab = "alerts";
      closeDrawer();
      render();
    }

    function logoutLogin() {
      closeUserMenu();
      applyLoginKey("entity:operator");
      state.view = "overview";
      state.deviceTab = "cabinet";
      closeDrawer();
      closeEmployeeForm();
      render();
      window.alert("已退出登录（演示：已切回默认运营商「绿色出行」）");
    }

    function renderGlobalHeader() {
      const el = document.querySelector("#globalHeader");
      if (!el) return;
      const pending = pendingDeviceAlertCount();
      const login = currentLoginSummary();
      const avatarChar = (login.displayName || "?").trim().charAt(0);
      const showAlerts = canAccessView("devices");
      el.innerHTML = `<div class="global-header-actions">
        ${showAlerts ? `<button type="button" class="device-alert-link" id="btnDeviceAlerts">
          设备报警${pending ? `<span class="alert-badge">${pending}</span>` : ""}
        </button>` : ""}
        <button type="button" class="user-avatar-btn" id="btnUserAvatar" title="账号">${avatarChar}</button>
        <div class="user-menu" id="userMenu">
          <div class="user-menu-head">
            <strong>${login.displayName}</strong>
            <span>${login.roleLabel}</span>
          </div>
          <dl class="user-menu-body">
            <dt>所属主体</dt><dd>${login.entity}</dd>
            <dt>登录账号</dt><dd>${login.account}</dd>
            <dt>会话</dt><dd>${login.loginAt}</dd>
          </dl>
          <div class="user-menu-foot">
            <button type="button" class="btn" id="btnLogout">退出登录</button>
          </div>
        </div>
      </div>`;
      document.querySelector("#btnDeviceAlerts")?.addEventListener("click", navigateToDeviceAlerts);
      document.querySelector("#btnUserAvatar")?.addEventListener("click", e => {
        e.stopPropagation();
        toggleUserMenu();
      });
      document.querySelector("#btnLogout")?.addEventListener("click", logoutLogin);
    }

    function myIccidProfiles() {
      if (isPlatformRole()) return iccidProfiles;
      return iccidProfiles.filter(i => i.operatorId === currentEntity().id);
    }

    function myDepositRechargeOrders() {
      return depositRechargeOrders.filter(o => o.operatorId === currentEntity().id);
    }

    function pendingDepositRechargeCount() {
      return depositRechargeOrders.filter(o => o.status === "待确认").length;
    }

    function operatorNameById(id) {
      return platformOperators.find(o => o.id === id)?.name || id;
    }

    function appendDepositLedger(operatorId, type, delta, ref, by) {
      const credit = creditForOperator(operatorId);
      if (!credit) return;
      credit.depositBalance = Math.round((credit.depositBalance + delta) * 1000) / 1000;
      depositLedger.unshift({
        id: "DL-" + Date.now(),
        operatorId,
        time: new Date().toISOString().slice(0, 19).replace("T", " "),
        type,
        delta: Math.round(delta * 1000) / 1000,
        balanceAfter: credit.depositBalance,
        ref: ref || "—",
        by
      });
    }

    function confirmDepositRecharge(orderId) {
      const o = depositRechargeOrders.find(x => x.id === orderId);
      if (!o || o.status !== "待确认") return false;
      o.status = "已确认";
      o.confirmTime = new Date().toISOString().slice(0, 19).replace("T", " ");
      o.confirmedBy = "平台财务";
      appendDepositLedger(o.operatorId, "对公充值", o.amount, o.id, "平台财务");
      return true;
    }

    function rejectDepositRecharge(orderId, reason) {
      const o = depositRechargeOrders.find(x => x.id === orderId);
      if (!o || o.status !== "待确认") return false;
      o.status = "已驳回";
      o.confirmTime = new Date().toISOString().slice(0, 19).replace("T", " ");
      o.confirmedBy = "平台财务";
      o.rejectReason = reason || "资料不符";
      return true;
    }

    function submitDepositRecharge(form) {
      const amount = Number(form.amount);
      if (!amount || amount <= 0) return "请输入有效充值金额";
      if (!form.transferRef?.trim()) return "请填写银行流水号/转账参考号";
      const id = "DR-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + String(depositRechargeOrders.length + 1).padStart(3, "0");
      depositRechargeOrders.unshift({
        id,
        operatorId: currentEntity().id,
        amount,
        transferRef: form.transferRef.trim(),
        payerAccount: (form.payerAccount || "").trim() || "—",
        transferDate: form.transferDate || new Date().toISOString().slice(0, 10),
        status: "待确认",
        submitTime: new Date().toISOString().slice(0, 19).replace("T", " "),
        confirmTime: null,
        confirmedBy: null,
        remark: (form.remark || "").trim()
      });
      return null;
    }

    function operatorAggregateStats(operatorId) {
      const siteSet = new Set(cabinets.filter(c => c.deviceOwnerId === operatorId).map(c => c.site));
      sites.filter(s => s.operatorId === operatorId).forEach(s => siteSet.add(s.name));
      const channels = channelContracts.filter(c => c.operatorId === operatorId).length;
      const turnover = packageOrders.filter(p => p.deviceOwnerId === operatorId).reduce((s, p) => s + p.pay, 0)
        + channelSalesOrders.filter(o => dayPools.some(p => p.sellerId === operatorId && p.orderNo === o.id)).reduce((s, o) => s + o.amount, 0);
      const cRev = packageOrders.filter(p => p.deviceOwnerId === operatorId).reduce((s, p) => s + calcPlatformFeeAmount(p.pay, operatorId, "支付成功"), 0);
      const bRev = platformFeeAccruals.filter(r => r.operatorId === operatorId).reduce((s, r) => s + r.feeAmount, 0);
      return {
        sites: siteSet.size,
        cabinets: cabinets.filter(c => c.deviceOwnerId === operatorId).length,
        batteries: batteries.filter(b => b.deviceOwnerId === operatorId).length,
        users: users.filter(u => u.deviceOwnerId === operatorId).length,
        channels,
        packageOrders: packageOrders.filter(p => p.deviceOwnerId === operatorId).length,
        swapOrders: swapOrders.filter(s => s.deviceOwnerId === operatorId && s.status === "成功").length,
        turnover,
        platformRevenue: Math.round((cRev + bRev) * 100) / 100
      };
    }

    function platformBizStats() {
      const channelIds = [...new Set(channelContracts.map(c => c.channelId))];
      const turnover = packageOrders.reduce((s, p) => s + p.pay, 0) + channelSalesOrders.reduce((s, o) => s + o.amount, 0);
      const cRev = packageOrders.reduce((s, p) => s + calcPlatformFeeAmount(p.pay, p.deviceOwnerId, "支付成功"), 0);
      const bRev = platformFeeAccruals.reduce((s, r) => s + r.feeAmount, 0);
      return {
        operators: platformOperators.filter(o => o.status === "在营").length,
        users: users.length,
        channels: channelIds.length,
        sites: sites.filter(s => s.status === "在营").length,
        cabinets: cabinets.length,
        batteries: batteries.length,
        devices: cabinets.length + batteries.length,
        packageOrders: packageOrders.length,
        swapOrders: swapOrders.filter(s => s.status === "成功").length,
        turnover,
        platformRevenue: Math.round((cRev + bRev) * 100) / 100,
        pendingInventory: 0
      };
    }

    function myDayPools() {
      const eid = currentEntity().id;
      if (isChannelRole()) return dayPools.filter(p => p.ownerId === eid);
      return [];
    }

    function myChannelTeams() {
      if (!isChannelRole()) return [];
      return dayPoolTeams.filter(t => t.channelId === currentEntity().id);
    }

    function defaultChannelPoolId() {
      const pools = myDayPools();
      return pools.length === 1 ? pools[0].id : null;
    }

    function resolveTeamPoolId(team) {
      const def = defaultChannelPoolId();
      if (def) return def;
      return (team && team.poolId) ? team.poolId : (myDayPools()[0] && myDayPools()[0].id);
    }

    function poolForChannelSeller(channelId, sellerId) {
      return dayPools.find(p => p.ownerId === channelId && p.sellerId === sellerId);
    }

    function poolById(id) { return dayPools.find(p => p.id === id); }

    function channelContractSitesLabel(sites) {
      return sites && sites.length ? sites.join("、") : "不限制（规则配置）";
    }

    function ensurePoolForChannelOrder(o) {
      let pool = o.poolId ? poolById(o.poolId) : poolForChannelSeller(o.channelId, o.operatorId);
      if (pool) {
        o.poolId = pool.id;
        return pool;
      }
      const contract = channelContracts.find(c => c.channelId === o.channelId && c.operatorId === o.operatorId);
      pool = createPendingPoolForChannel({
        channelId: o.channelId, channelName: o.channelName,
        operatorId: o.operatorId, operatorName: o.operatorName,
        wholesalePrice: o.unitPrice, validFrom: new Date().toISOString().slice(0, 10),
        validTo: contract?.validTo || "2026-12-31", orderNo: o.id, status: "使用中"
      });
      o.poolId = pool.id;
      return pool;
    }

    function createPendingPoolForChannel(opts) {
      const suffix = Date.now().toString().slice(-6);
      const poolId = "QP-" + suffix;
      const pool = {
        id: poolId,
        name: (opts.channelName || "渠道") + "·" + (opts.operatorName || "运营商").replace(/联营/g, "").slice(0, 6) + "人天池",
        ownerId: opts.channelId, ownerName: opts.channelName,
        sellerId: opts.operatorId, sellerName: opts.operatorName,
        totalDays: 0, availableDays: 0, frozenDays: 0, consumedDays: 0, giftedDays: 0, refundedDays: 0, expiredDays: 0,
        validFrom: opts.validFrom || new Date().toISOString().slice(0, 10),
        validTo: opts.validTo || "2026-12-31",
        wholesalePrice: opts.wholesalePrice,
        orderNo: opts.orderNo || "—",
        status: opts.status || "待配置", balancePct: 100, warnSms: false, ...POOL_CONTRACT_RULES
      };
      dayPools.push(pool);
      dayPoolTeams.push({
        id: "TEAM-" + suffix, channelId: opts.channelId, name: "默认团队", poolId,
        isDefault: true, riderCount: 0, status: "启用",
        createdAt: new Date().toISOString().slice(0, 10),
        remark: "签约开户时自动创建"
      });
      const ch = platformChannels.find(c => c.id === opts.channelId);
      if (ch) {
        ch.poolCount = (ch.poolCount || 0) + 1;
        ch.teamCount = (ch.teamCount || 0) + 1;
      }
      return pool;
    }

    function poolExpiredRecoveryWindow(pool) {
      if (!pool || !(pool.expiredDays > 0)) return null;
      const base = pool.poolExpiredAt || pool.validTo;
      if (!base) return null;
      const deadline = new Date(base);
      deadline.setDate(deadline.getDate() + 30);
      if (new Date() > deadline) return null;
      return { maxDays: pool.expiredDays, deadline: deadline.toISOString().slice(0, 10) };
    }

    function exportOrgConsumeCsv() {
      const tid = teamAdminScopeTeamId();
      const team = dayPoolTeams.find(t => t.id === tid);
      const rows = dayPoolRiderDailyConsume.filter(r => matchTeamScope(r));
      const header = "日期,骑手,换电次数,持有电池,确认人天,确认原因";
      const body = rows.map(r => [r.date, r.riderName, r.swapCount, r.batteryHeld, r.confirmedDays, r.confirmReason || "—"].join(",")).join("\n");
      window.alert("演示：已导出「" + (team?.name || "") + "」消耗明细 " + rows.length + " 条（CSV Mock）\n\n" + header + "\n" + (body || "（无数据）"));
    }

    function teamPoolCell(team) {
      const pid = resolveTeamPoolId(team);
      const p = poolById(pid);
      const auto = defaultChannelPoolId() ? `<br><small style="color:var(--muted)">唯一池，自动绑定</small>` : "";
      return p ? `<strong>${p.name}</strong><br><small>${p.id} · ${p.sellerName}</small>${auto}` : (pid || "—");
    }

    function syncTeamRiderCounts() {
      myChannelTeams().forEach(t => {
        t.riderCount = dayPoolRiders.filter(r => r.teamId === t.id && r.status === "在职").length;
      });
    }

    function mySoldDayPools() {
      if (!isOperatorRole()) return [];
      return dayPools.filter(p => p.sellerId === currentEntity().id);
    }

    function myChannelContracts() {
      const eid = currentEntity().id;
      if (isChannelRole()) return channelContracts.filter(c => c.channelId === eid);
      if (isOperatorRole()) return channelContracts.filter(c => c.operatorId === eid);
      return [];
    }

    function contractSettlementMode(c) {
      return c?.settlementMode || "人天池";
    }

    function rentExpiryPolicyLabel(policy) {
      return policy === "suspend" ? "到期停服" : "到期兜底 SKU";
    }

    function contractPricingCell(c) {
      const mode = contractSettlementMode(c);
      if (mode === "卡差价") {
        const skus = channelLinkSkus.filter(s => s.channelId === c.channelId);
        const instant = c.instantCommissionPayout ? `<br><small style="color:var(--green)">佣金及时到付 · ${formatCommissionRate(c.commissionRate)}</small>` : "";
        return skus.length
          ? skus.map(s => `${s.name}<br><small>正式 ¥${s.officialPrice} / 专享 ¥${s.channelPrice} / 佣 ¥${s.commissionPerOrder}</small>`).join("<br>") + instant
          : "推广链接分销" + instant;
      }
      if (mode === "设备租赁") {
        const pool = channelRentPoolData.find(p => p.channelId === c.channelId);
        return `月租 ¥${(c.monthlyRent || pool?.monthlyRent || 0).toLocaleString()}<br><small>覆盖 ${pool?.devicesCovered || "—"} 台</small>`;
      }
      if (mode === "激活码") {
        return `¥${c.wholesalePrice}/码<br><small>${c.codeSkuName || "—"} · ${c.codeValidityDays || 30} 天</small>`;
      }
      return `¥${c.wholesalePrice}/人天`;
    }

    function contractTermsCell(c) {
      const mode = contractSettlementMode(c);
      if (mode === "卡差价") {
        const skus = channelLinkSkus.filter(s => s.channelId === c.channelId);
        const settle = c.instantCommissionPayout
          ? `佣金及时到付 · ${formatCommissionRate(c.commissionRate)}`
          : "佣金线下结算";
        return `授权 ${skus.length} 个 SKU<br><small>推广链接 · ${settle} · 24h 归因</small>`;
      }
      if (mode === "设备租赁") {
        const site = c.dedicatedSiteName || "—";
        const ch = platformChannels.find(p => p.id === c.channelId);
        const suspendNote = ch?.status === "已停用" ? " · <span style=\"color:var(--danger)\">渠道已停用·停服</span>" : " · 欠费停服";
        return `专属站 ${site}<br><small>白名单 ${c.whitelistCount || "—"} 人${suspendNote}</small>`;
      }
      if (mode === "激活码") {
        return `${c.codeSkuName || "激活码"} · 一码一用<br><small>库存 ${c.codeInventory ?? "—"} · 已核销 ${c.codesRedeemed ?? "—"}</small>`;
      }
      return `${c.minDays || "—"} 人天起`;
    }

    function myOperatorDayOrders() {
      return channelSalesOrders.filter(o => o.operatorId === currentEntity().id);
    }

    function myOperatorCardOrders() {
      return channelCardSalesOrders.filter(o => o.operatorId === currentEntity().id);
    }

    function myOperatorRentOrders() {
      return channelRentTopupOrders.filter(o => o.operatorId === currentEntity().id);
    }

    function myOperatorActivationOrders() {
      return channelActivationOrders.filter(o => o.operatorId === currentEntity().id);
    }

    function myActivationCodes() {
      const cid = channelEntityId();
      return cid ? channelActivationCodes.filter(c => c.channelId === cid) : channelActivationCodes;
    }

    function myActivationRedemptions() {
      const cid = channelEntityId();
      return cid ? channelActivationRedemptions.filter(r => r.channelId === cid) : channelActivationRedemptions;
    }

    function b2bOrderActionCell(o, role, kind) {
      const confirmAttr = kind === "card" ? "data-confirm-card-order" : kind === "rent" ? "data-confirm-rent-order" : kind === "act" ? "data-confirm-act-order" : "data-confirm-channel-po";
      if (role === "operator" && o.orderStatus === "待确认到账" && o.operatorId === currentEntity().id) {
        return `<button type="button" class="link-btn" ${confirmAttr}="${o.id}">确认到账</button>`;
      }
      if (role === "platform" && o.payChannel === "online" && ["待支付", "支付中"].includes(o.orderStatus)) {
        return `<button type="button" class="link-btn" data-simulate-online-pay="${o.id}">模拟支付成功</button>`;
      }
      if (o.orderStatus === "已完成" && o.confirmedBy) {
        return `<small style="color:var(--muted)">${o.confirmedBy} 确认</small>`;
      }
      if (o.orderStatus === "已完成" && o.paymentNo) {
        return `<small style="color:var(--muted)">${o.paymentNo}</small>`;
      }
      return "—";
    }

    function myOperatorCredit() {
      if (!isOperatorRole()) return null;
      return operatorCreditAccounts.find(a => a.operatorId === currentEntity().id) || null;
    }

    function myInterOpLedger() {
      if (!isOperatorRole()) return [];
      const eid = currentEntity().id;
      return interOpLedger.filter(r =>
        r.payerId === eid || r.payeeCabinetId === eid || r.payeeBatteryId === eid
      );
    }

    function myChannelInterOpLedger() {
      if (!isLeaseChannel()) return [];
      const cid = channelEntityId();
      return channelInterOpLedger.filter(r => r.channelId === cid);
    }

    function channelSwapPolicyFor(cid) {
      return channelSwapPolicy[cid] || { crossNetworkEnabled: false, crossNetworkDepositPaid: false };
    }

    function whitelistAccessLabel(access) {
      return access === "free"
        ? '<span class="tag neutral">白名单免费</span>'
        : '<span class="tag warn">白名单付费</span>';
    }

    function interOpRowView(r) {
      const eid = currentEntity().id;
      let direction = "—";
      let amount = 0;
      if (r.payerId === eid && (r.cabinetFee > 0 || r.batteryFee > 0)) {
        direction = "平台代付";
        amount = (r.cabinetFee || 0) + (r.batteryFee || 0);
      } else if (r.payeeCabinetId === eid || r.payeeBatteryId === eid) {
        direction = "平台代收";
        amount = (r.payeeCabinetId === eid ? (r.cabinetFee || 0) : 0) + (r.payeeBatteryId === eid ? (r.batteryFee || 0) : 0);
      }
      return { direction, amount, isCross: amount > 0 && r.payerId !== r.payeeCabinetId };
    }

    function myInterOpDailyBills() {
      if (!isOperatorRole()) return [];
      return interOpDailyBills.filter(b => b.operatorId === currentEntity().id);
    }

    function myInterOpPeriodBills() {
      if (!isOperatorRole()) return [];
      return interOpPeriodBills.filter(b => b.operatorId === currentEntity().id);
    }

    function interOpRangeLabel(range) {
      return ({ today: "今日", yesterday: "昨日", "7": "近 7 天", "30": "近 30 天" })[range] || "近 7 天";
    }

    function interOpDateRange(range) {
      const today = INTER_OP_MOCK_TODAY;
      const td = new Date(today + "T12:00:00");
      const fmt = d => d.toISOString().slice(0, 10);
      if (range === "today") return { from: today, to: today };
      if (range === "yesterday") {
        const y = new Date(td);
        y.setDate(y.getDate() - 1);
        const ds = fmt(y);
        return { from: ds, to: ds };
      }
      const days = range === "30" ? 30 : 7;
      const from = new Date(td);
      from.setDate(from.getDate() - (days - 1));
      return { from: fmt(from), to: today };
    }

    function interOpDatesInRange(from, to) {
      const out = [];
      const cur = new Date(from + "T12:00:00");
      const end = new Date(to + "T12:00:00");
      while (cur <= end) {
        out.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
      return out;
    }

    function interOpDailySeries(dailyBills, from, to) {
      const billMap = Object.fromEntries(dailyBills.map(b => [b.date, b]));
      return interOpDatesInRange(from, to).map(date => {
        const b = billMap[date];
        return {
          date,
          label: date.slice(5).replace("-", "/"),
          payOut: b ? b.platformPayOut : 0,
          payIn: b ? b.platformPayIn : 0,
          net: b ? b.net : 0,
          swapCount: b ? b.swapCount : 0
        };
      });
    }

    function fmtInterOpMoney(n) {
      const abs = Math.abs(n).toFixed(2);
      return n < 0 ? "-¥" + abs : n > 0 ? "+¥" + abs : "¥0.00";
    }

    function myPlatformFeeAccruals() {
      if (!isOperatorRole()) return [];
      return platformFeeAccruals.filter(r => r.operatorId === currentEntity().id);
    }

    function myPlatformFeeBills() {
      if (!isOperatorRole()) return [];
      return platformFeeBills.filter(r => r.operatorId === currentEntity().id);
    }

    function selectedDayPool() {
      return myDayPools().find(p => p.id === state.dayPoolSelectedId) || myDayPools()[0] || null;
    }

    function poolStatusTag(status) {
      const risk = ["余额不足", "已到期", "已关闭", "预占失败"];
      const warn = ["待配置", "待重试", "待处理"];
      const cls = risk.some(k => status.includes(k)) ? "risk" : warn.some(k => status.includes(k)) ? "warn" : "";
      return `<span class="tag ${cls}">${status}</span>`;
    }

    function eligibilityTag(el) {
      const map = {
        "已确认消耗": "tag", "已预占": "tag warn", "预占失败": "tag risk", "待首换": "tag warn",
        "待首换开通": "tag warn", "已回池": "tag neutral", "不可用": "tag risk"
      };
      const cls = (map[el] || "tag neutral").replace("tag ", "");
      return `<span class="tag ${cls}">${el}</span>`;
    }

    function canEditDayPool() {
      if (!isChannelRole()) return false;
      return isEntityLogin() || employeeHasPerm("day_pool.edit");
    }

    function getPf() {
      const key = pfKey();
      const defaults = PF_DEFAULTS[key];
      if (!state.pf[key]) state.pf[key] = defaults ? { ...defaults } : {};
      return state.pf[key];
    }

    function matchKw(value, kw) {
      if (!kw || !String(kw).trim()) return true;
      return String(value || "").toLowerCase().includes(String(kw).trim().toLowerCase());
    }

    function matchDateStr(datetime, from, to) {
      if (!datetime) return true;
      const d = String(datetime).slice(0, 10);
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    }

    function userPkgServiceType(u) {
      if (u.poolId || u.poolEligibility || String(u.pkg || "").includes("人天池")) return "人天池";
      return "个人套餐";
    }

    function ownSiteOptions() {
      const eid = currentEntity().id;
      return ["全部", ...new Set(cabinets.filter(c => c.deviceOwnerId === eid).map(c => c.site))];
    }

    function ownSiteIdOptions() {
      return [{ v: "全部", t: "全部站点" }, ...myOperatorSites().map(s => ({ v: s.id, t: s.name }))];
    }

    function ownPartnerSiteIdOptions() {
      const p = currentSitePartner();
      if (!p) return [{ v: "全部", t: "全部站点" }];
      const siteIds = new Set(myPartnerBindings().map(b => b.siteId));
      return [{ v: "全部", t: "全部站点" }, ...sites.filter(s => siteIds.has(s.id)).map(s => ({ v: s.id, t: s.name }))];
    }

    function renderFilterField(spec, f) {
      const val = f[spec.key] ?? "";
      if (spec.type === "select") {
        const opts = (typeof spec.options === "function" ? spec.options() : spec.options)
          .map(o => `<option value="${o.v}"${o.v === val ? " selected" : ""}>${o.t}</option>`).join("");
        return `<div class="field"><label>${spec.label}</label><select data-pf-field="${spec.key}">${opts}</select></div>`;
      }
      return `<div class="field"><label>${spec.label}</label><input type="${spec.type || "text"}" data-pf-field="${spec.key}" value="${val}" placeholder="${spec.placeholder || ""}"></div>`;
    }

    const PAGE_FILTER_SPECS = {
      overview: [
        { key: "range", label: "统计范围", type: "select", options: [{ v: "today", t: "今日" }, { v: "7", t: "近 7 日" }, { v: "30", t: "近 30 日" }] }
      ],
      interOp: [
        { key: "range", label: "统计范围", type: "select", options: [
          { v: "today", t: "今日" }, { v: "yesterday", t: "昨日" }, { v: "7", t: "近 7 天" }, { v: "30", t: "近 30 天" }
        ] }
      ],
      sites: [
        { key: "siteName", label: "站点名称", placeholder: "模糊搜索" },
        { key: "city", label: "城市", type: "select", options: [{ v: "全部", t: "全部城市" }, { v: "上海", t: "上海" }] },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "在营", t: "在营" }, { v: "建设中", t: "建设中" }] }
      ],
      sitePartners: [
        { key: "keyword", label: "合伙人", placeholder: "姓名/公司/手机" },
        { key: "siteId", label: "站点", type: "select", options: () => ownSiteIdOptions() }
      ],
      partnerLedger: [
        { key: "keyword", label: "关键词", placeholder: "站点/单号" },
        { key: "siteId", label: "站点", type: "select", options: () => ownPartnerSiteIdOptions() },
        { key: "dateFrom", label: "日起", type: "date" },
        { key: "dateTo", label: "日止", type: "date" }
      ],
      devices: [
        { key: "sn", label: "设备编号", placeholder: "柜机 SN / 电池 SN" },
        { key: "site", label: "站点", type: "select", options: () => ownSiteOptions().map(s => ({ v: s, t: s === "全部" ? "全部站点" : s })) },
        { key: "online", label: "在线状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "online", t: "在线" }, { v: "offline", t: "离线/故障" }] }
      ],
      devices_cabinet: [
        { key: "deviceId", label: "设备编号", placeholder: "平台设备 ID" },
        { key: "sn", label: "设备 SN", placeholder: "如 CAB-22018" },
        { key: "deviceName", label: "设备名称", placeholder: "柜机名称" },
        { key: "site", label: "站点", type: "select", options: () => ownSiteOptions().map(s => ({ v: s, t: s === "全部" ? "全部站点" : s })) },
        { key: "online", label: "在线状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "online", t: "在线" }, { v: "offline", t: "离线" }] },
        { key: "powerStatus", label: "通电状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "已通电", t: "已通电" }, { v: "未通电", t: "未通电" }] },
        { key: "deviceStatus", label: "设备状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "启用", t: "启用" }, { v: "停用", t: "停用" }] }
      ],
      devices_battery: [
        { key: "sn", label: "电池 SN", placeholder: "BAT-" },
        { key: "site", label: "站点", type: "select", options: () => ownSiteOptions().map(s => ({ v: s, t: s === "全部" ? "全部站点" : s })) }
      ],
      orders_package: [
        { key: "orderId", label: "套餐单号", placeholder: "如 SUB260524001" },
        { key: "phone", label: "用户手机", placeholder: "完整或后四位" },
        { key: "payFrom", label: "支付日起", type: "date" },
        { key: "payTo", label: "支付日止", type: "date" },
        { key: "serviceState", label: "服务状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "服务中", t: "服务中" }, { v: "已冻结", t: "已冻结" }, { v: "中途完结", t: "中途完结" }, { v: "已完结", t: "已完结" }] },
        { key: "status", label: "订单状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "服务中", t: "服务中" }, { v: "已冻结", t: "已冻结" }, { v: "中途完结", t: "中途完结" }, { v: "已完结", t: "已完结" }] }
      ],
      orders_swap: [
        { key: "swapId", label: "换电单号", placeholder: "如 SW2605241201" },
        { key: "phone", label: "用户手机", placeholder: "完整或后四位" },
        { key: "timeFrom", label: "换电日起", type: "date" },
        { key: "timeTo", label: "换电日止", type: "date" },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "成功", t: "成功" }, { v: "失败", t: "失败" }] },
        { key: "entitlementType", label: "权益来源", type: "select", options: [{ v: "全部", t: "全部" }, { v: "个人套餐", t: "个人套餐" }, { v: "渠道人天", t: "渠道人天" }] }
      ],
      orders_service: [
        { key: "orderId", label: "套餐单号", placeholder: "关联套餐" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "type", label: "变更类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "中途完结", t: "中途完结" }, { v: "冻结", t: "冻结" }, { v: "解冻", t: "解冻" }] },
        { key: "status", label: "处理状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "退款处理中", t: "退款处理中" }, { v: "已生效", t: "已生效" }, { v: "待审核", t: "待审核" }, { v: "已通过", t: "已通过" }] }
      ],
      orderFreeze: [
        { key: "orderId", label: "套餐单号", placeholder: "SUB-" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "type", label: "变更类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "冻结", t: "冻结" }, { v: "解冻", t: "解冻" }] },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "已生效", t: "已生效" }] }
      ],
      flows_receipt: [
        { key: "orderId", label: "关联单号", placeholder: "套餐单号" },
        { key: "flowType", label: "流水类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "套餐支付", t: "套餐支付" }, { v: "额度池采购", t: "额度池采购" }, { v: "额度池零售", t: "额度池零售" }, { v: "退款出款", t: "退款出款" }, { v: "押金退还", t: "押金退还" }] },
        { key: "timeFrom", label: "交易日起", type: "date" },
        { key: "timeTo", label: "交易日止", type: "date" }
      ],
      flows_accrual: [
        { key: "orderId", label: "套餐单号", placeholder: "" },
        { key: "settle", label: "清分状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "已清分", t: "已清分" }, { v: "已提现", t: "已提现" }, { v: "已冲正", t: "已冲正" }] }
      ],
      flows_payout: [
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待审核", t: "待审核" }, { v: "已提现", t: "已提现" }, { v: "已驳回", t: "已驳回" }] }
      ],
      users: [
        { key: "userId", label: "用户 ID", placeholder: "如 U1028" },
        { key: "phone", label: "手机号", placeholder: "" },
        { key: "pkgService", label: "套餐/服务", type: "select", options: [
          { v: "全部", t: "全部" }, { v: "个人套餐", t: "个人套餐" }, { v: "人天池", t: "人天池" }
        ] },
        { key: "serviceState", label: "服务状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "服务中", t: "服务中" }, { v: "已冻结", t: "已冻结" }, { v: "中途完结", t: "中途完结" }] },
        { key: "depositKind", label: "电池押金", type: "select", options: [
          { v: "全部", t: "全部" }, { v: "实付", t: "实付在押" }, { v: "信用免押", t: "信用免押" },
          { v: "渠道担保", t: "渠道担保" }, { v: "退押中", t: "退押中" }
        ] }
      ],
      refundManage: [
        { key: "refundId", label: "退款单号", placeholder: "RF-" },
        { key: "orderId", label: "套餐单号", placeholder: "SUB-" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "type", label: "退款类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "冷静期退款", t: "冷静期退款" }, { v: "中途完结", t: "中途完结" }, { v: "押金退还", t: "押金退还" }, { v: "7天未使用退订", t: "7天未使用退订" }, { v: "单次未换电退订", t: "单次未换电退订" }] },
        { key: "status", label: "处理状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待审核", t: "待审核" }, { v: "已退款", t: "已退款" }, { v: "已驳回", t: "已驳回" }] },
        { key: "applyFrom", label: "申请日起", type: "date" },
        { key: "applyTo", label: "申请日止", type: "date" }
      ],
      leaseAgreements: [
        { key: "contractId", label: "协议编号", placeholder: "LC-" },
        { key: "party", label: "对方主体", placeholder: "承租/出租方名称" },
        { key: "status", label: "协议状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待确认", t: "待确认" }, { v: "变更待确认", t: "变更待确认" }, { v: "履约中", t: "履约中" }, { v: "已驳回", t: "已驳回" }] }
      ],
      leaseCollect: [
        { key: "month", label: "账期", placeholder: "2026-06" },
        { key: "lessee", label: "承租方", placeholder: "" },
        { key: "collectStatus", label: "收缴状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "已收缴", t: "已收缴" }, { v: "待收缴", t: "待收缴" }, { v: "待补缴", t: "待补缴" }, { v: "对公待确认", t: "对公待确认" }] }
      ],
      leaseRent: [
        { key: "month", label: "账单月", placeholder: "2026-06" },
        { key: "contractId", label: "协议编号", placeholder: "" }
      ],
      employees: [
        { key: "keyword", label: "姓名/手机", placeholder: "" },
        { key: "roleType", label: "类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "staff", t: "运营员工" }] },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "启用", t: "启用" }, { v: "停用", t: "停用" }] }
      ],
      dayPool_pools: [
        { key: "poolId", label: "额度池 ID", placeholder: "QP-" },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "使用中", t: "使用中" }, { v: "余额不足", t: "余额不足" }, { v: "待配置", t: "待配置" }, { v: "已到期", t: "已到期" }] }
      ],
      dayPool_teams: [
        { key: "keyword", label: "团队名称", placeholder: "" },
        { key: "poolId", label: "消耗额度池", type: "select", options: () => [{ v: "全部", t: "全部" }].concat(myDayPools().map(p => ({ v: p.id, t: p.name }))) }
      ],
      dayPool_rules: [
        { key: "poolId", label: "额度池", type: "select", options: () => [{ v: "全部", t: "全部额度池" }].concat(myDayPools().map(p => ({ v: p.id, t: p.name }))) },
        { key: "teamId", label: "团队", type: "select", options: () => [{ v: "全部", t: "全部团队" }].concat(myChannelTeams().map(t => ({ v: t.id, t: t.name }))) },
        { key: "status", label: "规则状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "启用", t: "启用" }, { v: "草稿", t: "草稿" }, { v: "停用", t: "停用" }] }
      ],
      dayPool_riders: [
        { key: "teamId", label: "团队", type: "select", options: () => [{ v: "全部", t: "全部团队" }].concat(myChannelTeams().map(t => ({ v: t.id, t: t.name }))) },
        { key: "keyword", label: "骑手手机/姓名", placeholder: "" },
        { key: "quotaStatus", label: "额度状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "使用中", t: "使用中" }, { v: "未分配", t: "未分配" }, { v: "已收回", t: "已收回" }] }
      ],
      dayPool_allocations: [
        { key: "poolId", label: "额度池", type: "select", options: () => [{ v: "全部", t: "全部" }].concat(myDayPools().map(p => ({ v: p.id, t: p.id }))) },
        { key: "riderId", label: "骑手 ID", placeholder: "U2101" },
        { key: "type", label: "操作类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "购买", t: "购买" }, { v: "分配", t: "分配" }, { v: "收回", t: "收回" }, { v: "消耗", t: "消耗" }] }
      ],
      dayPool_consume: [
        { key: "dateFrom", label: "日期起", type: "date" },
        { key: "dateTo", label: "日期止", type: "date" },
        { key: "teamId", label: "团队", type: "select", options: () => [{ v: "全部", t: "全部团队" }].concat(myChannelTeams().map(t => ({ v: t.id, t: t.name }))) }
      ],
      dayPool_retail: [
        { key: "city", label: "城市", type: "select", options: [{ v: "全部", t: "全部" }, { v: "上海", t: "上海" }] }
      ],
      dayPool_exceptions: [
        { key: "type", label: "异常类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "预占失败", t: "预占失败" }, { v: "支付退款待处理", t: "支付退款待处理" }, { v: "用户冲突", t: "用户冲突" }] },
        { key: "status", label: "处理状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待重试", t: "待重试" }, { v: "待处理", t: "待处理" }, { v: "已拒绝", t: "已拒绝" }] }
      ],
      dayPool_ledger: [
        { key: "poolId", label: "额度池", type: "select", options: () => [{ v: "全部", t: "全部" }].concat(myDayPools().map(p => ({ v: p.id, t: p.id }))) },
        { key: "type", label: "账本类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "购买入账", t: "购买入账" }, { v: "续费入账", t: "续费入账" }, { v: "充值", t: "充值" }, { v: "赠送入账", t: "赠送" }, { v: "退款", t: "退款" }, { v: "修正", t: "修正" }, { v: "分配出账", t: "分配出账" }, { v: "收回入账", t: "收回入账" }, { v: "用户资格预占", t: "预占" }, { v: "预占确认消耗", t: "确认消耗" }, { v: "预占释放", t: "释放" }, { v: "回池", t: "回池" }] }
      ],
      operators_list: [
        { key: "keyword", label: "名称/ID/联系人", placeholder: "OP-SX" },
        { key: "city", label: "城市", type: "select", options: [{ v: "全部", t: "全部" }, { v: "上海", t: "上海" }, { v: "杭州", t: "杭州" }] },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "在营", t: "在营" }, { v: "已停用", t: "已停用" }] }
      ],
      operators_withdrawReview: [
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待审核", t: "待审核" }, { v: "已提现", t: "已提现" }, { v: "已驳回", t: "已驳回" }] }
      ],
      operators_feeRate: [
        { key: "keyword", label: "运营商", placeholder: "OP-SX" },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "生效", t: "生效" }, { v: "停用", t: "停用" }] }
      ],
      l1Pricing_crossNet: [],
      l1Pricing_dayPrice: [],
      l1Pricing_sms: [
        { key: "keyword", label: "模板/手机/业务单", placeholder: "" }
      ],
      deviceBinding: [
        { key: "keyword", label: "设备 SN", placeholder: "CAB-" },
        { key: "type", label: "类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "cabinet", t: "换电柜" }, { v: "battery", t: "电池" }] }
      ],
      platformUsers_info: [
        { key: "keyword", label: "用户 ID/手机", placeholder: "U1028" },
        { key: "operatorId", label: "服务运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "userType", label: "用户类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "个人用户", t: "个人用户" }, { v: "渠道成员", t: "渠道成员" }] },
        { key: "userStatus", label: "用户状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "正常", t: "正常" }, { v: "冻结", t: "冻结" }, { v: "注销中", t: "注销中" }] },
        { key: "depositKind", label: "电池押金", type: "select", options: [
          { v: "全部", t: "全部" }, { v: "实付", t: "实付在押" }, { v: "信用免押", t: "信用免押" },
          { v: "渠道担保", t: "渠道担保" }, { v: "退押中", t: "退押中" }
        ] }
      ],
      platformUsers_depositStats: [
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() }
      ],
      platformOrders_package: [
        { key: "orderId", label: "套餐单号", placeholder: "SUB-" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "operatorId", label: "售卖运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "serviceState", label: "服务状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "服务中", t: "服务中" }, { v: "已冻结", t: "已冻结" }, { v: "中途完结", t: "中途完结" }, { v: "已完结", t: "已完结" }] }
      ],
      platformOrders_swap: [
        { key: "swapId", label: "换电单号", placeholder: "SW-" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "operatorId", label: "用户运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "成功", t: "成功" }, { v: "失败", t: "失败" }] }
      ],
      platformUsers_serviceChange: [
        { key: "scId", label: "申请单号", placeholder: "SC-" },
        { key: "orderId", label: "套餐单号", placeholder: "SUB-" },
        { key: "phone", label: "用户手机", placeholder: "" },
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "type", label: "变更类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "中途完结", t: "中途完结" }, { v: "冻结", t: "冻结" }, { v: "解冻", t: "解冻" }] },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待审核", t: "待审核" }, { v: "已生效", t: "已生效" }, { v: "待退款", t: "待退款" }, { v: "退款处理中", t: "退款处理中" }, { v: "已退款", t: "已退款" }] }
      ],
      platformOrders_channel: [
        { key: "orderId", label: "批发单号", placeholder: "PO-" },
        { key: "channelId", label: "渠道商", type: "select", options: () => [{ v: "全部", t: "全部" }].concat(platformChannels.map(c => ({ v: c.id, t: c.name }))) },
        { key: "payChannel", label: "支付渠道", type: "select", options: [{ v: "全部", t: "全部" }, { v: "online", t: "在线支付" }, { v: "offline", t: "线下支付" }] },
        { key: "orderStatus", label: "订单状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待支付", t: "待支付" }, { v: "支付中", t: "支付中" }, { v: "待确认到账", t: "待确认到账" }, { v: "已完成", t: "已完成" }] },
        { key: "payStatus", label: "支付状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待支付", t: "待支付" }, { v: "支付中", t: "支付中" }, { v: "待付款", t: "待付款（线下）" }, { v: "已付款", t: "已付款" }] }
      ],
      platformDevices_ledger: [
        { key: "keyword", label: "设备 SN", placeholder: "CAB-/BAT-" },
        { key: "type", label: "类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "cabinet", t: "换电柜" }, { v: "battery", t: "电池" }] },
        { key: "operatorId", label: "归属运营商", type: "select", options: () => platformOperatorOptions() }
      ],
      platformDevices_import: [],
      platformDevices_pending: [
        { key: "keyword", label: "设备 SN", placeholder: "CAB-" },
        { key: "type", label: "类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "cabinet", t: "换电柜" }, { v: "battery", t: "电池" }] }
      ],
      platformChannels_list: [
        { key: "keyword", label: "名称/ID/联系人", placeholder: "CH-SF" },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "在营", t: "在营" }, { v: "已停用", t: "已停用" }] }
      ],
      platformMarketing_campaigns: [
        { key: "keyword", label: "活动名称/ID", placeholder: "CMP-" },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "进行中", t: "进行中" }, { v: "已结束", t: "已结束" }, { v: "已停用", t: "已停用" }] }
      ],
      platformMarketing_agreements: [
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待确认", t: "待确认" }, { v: "已启用", t: "已启用" }, { v: "已停用", t: "已停用" }] }
      ],
      platformMarketing_links: [
        { key: "campaignId", label: "活动", type: "select", options: () => [{ v: "全部", t: "全部" }].concat(platformMarketingCampaigns.map(c => ({ v: c.id, t: c.name }))) },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "启用", t: "启用" }, { v: "停用", t: "停用" }] }
      ],
      platformMarketing_pending: [
        { key: "keyword", label: "订单/手机", placeholder: "PMO-" },
        { key: "activationStatus", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "服务中", t: "服务中" }, { v: "已退款", t: "已退款" }] }
      ],
      platformMarketing_settlements: [
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "month", label: "月份", placeholder: "2026-06" }
      ],
      platformMarketing_statements: [
        { key: "month", label: "月份", type: "select", options: () => [{ v: "全部", t: "全部" }, { v: "2026-06", t: "2026-06" }] },
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "status", label: "状态", type: "select", options: [{ v: "全部", t: "全部" }, { v: "待确认", t: "待确认" }, { v: "已确认", t: "已确认" }] }
      ],
      platformFlows_userPay: [
        { key: "orderId", label: "关联单号", placeholder: "" },
        { key: "flowType", label: "流水类型", type: "select", options: [{ v: "全部", t: "全部" }, { v: "套餐支付", t: "套餐支付" }, { v: "额度池采购", t: "额度池采购" }, { v: "额度池零售", t: "额度池零售" }, { v: "退款出款", t: "退款出款" }] },
        { key: "operatorId", label: "关联运营商", type: "select", options: () => platformOperatorOptions() }
      ],
      platformFlows_interOp: [
        { key: "operatorId", label: "运营商", type: "select", options: () => platformOperatorOptions() },
        { key: "dateFrom", label: "日期起", type: "date" },
        { key: "dateTo", label: "日期止", type: "date" }
      ],
      platformFlows_platformFee: [
        { key: "operatorId", label: "计提主体", type: "select", options: () => platformOperatorOptions() },
        { key: "trigger", label: "触发场景", type: "select", options: [{ v: "全部", t: "全部" }, { v: "确认消耗", t: "B 端确认消耗" }, { v: "支付成功", t: "C 端支付成功" }] }
      ],
      channelOrders: [
        { key: "payFrom", label: "支付日起", type: "date" },
        { key: "payTo", label: "支付日止", type: "date" },
        { key: "skuId", label: "套餐", type: "select", options: () => {
          const cid = isChannelRole() ? channelEntityId() : "CH-CARD";
          return [{ v: "全部", t: "全部套餐" }].concat(channelPackagesFor(cid).map(p => ({ v: p.skuId, t: p.name })));
        }},
        { key: "linkPurpose", label: "链接用途", placeholder: "模糊搜索" },
        { key: "phone", label: "用户手机", placeholder: "完整或后四位" }
      ],
      commissionStatement: [
        { key: "month", label: "统计月份", type: "select", options: () => {
          const cid = isChannelRole() ? channelEntityId() : "CH-CARD";
          const months = commissionMonthsForChannel(cid);
          return [{ v: "全部", t: "全部月份" }].concat(months.map(m => ({ v: m, t: m })));
        }}
      ],
      platformAccounts: [
        { key: "month", label: "统计月份", type: "select", options: () =>
          platformAccountMonthly.map(m => ({ v: m.month, t: m.month })).sort((a, b) => b.v.localeCompare(a.v))
        }
      ]
    };

    const PF_CONFIRM_KEYS = new Set(["users"]);

    function renderPageFilters() {
      const key = pfKey();
      let specs = PAGE_FILTER_SPECS[key];
      /* 总览：统计范围下沉到经营指标卡内，顶部不再展示 */
      if (key === "overview" && (isOperatorRole() || isPlatformRole())) specs = [];
      const box = document.querySelector("#pageFilters");
      if (!specs || !specs.length) {
        box.classList.remove("visible");
        box.innerHTML = "";
        return;
      }
      const f = getPf();
      const confirmBtn = PF_CONFIRM_KEYS.has(key)
        ? `<div class="field pf-actions"><label>&nbsp;</label><button type="button" class="btn primary" data-pf-confirm>确认筛选</button></div>`
        : "";
      box.innerHTML = specs.map(s => renderFilterField(s, f)).join("") + confirmBtn;
      box.classList.add("visible");
    }

    function applyPageFiltersFromDom() {
      const key = pfKey();
      const f = getPf();
      document.querySelectorAll("#pageFilters [data-pf-field]").forEach(el => {
        f[el.dataset.pfField] = el.value;
      });
      return f;
    }

    function filterPackageList(rows) {
      const f = getPf();
      return rows.filter(p => {
        if (!matchKw(p.id, f.orderId)) return false;
        if (!matchKw(p.phone, f.phone) && !matchKw(p.user, f.phone)) return false;
        if (f.status !== "全部" && p.status !== f.status) return false;
        if (f.serviceState !== "全部" && (p.serviceState || p.status) !== f.serviceState) return false;
        if (!matchDateStr(p.payTime, f.payFrom, f.payTo)) return false;
        return true;
      });
    }

    function filterSwapList(rows) {
      const f = getPf();
      return rows.filter(s => {
        if (!matchKw(s.id, f.swapId)) return false;
        if (!matchKw(s.phone, f.phone) && !matchKw(s.user, f.phone)) return false;
        if (f.status !== "全部" && s.status !== f.status) return false;
        if (f.entitlementType !== "全部" && (s.entitlementType || "个人套餐") !== f.entitlementType) return false;
        if (!matchDateStr(s.time, f.timeFrom, f.timeTo)) return false;
        return true;
      });
    }

    function filterServiceChanges(rows) {
      const f = getPf();
      return rows.filter(sc => {
        if (!matchKw(sc.subId, f.orderId)) return false;
        if (!matchKw(sc.phone, f.phone) && !matchKw(sc.user, f.phone)) return false;
        if (f.type && f.type !== "全部" && sc.type !== f.type) return false;
        if (f.status && f.status !== "全部" && sc.status !== f.status) return false;
        return true;
      });
    }

    function myRefundSettings() {
      const eid = currentEmployee() ? currentEmployee().entityId : currentEntity().id;
      if (!operatorRefundSettings[eid]) {
        operatorRefundSettings[eid] = {
          mode: "manual", depositRefundMode: "manual",
          coolingPeriodDays: 3, coolingPeriodEnabled: true, coolingDefaultAudit: true,
          updatedAt: new Date().toISOString().slice(0, 10), updatedBy: entityNameById(eid)
        };
      }
      const s = operatorRefundSettings[eid];
      if (s.coolingPeriodDays == null) s.coolingPeriodDays = 3;
      if (s.coolingPeriodEnabled == null) s.coolingPeriodEnabled = true;
      if (s.coolingDefaultAudit == null) s.coolingDefaultAudit = true;
      if (!s.depositRefundMode) s.depositRefundMode = "manual";
      return s;
    }

    function isDepositOnlyRefund(rf) {
      return !!(rf && (rf.depositOnly || rf.type === "押金退还"));
    }

    /** 套餐退款对应的平台 C 端 1% 冲正退还额（押金退还为 0） */
    function platformFeeRefundOf(rf) {
      if (!rf || isDepositOnlyRefund(rf)) return 0;
      if (rf.platformFeeRefund != null) return rf.platformFeeRefund;
      if (rf.platformFeeNonRefund != null) return rf.platformFeeNonRefund;
      const pkg = Number(rf.pkgRefund) || 0;
      return Math.round(pkg * 0.01 * 100) / 100;
    }

    function myPersonalDepositSettings() {
      const eid = currentEmployee() ? currentEmployee().entityId : currentEntity().id;
      if (!operatorPersonalDepositSettings[eid]) {
        operatorPersonalDepositSettings[eid] = {
          amount: 99, enabled: true, scope: "个人套餐",
          note: "信用不足时实缴；达标免押则实收 ¥0",
          updatedAt: new Date().toISOString().slice(0, 10),
          updatedBy: entityNameById(eid)
        };
      }
      const s = operatorPersonalDepositSettings[eid];
      if (s.amount == null || Number.isNaN(Number(s.amount))) s.amount = 99;
      if (s.enabled == null) s.enabled = true;
      if (!s.scope) s.scope = "个人套餐";
      return s;
    }

    function personalDepositAmountForOperator(operatorId) {
      const s = operatorPersonalDepositSettings[operatorId] || myPersonalDepositSettings();
      if (s.enabled === false) return 0;
      return Number(s.amount) || 0;
    }

    function applyRefundApproval(rf, pkgRefund, depositRefund, note) {
      rf.pkgRefund = pkgRefund;
      rf.depositRefund = depositRefund || 0;
      rf.totalRefund = Math.round((pkgRefund + (depositRefund || 0)) * 100) / 100;
      if (note) rf.operatorNote = note;
      rf.status = "已退款";
      rf.processedTime = new Date().toISOString().slice(0, 16).replace("T", " ");
      rf.processedBy = currentEmployee()?.name || currentEntity().name;
      rf.processMode = "manual";
      const sc = serviceChangeRequests.find(x => x.id === rf.scId);
      if (sc) sc.status = "已退款";
      const p = packageOrders.find(x => x.id === rf.orderId);
      if (!p) return;
      if (isDepositOnlyRefund(rf)) {
        p.depositPaid = 0;
        p.depositRefundedAt = rf.processedTime;
        p.depositRefundStatus = "已退款";
        return;
      }
      p.status = "中途完结";
      p.serviceState = "中途完结";
      p.refundStatus = "已退款";
      if ((depositRefund || 0) > 0) {
        p.depositPaid = 0;
        p.depositRefundedAt = rf.processedTime;
        p.depositRefundStatus = "已退款";
      }
    }

    function promptApproveRefund(rfId) {
      const rf = refundRequests.find(x => x.id === rfId);
      if (!rf || rf.status !== "待审核") return;
      if (!canAuditRefund()) return;
      if (isDepositOnlyRefund(rf)) {
        openProtoForm({
          title: "确认押金退还",
          fields: [
            { name: "depositRefund", label: "退押金（元）", value: String(rf.depositRefund || 0) },
            { name: "note", label: "审核说明（可选）", value: rf.operatorNote || "" }
          ],
          submitLabel: "确认退押",
          onSubmit: (data) => {
            const dep = parseFloat(data.depositRefund);
            if (Number.isNaN(dep) || dep < 0) return "请填写有效押金退款金额";
            applyRefundApproval(rf, 0, dep || 0, (data.note || "").trim());
            return { successMessage: "已确认退押 ¥" + rf.totalRefund + "，系统将原路执行；套餐服务不受影响", afterClose: () => render() };
          }
        });
        return;
      }
      if (rf.coolingPeriod || rf.type === "冷静期退款") {
        openProtoForm({
          title: "确认冷静期退款",
          fields: [
            { name: "pkgRefund", label: "退套餐费（元）", value: String(rf.suggestedRefund ?? rf.pkgRefund) },
            { name: "depositRefund", label: "退押金（元）", value: String(rf.depositRefund || 0) },
            { name: "note", label: "调整说明（可选）", value: rf.operatorNote || "" }
          ],
          submitLabel: "确认退款",
          onSubmit: (data) => {
            const pkg = parseFloat(data.pkgRefund);
            const dep = parseFloat(data.depositRefund);
            if (Number.isNaN(pkg) || pkg < 0) return "请填写有效套餐退款金额";
            if (Number.isNaN(dep) || dep < 0) return "请填写有效押金退款金额";
            applyRefundApproval(rf, pkg, dep || 0, (data.note || "").trim());
            return { successMessage: "已确认退款 ¥" + rf.totalRefund + "，系统将原路执行", afterClose: () => render() };
          }
        });
        return;
      }
      applyRefundApproval(rf, rf.pkgRefund, rf.depositRefund, null);
      render();
    }

    function myRefundRequests() {
      const eid = currentEmployee() ? currentEmployee().entityId : currentEntity().id;
      return refundRequests.filter(r => r.operatorId === eid);
    }

    function pendingRefundCount() {
      return myRefundRequests().filter(r => r.status === "待审核").length;
    }

    function canAuditRefund() {
      return isEntityLogin() || employeeHasPerm("refunds.audit");
    }

    function filterRefundRequests(rows) {
      const f = getPf();
      return rows.filter(r => {
        if (!matchKw(r.id, f.refundId)) return false;
        if (!matchKw(r.orderId, f.orderId)) return false;
        if (!matchKw(r.phone, f.phone) && !matchKw(r.user, f.phone)) return false;
        if (f.type && f.type !== "全部" && r.type !== f.type) return false;
        if (f.status && f.status !== "全部" && r.status !== f.status) return false;
        if (!matchDateStr(r.applyTime, f.applyFrom, f.applyTo)) return false;
        return true;
      });
    }

    function filterFundReceipts(rows) {
      const f = getPf();
      return rows.filter(r => {
        if (!matchKw(r.order, f.orderId)) return false;
        if (f.flowType !== "全部" && r.type !== f.flowType) return false;
        if (!matchDateStr(r.time, f.timeFrom, f.timeTo)) return false;
        return true;
      });
    }

    function isLeasingRole() {
      return state.role === "leasing";
    }

    function ownershipCell(row) {
      if (row.ownership === "租赁") {
        const cid = row.leaseContractId
          ? `<button type="button" class="link-btn" data-open-lease="${row.leaseContractId}">${row.leaseContractId}</button>`
          : "—";
        return `${tag("租赁")}<br><small style="color:var(--muted)">出租 ${row.lessorName || "—"}</small><br>${cid}`;
      }
      return tag(row.ownership || "自有");
    }

    function myLeaseContracts() {
      const eid = currentEntity().id;
      if (isLeasingRole()) return leaseContracts.filter(c => c.lessorId === eid);
      return leaseContracts.filter(c => c.lesseeId === eid);
    }

    function myLeasedDevices() {
      const eid = currentEntity().id;
      if (isLeasingRole()) {
        const sns = new Set(leaseContracts.filter(c => c.lessorId === eid).flatMap(c => contractDevices(c)));
        return [...cabinets.filter(c => sns.has(c.sn)), ...batteries.filter(b => sns.has(b.sn))].map(d => ({
          sn: d.sn, type: d.slots != null ? "换电柜" : "电池", site: d.site, city: d.city,
          lesseeId: findContractBySn(d.sn)?.lesseeId,
          lesseeName: findContractBySn(d.sn)?.lesseeName,
          contractId: d.leaseContractId || findContractBySn(d.sn)?.id,
          listId: findContractBySn(d.sn)?.deviceListId,
          status: "在租"
        }));
      }
      const leased = [...cabinets, ...batteries].filter(d => d.deviceOwnerId === eid && d.ownership === "租赁");
      return leased.map(d => ({
        sn: d.sn, type: d.slots != null ? "换电柜" : "电池", site: d.site, city: d.city,
        lessorName: d.lessorName, contractId: d.leaseContractId, status: "在租"
      }));
    }

    function repayProgress(contract) {
      if (contract.termType === "滚动租期" || !contract.periods) {
        return { pct: Math.min(100, contract.paidPeriods * 8), label: `滚动租期 · 已付 ${contract.paidPeriods} 期 · ¥${contract.paidRent.toLocaleString("zh-CN")}` };
      }
      const pct = contract.periods ? Math.round(contract.paidPeriods / contract.periods * 100) : 0;
      return { pct, label: `已还 ${contract.paidPeriods}/${contract.periods} 期 · ¥${contract.paidRent.toLocaleString("zh-CN")} / ¥${contract.totalRent.toLocaleString("zh-CN")}` };
    }

    function leaseTermLabel(c) {
      if (c.termType === "滚动租期") {
        return `滚动 · ${c.start} 起 · 提前 ${c.noticeDays || 30} 天通知终止`;
      }
      return `${c.start} 至 ${c.end}`;
    }

    function pendingLeaseConfirmCount() {
      if (!isOperatorRole()) return 0;
      return leaseContracts.filter(c => c.lesseeId === currentEntity().id && (c.status === "待确认" || c.status === "变更待确认")).length;
    }

    function finYuan(n) {
      return "¥" + (n || 0).toLocaleString("zh-CN");
    }

    function operatorClearedBalance(operatorId) {
      return packageOrders
        .filter(p => p.deviceOwnerId === operatorId && p.payout === "已清分")
        .reduce((s, p) => s + (p.accrued || 0), 0);
    }

    function operatorWithdrawnTotal(operatorId) {
      return operatorWithdrawalRequests
        .filter(w => w.operatorId === operatorId && w.status === "已提现")
        .reduce((s, w) => s + w.amount, 0);
    }

    function operatorPendingWithdrawTotal(operatorId) {
      return operatorWithdrawalRequests
        .filter(w => w.operatorId === operatorId && ["待审核", "审核通过", "处理中"].includes(w.status))
        .reduce((s, w) => s + w.amount, 0);
    }

    function pendingOperatorWithdrawReviewCount() {
      return operatorWithdrawalRequests.filter(w => w.status === "待审核").length;
    }

    function operatorFinanceMonthDue(operatorId, month) {
      const m = month || "2026-06";
      const appIds = new Set(financeApplications.filter(a => a.operatorId === operatorId).map(a => a.id));
      return financeRepaymentSchedules
        .filter(s => appIds.has(s.applicationId) && s.dueDate.startsWith(m) && s.status !== "已还清")
        .reduce((x, s) => x + s.dueAmount - (s.paidAmount || 0), 0);
    }

    function operatorWithdrawableBalance(operatorId) {
      const cleared = operatorClearedBalance(operatorId);
      const withdrawn = operatorWithdrawnTotal(operatorId);
      const pending = operatorPendingWithdrawTotal(operatorId);
      const monthDue = operatorFinanceMonthDue(operatorId);
      return Math.max(0, +(cleared - withdrawn - pending - monthDue).toFixed(2));
    }

    function operatorDefaultWithdrawAccount(operatorId) {
      const rows = paymentAccounts.filter(a => a.entityId === operatorId && a.accountScope === "c_end" && (a.status === "已开通" || a.status === "已绑定"));
      return rows.find(a => a.default) || rows[0] || null;
    }

    function myOperatorWithdrawals() {
      if (!isOperatorRole()) return [];
      return operatorWithdrawalRequests.filter(w => w.operatorId === currentEntity().id);
    }

    function openApplyWithdrawForm() {
      const opId = currentEntity().id;
      const avail = operatorWithdrawableBalance(opId);
      const acct = operatorDefaultWithdrawAccount(opId);
      const monthDue = operatorFinanceMonthDue(opId);
      if (!acct) { showProtoToast("请先在收款账户绑定默认子商户"); return; }
      if (avail <= 0) { showProtoToast("可提现余额不足（已扣除本月融资待还 ¥" + monthDue.toLocaleString("zh-CN") + "）"); return; }
      if (myOperatorWithdrawals().some(w => w.status === "待审核")) { showProtoToast("已有待审核申请"); return; }
      openProtoForm({
        title: "发起提现申请",
        fields: [
          { name: "amount", label: "提现金额（元）", type: "number", value: String(Math.min(avail, 500).toFixed(2)) },
          { name: "accountId", label: "到账账户", type: "select", options: [acct.id], optionLabels: { [acct.id]: acct.channel + " · " + acct.mchNo }, value: acct.id }
        ],
        submitLabel: "提交申请",
        onSubmit: (data) => {
          const amount = parseFloat(data.amount);
          if (!Number.isFinite(amount) || amount <= 0) return "请输入有效金额";
          if (amount > avail + 0.009) return "不得超过可提现余额 ¥" + avail.toFixed(2);
          operatorWithdrawalRequests.unshift({
            id: "WD-" + Date.now().toString().slice(-6), operatorId: opId, amount,
            applyTime: new Date().toISOString().slice(0, 16).replace("T", " "),
            reviewTime: null, reviewedBy: null, status: "待审核", withdrawTime: null,
            accountId: acct.id, accountLabel: acct.channel + " · " + acct.mchNo,
            monthDueReserved: monthDue, rejectReason: null
          });
          return { successMessage: "已提交 · 等待平台审核后打款", afterClose: () => render() };
        }
      });
    }

    function approveOperatorWithdraw(withdrawId) {
      const w = operatorWithdrawalRequests.find(x => x.id === withdrawId);
      if (!w || w.status !== "待审核") return;
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      w.status = "已提现";
      w.reviewTime = now;
      w.reviewedBy = currentEmployee()?.name || "平台管理员";
      w.withdrawTime = now;
      showProtoToast("已通过 · 已发起提现至 " + w.accountLabel);
      render();
    }

    function rejectOperatorWithdraw(withdrawId, reason) {
      const w = operatorWithdrawalRequests.find(x => x.id === withdrawId);
      if (!w || w.status !== "待审核") return;
      const now = new Date().toISOString().slice(0, 16).replace("T", " ");
      w.status = "已驳回";
      w.reviewTime = now;
      w.reviewedBy = currentEmployee()?.name || "平台管理员";
      w.rejectReason = (reason || "").trim() || "不符合提现条件";
      showProtoToast("已驳回");
      render();
    }

    function myFinanceProjects() {
      const oid = currentEntity().id;
      if (isLeasingRole()) return financeProjects.filter(p => p.financierId === oid);
      if (isOperatorRole()) return financeProjects.filter(p => p.operatorId === oid);
      return financeProjects;
    }

    function myFinanceApplications() {
      const eid = currentEntity().id;
      if (isLeasingRole()) return financeApplications.filter(a => a.financierId === eid);
      if (isOperatorRole()) return financeApplications.filter(a => a.operatorId === eid);
      return financeApplications;
    }

    function myFinanceAssets() {
      const oid = isOperatorRole() ? currentEntity().id : null;
      return oid ? financeAssets.filter(a => a.operatorId === oid) : financeAssets;
    }

    function financePackageById(id) {
      return financeAssetPackages.find(p => p.id === id);
    }

    function myFinancePackages() {
      const oid = currentEntity().id;
      return financeAssetPackages.filter(p => p.operatorId === oid).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }

    function isFinanceAssetSelectable(sn, excludePackageId) {
      const a = financeAssets.find(x => x.sn === sn);
      if (!a) return false;
      if (!["可融资"].includes(a.status)) return false;
      if (a.appId) return false;
      if (a.packageId && a.packageId !== excludePackageId) {
        const pkg = financePackageById(a.packageId);
        if (pkg && pkg.status !== "已作废") return false;
      }
      return true;
    }

    function releasePackageAssets(pkg) {
      (pkg.assetSns || []).forEach(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        if (a && a.packageId === pkg.id && !a.appId) {
          a.packageId = null;
          if (a.status === "包内占选") a.status = "可融资";
        }
      });
    }

    function assignPackageAssets(pkg, sns) {
      releasePackageAssets(pkg);
      pkg.assetSns = [...sns];
      const proj = financeProjectById(pkg.projectId);
      pkg.refAmount = sns.length * (proj?.unitRef || 15000);
      const sites = [...new Set(sns.map(sn => financeAssets.find(x => x.sn === sn)?.site).filter(Boolean))];
      pkg.regionSummary = sites.length ? `华东 · 上海 · ${sites.length} 站` : "—";
      sns.forEach(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        if (a) { a.packageId = pkg.id; a.status = "包内占选"; }
      });
      pkg.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
    }

    function createFinancePackage(name, projectId) {
      const proj = financeProjectById(projectId);
      if (!proj) return null;
      const id = "FAP-" + Date.now().toString().slice(-6);
      const pkg = {
        id, operatorId: currentEntity().id, projectId, financierId: proj.financierId,
        name: name || "新资产包", status: "草稿", applicationId: null, assetSns: [], refAmount: 0,
        regionSummary: "—", remark: "", createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
        updatedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
      };
      financeAssetPackages.unshift(pkg);
      return pkg;
    }

    function createFinanceAppFromPackage(packageId) {
      const pkg = financePackageById(packageId);
      if (!pkg || pkg.status !== "草稿" || !pkg.assetSns.length) return "请先为资产包选择至少一台设备";
      if (pkg.applicationId) return "该资产包已生成批次";
      const proj = financeProjectById(pkg.projectId);
      const month = "2026-06";
      const batchNo = financeApplications.filter(a => a.month === month && a.operatorId === pkg.operatorId).length + 1;
      const appId = `FDA-${month.replace("-", "")}-0${batchNo}`;
      const prePlanId = `FPR-${month.replace("-", "")}-0${batchNo}-v1`;
      const refAmount = pkg.refAmount || pkg.assetSns.length * (proj?.unitRef || 15000);
      financeApplications.unshift({
        id: appId, operatorId: pkg.operatorId, projectId: pkg.projectId, financierId: pkg.financierId, packageId: pkg.id,
        month, batchNo, status: "草稿", requestedAmount: refAmount, refAmount,
        assetSns: [...pkg.assetSns], regionSummary: pkg.regionSummary,
        submittedAt: null, confirmedAt: null, confirmedAmount: null, confirmNote: null,
        prePlanId, loanNoteId: null, createdAt: new Date().toISOString().slice(0, 16).replace("T", " ")
      });
      financePrePlans.push({
        id: prePlanId, applicationId: appId, version: 1, status: "草稿",
        lines: [
          { term: 1, dueDate: "2026-07-15", principal: Math.round(refAmount / 2), rent: 800, serviceFee: 0 },
          { term: 2, dueDate: "2026-08-15", principal: refAmount - Math.round(refAmount / 2), rent: 750, serviceFee: 0 }
        ]
      });
      pkg.applicationId = appId;
      pkg.status = "已生成批次";
      pkg.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      state.financeSelectedAppId = appId;
      state.financeTab = "ledger";
      return null;
    }

    function financePackageAssetTable(sns) {
      return (sns || []).map(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        return `<tr>
          <td><strong>${sn}</strong></td><td>${a?.type || "—"}</td><td>${a?.site || "—"}</td>
          <td>${a?.users ?? "—"}</td><td>${a?.cabinetEff != null ? Math.round(a.cabinetEff * 100) + "%" : "—"}</td>
          <td>${a?.income30d != null ? finYuan(a.income30d) : "—"}</td>
          <td>${a ? tag(a.status) : "—"}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="7">暂无设备</td></tr>`;
    }

    function financeApprovalTimeline(app) {
      const steps = [
        { key: "create", label: "创建批次", done: true, time: app.createdAt },
        { key: "submit", label: "提交资方", done: !!app.submittedAt, time: app.submittedAt },
        { key: "diligence", label: "尽调审查", done: app.status === "尽调通过" || app.status === "已放款", time: app.diligenceAt, fail: app.status === "已驳回" },
        { key: "fund", label: "登记放款", done: app.status === "已放款", time: app.fundedAt }
      ];
      return `<div class="finance-timeline">${steps.map(s => {
        const cls = s.fail ? "fail" : s.done ? "done" : "";
        return `<div class="finance-timeline-step ${cls}"><span class="dot"></span><div><strong>${s.label}</strong><br><small>${s.time || (s.fail ? "已驳回" : "待处理")}</small></div></div>`;
      }).join("")}</div>`;
    }

    function openFinancePackageEditor(packageId) {
      const pkg = packageId ? financePackageById(packageId) : null;
      const isNew = !pkg;
      const projects = myFinanceProjects();
      const projectId = pkg?.projectId || projects[0]?.id;
      const selectable = myFinanceAssets().filter(a => isFinanceAssetSelectable(a.sn, pkg?.id));
      const selected = new Set(pkg?.assetSns || []);
      const checkRows = [...selectable, ...myFinanceAssets().filter(a => selected.has(a.sn))].filter((a, i, arr) => arr.findIndex(x => x.sn === a.sn) === i)
        .map(a => {
          const locked = !isFinanceAssetSelectable(a.sn, pkg?.id) && !selected.has(a.sn);
          return `<label style="display:flex;align-items:center;gap:8px;padding:6px 0;${locked ? "opacity:.45" : ""}">
            <input type="checkbox" name="pkgAsset" value="${a.sn}" ${selected.has(a.sn) ? "checked" : ""} ${locked ? "disabled" : ""}>
            <span><strong>${a.sn}</strong> · ${a.type} · ${a.site} ${locked ? `<small style="color:var(--red)">（已被 ${a.packageId || a.appId} 占用）</small>` : ""}</span>
          </label>`;
        }).join("") || `<p style="color:var(--muted)">暂无可选资产，请先在资产池确认可融资设备。</p>`;
      document.querySelector("#drawerTitle").textContent = isNew ? "新建资产包" : "编辑资产包 · " + pkg.name;
      document.querySelector("#drawerBody").innerHTML = `
        <form id="financePackageForm" class="form-grid">
          <label>资产包名称<input name="name" value="${pkg?.name || ""}" required placeholder="如：浦东站 6 月首批"></label>
          <label>授信项目<select name="projectId" ${pkg?.status && pkg.status !== "草稿" ? "disabled" : ""}>
            ${projects.map(p => `<option value="${p.id}"${p.id === projectId ? " selected" : ""}>${p.name}</option>`).join("")}
          </select></label>
          <label style="grid-column:1/-1">备注<textarea name="remark" rows="2">${pkg?.remark || ""}</textarea></label>
          <fieldset style="grid-column:1/-1;border:1px solid var(--line);border-radius:8px;padding:12px">
            <legend style="font-size:13px;color:var(--muted)">选择资产 ${noteBtn("finance_asset_exclusion")}</legend>
            ${checkRows}
          </fieldset>
        </form>
        <div class="form-actions" style="margin-top:12px">
          <button type="button" class="btn" id="cancelFinancePackage">取消</button>
          <button type="button" class="btn primary" id="saveFinancePackage" data-pkg-id="${pkg?.id || ""}">保存</button>
        </div>`;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      document.querySelector("#cancelFinancePackage").onclick = closeDrawer;
      document.querySelector("#saveFinancePackage").onclick = () => {
        const form = document.querySelector("#financePackageForm");
        const fd = new FormData(form);
        const name = (fd.get("name") || "").trim();
        if (!name) { showProtoToast("请填写资产包名称"); return; }
        const pid = fd.get("projectId");
        const sns = fd.getAll("pkgAsset");
        let target = pkg;
        if (isNew) {
          target = createFinancePackage(name, pid);
          if (!target) return;
        } else {
          target.name = name;
          target.remark = (fd.get("remark") || "").trim();
          if (target.status === "草稿") target.projectId = pid;
        }
        assignPackageAssets(target, sns);
        closeDrawer();
        state.financeSelectedPackageId = target.id;
        state.financeTab = "packages";
        render();
        showProtoToast("资产包已保存");
      };
    }

    function financeProjectById(id) {
      return financeProjects.find(p => p.id === id);
    }

    function financePrePlanById(id) {
      return financePrePlans.find(p => p.id === id);
    }

    function financeAppById(id) {
      return financeApplications.find(a => a.id === id);
    }

    function financeLoanNoteByApp(appId) {
      const app = financeAppById(appId);
      return app?.loanNoteId ? financeLoanNotes.find(n => n.id === app.loanNoteId) : null;
    }

    function pendingFinanceDrawdownCount() {
      if (!isLeasingRole()) return 0;
      return financeApplications.filter(a => a.financierId === currentEntity().id && a.status === "已提交资方").length;
    }

    function operatorCreditByIds(operatorId, financierId) {
      return financeOperatorCredits.find(c => c.operatorId === operatorId && c.financierId === financierId);
    }

    function operatorCreditSummary(operatorId, financierId) {
      const oc = operatorCreditByIds(operatorId, financierId);
      const apps = financeApplications.filter(a => a.operatorId === operatorId && a.financierId === financierId);
      const pending = apps.filter(a => a.status === "已提交资方" || a.status === "尽调通过")
        .reduce((s, a) => s + (a.confirmedAmount || a.requestedAmount), 0);
      if (!oc) {
        const limit = financeProjects.filter(p => p.operatorId === operatorId && p.financierId === financierId).reduce((s, p) => s + p.creditLimit, 0);
        const used = financeProjects.filter(p => p.operatorId === operatorId && p.financierId === financierId).reduce((s, p) => s + (p.usedAmount || 0), 0);
        return { limit, used, pending, available: Math.max(0, limit - used - pending), revolving: false };
      }
      if (oc.pendingAmount !== pending) oc.pendingAmount = pending;
      const available = Math.max(0, oc.totalLimit - oc.usedAmount - pending);
      return { limit: oc.totalLimit, used: oc.usedAmount, pending, available, revolving: oc.revolving, record: oc };
    }

    function syncOperatorCreditPending(operatorId, financierId) {
      const sum = operatorCreditSummary(operatorId, financierId);
      const oc = operatorCreditByIds(operatorId, financierId);
      if (oc) oc.pendingAmount = sum.pending;
      financeProjects.filter(p => p.operatorId === operatorId && p.financierId === financierId)
        .forEach(p => { p.pendingAmount = sum.pending; });
    }

    function projectCreditSummary(projectId) {
      const p = financeProjectById(projectId);
      if (!p) return { limit: 0, used: 0, pending: 0, available: 0, revolving: false };
      return operatorCreditSummary(p.operatorId, p.financierId);
    }

    function agreementByApp(appId) {
      return financeAgreements.find(a => a.applicationId === appId);
    }

    function submitFinanceApplication(appId) {
      const app = financeAppById(appId);
      if (!app || app.status !== "草稿") return;
      app.status = "已提交资方";
      app.submittedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      app.assetSns.forEach(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        if (a) { a.status = "申请锁定"; a.appId = app.id; }
      });
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      if (pkg) { pkg.status = "已提交"; pkg.updatedAt = app.submittedAt; }
      const plan = financePrePlanById(app.prePlanId);
      if (plan) plan.status = "待确认";
      syncOperatorCreditPending(app.operatorId, app.financierId);
    }

    function confirmFinanceApplication(appId, amount, note) {
      const app = financeAppById(appId);
      if (!app || app.status !== "已提交资方") return;
      app.status = "尽调通过";
      app.diligenceAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      app.confirmedAmount = amount || app.requestedAmount;
      app.confirmNote = note || "尽调通过";
      const plan = financePrePlanById(app.prePlanId);
      if (plan) plan.status = "已确认";
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      if (pkg) { pkg.status = "尽调通过"; pkg.updatedAt = app.diligenceAt; }
      syncOperatorCreditPending(app.operatorId, app.financierId);
    }

    function rejectFinanceApplication(appId, reason) {
      const app = financeAppById(appId);
      if (!app || app.status !== "已提交资方") return;
      app.status = "已驳回";
      app.rejectReason = reason || "尽调驳回";
      app.diligenceAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      app.assetSns.forEach(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        if (a && a.appId === app.id) {
          a.appId = null;
          a.status = a.packageId ? "包内占选" : "可融资";
        }
      });
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      if (pkg) { pkg.status = "已生成批次"; pkg.updatedAt = app.diligenceAt; }
      const plan = financePrePlanById(app.prePlanId);
      if (plan) plan.status = "草稿";
      syncOperatorCreditPending(app.operatorId, app.financierId);
    }

    function fundFinanceApplication(appId) {
      const app = financeAppById(appId);
      if (!app || app.status !== "尽调通过") return;
      if (!isLeasingRole()) { showProtoToast("登记放款仅资方可操作"); return; }
      const noteId = "LN-" + Date.now().toString().slice(-6);
      const plan = financePrePlanById(app.prePlanId);
      app.fundedAt = new Date().toISOString().slice(0, 10);
      const agrId = "FLA-" + app.fundedAt.replace(/-/g, "") + String(app.batchNo).padStart(2, "0");
      app.status = "已放款";
      app.loanNoteId = noteId;
      app.agreementId = agrId;
      financeLoanNotes.push({
        id: noteId, applicationId: app.id, operatorId: app.operatorId, financierId: app.financierId,
        projectId: app.projectId, noteNo: "HZ" + app.fundedAt.replace(/-/g, "") + "001",
        amount: app.confirmedAmount || app.requestedAmount, fundDate: app.fundedAt,
        startDate: app.fundedAt, endDate: plan?.lines?.slice(-1)[0]?.dueDate || app.fundedAt,
        termMonths: plan?.lines?.length || 1, rate: "6.5%", contractNo: "FLC-" + app.id
      });
      (plan?.lines || []).forEach((ln, i) => {
        const due = ln.principal + ln.rent + (ln.serviceFee || 0);
        financeRepaymentSchedules.push({
          id: "FRS-" + noteId + "-" + (i + 1), loanNoteId: noteId, applicationId: app.id,
          term: ln.term, dueDate: ln.dueDate, principal: ln.principal, rent: ln.rent, serviceFee: ln.serviceFee || 0,
          dueAmount: due, paidAmount: 0, status: "待还"
        });
      });
      app.assetSns.forEach(sn => {
        const a = financeAssets.find(x => x.sn === sn);
        if (a) { a.status = "已融资"; a.loanNoteId = noteId; }
      });
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      if (pkg) { pkg.status = "已放款"; pkg.updatedAt = app.fundedAt; }
      financeAgreements.push({
        id: agrId, agreementNo: "FLA-" + app.fundedAt.replace(/-/g, "") + String(app.batchNo).padStart(3, "0"),
        operatorId: app.operatorId, financierId: app.financierId, projectId: app.projectId,
        applicationId: app.id, loanNoteId: noteId, deviceSns: [...app.assetSns],
        status: "履约中", signedAt: app.fundedAt, remark: "登记放款生成 · 一协议一还款计划"
      });
      const oc = operatorCreditByIds(app.operatorId, app.financierId);
      const proj = financeProjectById(app.projectId);
      const amt = app.confirmedAmount || app.requestedAmount;
      if (oc) {
        oc.usedAmount = (oc.usedAmount || 0) + amt;
        oc.pendingAmount = Math.max(0, (oc.pendingAmount || 0) - amt);
      }
      if (proj) {
        proj.usedAmount = (proj.usedAmount || 0) + amt;
        proj.pendingAmount = Math.max(0, (proj.pendingAmount || 0) - amt);
      }
      if (plan) plan.status = "已固化";
    }

    function tryReleaseRevolvingCredit(loanNoteId) {
      const note = financeLoanNotes.find(n => n.id === loanNoteId);
      if (!note) return;
      const scheds = financeRepaymentSchedules.filter(s => s.loanNoteId === loanNoteId);
      if (!scheds.length || !scheds.every(s => s.status === "已还清")) return;
      const oc = operatorCreditByIds(note.operatorId, note.financierId);
      const proj = financeProjectById(note.projectId);
      if (!oc?.revolving && !proj?.revolving) return;
      if (oc) oc.usedAmount = Math.max(0, (oc.usedAmount || 0) - note.amount);
      if (proj) proj.usedAmount = Math.max(0, (proj.usedAmount || 0) - note.amount);
    }

    function registerFinanceRepayment(scheduleId, amount) {
      const row = financeRepaymentSchedules.find(s => s.id === scheduleId);
      if (!row) return;
      row.paidAmount = Math.min(row.dueAmount, (row.paidAmount || 0) + amount);
      row.status = row.paidAmount >= row.dueAmount ? "已还清" : "部分已还";
      tryReleaseRevolvingCredit(row.loanNoteId);
    }

    function submitFinanceRepaymentTicket(scheduleId, amount, payMethod, voucherNote) {
      const row = financeRepaymentSchedules.find(s => s.id === scheduleId);
      if (!row || amount <= 0) return "无效还款";
      const app = financeAppById(row.applicationId);
      const id = "RT-" + Date.now().toString().slice(-6);
      financeRepaymentTickets.unshift({
        id, scheduleId, applicationId: row.applicationId, operatorId: app?.operatorId || currentEntity().id,
        financierId: app?.financierId, amount, payMethod: payMethod || "对公转账",
        voucherNote: voucherNote || "", status: "待确认",
        submittedAt: new Date().toISOString().slice(0, 16).replace("T", " "), confirmedAt: null, confirmedBy: null
      });
      return null;
    }

    function confirmFinanceRepaymentTicket(ticketId) {
      const t = financeRepaymentTickets.find(x => x.id === ticketId);
      if (!t || t.status !== "待确认") return;
      registerFinanceRepayment(t.scheduleId, t.amount);
      t.status = "已确认";
      t.confirmedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
      t.confirmedBy = currentEmployee()?.name || currentEntity().name;
    }

    function replaceFinanceAsset(oldSn, newSn, reason) {
      const oldA = financeAssets.find(a => a.sn === oldSn);
      const newA = financeAssets.find(a => a.sn === newSn);
      if (!oldA || !newA) return "SN 不存在";
      if (newA.status !== "可融资") return "新 SN 须为可融资状态";
      const pkgId = oldA.packageId;
      const appId = oldA.appId;
      const inherit = { packageId: pkgId, appId, loanNoteId: oldA.loanNoteId, status: oldA.status };
      oldA.status = "已替换";
      oldA.packageId = null;
      oldA.appId = null;
      oldA.loanNoteId = null;
      Object.assign(newA, inherit);
      if (pkgId) {
        const pkg = financePackageById(pkgId);
        if (pkg) pkg.assetSns = pkg.assetSns.map(s => s === oldSn ? newSn : s);
      }
      const app = appId ? financeAppById(appId) : financeApplications.find(a => a.assetSns.includes(oldSn));
      if (app) app.assetSns = app.assetSns.map(s => s === oldSn ? newSn : s);
      const agr = financeAgreements.find(a => a.deviceSns.includes(oldSn));
      if (agr) agr.deviceSns = agr.deviceSns.map(s => s === oldSn ? newSn : s);
      financeAssetReplacements.unshift({
        id: "FAR-" + Date.now().toString().slice(-4), oldSn, newSn,
        reason: reason || "坏件更换", replacedAt: new Date().toISOString().slice(0, 10),
        operatorId: currentEntity().id, by: currentEmployee()?.name || currentEntity().name
      });
      return null;
    }

    function confirmLeaseContract(contractId) {
      const c = leaseContracts.find(x => x.id === contractId);
      if (!c || c.lesseeId !== currentEntity().id) return false;
      if (c.status === "待确认") {
        c.status = "履约中";
        c.confirmedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
        c.confirmedBy = currentEntity().name;
        const dl = getLeaseDeviceList(c.deviceListId);
        if (dl) activeListDevices(dl).forEach(d => { d.status = "在租"; });
        return true;
      }
      if (c.status === "变更待确认" && c.pendingChange) {
        const ch = c.pendingChange;
        c.monthlyRent = ch.monthlyRent;
        if (ch.deviceListId) c.deviceListId = ch.deviceListId;
        const dl = getLeaseDeviceList(c.deviceListId);
        if (dl && ch.addDevices?.length) {
          ch.addDevices.forEach(dev => {
            const standby = dl.devices.find(x => x.sn === dev.sn);
            if (standby) standby.status = "在租";
            else dl.devices.push({ sn: dev.sn, type: dev.type || "电池", status: "在租" });
            const stbyList = getLeaseDeviceList("LDL-STBY-01");
            if (stbyList) {
              const idx = stbyList.devices.findIndex(x => x.sn === dev.sn);
              if (idx >= 0) stbyList.devices.splice(idx, 1);
            }
          });
          dl.updatedAt = new Date().toISOString().slice(0, 10);
        }
        if (c.termType === "固定租期" && c.periods) {
          c.totalRent = c.monthlyRent * c.periods;
        }
        c.pendingChange = null;
        c.status = "履约中";
        c.confirmedAt = new Date().toISOString().slice(0, 19).replace("T", " ");
        c.confirmedBy = currentEntity().name + "（变更确认）";
        return true;
      }
      return false;
    }

    function rejectLeaseContract(contractId, reason) {
      const c = leaseContracts.find(x => x.id === contractId);
      if (!c || c.lesseeId !== currentEntity().id) return false;
      if (c.status === "待确认") {
        c.status = "已驳回";
        c.rejectReason = reason || "运营商拒绝";
        return true;
      }
      if (c.status === "变更待确认") {
        c.pendingChange = null;
        c.status = "履约中";
        c.rejectReason = reason || "运营商拒绝变更";
        return true;
      }
      return false;
    }

    function deviceChips(list) {
      return `<span class="device-chips">${list.map(sn => `<span class="device-chip">${sn}</span>`).join("")}</span>`;
    }

    function getLeaseDeviceList(id) {
      return leaseDeviceLists.find(x => x.id === id);
    }

    function activeListDevices(dl) {
      if (!dl) return [];
      return (dl.devices || []).filter(d => d.status !== "已替换");
    }

    function deviceListSnSummary(dl) {
      return activeListDevices(dl).map(d => d.sn);
    }

    function contractDevices(c) {
      if (!c) return [];
      const dl = c.deviceListId ? getLeaseDeviceList(c.deviceListId) : null;
      if (dl) return deviceListSnSummary(dl);
      return c.devices || [];
    }

    function contractDeviceList(c) {
      return c?.deviceListId ? getLeaseDeviceList(c.deviceListId) : null;
    }

    function contractByDeviceListId(listId) {
      return leaseContracts.find(c => c.deviceListId === listId);
    }

    function myLeaseDeviceLists() {
      if (isLeasingRole()) return leaseDeviceLists.filter(d => d.lessorId === currentEntity().id);
      const ids = new Set(myLeaseContracts().map(c => c.deviceListId).filter(Boolean));
      return leaseDeviceLists.filter(d => ids.has(d.id));
    }

    function availableDeviceListsForLessee(lesseeId) {
      return leaseDeviceLists.filter(dl =>
        dl.lessorId === currentEntity().id && !dl.contractId && (dl.lesseeId === lesseeId || !dl.lesseeId)
      );
    }

    function lessorUnassignedFleet() {
      const used = new Set(leaseDeviceLists.flatMap(dl => activeListDevices(dl).map(d => d.sn)));
      const fleet = [...cabinets, ...batteries].filter(d => d.lessorId === currentEntity().id && !used.has(d.sn));
      const inv = platformDeviceInventory.map(d => ({
        sn: d.sn, type: d.type === "cabinet" ? "换电柜" : "电池"
      })).filter(d => !used.has(d.sn));
      const map = new Map();
      fleet.forEach(d => map.set(d.sn, { sn: d.sn, type: d.slots != null ? "换电柜" : "电池" }));
      inv.forEach(d => { if (!map.has(d.sn)) map.set(d.sn, d); });
      return [...map.values()];
    }

    function findContractBySn(sn) {
      return leaseContracts.find(c => contractDevices(c).includes(sn));
    }

    function removeSnFromStandbyLists(sn, exceptListId) {
      leaseDeviceLists.forEach(dl => {
        if (dl.id === exceptListId || dl.contractId) return;
        const idx = dl.devices.findIndex(d => d.sn === sn && d.status !== "已替换");
        if (idx >= 0) dl.devices.splice(idx, 1);
      });
    }

    function lessorReplaceCandidates(excludeListId) {
      const usedElsewhere = new Set();
      leaseDeviceLists.forEach(dl => {
        if (dl.id === excludeListId) return;
        activeListDevices(dl).forEach(d => usedElsewhere.add(d.sn));
      });
      const map = new Map();
      lessorUnassignedFleet().forEach(d => { if (!usedElsewhere.has(d.sn)) map.set(d.sn, d); });
      leaseDeviceLists.filter(dl => dl.lessorId === currentEntity().id && !dl.contractId && dl.id !== excludeListId)
        .flatMap(dl => activeListDevices(dl).filter(d => d.status === "待用"))
        .forEach(d => { if (!usedElsewhere.has(d.sn)) map.set(d.sn, { sn: d.sn, type: d.type }); });
      return [...map.values()];
    }

    function myLeaseRentBills() {
      const eid = currentEntity().id;
      return leaseRentBills.filter(b => b.lesseeId === eid).sort((a, b) => b.month.localeCompare(a.month));
    }

    function leasePayChannelLabel(b) {
      if (b.status === "已还清") {
        if (b.payChannel === "微信支付" || b.payChannel === "微信扫码") return "微信支付";
        if (b.payChannel === "支付宝") return "支付宝";
        if (b.payChannel === "对公打款") return "对公打款（已确认）";
        return b.payChannel || "—";
      }
      if (b.status === "待资方确认") return "对公打款（待确认）";
      if (b.status === "待缴纳" || b.status === "逾期") return "待手动缴纳";
      return "—";
    }

    function myLeaseOfflineTickets() {
      const eid = currentEntity().id;
      if (isLeasingRole()) return leaseRentOfflineTickets.filter(t => t.lessorId === eid);
      return leaseRentOfflineTickets.filter(t => t.lesseeId === eid);
    }

    function pendingLeaseOfflineCount() {
      return myLeaseOfflineTickets().filter(t => t.status === "待资方确认").length;
    }

    function lessorCollectionRows() {
      return leaseRentBills.map(b => {
        const c = leaseContracts.find(x => x.id === b.contractId);
        const received = b.paidAmount || 0;
        const pending = Math.max(0, b.rentAmount - received);
        let collectStatus = "待收缴";
        if (b.status === "已还清") collectStatus = "已收缴";
        else if (b.status === "待缴纳" || b.status === "逾期") collectStatus = "待收缴";
        else if (b.status === "待资方确认") collectStatus = "对公待确认";
        else if (b.status === "待还") collectStatus = "待收缴";
        const payLabel = leasePayChannelLabel(b);
        return {
          ...b, lesseeName: c ? c.lesseeName : "—", devices: c ? contractDevices(c) : [],
          received, pending, collectStatus, payLabel
        };
      }).sort((a, b) => b.month.localeCompare(a.month));
    }

    function coverTag(bill) {
      const unpaid = Math.max(0, bill.rentAmount - (bill.paidAmount || 0));
      if (unpaid > 0 && bill.status !== "已还清") return tag("待缴纳");
      return tag("已结清");
    }

    function rentGapBanner(bills) {
      const gaps = bills.filter(b => b.status !== "已还清" && b.status !== "待资方确认");
      if (!gaps.length) return "";
      const totalGap = gaps.reduce((s, b) => s + Math.max(0, b.rentAmount - (b.paidAmount || 0)), 0);
      if (totalGap <= 0) return "";
      return `<div class="rent-gap-banner">${noteBtn("lease_cover_gap")}${noteBtn("lease_manual_pay")}
        <strong>${gaps.length} 笔账单待补缴</strong>，待补缴合计 <strong>¥${totalGap.toLocaleString("zh-CN")}</strong>。
        请选择<strong>微信支付 / 支付宝</strong>在线补缴，或<strong>对公打款</strong>后提交工单（资方确认后核销）。</div>`;
    }

    function employeeLoginBanner() {
      const emp = currentEmployee();
      if (!emp) return "";
      const permLabels = employeePerms().map(pid => EMP_PERMISSIONS.find(x => x.id === pid)?.label || pid).join("、");
      const scope = `数据范围：所属主体 ${entityNameById(emp.entityId)} 名下经营数据`;
      return `<div class="perm-banner">${noteBtn("employee_login")} ${noteBtn("employee_login_scope")}
        当前登录 <strong>${emp.name}</strong>（运营员工 · ${emp.id}）· ${scope}
        <br>可见模块：${permLabels || "—"}</div>`;
    }

    function ownScopeBanner() {
      if (!isEntityLogin()) return employeeLoginBanner();
      const e = currentEntity();
      if (isPlatformRole()) {
        return `<div class="own-scope-banner">${noteBtn("platform_scope")} 当前登录 <strong>${e.name}</strong>：全平台外卖换电业务治理与汇总（演示 Mock）。</div>`;
      }
      if (isLeasingRole()) {
        return `<div class="own-scope-banner">${noteBtn("lease_panel")} 当前登录 <strong>${e.name}</strong>：出租设备、租赁协议、承租方还款进度与<strong>放款申请确认</strong>。</div>`;
      }
      if (isChannelRole()) {
        const contracts = myChannelContracts();
        const opHint = contracts.length
          ? ` 签约运营商 ${contracts.length} 家：${contracts.map(c => c.operatorName).join("、")}；额度池 ${myDayPools().length} 个。`
          : "";
        return `<div class="own-scope-banner">${noteBtn("day_pool_channel")} 当前登录 <strong>${e.name}</strong>：额度池 · 骑手团队 · 登记分配。${opHint}</div>`;
      }
      if (isSitePartnerRole()) {
        const p = currentSitePartner();
        const op = entityNameById(p?.operatorId);
        const cnt = myPartnerBindings().length;
        return `<div class="own-scope-banner">${noteBtn("partner_portal")} 当前登录 <strong>${p?.name || "合伙人"}</strong>（${p?.partnerType || "个人"}）· 关联合伙人运营商 <strong>${op}</strong>；绑定 ${cnt} 个站点。<strong>只读</strong>查看分润配置与明细。</div>`;
      }
      const hasLease = myLeaseContracts().length > 0;
      const leaseHint = "";
      const empHint = myEmployees().length ? " 员工与权限见「员工」菜单。" : "";
      return `<div class="own-scope-banner">${noteBtn("own_data")} 当前仅展示 <strong>${e.name}</strong>（${e.id}）名下设备经营数据。${leaseHint}${empHint}</div>`;
    }

    /** 原型二期范围标记（可浏览，不作为一期交付） */
    const PHASE2_VIEWS = new Set([
      "employees",
      "financeManage", "financeDrawdown", "platformLeasing",
      "leaseAgreements", "leaseCollect", "leaseRent",
      "activationCodes", "activationRecords",
      "leasePkgPricing", "rentPool", "rentDevices", "leaseBatteryHold", "leaseWhitelist", "channelInterOp",
      "platformMarketing"
    ]);

    function phase2ChannelMode() {
      if (!isChannelRole()) return null;
      const mode = contractSettlementMode(channelProfile());
      if (mode === "激活码" || mode === "设备租赁") return mode;
      return null;
    }

    function isPhase2Identity() {
      return isLeasingRole() || !!phase2ChannelMode();
    }

    /** 运营商渠道管理下的「平台营销」Tab 亦属二期 */
    function isPhase2ChannelMarketingTab() {
      return state.view === "channelSales" && state.channelSalesTab === "platformMarketing";
    }

    function isPhase2View(view) {
      const v = view || state.view;
      if (PHASE2_VIEWS.has(v)) return true;
      if (v === "channelSales" && state.channelSalesTab === "platformMarketing") return true;
      return false;
    }

    function phase2Meta() {
      if (isLeasingRole()) {
        return {
          short: "二期",
          label: "设备租赁公司 · 融资协作",
          detail: "含资方登录、「放款申请」及与运营商「融资管理」的协作链路；平台「租赁公司」绑定同属本范围。一期不交付，原型仅演示。"
        };
      }
      const mode = phase2ChannelMode();
      if (mode === "激活码") {
        return {
          short: "二期",
          label: "渠道商 · 激活码",
          detail: "激活码批发 / 核销 / 结算整条渠道模式标为二期。一期不交付，原型仅演示。"
        };
      }
      if (mode === "设备租赁") {
        return {
          short: "二期",
          label: "渠道商 · 设备租赁",
          detail: "白名单套餐、月租账单、租赁设备、电池持有等整条渠道模式标为二期。一期不交付，原型仅演示。"
        };
      }
      if (state.view === "financeManage") {
        return {
          short: "二期",
          label: "运营商 · 融资管理",
          detail: "与设备租赁公司（资方）放款/还款协作相关，标为二期。一期不交付，原型可浏览。"
        };
      }
      if (state.view === "platformLeasing") {
        return {
          short: "二期",
          label: "平台 · 租赁公司",
          detail: "租赁公司档案与「租赁公司↔运营商」绑定，服务于融资协作，标为二期。"
        };
      }
      if (state.view === "financeDrawdown") {
        return {
          short: "二期",
          label: "资方 · 放款申请",
          detail: "设备租赁公司侧放款/尽调确认，与运营商融资管理同一链路，标为二期。"
        };
      }
      if (state.view === "employees") {
        return {
          short: "二期",
          label: "员工模块",
          detail: "各角色（平台 / 运营商 / 渠道商 / 资方等）「员工」账号与权限管理整块标为二期。一期不交付，原型仅演示。"
        };
      }
      if (state.view === "platformMarketing" || isPhase2ChannelMarketingTab()) {
        return {
          short: "二期",
          label: "平台营销",
          detail: "立减券获客、购时锁 OP、成交与营销对账整块标为二期（决策 014）。规则见 012/013；一期不交付，原型仅演示。"
        };
      }
      if (isPhase2View(state.view)) {
        return {
          short: "二期",
          label: (NAV_LABEL[state.view] || "模块") + " · 二期范围",
          detail: "本模块属于二期范围。一期不交付，原型仅演示。"
        };
      }
      return null;
    }

    function phase2BadgeHtml(extraClass) {
      return `<span class="badge-p2${extraClass ? " " + extraClass : ""}" title="二期范围：可浏览，一期不交付">二期</span>`;
    }

    function settlementModeLabel(mode) {
      const m = mode || "人天池";
      if (m === "设备租赁" || m === "激活码") return `${tag(m)}${phase2BadgeHtml()}`;
      return tag(m);
    }

    function phase2BannerHtml() {
      const m = phase2Meta();
      if (!m) return "";
      return `<div class="phase2-banner" role="status">${phase2BadgeHtml()}<div><strong>${m.label}</strong> — ${m.detail}</div></div>`;
    }

    /** 侧栏一级模块 → 二级子页（原页内 tab-sidebar） */
    function getNavL2(view) {
      const alertBadge = () => (myDeviceAlerts().filter(a => a.status === "待处理").length ? " !" : "");
      const depBadge = () => (pendingDepositRechargeCount() ? " (" + pendingDepositRechargeCount() + ")" : "");
      const refundBadge = () => {
        const n = (typeof pendingRefundCount === "function" ? pendingRefundCount() : 0);
        return n ? " (" + n + ")" : "";
      };
      const map = {
        pricing: { stateKey: "pricingTab", tabs: [["pkg", "个人套餐价"], ["deposit", "押金设置"], ["quota", "人天批发价"], ["card", "渠道分销价"]] },
        channelSales: { stateKey: "channelSalesTab", tabs: [["contracts", "签约渠道"], ["orders", "服务订单"], ["assets", "渠道权益"], ["platformMarketing", "平台营销"]] },
        devices: { stateKey: "deviceTab", tabs: () => [["cabinet", "换电柜"], ["battery", "电池"], ["alerts", "设备告警" + alertBadge()], ["iccid", "ICCID"]] },
        flows: { stateKey: "flowTab", tabs: [["receipt", "资金实收"], ["accrual", "清分明细"], ["payout", "提现申请"]] },
        refundManage: { stateKey: "refundTab", tabs: () => [["queue", "退款申请" + refundBadge()], ["settings", "退款设置"]] },
        financeManage: { stateKey: "financeTab", tabs: [["dashboard", "工作台"], ["packages", "资产包"], ["ledger", "融资台账"], ["projects", "授信项目"], ["assets", "资产池"], ["repayments", "还款日历"]] },
        sitePartners: { stateKey: "sitePartnersTab", tabs: [["profiles", "合伙人档案"], ["bindings", "分润绑定一览"], ["ledger", "分润明细"]] },
        siteExpenses: { stateKey: "siteExpenseTab", tabs: [["sites", "按站点"], ["bills", "全部账单"]] },
        leaseAgreements: { stateKey: "leaseAgreementsTab", tabs: [["contracts", "租赁协议"], ["deviceLists", "设备清单"]] },
        dayPool: {
          stateKey: "dayPoolTab",
          tabs: () => (isOrgAdminLogin() ? [["consume", "消耗明细"]] : [
            ["pools", "额度池"], ["teams", "骑手团队"], ["riders", "骑手登记"], ["allocations", "额度分配"],
            ["rules", "额度使用规则"], ["consume", "消耗明细"], ["retail", "零售价"],
            ["exceptions", "异常记录"], ["ledger", "额度明细"]
          ])
        },
        depositManage: { stateKey: "depositTab", tabs: () => [["pending", "充值确认" + depBadge()], ["accounts", "账户总览"], ["ledger", "变动明细"]] },
        operatorCreditEval: { stateKey: "operatorCreditTab", tabs: [["tierConfig", "档位配置"], ["assignments", "运营商定档"], ["logs", "变更记录"]] },
        operators: {
          stateKey: "operatorsTab",
          tabs: () => {
            const n = pendingOperatorWithdrawReviewCount();
            return [
              ["list", "运营商列表"],
              ["withdrawReview", "运营商提现审核" + (n ? " (" + n + ")" : "")],
              ["feeRate", "运营商平台服务费"]
            ];
          }
        },
        l1Pricing: {
          stateKey: "l1PricingTab",
          tabs: [["crossNet", "跨网服务费"], ["dayPrice", "人天标准日值"], ["sms", "预警短信"]]
        },
        platformUsers: { stateKey: "platformUsersTab", tabs: [["info", "用户信息"], ["depositStats", "用户押金统计"], ["serviceChange", "服务变更"]] },
        platformLeasing: { stateKey: "platformLeasingTab", tabs: [["companies", "租赁公司"], ["bindings", "租赁关系绑定"]] },
        platformOrders: { stateKey: "platformOrderTab", tabs: [["package", "套餐购买订单"], ["swap", "换电订单"], ["channel", "渠道商订单"]] },
        platformDevices: { stateKey: "platformDeviceTab", tabs: [["ledger", "设备台账"], ["import", "批量导入"]] },
        platformMarketing: { stateKey: "platformMarketingTab", tabs: [["campaigns", "活动管理"], ["agreements", "运营商签约"], ["links", "链接与二维码"], ["pending", "成交订单"], ["settlements", "券核销结算"], ["statements", "营销对账"]] },
        platformFlows: { stateKey: "platformFlowTab", tabs: [["userPay", "用户支付记录"], ["interOp", "运营商之间"], ["platformFee", "平台提成"]] }
      };
      const def = map[view];
      if (!def) return null;
      const tabs = typeof def.tabs === "function" ? def.tabs() : def.tabs;
      return { stateKey: def.stateKey, tabs };
    }

    function currentNavL2Key(view) {
      const def = getNavL2(view);
      if (!def) return null;
      return state[def.stateKey];
    }

    function setNavL2Key(view, tab) {
      const def = getNavL2(view);
      if (!def || !tab) return;
      const prev = state[def.stateKey];
      state[def.stateKey] = tab;
      if (view === "platformUsers" && prev !== tab) state.platformUsersPage = 1;
    }

    function renderNav() {
      const items = getAllowedNavItems();
      if (!items.includes(state.view)) state.view = items[0];
      const identityP2 = isPhase2Identity();
      document.querySelector("#nav").innerHTML = items.map(k => {
        const viewP2 = identityP2 || isPhase2View(k);
        const p2Mark = viewP2 ? phase2BadgeHtml() : "";
        const l2 = getNavL2(k);
        if (l2) {
          const on = state.view === k;
          const tabKeys = l2.tabs.map(t => t[0]);
          if (on && !tabKeys.includes(state[l2.stateKey])) state[l2.stateKey] = tabKeys[0];
          const cur = state[l2.stateKey] || tabKeys[0];
          const l1Cls = ["nav-l1", on ? "parent-active" : "", viewP2 ? "nav-phase2" : ""].filter(Boolean).join(" ");
          const children = l2.tabs.map(([tab, label]) => {
            const tabP2 = viewP2 || (k === "channelSales" && tab === "platformMarketing");
            const cls = ["nav-l2", on && cur === tab ? "active" : "", tabP2 ? "nav-phase2" : ""].filter(Boolean).join(" ");
            const tabMark = (!viewP2 && tabP2) ? phase2BadgeHtml() : "";
            return `<button type="button" class="${cls}" data-view="${k}" data-nav-sub="${tab}">${label}${tabMark}</button>`;
          }).join("");
          return `<div class="nav-group${on ? " open" : ""}">
            <button type="button" class="${l1Cls}" data-view="${k}" data-nav-sub="${cur}">${NAV_LABEL[k] || k}${p2Mark}</button>
            <div class="nav-l2-wrap">${children}</div>
          </div>`;
        }
        const cls = [
          state.view === k ? "active" : "",
          k === "dayPool" ? "nav-day-pool" : "",
          viewP2 ? "nav-phase2" : ""
        ].filter(Boolean).join(" ");
        const badge = k === "dayPool" && myDayPools().some(p => p.balancePct < 20) ? " !"
          : k === "depositManage" && pendingDepositRechargeCount() > 0 ? " !"
          : k === "operators" && pendingOperatorWithdrawReviewCount() > 0 ? " !"
          : k === "financeDrawdown" && pendingFinanceDrawdownCount() > 0 ? " !"
          : k === "refundManage" && pendingRefundCount() > 0 ? " !"
          : k === "partnerWithdraw" && partnerPendingWithdrawTotal() > 0 ? " !"
          : "";
        return `<button type="button" class="${cls}" data-view="${k}">${NAV_LABEL[k]}${p2Mark}${badge}</button>`;
      }).join("");
    }

    function syncTenantUi() {
      const sel = document.querySelector("#loginSelect");
      if (sel) sel.innerHTML = buildLoginSelectHtml();
      const emp = currentEmployee();
      if (emp) {
        document.querySelector("#tenantName").textContent = emp.name;
        document.querySelector("#tenantType").textContent = "员工登录 · " + (emp.jobTitle || "运营");
        document.querySelector("#treeHint").textContent = "所属：" + entityNameById(emp.entityId);
      } else {
        const r = ROLE[state.role] || ROLE.operator;
        const ch = state.role === "channel" ? channelProfile() : null;
        const ent = currentEntity();
        if (state.role === "sitePartner") {
          const p = currentSitePartner();
          document.querySelector("#tenantName").textContent = p?.name || "站点合伙人";
          document.querySelector("#tenantType").textContent = `站点合伙人 · ${p?.partnerType || "个人"}`;
          document.querySelector("#treeHint").textContent = `运营商：${entityNameById(p?.operatorId)} · ${r.tree}`;
        } else {
          document.querySelector("#tenantName").textContent = ch ? ch.name : (ent.name || r.name);
          document.querySelector("#tenantType").textContent = ch ? `${r.type} · ${ch.settlementMode}` : r.type;
          document.querySelector("#treeHint").textContent = ch ? ch.tree : r.tree;
        }
      }
      if (sel) sel.value = state.loginKey;
    }

    function noteBtn(id) {
      return "";
    }

    function getViewModuleNoteIds(view) {
      if (view === "channelSettlement") {
        const ch = isChannelRole() ? channelProfile() : null;
        const mode = ch?.settlementMode;
        if (mode === "卡差价") return ["channel_settlement_card", "channel_card_margin", "module_channel_links"];
        if (mode === "设备租赁") return ["channel_settlement_rent", "lease_whitelist", "lease_whitelist_pkg", "lease_battery_hold"];
        if (mode === "激活码") return ["channel_settlement_activation", "platform_fee_trigger"];
        return ["day_pool_panel", "day_pool_contract", "entitlement_api"];
      }
      if (view === "overview") {
        if (isPlatformRole()) return ["platform_scope", "platform_stats"];
        if (isLeasingRole()) return ["lease_panel", "finance_drawdown", "finance_pre_plan", "finance_confirm_flow"];
      }
      const ids = VIEW_MODULE_NOTE[view];
      if (!ids) return [];
      return Array.isArray(ids) ? ids : [ids];
    }

    function renderPageModuleNote() {
      const ids = getViewModuleNoteIds(state.view);
      if (!ids.length || !ids.some(id => MODULE_NOTES[id])) return "";
      return `<button type="button" class="module-note page-module-note" data-view-note="${state.view}">说明</button>`;
    }

    function openViewModuleNote(view) {
      const notes = getViewModuleNoteIds(view).map(id => MODULE_NOTES[id]).filter(Boolean);
      if (!notes.length) return;
      const pageTitle = (meta[view] || [])[0] || "模块说明";
      document.querySelector("#noteTitle").textContent = pageTitle + " · 说明";
      document.querySelector("#noteBody").innerHTML = notes.map(n =>
        `<section class="note-section"><h4>${n.title}</h4><div>${n.content}</div></section>`
      ).join("");
      document.querySelector("#noteModal").classList.add("open");
      document.querySelector("#noteMask").classList.add("open");
    }

    function kpi(label, value, sub, icon, noteId) {
      return `<article class="kpi">
        <div class="kpi-head"><span>${label}</span><span class="kpi-head-actions">${noteBtn(noteId)}<span class="kpi-icon">${icon}</span></span></div>
        <div class="kpi-value">${value}</div>
        <div class="kpi-sub">${sub}</div>
      </article>`;
    }

    function panelHead(title, sub, noteId, extra = "") {
      return `<div class="panel-head"><div><h2>${title}</h2>${sub ? `<span>${sub}</span>` : ""}</div><div style="display:flex;align-items:center;gap:8px">${extra}${noteBtn(noteId)}</div></div>`;
    }

    function tabSidebar(tabs, activeKey, dataAttr) {
      /* L2 已收进左侧导航；保留空实现以免历史调用报错 */
      return "";
    }

    function pageWithTabs(sidebarHtml, contentHtml) {
      /* 一级/二级导航迁至侧栏后，页内不再包一层 tab-sidebar */
      return contentHtml;
    }

    function pageWithInnerTabs(sidebarHtml, contentHtml) {
      /* 三级子页（如人天池·消耗明细细分）仍用页内侧栏 */
      return `<div class="page-with-tabs">${sidebarHtml}<div class="tab-content">${contentHtml}</div></div>`;
    }

    function innerTabSidebar(tabs, activeKey, dataAttr) {
      return `<nav class="tab-sidebar" aria-label="子模块">${tabs.map(([k, label]) =>
        `<button type="button" class="${activeKey === k ? "active" : ""}" data-${dataAttr}="${k}">${label}</button>`
      ).join("")}</nav>`;
    }

    function paginateList(rows, page, pageSize) {
      const size = Math.max(1, pageSize || 10);
      const total = rows.length;
      const pages = Math.max(1, Math.ceil(total / size) || 1);
      const cur = Math.min(Math.max(1, page || 1), pages);
      const start = (cur - 1) * size;
      return { page: cur, pages, total, pageSize: size, start, slice: rows.slice(start, start + size) };
    }

    function renderTablePager(pg, dataAttr) {
      const attr = dataAttr || "page";
      if (pg.total <= 0) {
        return `<div class="table-pager"><span class="table-pager-info">共 0 条</span></div>`;
      }
      const from = pg.start + 1;
      const to = Math.min(pg.start + pg.pageSize, pg.total);
      const btns = [];
      btns.push(`<button type="button" class="btn table-pager-btn" data-${attr}="${pg.page - 1}" ${pg.page <= 1 ? "disabled" : ""}>上一页</button>`);
      const windowSize = 5;
      let startP = Math.max(1, pg.page - Math.floor(windowSize / 2));
      let endP = Math.min(pg.pages, startP + windowSize - 1);
      startP = Math.max(1, endP - windowSize + 1);
      if (startP > 1) {
        btns.push(`<button type="button" class="btn table-pager-btn" data-${attr}="1">1</button>`);
        if (startP > 2) btns.push(`<span class="table-pager-ellipsis">…</span>`);
      }
      for (let i = startP; i <= endP; i++) {
        btns.push(`<button type="button" class="btn table-pager-btn${i === pg.page ? " primary" : ""}" data-${attr}="${i}">${i}</button>`);
      }
      if (endP < pg.pages) {
        if (endP < pg.pages - 1) btns.push(`<span class="table-pager-ellipsis">…</span>`);
        btns.push(`<button type="button" class="btn table-pager-btn" data-${attr}="${pg.pages}">${pg.pages}</button>`);
      }
      btns.push(`<button type="button" class="btn table-pager-btn" data-${attr}="${pg.page + 1}" ${pg.page >= pg.pages ? "disabled" : ""}>下一页</button>`);
      return `<div class="table-pager">
        <span class="table-pager-info">第 ${from}–${to} 条 · 共 ${pg.total} 条 · ${pg.pages} 页</span>
        <div class="table-pager-actions">${btns.join("")}</div>
      </div>`;
    }

    function tag(s) {
      const risk = ["退款", "故障", "离线", "建设", "预警", "冻结", "失败", "中途", "完结"];
      const warn = ["待", "处理", "结转", "可打"];
      const cls = risk.some(k => s.includes(k)) ? "risk" : warn.some(k => s.includes(k)) ? "warn" : s.includes("已打") || s.includes("完结") ? "neutral" : "";
      return `<span class="tag ${cls}">${s}</span>`;
    }

    function scale(n) {
      return Math.round(n * rangeMultiplier());
    }

    function updateScopeHint() {
      const emp = currentEmployee();
      const parts = emp ? [emp.name, "员工"] : [isSitePartnerRole() ? (currentSitePartner()?.name || "站点合伙人") : (ROLE[state.role]?.name || "")];
      const e = currentEntity();
      const ownerId = emp ? emp.entityId : e.id;
      let extra = isPlatformRole()
        ? "全平台 · 运营商 " + platformOperators.length + " 家 · 设备 " + (cabinets.length + batteries.length) + " 台"
        : isLeasingRole()
        ? "出租协议 " + myLeaseContracts().length + " 份"
        : isChannelRole()
          ? "额度池 " + myDayPools().length + " 个 · 签约运营商 " + myChannelContracts().length + " 家"
          : isSitePartnerRole()
            ? `绑定站点 ${myPartnerBindings().length} 个 · 累计分润 ¥${partnerAccruedTotal().toFixed(2)}`
          : operatorScopeDeviceHint(ownerId);
      document.querySelector("#scopeHint").innerHTML =
        "数据范围：" + parts.join(" · ") + " · " + extra;
    }

    function operatorDeviceBreakdown(ownerId) {
      const ownCabList = cabinets.filter(c => c.deviceOwnerId === ownerId && c.ownership !== "租赁");
      const leaseCabList = cabinets.filter(c => c.deviceOwnerId === ownerId && c.ownership === "租赁");
      const ownBatList = batteries.filter(b => b.deviceOwnerId === ownerId && b.ownership !== "租赁");
      const leaseBatList = batteries.filter(b => b.deviceOwnerId === ownerId && b.ownership === "租赁");
      const total = ownCabList.length + leaseCabList.length + ownBatList.length + leaseBatList.length;
      return { ownCabList, leaseCabList, ownBatList, leaseBatList, total };
    }

    /** 电池在线：有 online 字段优先；否则随所在柜机；柜外/未知按 health=正常 [假设] */
    function isBatteryOnline(b) {
      if (typeof b.online === "boolean") return b.online;
      const cabSn = b.inCab;
      if (cabSn && cabSn !== "柜外充电") {
        const cab = cabinets.find(c => c.sn === cabSn);
        if (cab) return !!cab.online;
      }
      return b.health === "正常";
    }

    function channelContractModeSummary() {
      const cs = myChannelContracts();
      const day = cs.filter(c => contractSettlementMode(c) === "人天池").length;
      const rent = cs.filter(c => contractSettlementMode(c) === "设备租赁").length;
      const card = cs.filter(c => contractSettlementMode(c) === "卡差价").length;
      const act = cs.filter(c => contractSettlementMode(c) === "激活码").length;
      return { total: cs.length, day, rent, card, act, sub: `人天池 ${day} · 设备租赁 ${rent}（二期） · 骑士卡 ${card}${act ? " · 激活码 " + act + "（二期）" : ""}` };
    }

    function operatorScopeDeviceHint(ownerId) {
      const d = operatorDeviceBreakdown(ownerId);
      return `运营设备 ${d.total} 台：自有柜机 ${d.ownCabList.length} · 自有电池 ${d.ownBatList.length} · 租赁柜机 ${d.leaseCabList.length} · 租赁电池 ${d.leaseBatList.length}`;
    }

    function rangeMultiplier() {
      const ov = state.pf.overview || PF_DEFAULTS.overview;
      const r = ov.range || "30";
      return r === "7" ? 5.2 : r === "30" ? 18 : 1;
    }

    function overviewRangeLabel() {
      const r = (state.pf.overview || PF_DEFAULTS.overview).range || "30";
      return r === "7" ? "近 7 日" : r === "30" ? "近 30 日" : "今日";
    }

    function overviewRangeSelectHtml(hint) {
      const r = (state.pf.overview || PF_DEFAULTS.overview).range || "30";
      const hintText = hint || "仅影响下方经营指标；柜机/电池/站点为实时快照";
      return `<div class="overview-range-bar" aria-label="统计范围">
        <div class="field">
          <label>统计范围</label>
          <select data-overview-range>
            <option value="today"${r === "today" ? " selected" : ""}>今日</option>
            <option value="7"${r === "7" ? " selected" : ""}>近 7 日</option>
            <option value="30"${r === "30" ? " selected" : ""}>近 30 日</option>
          </select>
        </div>
        <p class="overview-range-hint">${hintText}</p>
      </div>`;
    }

    function scaleMoney(n) {
      return Math.round(n * rangeMultiplier() * 100) / 100;
    }

    function getPowerPf() {
      if (!state.pf.overviewPower) state.pf.overviewPower = { ...PF_DEFAULTS.overviewPower };
      return state.pf.overviewPower;
    }

    function powerDateRange(pp) {
      const p = pp || getPowerPf();
      if (p.dateFrom && p.dateTo) return { from: p.dateFrom, to: p.dateTo };
      const anchor = "2026-06-15";
      if (p.range === "today") return { from: anchor, to: anchor };
      if (p.range === "7") return { from: "2026-06-09", to: anchor };
      return { from: "2026-06-01", to: anchor };
    }

    function syncPowerRangeDates(pf) {
      const anchor = "2026-06-15";
      if (pf.range === "today") { pf.dateFrom = anchor; pf.dateTo = anchor; }
      else if (pf.range === "7") { pf.dateFrom = "2026-06-09"; pf.dateTo = anchor; }
      else { pf.dateFrom = "2026-06-01"; pf.dateTo = anchor; pf.range = pf.range || "30"; }
    }

    function applyPowerFiltersFromDom() {
      const pp = getPowerPf();
      document.querySelectorAll("[data-power-pf]").forEach(el => {
        pp[el.dataset.powerPf] = el.value;
      });
      return pp;
    }

    function overviewPowerStats() {
      const { from, to } = powerDateRange();
      const eid = isPlatformRole() ? null : currentEntity().id;
      let rows = cabinetPowerDaily.filter(r => {
        if (eid && r.deviceOwnerId !== eid) return false;
        if (r.date < from || r.date > to) return false;
        return true;
      });
      const siteMap = {};
      const cabMap = {};
      const dayMap = {};
      rows.forEach(r => {
        if (!siteMap[r.site]) siteMap[r.site] = { site: r.site, kwh: 0, cabinets: new Set() };
        siteMap[r.site].kwh += r.kwh;
        siteMap[r.site].cabinets.add(r.sn);
        if (!cabMap[r.sn]) {
          const cab = cabinetBySn(r.sn);
          cabMap[r.sn] = { sn: r.sn, site: r.site, deviceId: cab?.deviceId || "—", deviceName: cab?.deviceName || "—", kwh: 0, currentReading: cab?.usedPowerKwh };
        }
        cabMap[r.sn].kwh += r.kwh;
        dayMap[r.date] = (dayMap[r.date] || 0) + r.kwh;
      });
      const siteRows = Object.values(siteMap).map(s => ({
        site: s.site,
        kwh: s.kwh,
        cabinets: s.cabinets.size,
        avgKwh: s.cabinets.size ? s.kwh / s.cabinets.size : 0
      })).sort((a, b) => b.kwh - a.kwh);
      const cabRows = Object.values(cabMap).sort((a, b) => b.kwh - a.kwh);
      const dailyTrend = Object.keys(dayMap).sort().map(date => ({ date, kwh: dayMap[date] }));
      const totalKwh = rows.reduce((s, r) => s + r.kwh, 0);
      const cabinetCount = new Set(rows.map(r => r.sn)).size;
      const dayCount = dailyTrend.length || 1;
      return { from, to, siteRows, cabRows, dailyTrend, totalKwh, cabinetCount, dayCount };
    }

    function siteBusyLevel(waiting, slotPct) {
      if (waiting >= 3 || slotPct >= 85) return "高";
      if (waiting >= 1 || slotPct >= 60) return "中";
      return "低";
    }

    function siteBusinessStats() {
      const eid = currentEntity().id;
      const ownCabs = cabinets.filter(c => c.deviceOwnerId === eid);
      const siteNames = [...new Set(ownCabs.map(c => c.site))].sort();
      return siteNames.map(siteName => {
        const siteMeta = sites.find(s => s.name === siteName) || { id: "—", city: "—", address: "—", status: "—", waitingCount: 0 };
        const cabinetsAtSite = ownCabs.filter(c => c.site === siteName);
        const cabSns = new Set(cabinetsAtSite.map(c => c.sn));
        const batteriesInCab = batteries.filter(b =>
          b.deviceOwnerId === eid && b.inCab && b.inCab.startsWith("CAB-") && cabSns.has(b.inCab)
        ).length;
        const slotTotal = cabinetsAtSite.reduce((s, c) => s + (c.slots || 0), 0);
        const slotUsed = batteriesInCab;
        const slotPct = slotTotal ? Math.round(slotUsed / slotTotal * 100) : 0;
        const waiting = siteMeta.waitingCount ?? 0;
        const cabinetsOnline = cabinetsAtSite.filter(c => c.online).length;
        const cabinetsOffline = cabinetsAtSite.length - cabinetsOnline;
        return {
          siteName,
          siteId: siteMeta.id,
          address: siteMeta.address || siteMeta.city || "—",
          status: siteMeta.status,
          cabinets: cabinetsAtSite.length,
          cabinetsOnline,
          cabinetsOffline,
          slotUsed,
          slotTotal,
          slotPct,
          batteriesInCab,
          waiting,
          busyLevel: siteBusyLevel(waiting, slotPct)
        };
      }).filter(Boolean);
    }

    function busyLevelClass(level) {
      if (level === "高") return "busy-high";
      if (level === "中") return "busy-mid";
      return "busy-low";
    }

    function busyTag(level) {
      const cls = level === "高" ? "risk" : level === "中" ? "warn" : "";
      return cls ? `<span class="tag ${cls}">${level}</span>` : tag(level);
    }

    function renderOverviewSiteStats() {
      const rows = siteBusinessStats();
      const cards = rows.length
        ? rows.map(r => `<article class="site-busy-card ${busyLevelClass(r.busyLevel)}" title="${r.siteName}">
            <strong class="site-busy-name">${r.siteName}</strong>
            <span class="site-busy-level">${r.busyLevel}</span>
          </article>`).join("")
        : `<p class="site-busy-empty">暂无自有站点数据</p>`;
      return `<section class="panel overview-site-busy-panel">
        ${panelHead("站点繁忙度", "", "overview_site_stats")}
        <div class="panel-body">
          <div class="site-busy-grid">${cards}</div>
        </div>
      </section>`;
    }

    function renderOverviewPowerStats() {
      const pp = getPowerPf();
      const stats = overviewPowerStats();
      const avgPerCab = stats.cabinetCount ? stats.totalKwh / stats.cabinetCount : 0;
      const avgPerDay = stats.dayCount ? stats.totalKwh / stats.dayCount : 0;
      const trendValues = stats.dailyTrend.map(d => Math.round(d.kwh * 1000) / 1000);
      const trendLabels = stats.dailyTrend.map(d => {
        const parts = String(d.date).split("-");
        return parts.length >= 3 ? `${Number(parts[1])}/${Number(parts[2])}` : d.date;
      });
      const trendHtml = stats.dailyTrend.length
        ? `<div class="power-trend-line">
            ${renderSparkChart(trendValues, trendLabels, "#0d9488", false, {
              compact: true,
              stretch: true,
              height: 200,
              pl: 44,
              pr: 12,
              pt: 12,
              pb: 28,
              unit: "kWh"
            })}
          </div>
          <p class="power-trend-caption">日用电趋势（kWh）</p>`
        : `<p class="power-trend-empty">当前筛选条件下暂无日用电数据</p>`;
      return `<section class="panel overview-power-panel">
        ${panelHead("用电量统计", "", "overview_power_stats")}
        <div class="panel-body">
          <div class="power-filter-bar power-filter-inline" id="powerFilterBar">
            <label class="filter-inline filter-inline-range">
              <span>起止时间</span>
              <input type="date" data-power-pf="dateFrom" value="${pp.dateFrom || stats.from}">
              <span class="range-sep">~</span>
              <input type="date" data-power-pf="dateTo" value="${pp.dateTo || stats.to}">
            </label>
            <label class="filter-inline">
              <span>快捷</span>
              <select data-power-pf="range">
                <option value="today"${pp.range === "today" ? " selected" : ""}>今日</option>
                <option value="7"${pp.range === "7" ? " selected" : ""}>近 7 日</option>
                <option value="30"${pp.range === "30" ? " selected" : ""}>近 30 日</option>
              </select>
            </label>
          </div>
          <div class="power-stats-kpi power-stats-kpi-compact">
            <div class="power-kpi-chip"><span>总用电 ${noteBtn("overview_power_kwh")}</span><strong>${stats.totalKwh.toFixed(3)}</strong><em>kWh</em></div>
            <div class="power-kpi-chip"><span>柜机</span><strong>${stats.cabinetCount}</strong><em>台</em></div>
            <div class="power-kpi-chip"><span>单柜均</span><strong>${avgPerCab.toFixed(3)}</strong><em>kWh</em></div>
            <div class="power-kpi-chip"><span>日均</span><strong>${avgPerDay.toFixed(3)}</strong><em>kWh</em></div>
          </div>
          ${trendHtml}
        </div>
      </section>`;
    }

    function openLeaseDetail(contractId) {
      const c = leaseContracts.find(x => x.id === contractId);
      if (!c) return;
      const reps = leaseRepayments.filter(r => r.contractId === contractId);
      const prog = repayProgress(c);
      const partyLabel = isLeasingRole() ? "承租方" : "出租方";
      const partyName = isLeasingRole() ? c.lesseeName : c.lessorName;
      const canConfirm = isOperatorRole() && c.lesseeId === currentEntity().id && (c.status === "待确认" || c.status === "变更待确认");
      const pendingHtml = c.pendingChange ? `<section class="panel" style="margin:0 0 16px;border-color:var(--warn)">
          ${panelHead("待确认变更", `生效日 ${c.pendingChange.effectiveDate}（次月 1 日）`, "lease_confirm")}
          <div class="panel-body" style="padding-top:0">
            <p style="font-size:13px;margin:0 0 10px">资方 ${c.pendingChange.submittedBy} 于 ${c.pendingChange.submittedAt} 提交 · ${c.pendingChange.reason || "—"}</p>
            <table class="sub-table"><thead><tr><th>字段</th><th>当前</th><th>变更后</th></tr></thead>
            <tbody>${(c.pendingChange.changes || []).map(ch => `<tr><td>${ch.field}</td><td>${ch.from}</td><td><strong>${ch.to}</strong></td></tr>`).join("")}</tbody></table>
          </div>
        </section>` : "";
      const confirmBtns = canConfirm ? `<div style="margin-top:16px;display:flex;gap:8px">
          <button type="button" class="btn primary" data-confirm-lease="${c.id}">确认${c.status === "变更待确认" ? "变更" : "承租"}</button>
          <button type="button" class="btn" data-reject-lease="${c.id}">拒绝</button>
        </div>` : "";
      const lessorBtns = isLeasingRole() ? `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
          ${c.status === "待确认" || c.status === "已驳回" ? `<button type="button" class="btn primary" data-edit-lease="${c.id}">编辑协议</button>` : ""}
          ${c.status === "履约中" ? `<button type="button" class="btn primary" data-edit-lease="${c.id}" data-lease-change="1">提交变更</button>` : ""}
          ${c.status === "变更待确认" ? `<span style="font-size:12px;color:var(--muted);align-self:center">等待运营商确认变更（生效 ${c.pendingChange?.effectiveDate || nextMonthFirstStr()}）</span>` : ""}
        </div>` : "";
      const dl = contractDeviceList(c);
      const devSns = contractDevices(c);
      state.detailLeaseId = contractId;
      state.detailSubId = null;
      state.detailSwapId = null;
      document.querySelector("#drawerTitle").textContent = "租赁协议 · " + c.id;
      document.querySelector("#drawerSub").textContent = `${partyLabel} ${partyName} · ${tag(c.status)} · ${c.termType}`;
      document.querySelector("#drawerBody").innerHTML = `
        ${pendingHtml}
        <div class="detail-grid">
          <div class="detail-item"><span>${partyLabel}</span><strong>${partyName}</strong></div>
          <div class="detail-item"><span>租期类型</span><strong>${c.termType}${noteBtn(c.termType === "滚动租期" ? "lease_term_rolling" : "lease_term_fixed")}</strong></div>
          <div class="detail-item"><span>租期</span><strong>${leaseTermLabel(c)}</strong></div>
          <div class="detail-item"><span>月租金</span><strong>¥${c.monthlyRent.toLocaleString("zh-CN")}</strong></div>
          <div class="detail-item"><span>租金总额</span><strong>${c.totalRent != null ? "¥" + c.totalRent.toLocaleString("zh-CN") : "滚动 · 按实际期数累计"}</strong></div>
          <div class="detail-item"><span>押金</span><strong>¥${c.deposit.toLocaleString("zh-CN")}</strong></div>
          <div class="detail-item"><span>还款日</span><strong>${c.repayDay}</strong></div>
          <div class="detail-item"><span>缴纳方式</span><strong>仅手动（微信/支付宝/对公工单）${noteBtn("lease_auto_deduct")}</strong></div>
          <div class="detail-item"><span>确认信息</span><strong>${c.confirmedAt ? c.confirmedBy + " · " + c.confirmedAt : "待运营商确认"}</strong></div>
          <div class="detail-item"><span>设备清单</span><strong>${dl ? `<button type="button" class="link-btn" data-open-device-list="${dl.id}">${dl.id}</button> · ${dl.name}` : "—"}</strong></div>
        </div>
        <section class="panel" style="margin:0 0 16px">
          ${panelHead("清单内设备", `${devSns.length} 台`, "lease_devices")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table class="sub-table"><thead><tr><th>资产编号</th><th>类型</th></tr></thead>
            <tbody>${devSns.map(sn => {
              const cab = cabinets.find(x => x.sn === sn);
              const type = cab ? "换电柜" : "电池";
              return `<tr><td>${sn}</td><td>${type}</td></tr>`;
            }).join("")}</tbody></table>
          </div>
        </section>
        <p style="font-size:12px;color:var(--muted);margin:0 0 8px">${prog.label}</p>
        <div class="usage-bar"><i style="width:${prog.pct}%"></i></div>
        <section class="panel" style="margin-top:16px">
          ${panelHead(isLeasingRole() ? "收款计划明细" : "还款计划明细", `${reps.length} 期`, "lease_repay")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table class="sub-table">
              <thead><tr><th>期次</th><th>应还日</th><th>金额</th><th>状态</th><th>实还日</th></tr></thead>
              <tbody>${reps.map(r => `<tr>
                <td>第 ${r.period} 期</td><td>${r.dueDate}</td><td>¥${r.amount.toLocaleString("zh-CN")}</td>
                <td>${tag(r.status)}</td><td>${r.paidDate || "—"}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
        ${confirmBtns}${lessorBtns}`;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function renderLeaseDeviceListsPanel() {
      const lessor = isLeasingRole();
      const lists = myLeaseDeviceLists();
      const addBtns = lessor
        ? `<button type="button" class="btn" data-import-device-list>导入清单</button>
           <button type="button" class="btn primary" data-new-device-list>+ 新建设备清单</button>`
        : "";
      const rows = lists.length ? lists.map(dl => {
        const sns = deviceListSnSummary(dl);
        const contract = dl.contractId ? leaseContracts.find(c => c.id === dl.contractId) : null;
        const ops = lessor
          ? `<button type="button" class="link-btn" data-open-device-list="${dl.id}">查看</button>
             ${!dl.contractId ? `<button type="button" class="link-btn" data-edit-device-list="${dl.id}">编辑</button>` : ""}`
          : `<button type="button" class="link-btn" data-open-device-list="${dl.id}">查看</button>`;
        return `<tr>
          <td><button type="button" class="link-btn" data-open-device-list="${dl.id}">${dl.id}</button></td>
          <td>${dl.name}</td>
          <td>${dl.lesseeName || "—"}</td>
          <td>${dl.contractId ? `<button type="button" class="link-btn" data-open-lease="${dl.contractId}">${dl.contractId}</button>` : "—"}</td>
          <td>${deviceChips(sns)}</td>
          <td>${sns.length}</td>
          <td>${tag(dl.status)}</td>
          <td><small>${dl.updatedAt}</small></td>
          <td class="row-actions">${ops}</td>
        </tr>`;
      }).join("") : `<tr><td colspan="9">${lessor ? "暂无设备清单，请新建或导入" : "暂无关联设备清单"}</td></tr>`;
      return `
        <section class="panel">
          ${panelHead("设备清单库", lessor ? "独立维护设备组合；支持导入与清单内设备替换；新建协议时关联待绑定清单" : "查看本主体租赁协议关联的设备清单", "lease_device_lists", addBtns)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>清单编号</th><th>清单名称</th><th>意向承租方</th><th>绑定协议</th>
                <th>设备 SN</th><th>台数</th><th>状态</th><th>更新日</th><th>操作</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderLeaseAgreements() {
      const lessor = isLeasingRole();
      const tab = state.leaseAgreementsTab || "contracts";
      const tabs = [["contracts", "租赁协议"], ["deviceLists", "设备清单"]];
      const sidebar = tabSidebar(tabs, tab, "lease-agreements-tab");
      if (tab === "deviceLists") {
        return `${ownScopeBanner()}${pageWithTabs(sidebar, renderLeaseDeviceListsPanel())}`;
      }
      const f = getPf();
      const contracts = myLeaseContracts().filter(c => {
        if (!matchKw(c.id, f.contractId)) return false;
        const party = lessor ? c.lesseeName : c.lessorName;
        if (!matchKw(party, f.party)) return false;
        if (f.status !== "全部" && c.status !== f.status) return false;
        return true;
      });
      const addBtn = lessor
        ? `<button type="button" class="btn primary" data-new-lease>+ 新增协议</button>`
        : "";
      const partyCol = lessor ? "<th>承租方</th>" : "<th>出租方</th>";
      const pendingBanner = !lessor && pendingLeaseConfirmCount() > 0
        ? `<div class="pool-warn-banner" style="margin-bottom:14px">${noteBtn("lease_confirm")} 有 <strong>${pendingLeaseConfirmCount()}</strong> 份协议待确认，确认前不出账；变更<strong>次月 1 日</strong>生效。租金须手动缴纳。</div>`
        : "";
      const boundLessorsBanner = !lessor && boundLessorsForOperator(currentEntity().id).length
        ? `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_lease_binding")} 平台已绑定 <strong>${boundLessorsForOperator(currentEntity().id).map(l => l.name).join("、")}</strong>；可向不同出租方分别签约（当前 ${contracts.length} 份协议）。</div>`
        : "";
      const lessorBindBanner = lessor && boundOperatorsForLessor(currentEntity().id).length
        ? `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_lease_binding")} 承租运营商须来自<strong>平台绑定</strong>名单（共 ${boundOperatorsForLessor(currentEntity().id).length} 家）。</div>`
        : "";
      const rows = contracts.length ? contracts.map(c => {
        const prog = repayProgress(c);
        const dl = contractDeviceList(c);
        const payModeTxt = `<span class="pay-mode">扫码/工单</span>`;
        const actionLabel = !lessor && (c.status === "待确认" || c.status === "变更待确认") ? "确认" : (lessor ? "管理" : "查看");
        return `<tr>
          <td><button type="button" class="link-btn" data-open-lease="${c.id}">${c.id}</button></td>
          <td>${lessor ? c.lesseeName : c.lessorName}</td>
          <td>${c.termType || "固定租期"}</td>
          <td>${dl ? `<button type="button" class="link-btn" data-open-device-list="${dl.id}">${dl.id}</button><br><small>${dl.name}</small>` : "—"}</td>
          <td>${deviceChips(contractDevices(c))}</td>
          <td><small>${leaseTermLabel(c)}</small></td>
          <td>¥${c.monthlyRent.toLocaleString("zh-CN")}<br>${payModeTxt}</td>
          <td style="min-width:130px"><div class="usage-bar"><i style="width:${prog.pct}%"></i></div><small>${prog.label}</small></td>
          <td>${tag(c.status)}${c.pendingChange ? `<br><small>生效 ${c.pendingChange.effectiveDate}</small>` : ""}</td>
          <td><button type="button" class="link-btn" data-open-lease="${c.id}">${actionLabel}</button></td>
        </tr>`;
      }).join("") : `<tr><td colspan="10">${lessor ? "暂无出租协议" : "当前无租赁协议（设备均为自有）"}</td></tr>`;
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `${boundLessorsBanner}${lessorBindBanner}${pendingBanner}
        <section class="panel">
          ${panelHead("租赁协议", lessor ? "关联设备清单 + 租金条款；一运营商可有多份协议" : "查看租用协议；待确认项须确认后生效", "lease_agreements", addBtn)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>协议编号</th>${partyCol}<th>租期类型</th><th>设备清单</th><th>清单内设备</th>
                <th>租期</th><th>月租金</th><th>履约进度</th><th>状态</th><th>操作</th>
              </tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function renderLeaseCollect() {
      const f = getPf();
      const rows = lessorCollectionRows().filter(r => {
        if (!matchKw(r.month, f.month)) return false;
        if (!matchKw(r.lesseeName, f.lessee)) return false;
        if (f.collectStatus !== "全部" && r.collectStatus !== f.collectStatus) return false;
        return true;
      });
      const totalDue = rows.filter(r => r.month === "2026-06").reduce((s, r) => s + r.rentAmount, 0);
      const totalRecv = rows.filter(r => r.month === "2026-06").reduce((s, r) => s + r.received, 0);
      const followUp = rows.filter(r => r.collectStatus === "待补缴" || r.collectStatus === "对公待确认").length;
      const offlinePending = myLeaseOfflineTickets().filter(t => t.status === "待资方确认");
      const offlinePanel = offlinePending.length ? `
        <section class="panel" style="margin-bottom:14px">
          ${panelHead("对公打款工单", `${offlinePending.length} 笔待审核`, "lease_offline_ticket")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>工单号</th><th>承租方</th><th>账期</th><th>协议</th><th>金额</th><th>流水号</th><th>转账日</th><th>提交时间</th><th>操作</th>
              </tr></thead>
              <tbody>${offlinePending.map(t => `<tr>
                <td>${t.id}</td><td>${t.lesseeName}</td><td>${t.month}</td>
                <td><button type="button" class="link-btn" data-open-lease="${t.contractId}">${t.contractId}</button></td>
                <td>¥${t.amount.toLocaleString("zh-CN")}</td><td>${t.transferRef}</td><td>${t.transferDate}</td><td>${t.submitTime}</td>
                <td class="row-actions">
                  <button type="button" class="link-btn" data-confirm-rent-offline="${t.id}">确认到账</button>
                  <button type="button" class="link-btn" data-reject-rent-offline="${t.id}">驳回</button>
                </td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>` : "";
      const offlineHistory = myLeaseOfflineTickets().filter(t => t.status !== "待资方确认").slice(0, 5);
      const offlineHistoryPanel = offlineHistory.length ? `
        <section class="panel" style="margin-bottom:14px">
          ${panelHead("对公工单记录", "近期已处理", "lease_offline_ticket")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>工单号</th><th>承租方</th><th>账期</th><th>金额</th><th>状态</th><th>处理人</th><th>处理时间</th></tr></thead>
              <tbody>${offlineHistory.map(t => `<tr>
                <td>${t.id}</td><td>${t.lesseeName}</td><td>${t.month}</td>
                <td>¥${t.amount.toLocaleString("zh-CN")}</td><td>${tag(t.status)}</td>
                <td>${t.confirmedBy || "—"}</td><td>${t.confirmTime || "—"}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>` : "";
      const body = rows.length ? rows.map(r => `<tr>
        <td>${r.month}</td>
        <td>${r.lesseeName}</td>
        <td><button type="button" class="link-btn" data-open-lease="${r.contractId}">${r.contractId}</button></td>
        <td>${deviceChips(r.devices)}</td>
        <td>¥${r.rentAmount.toLocaleString("zh-CN")}</td>
        <td>¥${r.received.toLocaleString("zh-CN")}</td>
        <td>¥${r.pending.toLocaleString("zh-CN")}</td>
        <td>${r.payLabel}<br><small style="color:var(--muted)">${r.autoStatus || "—"}</small></td>
        <td>${tag(r.collectStatus)}</td>
        <td>${r.dueDate}</td>
        <td>${r.collectStatus === "待补缴"
          ? `<button type="button" class="link-btn" data-collect-follow="${r.id}">登记跟进</button>`
          : r.collectStatus === "对公待确认" ? `<small>工单审核中</small>` : "—"}</td>
      </tr>`).join("") : "<tr><td colspan='11'>暂无收缴记录</td></tr>";
      return `
        ${ownScopeBanner()}
        ${offlinePanel}
        <div class="kpi-grid">
          ${kpi("本月应收", "¥" + totalDue.toLocaleString("zh-CN"), "2026-06", "收", "lease_collect")}
          ${kpi("本月已收", "¥" + totalRecv.toLocaleString("zh-CN"), "含在线/对公", "到", "lease_collect")}
          ${kpi("待跟进", followUp, "待补缴/对公待确认", "跟", "lease_cover_gap")}
          ${kpi("对公待审", offlinePending.length, "工单", "审", "lease_offline_ticket")}
          ${kpi("收缴率", totalDue ? Math.round(totalRecv / totalDue * 100) + "%" : "—", "本月", "率", "lease_collect")}
        </div>
        <section class="panel">
          ${panelHead("租金收缴进度", "按账期跟踪微信/支付宝扫码、对公工单收缴进度", "lease_collect")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>账期</th><th>承租方</th><th>协议</th><th>设备</th>
                <th>应收</th><th>已收</th><th>待收</th><th>收缴方式</th><th>状态</th><th>到期日</th><th>操作</th>
              </tr></thead>
              <tbody>${body}</tbody>
            </table>
          </div>
        </section>
        ${offlineHistoryPanel}`;
    }

    function renderLeaseRent() {
      const f = getPf();
      const bills = myLeaseRentBills().filter(b => {
        if (!matchKw(b.month, f.month)) return false;
        if (!matchKw(b.contractId, f.contractId)) return false;
        return true;
      });
      const monthKey = f.month || "2026-06";
      const current = bills.filter(b => b.month === monthKey);
      const dueTotal = current.reduce((s, b) => s + b.rentAmount, 0);
      const paidTotal = current.reduce((s, b) => s + (b.paidAmount || 0), 0);
      const gapTotal = Math.max(0, dueTotal - paidTotal);
      const offlineTickets = myLeaseOfflineTickets();
      const tableBody = current.length ? current.map(b => {
        const c = leaseContracts.find(x => x.id === b.contractId);
        const devs = c ? contractDevices(c) : [];
        const pending = Math.max(0, b.rentAmount - (b.paidAmount || 0));
        let actions = "—";
        if (b.status !== "已还清" && b.status !== "待资方确认") {
          actions = `<button type="button" class="link-btn" data-pay-rent="${b.id}">缴纳租金</button>`;
        } else if (b.status === "待资方确认") {
          actions = `<small>对公工单审核中</small>`;
        }
        return `<tr>
          <td>${b.month}</td>
          <td><button type="button" class="link-btn" data-open-lease="${b.contractId}">${b.contractId}</button>${c ? `<br><small style="color:var(--muted)">${c.lessorName}</small>` : ""}</td>
          <td>${deviceChips(devs)}</td>
          <td>¥${b.rentAmount.toLocaleString("zh-CN")}<br><small style="color:var(--muted)">还款日 ${b.dueDate || c?.repayDay || "—"}</small></td>
          <td>${coverTag(b)}${pending > 0 ? `<br><small>待缴 ¥${pending.toLocaleString("zh-CN")}</small>` : ""}</td>
          <td>${leasePayChannelLabel(b)}<br><small>${b.autoStatus || ""}</small></td>
          <td>${tag(b.status)}</td>
          <td class="row-actions">${actions}</td>
        </tr>`;
      }).join("") : "<tr><td colspan='8'>暂无租赁账单</td></tr>";
      const corp = lessorRentReceiveAccount;
      const offlineRows = offlineTickets.length ? offlineTickets.map(t => `<tr>
        <td>${t.id}</td><td>${t.month}</td><td>${t.contractId}</td>
        <td>¥${t.amount.toLocaleString("zh-CN")}</td><td>${t.transferRef}</td><td>${t.transferDate}</td>
        <td>${tag(t.status)}</td><td>${t.confirmTime || t.submitTime}</td>
      </tr>`).join("") : "<tr><td colspan='8'>暂无对公打款工单</td></tr>";
      return `
        ${ownScopeBanner()}
        ${rentGapBanner(bills)}
        <div class="kpi-grid">
          ${kpi("本月应付租金", "¥" + dueTotal.toLocaleString("zh-CN"), current.length + " 份协议", "付", "lease_rent_monthly")}
          ${kpi("已实还", "¥" + paidTotal.toLocaleString("zh-CN"), "本月累计", "还", "lease_rent_monthly")}
          ${kpi("待缴", gapTotal > 0 ? "¥" + gapTotal.toLocaleString("zh-CN") : "无", gapTotal > 0 ? "须在线/对公缴纳" : "已结清", "缺", "lease_cover_gap")}
          ${kpi("收缴方式", "仅手动", "扫码 + 对公工单", "式", "lease_manual_pay")}
        </div>
        <section class="panel">
          ${panelHead("缴纳方式说明", "微信/支付宝扫码 · 对公打款工单", "lease_manual_pay")}
          <div class="panel-body">
            <p style="margin:0;font-size:13px">${noteBtn("lease_manual_pay")}${noteBtn("lease_offline_ticket")} 资方收款对公账户：<strong>${corp.bankName}</strong> · ${corp.accountName} · ${corp.accountNo}<br>${corp.transferRemark}</p>
          </div>
        </section>
        <section class="panel">
          ${panelHead("本月协议租金", "按租赁协议出账 · " + monthKey, "lease_rent_monthly")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>账期</th><th>协议</th><th>绑定设备</th><th>协议月租金</th>
                <th>缴纳状态</th><th>方式</th><th>账单状态</th><th>操作</th>
              </tr></thead>
              <tbody>${tableBody}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("对公打款工单", "线下转账后提交，资方审核确认", "lease_offline_ticket")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>工单号</th><th>账期</th><th>协议</th><th>金额</th><th>流水号</th><th>转账日</th><th>状态</th><th>时间</th></tr></thead>
              <tbody>${offlineRows}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("历史账单", "按月汇总", "lease_rent_monthly")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>账期</th><th>协议</th><th>月租金</th><th>已实还</th><th>待缴</th><th>方式</th><th>状态</th><th>实还日</th></tr></thead>
              <tbody>${bills.map(b => `<tr>
                <td>${b.month}</td>
                <td>${b.contractId}</td>
                <td>¥${b.rentAmount.toLocaleString("zh-CN")}</td>
                <td>¥${(b.paidAmount || 0).toLocaleString("zh-CN")}</td>
                <td>${Math.max(0, b.rentAmount - (b.paidAmount || 0)) > 0 ? "¥" + Math.max(0, b.rentAmount - (b.paidAmount || 0)).toLocaleString("zh-CN") : "—"}</td>
                <td>${leasePayChannelLabel(b)}</td>
                <td>${tag(b.status)}</td>
                <td>${b.paidDate || "—"}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>`;
    }

    function markBillPaid(b, channel, paidDate) {
      if (b.status === "已还清") return;
      b.status = "已还清";
      b.payChannel = channel;
      b.paidDate = paidDate;
      b.paidAmount = b.rentAmount;
      b.manualRequired = false;
      b.coverGap = 0;
      b.autoStatus = channel + " · 已核销";
      const rep = leaseRepayments.find(r => r.contractId === b.contractId && r.status === "待还");
      if (rep) { rep.status = "已还"; rep.paidDate = paidDate; }
      const c = leaseContracts.find(x => x.id === b.contractId);
      if (c) { c.paidPeriods += 1; c.paidRent += b.rentAmount; }
    }

    function openRentPayForm(billId) {
      const b = leaseRentBills.find(x => x.id === billId);
      if (!b || b.status === "已还清" || b.status === "待资方确认") return;
      const c = leaseContracts.find(x => x.id === b.contractId);
      const corp = lessorRentReceiveAccount;
      const pending = Math.max(0, b.rentAmount - (b.paidAmount || 0));
      state.rentPayBillId = billId;
      document.querySelector("#rentPayFormTitle").textContent = "补缴租金 · " + (c?.id || billId) + " · " + b.month;
      document.querySelector("#rentPayForm").innerHTML = `
        <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("lease_manual_pay")}${noteBtn("lease_offline_ticket")} 选择微信/支付宝在线支付，或对公转账后提交工单，资金均入账资方。</p>
        <label>账期<input value="${b.month}" readonly></label>
        <label>待缴金额<input value="¥${pending.toLocaleString("zh-CN")}" readonly></label>
        <label style="grid-column:1/-1">补缴方式<select name="payMethod" id="rentPayMethod">
          <option value="wx">微信支付（在线）</option>
          <option value="alipay">支付宝（在线）</option>
          <option value="offline">线下对公打款（提交工单）</option>
        </select></label>
        <div id="rentPayOfflineFields" style="display:none;grid-column:1/-1">
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">请先转账至资方对公账户，再填写回单信息：<br><strong>${corp.bankName}</strong> · ${corp.accountName} · ${corp.accountNo}<br>${corp.transferRemark}</p>
          <label>转账日期<input name="transferDate" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
          <label>银行流水号 *<input name="transferRef" placeholder="对公回单流水号" required></label>
          <label style="grid-column:1/-1">凭证说明<textarea name="voucherNote" rows="2" placeholder="例：6月租金对公"></textarea></label>
        </div>`;
      const methodSel = document.querySelector("#rentPayMethod");
      const offlineWrap = document.querySelector("#rentPayOfflineFields");
      const toggleOffline = () => {
        offlineWrap.style.display = methodSel.value === "offline" ? "grid" : "none";
        offlineWrap.style.gridColumn = "1 / -1";
        offlineWrap.style.gridTemplateColumns = "repeat(2, 1fr)";
        offlineWrap.style.gap = "12px";
      };
      methodSel.onchange = toggleOffline;
      toggleOffline();
      document.querySelector("#rentPayModal").classList.add("open");
      document.querySelector("#rentPayMask").classList.add("open");
    }

    function closeRentPayForm() {
      state.rentPayBillId = null;
      document.querySelector("#rentPayModal").classList.remove("open");
      document.querySelector("#rentPayMask").classList.remove("open");
    }

    function saveRentPayForm() {
      const b = leaseRentBills.find(x => x.id === state.rentPayBillId);
      if (!b) return;
      const form = document.querySelector("#rentPayForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const c = leaseContracts.find(x => x.id === b.contractId);
      if (data.payMethod === "wx") {
        markBillPaid(b, "微信支付", today);
        b.autoStatus = "微信在线支付成功 · 已打款至资方商户";
        window.alert("演示：微信支付成功，租金 ¥" + b.rentAmount.toLocaleString("zh-CN") + " 已打款至资方。");
      } else if (data.payMethod === "alipay") {
        markBillPaid(b, "支付宝", today);
        b.autoStatus = "支付宝在线支付成功 · 已打款至资方商户";
        window.alert("演示：支付宝支付成功，租金 ¥" + b.rentAmount.toLocaleString("zh-CN") + " 已打款至资方。");
      } else {
        if (!data.transferRef?.trim()) { window.alert("请填写银行流水号"); return; }
        const ticketId = "LR-OFF-" + String(leaseRentOfflineTickets.length + 1).padStart(3, "0");
        leaseRentOfflineTickets.unshift({
          id: ticketId, billId: b.id, contractId: b.contractId,
          lesseeId: b.lesseeId, lesseeName: c?.lesseeName || "—", lessorId: c?.lessorId || "LEASE-HD",
          month: b.month, amount: b.rentAmount - (b.paidAmount || 0),
          transferRef: data.transferRef.trim(), transferDate: data.transferDate || today,
          voucherNote: data.voucherNote?.trim() || "", status: "待资方确认", submitTime: now,
          confirmTime: null, confirmedBy: null, rejectReason: null
        });
        b.status = "待资方确认";
        b.payChannel = "对公打款";
        b.autoStatus = "对公工单 " + ticketId + " 待资方确认";
        b.manualRequired = false;
        window.alert("对公打款工单已提交（" + ticketId + "），资方确认到账后账单核销。");
      }
      closeRentPayForm();
      render();
    }

    function confirmLeaseOfflineTicket(ticketId) {
      const t = leaseRentOfflineTickets.find(x => x.id === ticketId);
      if (!t || t.status !== "待资方确认") return false;
      const b = leaseRentBills.find(x => x.id === t.billId);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      t.status = "已确认";
      t.confirmTime = now;
      t.confirmedBy = currentEntity().name;
      if (b) {
        markBillPaid(b, "对公打款", t.transferDate);
        b.autoStatus = "对公打款已确认 · " + ticketId;
      }
      return true;
    }

    function rejectLeaseOfflineTicket(ticketId, reason) {
      const t = leaseRentOfflineTickets.find(x => x.id === ticketId);
      if (!t || t.status !== "待资方确认") return false;
      const b = leaseRentBills.find(x => x.id === t.billId);
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      t.status = "已驳回";
      t.confirmTime = now;
      t.confirmedBy = currentEntity().name;
      t.rejectReason = reason || "信息不符";
      if (b) {
        b.status = "待缴纳";
        b.payChannel = null;
        b.autoStatus = "对公工单驳回：" + t.rejectReason;
      }
      return true;
    }

    function handlePayManual(billId) {
      openRentPayForm(billId);
    }

    function handleCollectFollow(billId) {
      openFollowForm(billId);
    }

    function lessorLeasableDevices() {
      const eid = currentEntity().id;
      const fleet = [...cabinets, ...batteries].filter(d => d.lessorId === eid);
      const inv = platformDeviceInventory.map(d => ({
        sn: d.sn, type: d.type === "cabinet" ? "换电柜" : "电池", site: "待绑定", city: d.city
      }));
      const map = new Map();
      fleet.forEach(d => map.set(d.sn, { sn: d.sn, type: d.slots != null ? "换电柜" : "电池", site: d.site, city: d.city }));
      inv.forEach(d => { if (!map.has(d.sn)) map.set(d.sn, d); });
      return [...map.values()];
    }

    function leaseChangeDiff(before, after) {
      const changes = [];
      if (before.monthlyRent !== after.monthlyRent) {
        changes.push({ field: "月租金", from: "¥" + before.monthlyRent.toLocaleString("zh-CN"), to: "¥" + after.monthlyRent.toLocaleString("zh-CN") });
      }
      const bDev = (before.deviceListId ? `${before.deviceListId}：${contractDevices(before).join("、")}` : contractDevices(before).join("、"));
      const afterDl = after.deviceListId ? getLeaseDeviceList(after.deviceListId) : null;
      const aDev = afterDl ? `${after.deviceListId}：${deviceListSnSummary(afterDl).join("、")}` : (after.devices || []).join("、");
      if (bDev !== aDev) changes.push({ field: "设备清单", from: bDev || "—", to: aDev || "—" });
      if (before.termType !== after.termType) changes.push({ field: "租期类型", from: before.termType, to: after.termType });
      if (before.end !== after.end) changes.push({ field: "截止日", from: before.end || "—", to: after.end || "—" });
      if (before.noticeDays !== after.noticeDays) changes.push({ field: "提前通知天数", from: String(before.noticeDays || "—"), to: String(after.noticeDays || "—") });
      return changes;
    }

    function bindLeaseFormToggles() {
      const form = document.querySelector("#leaseForm");
      if (!form) return;
      const termSel = form.querySelector('[name="termType"]');
      const fixed = form.querySelector(".lease-fixed-fields");
      const rolling = form.querySelector(".lease-rolling-fields");
      const toggle = () => {
        const fixedOn = termSel.value === "固定租期";
        if (fixed) fixed.style.display = fixedOn ? "contents" : "none";
        if (rolling) rolling.style.display = fixedOn ? "none" : "contents";
      };
      termSel.onchange = toggle;
      toggle();
    }

    function openDeviceListDetail(listId) {
      const dl = getLeaseDeviceList(listId);
      if (!dl) return;
      const contract = dl.contractId ? leaseContracts.find(c => c.id === dl.contractId) : null;
      const active = activeListDevices(dl);
      const replaceBtn = isLeasingRole() && active.length
        ? `<button type="button" class="btn" data-replace-device-list="${dl.id}">替换设备</button>` : "";
      const editBtn = isLeasingRole() && !dl.contractId
        ? `<button type="button" class="btn primary" data-edit-device-list="${dl.id}">编辑清单</button>` : "";
      state.detailLeaseId = null;
      document.querySelector("#drawerTitle").textContent = "设备清单 · " + dl.id;
      document.querySelector("#drawerSub").textContent = `${dl.name} · ${tag(dl.status)} · ${active.length} 台`;
      document.querySelector("#drawerBody").innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><span>清单名称</span><strong>${dl.name}</strong></div>
          <div class="detail-item"><span>意向承租方</span><strong>${dl.lesseeName || "—"}</strong></div>
          <div class="detail-item"><span>绑定协议</span><strong>${contract ? `<button type="button" class="link-btn" data-open-lease="${contract.id}">${contract.id}</button>` : "未绑定"}</strong></div>
          <div class="detail-item"><span>最近更新</span><strong>${dl.updatedAt}</strong></div>
        </div>
        <section class="panel" style="margin:0 0 16px">
          ${panelHead("在册设备", `${active.length} 台`, "lease_device_lists")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table class="sub-table"><thead><tr><th>SN</th><th>类型</th><th>状态</th></tr></thead>
            <tbody>${active.map(d => `<tr><td>${d.sn}</td><td>${d.type}</td><td>${tag(d.status)}</td></tr>`).join("") || "<tr><td colspan='3'>暂无设备</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        ${(dl.replacements || []).length ? `<section class="panel" style="margin:0 0 16px">
          ${panelHead("替换记录", (dl.replacements || []).length + " 条", "lease_device_replace")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table class="sub-table"><thead><tr><th>日期</th><th>原设备</th><th>新设备</th><th>原因</th></tr></thead>
            <tbody>${dl.replacements.map(r => `<tr><td>${r.at}</td><td>${r.fromSn}</td><td>${r.toSn}</td><td>${r.reason}</td></tr>`).join("")}</tbody>
            </table>
          </div>
        </section>` : ""}
        <div style="margin-top:16px;display:flex;gap:8px">${editBtn}${replaceBtn}</div>`;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function parseDeviceListCsv(text) {
      const lines = (text || "").trim().split(/\n/).map(l => l.trim()).filter(Boolean);
      const out = [];
      lines.forEach((line, i) => {
        if (i === 0 && /sn|编号/i.test(line)) return;
        const parts = line.split(/[,，\t]/).map(s => s.trim());
        if (!parts[0]) return;
        const type = (parts[1] || "").includes("柜") ? "换电柜" : "电池";
        out.push({ sn: parts[0], type });
      });
      return out;
    }

    function openDeviceListForm(listId, importMode) {
      if (!isLeasingRole()) return;
      const dl = listId ? getLeaseDeviceList(listId) : null;
      state.deviceListFormId = listId || "new";
      const fleet = lessorUnassignedFleet();
      const active = dl ? activeListDevices(dl) : [];
      const selected = new Set(active.map(d => d.sn));
      const deviceChecks = fleet.map(d =>
        `<label style="display:flex;align-items:center;gap:6px;font-size:13px"><input type="checkbox" name="listDevices" value="${d.sn}" data-type="${d.type}" ${selected.has(d.sn) ? "checked" : ""}> ${d.sn} · ${d.type}</label>`
      ).join("") || "<p style=\"font-size:12px;color:var(--muted);margin:0\">资方库存暂无可用设备，请先在平台入库。</p>";
      const opOptions = `<option value="">（暂不指定）</option>` + platformOperators.filter(o => o.status === "在营").map(o =>
        `<option value="${o.id}" ${dl?.lesseeId === o.id ? "selected" : ""}>${o.name}</option>`
      ).join("");
      document.querySelector("#deviceListFormTitle").textContent = importMode ? "导入设备清单" : (dl ? "编辑设备清单" : "新建设备清单");
      document.querySelector("#deviceListForm").innerHTML = `
        <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("lease_device_lists")} 清单独立维护，创建协议时选择「待绑定」清单关联。</p>
        <label>清单名称<input name="name" value="${dl?.name || ""}" required placeholder="如：绿色出行 · 柜电套装"></label>
        <label>意向承租方<select name="lesseeId">${opOptions}</select></label>
        ${importMode ? `<label style="grid-column:1/-1">CSV 导入<textarea name="importCsv" rows="5" placeholder="SN,类型&#10;BAT-SH-1060,电池&#10;CAB-NEW-001,换电柜"></textarea><small style="color:var(--muted)">每行：SN,类型（柜/电池）；首行可为表头</small></label>` : ""}
        <fieldset style="border:1px solid var(--line);border-radius:var(--radius);padding:10px 12px;margin:0;grid-column:1/-1">
          <legend style="font-size:13px;color:var(--muted)">勾选设备（资方库存未入其他清单）</legend>
          <div style="display:grid;gap:6px;margin-top:6px;max-height:200px;overflow:auto">${deviceChecks}</div>
        </fieldset>`;
      document.querySelector("#deviceListModal").classList.add("open");
      document.querySelector("#deviceListMask").classList.add("open");
    }

    function closeDeviceListForm() {
      state.deviceListFormId = null;
      document.querySelector("#deviceListModal").classList.remove("open");
      document.querySelector("#deviceListMask").classList.remove("open");
    }

    function saveDeviceListForm() {
      const form = document.querySelector("#deviceListForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const checked = [...form.querySelectorAll('[name="listDevices"]:checked')].map(el => ({
        sn: el.value, type: el.dataset.type || "电池", status: "待用"
      }));
      const imported = parseDeviceListCsv(data.importCsv);
      imported.forEach(d => {
        if (!checked.some(x => x.sn === d.sn)) checked.push({ ...d, status: "待用" });
      });
      if (!data.name?.trim()) { window.alert("请填写清单名称"); return; }
      if (!checked.length) { window.alert("请至少选择或导入一台设备"); return; }
      const lessee = data.lesseeId ? platformOperators.find(o => o.id === data.lesseeId) : null;
      const today = new Date().toISOString().slice(0, 10);
      if (state.deviceListFormId === "new") {
        const id = "LDL-" + new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2) + "-" + String(leaseDeviceLists.length + 1).padStart(2, "0");
        leaseDeviceLists.unshift({
          id, lessorId: currentEntity().id, name: data.name.trim(),
          lesseeId: lessee?.id || null, lesseeName: lessee?.name || null,
          contractId: null, status: "待绑定",
          devices: checked, replacements: [], updatedAt: today
        });
      } else {
        const dl = getLeaseDeviceList(state.deviceListFormId);
        if (!dl || dl.contractId) { window.alert("已绑定协议的清单不可编辑设备"); return; }
        dl.name = data.name.trim();
        dl.lesseeId = lessee?.id || null;
        dl.lesseeName = lessee?.name || null;
        dl.devices = checked;
        dl.updatedAt = today;
      }
      closeDeviceListForm();
      state.leaseAgreementsTab = "deviceLists";
      render();
    }

    function openDeviceReplaceForm(listId) {
      if (!isLeasingRole()) return;
      const dl = getLeaseDeviceList(listId);
      if (!dl) return;
      const active = activeListDevices(dl);
      const spare = lessorReplaceCandidates(listId);
      state.deviceReplaceListId = listId;
      document.querySelector("#deviceReplaceFormTitle").textContent = "替换设备 · " + dl.id;
      document.querySelector("#deviceReplaceForm").innerHTML = `
        <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("lease_device_replace")} 故障设备退出清单，登记新 SN；<strong>仅保修期内</strong>可替换（平台管理员可编辑保修期）。</p>
        <label>原设备<select name="fromSn" required>${active.map(d => {
          const w = d.warrantyUntil ? ` · 保修至 ${d.warrantyUntil}` : "";
          const expired = d.warrantyUntil && d.warrantyUntil < new Date().toISOString().slice(0, 10) ? "（已过保）" : "";
          return `<option value="${d.sn}" ${expired ? "disabled" : ""}>${d.sn} · ${d.type}${w}${expired}</option>`;
        }).join("")}</select></label>
        <label>新设备<select name="toSn" required>${spare.map(d => `<option value="${d.sn}">${d.sn} · ${d.type}</option>`).join("") || "<option>— 无可用库存 —</option>"}</select></label>
        <label style="grid-column:1/-1">替换原因<textarea name="reason" rows="2" placeholder="如：电池 A 无法维修"></textarea></label>`;
      document.querySelector("#deviceReplaceModal").classList.add("open");
      document.querySelector("#deviceReplaceMask").classList.add("open");
    }

    function closeDeviceReplaceForm() {
      state.deviceReplaceListId = null;
      document.querySelector("#deviceReplaceModal").classList.remove("open");
      document.querySelector("#deviceReplaceMask").classList.remove("open");
    }

    function saveDeviceReplaceForm() {
      const dl = getLeaseDeviceList(state.deviceReplaceListId);
      if (!dl) return;
      const form = document.querySelector("#deviceReplaceForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.fromSn || !data.toSn || data.toSn.includes("无可用")) {
        window.alert("请选择原设备与新设备"); return;
      }
      const fromDev = dl.devices.find(d => d.sn === data.fromSn);
      if (fromDev?.warrantyUntil && fromDev.warrantyUntil < new Date().toISOString().slice(0, 10)) {
        window.alert("该设备已过保修期，不可替换"); return;
      }
      const idx = dl.devices.findIndex(d => d.sn === data.fromSn && d.status !== "已替换");
      if (idx < 0) return;
      const type = dl.devices[idx].type;
      dl.devices[idx].status = "已替换";
      dl.devices.push({ sn: data.toSn, type, status: "在租" });
      if (!dl.replacements) dl.replacements = [];
      dl.replacements.unshift({
        at: new Date().toISOString().slice(0, 10),
        fromSn: data.fromSn, toSn: data.toSn,
        reason: data.reason?.trim() || "设备替换"
      });
      dl.updatedAt = new Date().toISOString().slice(0, 10);
      removeSnFromStandbyLists(data.toSn, dl.id);
      closeDeviceReplaceForm();
      closeDrawer();
      openDeviceListDetail(dl.id);
      render();
    }

    function openLeaseForm(contractId, mode) {
      const lessor = currentEntity();
      const c = contractId ? leaseContracts.find(x => x.id === contractId) : null;
      const formMode = mode || (c ? (c.status === "履约中" ? "change" : "edit") : "new");
      state.leaseFormId = contractId || "new";
      state.leaseFormMode = formMode;
      const lesseeId = c?.lesseeId || "";
      const listOptions = (formMode === "new" || formMode === "edit"
        ? [...availableDeviceListsForLessee(lesseeId), ...(c?.deviceListId ? [getLeaseDeviceList(c.deviceListId)] : [])].filter(Boolean)
        : c?.deviceListId ? [getLeaseDeviceList(c.deviceListId)] : []
      ).filter((dl, i, arr) => dl && arr.findIndex(x => x.id === dl.id) === i);
      const listSelect = listOptions.map(dl =>
        `<option value="${dl.id}" ${c?.deviceListId === dl.id ? "selected" : ""}>${dl.id} · ${dl.name}（${deviceListSnSummary(dl).length} 台）</option>`
      ).join("") || "<option value=\"\">— 请先新建设备清单 —</option>";
      const opOptions = boundOperatorsForLessor(lessor.id).map(o =>
        `<option value="${o.id}" ${c?.lesseeId === o.id ? "selected" : ""}>${o.name}（${o.id}）</option>`
      ).join("") || "<option value=\"\">— 请先在平台建立租赁关系绑定 —</option>";
      const titles = { new: "新增租赁协议", edit: "编辑租赁协议", change: "提交协议变更" };
      document.querySelector("#leaseFormTitle").textContent = titles[formMode] || "租赁协议";
      const changeHint = formMode === "change"
        ? `<p style="font-size:12px;color:var(--muted);margin:0 0 8px;grid-column:1/-1">${noteBtn("lease_confirm")} 变更提交后须<strong>运营商确认</strong>，生效日 <strong>${nextMonthFirstStr()}</strong>（次月 1 日）。设备清单变更请在「设备清单」Tab 维护后在此调整关联或租金。</p>`
        : `<p style="font-size:12px;color:var(--muted);margin:0 0 8px;grid-column:1/-1">${noteBtn("lease_agreements")}${noteBtn("platform_lease_binding")} 承租运营商须为平台已绑定主体；新签须选择<strong>待绑定</strong>设备清单。</p>`;
      document.querySelector("#leaseForm").innerHTML = `
        <div class="perm-banner" style="grid-column:1/-1;margin-bottom:8px">授信评估 · 电子合同：<strong>未接入</strong>（演示入口，D12）</div>
        ${changeHint}
        <label>承租运营商<select name="lesseeId" id="leaseFormLessee" required ${formMode === "change" ? "disabled" : ""}>${opOptions}</select></label>
        <label>关联设备清单<select name="deviceListId" required ${formMode === "change" ? "disabled" : ""}>${listSelect}</select></label>
        ${formMode !== "change" ? `<p style="font-size:12px;margin:0;grid-column:1/-1"><button type="button" class="link-btn" data-jump-device-lists>前往新建设备清单</button></p>` : ""}
        <label>租期类型<select name="termType"><option ${(!c || c.termType === "固定租期") ? "selected" : ""}>固定租期</option><option ${c?.termType === "滚动租期" ? "selected" : ""}>滚动租期</option></select></label>
        <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0">滚动租期终止：须提前 N 天通知 → 生成<strong>终止结算单</strong> → 资方+运营商确认（平台只读）。<button type="button" class="link-btn" id="demoLeaseTerminate">演示终止结算单</button></p>
        <label>起始日<input name="start" type="date" value="${c?.start || new Date().toISOString().slice(0, 10)}" required></label>
        <div class="lease-fixed-fields" style="display:contents">
          <label>截止日<input name="end" type="date" value="${c?.end || ""}"></label>
          <label>租期（月，可选）<input name="periods" type="number" min="1" value="${c?.periods || ""}" placeholder="如 36"></label>
        </div>
        <div class="lease-rolling-fields" style="display:contents">
          <label>提前通知（天）<input name="noticeDays" type="number" min="1" value="${c?.noticeDays || 30}"></label>
        </div>
        <label>月租金（元）<input name="monthlyRent" type="number" min="1" step="0.01" value="${c?.monthlyRent || ""}" required></label>
        <label>押金（元）<input name="deposit" type="number" min="0" value="${c?.deposit || ""}" required></label>
        <label>还款日<select name="repayDayNum">${Array.from({ length: 28 }, (_, i) => {
          const day = i + 1;
          const label = "每月" + day + "日";
          return `<option value="${day}" ${c?.repayDay === label ? "selected" : ""}>${label}</option>`;
        }).join("")}</select></label>
        ${formMode === "change" ? `<label style="grid-column:1/-1">变更原因<textarea name="changeReason" rows="2" required placeholder="如：调整租金、更换关联清单"></textarea></label>` : ""}`;
      bindLeaseFormToggles();
      document.querySelector("#leaseModal").classList.add("open");
      document.querySelector("#leaseMask").classList.add("open");
    }

    function closeLeaseForm() {
      state.leaseFormId = null;
      state.leaseFormMode = null;
      document.querySelector("#leaseModal").classList.remove("open");
      document.querySelector("#leaseMask").classList.remove("open");
    }

    function saveLeaseForm() {
      const form = document.querySelector("#leaseForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.lesseeId && state.leaseFormMode !== "change") {
        window.alert("请选择承租运营商");
        return;
      }
      if (!data.deviceListId && state.leaseFormMode !== "change") {
        window.alert("请选择关联设备清单");
        return;
      }
      const lessee = platformOperators.find(o => o.id === (data.lesseeId || leaseContracts.find(c => c.id === state.leaseFormId)?.lesseeId));
      if (!lessee) { window.alert("承租运营商无效"); return; }
      const lessorEnt = currentEntity();
      if (state.leaseFormMode !== "change" && !isLeaseBindingActive(lessorEnt.id, lessee.id)) {
        window.alert("该运营商未与当前租赁公司建立平台绑定关系，请联系平台管理员在「租赁公司 → 租赁关系绑定」中配置。");
        return;
      }
      const dl = data.deviceListId ? getLeaseDeviceList(data.deviceListId) : null;
      if (state.leaseFormMode !== "change" && (!dl || dl.contractId)) {
        window.alert("请选择未绑定的设备清单");
        return;
      }
      const monthlyRent = Number(data.monthlyRent);
      const deposit = Number(data.deposit);
      const termType = data.termType;
      const payload = {
        lesseeId: lessee.id, lesseeName: lessee.name,
        deviceListId: data.deviceListId || leaseContracts.find(c => c.id === state.leaseFormId)?.deviceListId,
        termType,
        start: data.start, end: termType === "固定租期" ? data.end : null,
        noticeDays: termType === "滚动租期" ? Number(data.noticeDays) || 30 : null,
        monthlyRent, deposit,
        repayDay: "每月" + data.repayDayNum + "日",
        periods: termType === "固定租期" && data.periods ? Number(data.periods) : null,
        totalRent: termType === "固定租期" && data.periods ? monthlyRent * Number(data.periods) : null,
        autoDeduct: false, autoDeductAccountId: null
      };
      const lessor = currentEntity();
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      if (state.leaseFormId === "new") {
        const id = "LC-" + new Date().toISOString().slice(0, 10).replace(/-/g, "").slice(2) + "-" + String(leaseContracts.length + 1).padStart(3, "0");
        leaseContracts.unshift({
          id, lessorId: lessor.id, lessorName: lessor.name,
          ...payload, paidRent: 0, paidPeriods: 0,
          status: "待确认", confirmedAt: null, confirmedBy: null, pendingChange: null
        });
        if (dl) {
          dl.contractId = id;
          dl.lesseeId = lessee.id;
          dl.lesseeName = lessee.name;
          dl.status = "已绑定";
          activeListDevices(dl).forEach(d => { d.status = "在租"; });
        }
      } else {
        const c = leaseContracts.find(x => x.id === state.leaseFormId);
        if (!c) return;
        if (state.leaseFormMode === "change") {
          if (!data.changeReason?.trim()) { window.alert("请填写变更原因"); return; }
          const after = { ...payload, deviceListId: c.deviceListId };
          c.pendingChange = {
            submittedAt: now, submittedBy: lessor.name,
            effectiveDate: nextMonthFirstStr(),
            ...after,
            reason: data.changeReason.trim(),
            changes: leaseChangeDiff(c, after)
          };
          c.status = "变更待确认";
        } else {
          const oldDl = c.deviceListId ? getLeaseDeviceList(c.deviceListId) : null;
          if (oldDl && oldDl.id !== data.deviceListId) {
            oldDl.contractId = null;
            oldDl.status = "待绑定";
          }
          Object.assign(c, payload);
          if (dl && dl.id === data.deviceListId) {
            dl.contractId = c.id;
            dl.lesseeId = lessee.id;
            dl.lesseeName = lessee.name;
            dl.status = "已绑定";
          }
          if (c.status === "已驳回") c.status = "待确认";
        }
      }
      closeLeaseForm();
      closeDrawer();
      state.view = "leaseAgreements";
      render();
    }

    function openFollowForm(billId) {
      const b = leaseRentBills.find(x => x.id === billId);
      if (!b) return;
      const c = leaseContracts.find(x => x.id === b.contractId);
      state.followBillId = billId;
      document.querySelector("#followFormTitle").textContent = "租金跟进 · " + (c?.lesseeName || billId);
      document.querySelector("#followForm").innerHTML = `
        <label>账期<input value="${b.month}" readonly></label>
        <label>待收金额<input value="¥${Math.max(0, b.rentAmount - (b.paidAmount || 0)).toLocaleString("zh-CN")}" readonly></label>
        <label>跟进方式<select name="method"><option>电话催收</option><option>对公提醒</option><option>上门沟通</option><option>其他</option></select></label>
        <label style="grid-column:1/-1">跟进记录<textarea name="note" rows="3" placeholder="记录沟通内容与承诺还款时间"></textarea></label>`;
      document.querySelector("#followModal").classList.add("open");
      document.querySelector("#followMask").classList.add("open");
    }

    function closeFollowForm() {
      state.followBillId = null;
      document.querySelector("#followModal").classList.remove("open");
      document.querySelector("#followMask").classList.remove("open");
    }

    function saveFollowForm() {
      const b = leaseRentBills.find(x => x.id === state.followBillId);
      if (!b) return;
      const form = document.querySelector("#followForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const today = new Date().toISOString().slice(0, 10);
      b.autoStatus = (data.method || "电话催收") + " · " + today + (data.note ? "：" + data.note.slice(0, 40) : "");
      closeFollowForm();
      render();
    }

    function renderAccounts() {
      const opId = currentEntity().id;
      const isLeaseCh = isLeaseChannel();
      const isCardInstant = isCardChannel() && channelInstantCommissionEnabled(opId);
      let body = "";
      if (isLeaseCh) {
        const rows = paymentAccounts.filter(a => a.entityId === opId);
        body = `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("lease_whitelist_pkg")} 设备租赁模式：<strong>白名单用户购套餐</strong>款进入本渠道子商户，<strong>不经运营商提现审核</strong>；设备月租 MO 仍付运营商。</p>
          <table>
            <thead><tr><th>账户编号</th><th>通道</th><th>商户名称</th><th>商户号/账号</th><th>用途</th><th>状态</th><th>默认</th></tr></thead>
            <tbody>${rows.map(a => accountRowHtml(a)).join("") || "<tr><td colspan='7'>暂无账户</td></tr>"}</tbody>
          </table>`;
      } else if (isCardInstant) {
        const rows = paymentAccounts.filter(a => a.entityId === opId);
        body = `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("channel_card_accounts")} 运营商已为您开启<strong>佣金及时到付</strong>；链接购卡佣金将分账至以下子商户。用户套餐款仍进运营商子商户。</p>
          <table>
            <thead><tr><th>账户编号</th><th>通道</th><th>商户名称</th><th>商户号/账号</th><th>用途</th><th>状态</th><th>默认</th></tr></thead>
            <tbody>${rows.map(a => accountRowHtml(a)).join("") || "<tr><td colspan='7'>暂无账户，请联系运营商协助进件</td></tr>"}</tbody>
          </table>`;
      } else if (isCardChannel()) {
        body = `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("channel_instant_commission")} 当前签约未开启佣金及时到付，无需配置收款账户。用户经推广链接购卡款进运营商子商户。</p>
          <div class="empty" style="padding:24px;text-align:center;color:var(--muted)">未开启即时到付 · 无收款账户</div>`;
      } else {
        const rows = paymentAccounts.filter(a => a.entityId === opId);
        body = `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("arch_b")} 骑手套餐默认入账标记为「骑手套餐收款」的微信商户。</p>
          <table>
            <thead><tr><th>账户编号</th><th>通道</th><th>商户名称</th><th>商户号/账号</th><th>用途</th><th>状态</th><th>默认</th></tr></thead>
            <tbody>${rows.length ? rows.map(a => accountRowHtml(a)).join("") : "<tr><td colspan='7'>暂无账户，请进件开通</td></tr>"}</tbody>
          </table>`;
      }
      function accountRowHtml(a) {
        return `<tr>
          <td>${a.id}</td><td>${a.channel}</td><td>${a.mchName}</td><td>${a.mchNo}</td>
          <td>${a.purpose}</td><td>${tag(a.status)}</td><td>${a.default ? tag("默认") : "—"}</td>
        </tr>`;
      }
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("收款账户管理", isLeaseCh ? "白名单套餐 C 端收款进件账户" : isCardInstant ? "链接购卡佣金分账进件账户" : isCardChannel() ? "佣金及时到付（未开启）" : "本主体全部进件账户；骑手收款须与资金实收商户号一致", isCardInstant ? "channel_card_accounts" : "accounts_panel")}
          <div class="panel-body orders-table-wrap">
            ${body}
          </div>
        </section>`;
    }

    function openOperatorDetail(opId) {
      const op = platformOperators.find(o => o.id === opId);
      if (!op) return;
      const credit = creditForOperator(op.id);
      const prof = operatorCreditProfile(op.id);
      const tier = prof?.tierCode ? admissionTierByCode(prof.tierCode) : null;
      const st = operatorAggregateStats(op.id);
      document.querySelector("#drawerTitle").textContent = op.name;
      document.querySelector("#drawerSub").textContent = op.id + " · " + op.city + " · " + op.status;
      document.querySelector("#drawerBody").innerHTML = `
        <section class="panel" style="margin:0">
          ${panelHead("基础信息", "平台维护的运营商主体", "platform_operators")}
          <div class="panel-body" style="padding-top:0">
            <div class="detail-grid">
              <div class="detail-item"><span>联系人</span><strong>${op.contactName}<br><small>${op.contactPhone}</small></strong></div>
              <div class="detail-item"><span>邮箱</span><strong>${op.email || "—"}</strong></div>
              <div class="detail-item"><span>地址</span><strong style="white-space:normal">${op.address || "—"}</strong></div>
              <div class="detail-item"><span>入驻日期</span><strong>${op.onboardDate}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("准入档位", prof?.tierCode ? "平台定档政策包（只读）" : "尚未定档", "operator_credit_eval")}
          <div class="panel-body" style="padding-top:0">
            ${tier ? `<div class="detail-grid">
              <div class="detail-item"><span>当前档位</span><strong>${tierLabel(prof.tierCode)}</strong></div>
              <div class="detail-item"><span>信用封顶</span><strong>¥${tier.creditCap.toLocaleString("zh-CN")}</strong></div>
              <div class="detail-item"><span>最低保证金</span><strong>${formatMinDeposit(tier)}</strong></div>
              <div class="detail-item"><span>跨网默认</span><strong>${tier.crossNetworkDefault ? "开" : "关"}</strong></div>
              <div class="detail-item"><span>档位用途</span><strong>融资参考 · 已签渠道 ${st.channels}（不限）</strong></div>
              <div class="detail-item"><span>下次复审</span><strong>${prof.nextReviewAt || "—"}</strong></div>
            </div>` : `<p style="margin:0;font-size:13px;color:var(--warn)">该运营商尚未完成入网定档，请前往「运营商信用评估」。</p>`}
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("清分账户", "保证金优先，用尽后启用信用额度", "operator_deposit")}
          <div class="panel-body" style="padding-top:0">
            <div class="detail-grid">
              <div class="detail-item"><span>平台保证金</span><strong>¥${(credit?.depositBalance || 0).toLocaleString("zh-CN")}</strong></div>
              <div class="detail-item"><span>信用额度</span><strong>¥${(credit?.creditLimit || 0).toLocaleString("zh-CN")}</strong><br><small>已用 ¥${(credit?.used || 0).toLocaleString("zh-CN")} · 可用 ¥${(credit?.available || 0).toLocaleString("zh-CN")}</small></div>
              <div class="detail-item"><span>跨网换电</span><strong>${credit?.crossSwapEnabled ? tag("已开启") : tag("已关闭")}</strong></div>
              <div class="detail-item"><span>欠费</span><strong>${credit?.owed ? "¥" + credit.owed.toLocaleString("zh-CN") : "—"}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("平台服务费比例", "平台统一配置 · 本主体只读", "platform_operator_fee_rate")}
          <div class="panel-body" style="padding-top:0">
            <div class="detail-grid">
              <div class="detail-item"><span>C 端抽成</span><strong class="fee-platform">${formatFeeRatePct(operatorPlatformFeeConfig(op.id).cEndRate)}</strong><br><small>支付成功分账</small></div>
              <div class="detail-item"><span>B 端抽成</span><strong class="fee-platform">${formatFeeRatePct(operatorPlatformFeeConfig(op.id).bEndRate)}</strong><br><small>确认消耗计提</small></div>
              <div class="detail-item"><span>生效日</span><strong>${operatorPlatformFeeConfig(op.id).effectiveFrom}</strong></div>
              <div class="detail-item"><span>备注</span><strong style="white-space:normal">${operatorPlatformFeeConfig(op.id).remark || "—"}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("进件账户摘要", "骑手收款子商户（演示）", "accounts")}
          <div class="panel-body" style="padding-top:0">
            <div class="detail-grid">
              <div class="detail-item"><span>微信子商户</span><strong>${op.mchWx || "—"}</strong></div>
              <div class="detail-item"><span>支付宝子商户</span><strong>${op.mchAli || "—"}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("经营汇总", "全平台可见的统计摘要", "platform_stats")}
          <div class="panel-body" style="padding-top:0">
            <div class="detail-grid">
              <div class="detail-item"><span>站点</span><strong>${st.sites}</strong></div>
              <div class="detail-item"><span>柜机/电池</span><strong>${st.cabinets} / ${st.batteries}</strong></div>
              <div class="detail-item"><span>用户</span><strong>${st.users}</strong></div>
              <div class="detail-item"><span>签约渠道</span><strong>${st.channels}</strong></div>
              <div class="detail-item"><span>套餐单</span><strong>${st.packageOrders}</strong></div>
              <div class="detail-item"><span>换电成功</span><strong>${st.swapOrders}</strong></div>
              <div class="detail-item"><span>业务流水</span><strong>¥${st.turnover.toLocaleString("zh-CN")}</strong></div>
              <div class="detail-item"><span>平台营收贡献</span><strong>¥${st.platformRevenue.toLocaleString("zh-CN")}</strong></div>
            </div>
          </div>
        </section>
        ${op.remark ? `<p style="font-size:12px;color:var(--muted);margin:12px 0 0">备注：${op.remark}</p>` : ""}
        <div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn primary" data-edit-operator="${op.id}">编辑信息</button>
          <button type="button" class="btn" data-edit-platform-fee-rate="${op.id}">编辑平台费率</button>
          <button type="button" class="btn" data-view-jump="depositManage" data-depstab-jump="pending">保证金管理</button>
          <button type="button" class="btn" data-view-jump="operatorCreditEval">信用评估</button>
        </div>`;
      state.detailOperatorId = opId;
      state.detailSubId = null;
      state.detailSwapId = null;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function openOperatorForm(opId) {
      const op = opId ? platformOperators.find(o => o.id === opId) : null;
      state.operatorFormId = opId || "new";
      document.querySelector("#operatorFormTitle").textContent = op ? "编辑运营商 · " + op.name : "新增运营商";
      document.querySelector("#operatorForm").innerHTML = `
        <label>运营商名称<input name="name" value="${op?.name || ""}" required placeholder="如：绿色出行" /></label>
        <label>城市<select name="city"><option ${(!op || op.city === "上海") ? "selected" : ""}>上海</option><option ${op?.city === "杭州" ? "selected" : ""}>杭州</option></select></label>
        <label>状态<select name="status"><option ${(!op || op.status === "在营") ? "selected" : ""}>在营</option><option ${op?.status === "已停用" ? "selected" : ""}>已停用</option></select></label>
        <label>联系人<input name="contactName" value="${op?.contactName || ""}" /></label>
        <label>联系电话<input name="contactPhone" value="${op?.contactPhone || ""}" /></label>
        <label>邮箱<input name="email" type="email" value="${op?.email || ""}" /></label>
        <label>地址<input name="address" value="${op?.address || ""}" /></label>
        <label>微信子商户号<input name="mchWx" value="${op?.mchWx || ""}" placeholder="1900000***" /></label>
        <label>支付宝子商户号<input name="mchAli" value="${op?.mchAli || ""}" placeholder="2088***" /></label>
        <label>备注<textarea name="remark" rows="2">${op?.remark || ""}</textarea></label>`;
      document.querySelector("#operatorModal").classList.add("open");
      document.querySelector("#operatorMask").classList.add("open");
    }

    function closeOperatorForm() {
      state.operatorFormId = null;
      document.querySelector("#operatorModal").classList.remove("open");
      document.querySelector("#operatorMask").classList.remove("open");
    }

    function syncLeasingCompanyName(lessorId, name) {
      leaseContracts.filter(c => c.lessorId === lessorId).forEach(c => { c.lessorName = name; });
      leaseDeviceLists.filter(dl => dl.lessorId === lessorId).forEach(dl => { /* id only */ });
      cabinets.filter(c => c.lessorId === lessorId).forEach(c => { c.lessorName = name; });
      batteries.filter(b => b.lessorId === lessorId).forEach(b => { b.lessorName = name; });
      paymentAccounts.filter(a => a.entityId === lessorId).forEach(a => { a.mchName = name; });
      if (lessorId === "LEASE-HD") ENT.leasing.name = name;
    }

    function openLeasingCompanyForm(lessorId) {
      const l = lessorId ? platformLeasingCompanies.find(x => x.id === lessorId) : null;
      state.leasingCompanyFormId = lessorId || "new";
      document.querySelector("#leasingCompanyFormTitle").textContent = l ? "编辑租赁公司 · " + l.name : "新增租赁公司";
      document.querySelector("#leasingCompanyForm").innerHTML = `
        <label>公司名称<input name="name" value="${l?.name || ""}" required placeholder="如：华东设备租赁公司" /></label>
        <label>城市<select name="city"><option ${(!l || l.city === "上海") ? "selected" : ""}>上海</option><option ${l?.city === "杭州" ? "selected" : ""}>杭州</option><option ${l?.city === "苏州" ? "selected" : ""}>苏州</option></select></label>
        <label>状态<select name="status"><option ${(!l || l.status === "在营") ? "selected" : ""}>在营</option><option ${l?.status === "已停用" ? "selected" : ""}>已停用</option></select></label>
        <label>联系人<input name="contactName" value="${l?.contactName || ""}" /></label>
        <label>联系电话<input name="contactPhone" value="${l?.contactPhone || ""}" /></label>
        <label>统一社会信用代码<input name="licenseNo" value="${l?.licenseNo || ""}" placeholder="91310000MA****" /></label>
        <label>入驻日期<input name="onboardDate" type="date" value="${l?.onboardDate || new Date().toISOString().slice(0, 10)}" /></label>
        <label style="grid-column:1/-1">备注<textarea name="remark" rows="2">${l?.remark || ""}</textarea></label>
        ${l ? `<label>主体编号<input value="${l.id}" readonly /></label>` : ""}`;
      document.querySelector("#leasingCompanyModal").classList.add("open");
      document.querySelector("#leasingCompanyMask").classList.add("open");
    }

    function closeLeasingCompanyForm() {
      state.leasingCompanyFormId = null;
      document.querySelector("#leasingCompanyModal").classList.remove("open");
      document.querySelector("#leasingCompanyMask").classList.remove("open");
    }

    function saveLeasingCompanyForm() {
      const form = document.querySelector("#leasingCompanyForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim()) {
        window.alert("请填写公司名称");
        return;
      }
      if (state.leasingCompanyFormId === "new") {
        const id = "LEASE-" + Date.now().toString().slice(-4);
        platformLeasingCompanies.push({
          id, name: data.name.trim(), city: data.city, status: data.status,
          contactName: data.contactName, contactPhone: data.contactPhone,
          onboardDate: data.onboardDate || new Date().toISOString().slice(0, 10),
          licenseNo: data.licenseNo, remark: data.remark
        });
        ENTITY_ROLE[id] = "leasing";
      } else {
        const l = platformLeasingCompanies.find(x => x.id === state.leasingCompanyFormId);
        if (!l) return;
        const prevName = l.name;
        Object.assign(l, {
          name: data.name.trim(), city: data.city, status: data.status,
          contactName: data.contactName, contactPhone: data.contactPhone,
          onboardDate: data.onboardDate, licenseNo: data.licenseNo, remark: data.remark
        });
        if (prevName !== l.name) syncLeasingCompanyName(l.id, l.name);
      }
      closeLeasingCompanyForm();
      state.view = "platformLeasing";
      state.platformLeasingTab = "companies";
      render();
      window.alert("租赁公司信息已保存（演示）");
    }

    function myOperatorSites() {
      const ownSiteNames = [...new Set(cabinets.filter(c => c.deviceOwnerId === currentEntity().id).map(c => c.site))];
      return sites.filter(s => s.operatorId === currentEntity().id || ownSiteNames.includes(s.name));
    }

    function openSiteForm(siteId) {
      const site = siteId ? sites.find(s => s.id === siteId) : null;
      const dedicated = !!site?.channelDedicated;
      state.siteFormId = siteId || "new";
      document.querySelector("#siteFormTitle").textContent = site ? "编辑站点 · " + site.name : "新增站点";
      const dedicatedNote = dedicated ? `<p class="perm-banner" style="grid-column:1/-1;margin:0">渠道专属站点由<strong>渠道合同</strong>创建；此处仅可修改地址与营业状态。</p>` : "";
      document.querySelector("#siteForm").innerHTML = dedicatedNote + `
        <label>站点名称<input name="name" value="${site?.name || ""}" required placeholder="如：浦东骑手驿站" ${dedicated ? "readonly" : ""} /></label>
        <label>城市<select name="city" ${dedicated ? "disabled" : ""}><option ${(!site || site.city === "上海") ? "selected" : ""}>上海</option><option ${site?.city === "杭州" ? "selected" : ""}>杭州</option></select></label>
        <label style="grid-column:1/-1">详细地址<input name="address" value="${site?.address || ""}" required placeholder="省市区 + 门牌号" /></label>
        <label>站点类型<select name="type" ${dedicated ? "disabled" : ""}>
          <option ${(!site || site.type === "配送站") ? "selected" : ""}>配送站</option>
          <option ${site?.type === "写字楼" ? "selected" : ""}>写字楼</option>
          ${dedicated ? `<option selected>渠道专属</option>` : ""}
        </select></label>
        <label>营业状态<select name="status"><option ${(!site || site.status === "在营") ? "selected" : ""}>在营</option><option ${site?.status === "建设中" ? "selected" : ""}>建设中</option><option ${site?.status === "已停用" ? "selected" : ""}>已停用</option></select></label>
        ${site ? `<label>站点编号<input value="${site.id}" readonly /></label>` : ""}`;
      document.querySelector("#siteModal").classList.add("open");
      document.querySelector("#siteMask").classList.add("open");
    }

    function closeSiteForm() {
      state.siteFormId = null;
      document.querySelector("#siteModal").classList.remove("open");
      document.querySelector("#siteMask").classList.remove("open");
    }

    function saveSiteForm() {
      const form = document.querySelector("#siteForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim() || !data.address?.trim()) {
        window.alert("请填写站点名称与地址");
        return;
      }
      if (state.siteFormId === "new") {
        const seq = String(sites.length + 1).padStart(2, "0");
        const id = "ST-SH-" + seq;
        sites.push({
          id, name: data.name.trim(), city: data.city, address: data.address.trim(),
          type: data.type, cabinets: 0, batteries: 0, status: data.status,
          operatorId: currentEntity().id, waitingCount: 0
        });
      } else {
        const site = sites.find(s => s.id === state.siteFormId);
        if (!site || site.operatorId !== currentEntity().id) return;
        if (site.channelDedicated) {
          site.address = data.address.trim();
          site.status = data.status;
        } else {
          site.name = data.name.trim();
          site.city = data.city;
          site.address = data.address.trim();
          site.type = data.type;
          site.status = data.status;
        }
      }
      closeSiteForm();
      render();
      window.alert("站点已保存（演示）");
    }

    function saveOperatorForm() {
      const form = document.querySelector("#operatorForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (state.operatorFormId === "new") {
        const id = "OP-" + Date.now().toString().slice(-4);
        platformOperators.push({
          id, name: data.name, city: data.city, status: data.status,
          contactName: data.contactName, contactPhone: data.contactPhone, email: data.email,
          address: data.address, onboardDate: new Date().toISOString().slice(0, 10),
          mchWx: data.mchWx, mchAli: data.mchAli, remark: data.remark
        });
        operatorCreditAccounts.push({ operatorId: id, depositBalance: 0, creditLimit: 0, used: 0, available: 0, crossSwapEnabled: false, owed: 0 });
        operatorCreditProfiles.push({ operatorId: id, tierCode: null, status: "待定档", assignedAt: null, assignedBy: null, nextReviewAt: null, assignReason: null });
        operatorSwapPolicy[id] = { crossNetworkEnabled: false };
        operatorPlatformFeeRates[id] = {
          cEndRate: DEFAULT_PLATFORM_FEE_RATE, bEndRate: DEFAULT_PLATFORM_FEE_RATE,
          effectiveFrom: new Date().toISOString().slice(0, 10), status: "生效",
          updatedAt: new Date().toISOString().slice(0, 10), updatedBy: "平台管理员", remark: "新入网默认 1%"
        };
      } else {
        const op = platformOperators.find(o => o.id === state.operatorFormId);
        if (op) Object.assign(op, data);
      }
      closeOperatorForm();
      state.view = "operators";
      render();
      window.alert("演示：运营商信息已保存（Mock）");
    }

    function cardSkuPricingFieldsHtml(channelId) {
      const skus = channelId
        ? channelLinkSkus.filter(s => s.channelId === channelId)
        : [
          { id: "new-30D", name: "包月30天卡", officialPrice: 299, channelPrice: 279, commissionPerOrder: 25 },
          { id: "new-7D", name: "7天卡", officialPrice: 89, channelPrice: 79, commissionPerOrder: 8 }
        ];
      return `<div class="field-card card-sku-pricing form-span-2" style="padding:12px;border:1px solid var(--line);border-radius:8px;background:var(--surface-soft)">
        <p style="font-size:12px;font-weight:600;margin:0 0 10px">授权套餐 · 正式零售价 / 渠道专享价 / 佣金（单）</p>
        <div class="orders-table-wrap">
        <table style="width:100%;font-size:13px;border-collapse:collapse">
          <thead><tr><th style="text-align:left;padding:8px 6px">SKU</th><th style="padding:8px 6px">正式价</th><th style="padding:8px 6px">渠道专享价</th><th style="padding:8px 6px">佣金/单</th></tr></thead>
          <tbody>${skus.map(s => `<tr>
            <td style="padding:8px 6px"><strong>${s.name}</strong></td>
            <td style="padding:8px 6px"><input name="sku_o_${s.id}" type="number" min="1" step="0.01" value="${s.officialPrice}" /></td>
            <td style="padding:8px 6px"><input name="sku_c_${s.id}" type="number" min="1" step="0.01" value="${s.channelPrice}" /></td>
            <td style="padding:8px 6px"><input name="sku_m_${s.id}" type="number" min="0" step="0.01" value="${s.commissionPerOrder}" /></td>
          </tr>`).join("")}</tbody>
        </table>
        </div>
        <p style="font-size:12px;color:var(--muted);margin:10px 0 0">专享价须 ≤ 正式价；各分销渠道可配置<strong>不同</strong>专享价与佣金。</p>
      </div>`;
    }

    function applyCardSkuPricingFromForm(channelId, formData, isNew) {
      const templates = isNew
        ? [
          { id: "new-30D", skuId: "SKU-" + channelId.slice(-4) + "-30D", name: "包月30天卡", validityDays: 30, linkCode: "lnk-30d" },
          { id: "new-7D", skuId: "SKU-" + channelId.slice(-4) + "-7D", name: "7天卡", validityDays: 7, linkCode: "lnk-7d" }
        ]
        : channelSalePackages.filter(s => s.channelId === channelId).map(s => ({ id: s.id, skuId: s.skuId, name: s.name, validityDays: s.validityDays }));
      templates.forEach(t => {
        const o = parseFloat(formData["sku_o_" + t.id]);
        const c = parseFloat(formData["sku_c_" + t.id]);
        const m = parseFloat(formData["sku_m_" + t.id]);
        if (!Number.isFinite(o) || !Number.isFinite(c) || !Number.isFinite(m) || c > o) return;
        const existing = channelSalePackages.find(s => s.skuId === t.skuId || s.id === t.id);
        if (existing) {
          existing.officialPrice = o;
          existing.channelPrice = c;
          existing.commissionPerOrder = m;
        } else {
          channelSalePackages.push({
            id: "PKG-" + channelId.replace(/-/g, "") + "-" + t.skuId.slice(-3),
            channelId, skuId: t.skuId, name: t.name, officialPrice: o, channelPrice: c, commissionPerOrder: m,
            validityDays: t.validityDays, status: "启用"
          });
        }
      });
    }

    function openChannelPartnerForm(contractId) {
      const op = currentEntity();
      const contract = contractId ? channelContracts.find(c => c.id === contractId && c.operatorId === op.id) : null;
      const ch = contract ? platformChannels.find(c => c.id === contract.channelId) : null;
      const mode = contract ? contractSettlementMode(contract) : "人天池";
      state.channelPartnerContractId = contractId || "new";
      const stdPrice = platformAccrualDayPrice();
      const modeSelect = contract
        ? `<label>结算模式<input value="${mode}${mode === "设备租赁" || mode === "激活码" ? "（二期）" : ""}" readonly /></label>`
        : `<label>结算模式<select name="settlementMode" id="channelPartnerMode">
            <option value="人天池">人天池</option>
            <option value="卡差价">卡差价</option>
            <option value="设备租赁">设备租赁（二期）</option>
            <option value="激活码">激活码（二期）</option>
          </select></label>`;
      document.querySelector("#channelPartnerFormTitle").textContent = contract
        ? "编辑渠道商 · " + (ch?.name || contract.channelName)
        : "新增渠道商";
      document.querySelector("#channelPartnerForm").innerHTML = `
        <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0 0 4px">${noteBtn("channel_partner_manage")} 保存后同步至平台「渠道商管理」（平台只读监管）。</p>
        <label>渠道商名称<input name="name" value="${ch?.name || ""}" required placeholder="如：同城配送渠道" /></label>
        <label>登录账号<input name="loginAccount" value="${ch?.loginAccount || ""}" required placeholder="channel-admin" /></label>
        ${modeSelect}
        <label>城市<select name="city"><option ${(!ch || ch.city === "上海") ? "selected" : ""}>上海</option><option ${ch?.city === "杭州" ? "selected" : ""}>杭州</option></select></label>
        <label>状态<select name="status"><option ${(!ch || ch.status === "在营") ? "selected" : ""}>在营</option><option ${ch?.status === "已停用" ? "selected" : ""}>已停用</option></select></label>
        <p class="field-rent form-span-2" style="font-size:12px;color:var(--warn);margin:0">${phase2BadgeHtml()} 设备租赁（二期）·「已停用」后：白名单用户<strong>不出电</strong>，仍可<strong>还电入柜</strong>；扫码提示「当前站点已到期，请联系管理员续费」。</p>
        <label>联系人<input name="contactName" value="${ch?.contactName || ""}" placeholder="选填" /></label>
        <label>联系电话<input name="contactPhone" value="${ch?.contactPhone || ""}" placeholder="选填" /></label>
        <label class="field-day">批发单价（元/人天）<input name="wholesalePrice" type="number" min="0.1" step="0.1" value="${contract?.wholesalePrice ?? stdPrice}" /></label>
        <label class="field-day">最低起购（人天）<input name="minDays" type="number" min="1" step="1" value="${contract?.minDays ?? 500}" /></label>
        <label class="field-act">单码批发价（元）<input name="wholesalePriceAct" type="number" min="1" step="1" value="${contract?.wholesalePrice ?? 255}" /></label>
        <label class="field-act">最低起购（码）<input name="minCodes" type="number" min="1" step="1" value="${contract?.minCodes ?? 100}" /></label>
        <label class="field-act">默认套餐码<select name="codeSkuName">
          <option ${(!contract || contract.codeSkuName === "30天包月") ? "selected" : ""}>30天包月</option>
          <option ${contract?.codeSkuName === "7天体验" ? "selected" : ""}>7天体验</option>
        </select></label>
        <label class="field-act">服务人天（计提用）<input name="codeValidityDays" type="number" min="1" step="1" value="${contract?.codeValidityDays ?? 30}" /></label>
        <p class="field-act form-span-2" style="font-size:12px;color:var(--muted);margin:0">${phase2BadgeHtml()} 激活码（二期）：渠道批发码库存；骑手核销获套餐；平台 1% 在核销时按标准人天价×服务人天×B 端费率计提。</p>
        ${cardSkuPricingFieldsHtml(contract?.channelId)}
        <div class="field-card field-card-instant form-span-2" style="padding:12px;border:1px solid var(--line);border-radius:8px;background:#f8fafc">
          <p style="font-size:12px;font-weight:600;margin:0 0 10px">${noteBtn("channel_instant_commission")} 佣金及时到付（仅渠道分销）</p>
          <label>开启即时到付<select name="instantCommissionPayout" id="instantCommissionPayout">
            <option value="0" ${!contract?.instantCommissionPayout ? "selected" : ""}>关闭 · 佣金线下结算</option>
            <option value="1" ${contract?.instantCommissionPayout ? "selected" : ""}>开启 · 支付成功即时分账至渠道</option>
          </select></label>
          <label class="field-card-instant-on">渠道佣金比例（%）<input name="commissionRatePct" type="number" min="0.1" max="50" step="0.1" value="${contract?.commissionRate != null ? (contract.commissionRate * 100) : 9}" /></label>
          <p class="field-card-instant-on form-span-2" style="font-size:12px;color:var(--muted);margin:8px 0 0">平台服务费仍按默认 <strong>1%</strong> 即时清分。开启须渠道在「收款账户」完成进件（微信/支付宝子商户）。</p>
          ${contract?.channelId && !channelHasPayoutAccount(contract.channelId) ? `<p class="field-card-instant-on form-span-2" style="font-size:12px;color:var(--warn);margin:8px 0 0">⚠ 当前渠道尚未开通收款账户，无法正式开启即时到付。</p>` : ""}
        </div>
        <label class="field-rent">月租（元/月 · 签约统一价）<input name="monthlyRent" type="number" min="1000" step="100" value="${contract?.monthlyRent ?? 12000}" /></label>
        <label class="field-rent">白名单默认类型<select name="whitelistDefaultAccess">
          <option value="paid" ${contract?.whitelistDefaultAccess !== "free" ? "selected" : ""}>白名单付费（须购白名单套餐）</option>
          <option value="free" ${contract?.whitelistDefaultAccess === "free" ? "selected" : ""}>白名单免费（B2B 月租覆盖）</option>
        </select></label>
        <div class="field-rent form-span-2" style="padding:12px;border:1px solid var(--line);border-radius:8px;background:#f8fafc">
          <p style="font-size:12px;font-weight:600;margin:0 0 10px">${noteBtn("channel_lease_crossnet")} 跨网换电（小型运营商）</p>
          <label>开通跨网<select name="crossNetworkEnabled">
            <option value="1" ${contract?.crossNetworkEnabled !== false ? "selected" : ""}>开通 · 须缴平台跨网保证金</option>
            <option value="0" ${contract?.crossNetworkEnabled === false ? "selected" : ""}>关闭</option>
          </select></label>
          <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:8px 0 0">设备租赁渠道可视为<strong>小型运营商</strong>：名下骑手 userOwner=渠道。开通后骑手在他网换电产生<strong>跨网设备服务费</strong>，由渠道向平台保证金/信用额度支付（演示保证金 ¥20,000）。</p>
        </div>
        <label class="field-rent">专属站点 ${noteBtn("lease_dedicated_site")}<select name="dedicatedSiteId">
          <option value="">（暂不绑定）</option>
          <option value="new">+ 新建专属站点</option>
          ${sites.filter(s => s.operatorId === op.id).map(s => `<option value="${s.id}" ${contract?.dedicatedSiteId === s.id ? "selected" : ""}>${s.name}${s.channelDedicated ? " · 渠道专属" : ""}</option>`).join("")}
        </select></label>
        <label class="field-rent form-span-2">新建站点名称<input name="newSiteName" placeholder="选择「+ 新建专属站点」时填写" /></label>
        <p class="field-rent form-span-2" style="font-size:12px;color:var(--muted);margin:0">月租为签约<strong>统一价</strong>；专属站专用；白名单由渠道自行维护。</p>
        <label>合同有效期起<input name="validFrom" type="date" value="${contract?.validFrom || "2026-01-01"}" required /></label>
        <label>合同有效期止<input name="validTo" type="date" value="${contract?.validTo || "2026-12-31"}" required /></label>
        <label>签约状态<select name="contractStatus"><option ${(!contract || contract.status === "启用") ? "selected" : ""}>启用</option><option ${contract?.status === "停用" ? "selected" : ""}>停用</option></select></label>
        <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0">人天池：自动建池 · 渠道分销：配置授权 SKU 专享价/佣金 · <span class="badge-p2">二期</span>设备租赁：统一月租与专属站 · <span class="badge-p2">二期</span>激活码：批发码库存</p>`;
      const syncModeFields = () => {
        const m = contract ? mode : (document.querySelector("#channelPartnerMode")?.value || "人天池");
        document.querySelectorAll(".field-day, .field-card, .field-rent, .field-act").forEach(el => { el.style.display = "none"; });
        if (m === "人天池") document.querySelectorAll(".field-day").forEach(el => { el.style.display = ""; });
        if (m === "卡差价") document.querySelectorAll(".field-card").forEach(el => { el.style.display = ""; });
        if (m === "设备租赁") document.querySelectorAll(".field-rent").forEach(el => { el.style.display = ""; });
        if (m === "激活码") document.querySelectorAll(".field-act").forEach(el => { el.style.display = ""; });
        const instantOn = document.querySelector("#instantCommissionPayout")?.value === "1";
        document.querySelectorAll(".field-card-instant-on").forEach(el => {
          el.style.display = (m === "卡差价" && instantOn) ? "" : "none";
        });
        const modal = document.querySelector("#channelPartnerModal");
        if (modal) modal.style.width = m === "卡差价" ? "min(720px,calc(100vw - 32px))" : "min(640px,calc(100vw - 32px))";
      };
      syncModeFields();
      document.querySelector("#channelPartnerMode")?.addEventListener("change", syncModeFields);
      document.querySelector("#instantCommissionPayout")?.addEventListener("change", syncModeFields);
      document.querySelector("#channelPartnerModal").classList.add("open");
      document.querySelector("#channelPartnerMask").classList.add("open");
    }

    function closeChannelPartnerForm() {
      state.channelPartnerContractId = null;
      document.querySelector("#channelPartnerModal").classList.remove("open");
      document.querySelector("#channelPartnerMask").classList.remove("open");
    }

    function saveChannelPartnerForm() {
      const op = currentEntity();
      const form = document.querySelector("#channelPartnerForm");
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.name?.trim() || !data.loginAccount?.trim()) {
        window.alert("请填写渠道商名称与登录账号");
        return;
      }
      const settlementMode = data.settlementMode || channelContracts.find(c => c.id === state.channelPartnerContractId)?.settlementMode || "人天池";
      let wholesalePrice = parseFloat(data.wholesalePrice);
      if (settlementMode === "卡差价") {
        wholesalePrice = null;
      } else if (settlementMode === "激活码") {
        wholesalePrice = parseFloat(data.wholesalePriceAct) || parseFloat(data.wholesalePrice) || 255;
      }
      const minDays = settlementMode === "人天池" ? parseInt(data.minDays, 10) : null;
      const minCodes = settlementMode === "激活码" ? parseInt(data.minCodes, 10) : null;
      const codeSkuName = settlementMode === "激活码" ? (data.codeSkuName || "30天包月") : null;
      const codeValidityDays = settlementMode === "激活码" ? parseInt(data.codeValidityDays, 10) || 30 : null;
      const monthlyRent = settlementMode === "设备租赁" ? parseFloat(data.monthlyRent) : null;
      const instantCommissionPayout = settlementMode === "卡差价" && data.instantCommissionPayout === "1";
      const commissionRatePct = parseFloat(data.commissionRatePct);
      const commissionRate = instantCommissionPayout && Number.isFinite(commissionRatePct) ? commissionRatePct / 100 : null;
      if (settlementMode === "卡差价" && instantCommissionPayout) {
        if (!Number.isFinite(commissionRatePct) || commissionRatePct <= 0 || commissionRatePct > 50) {
          window.alert("请填写有效的渠道佣金比例（0.1%～50%）");
          return;
        }
        const cidCheck = state.channelPartnerContractId === "new" ? null : channelContracts.find(c => c.id === state.channelPartnerContractId)?.channelId;
        if (cidCheck && !channelHasPayoutAccount(cidCheck)) {
          window.alert("无法开启：请渠道商先在「收款账户」完成支付通道进件");
          return;
        }
      }
      let dedicatedSiteId = settlementMode === "设备租赁" ? (data.dedicatedSiteId || null) : null;
      let dedicatedSiteName = null;
      if (settlementMode === "设备租赁" && dedicatedSiteId === "new" && data.newSiteName?.trim()) {
        dedicatedSiteId = "ST-" + Date.now().toString().slice(-6);
        dedicatedSiteName = data.newSiteName.trim();
        sites.push({ id: dedicatedSiteId, name: dedicatedSiteName, city: data.city || "上海", address: "（待完善）", type: "渠道专属", cabinets: 0, batteries: 0, status: "在营", operatorId: op.id, channelDedicated: true, publicOpen: false, visibilityMode: "whitelist_only", waitingCount: 0 });
      } else if (dedicatedSiteId) {
        const st = sites.find(s => s.id === dedicatedSiteId);
        dedicatedSiteName = st?.name || null;
        if (st) { st.channelId = state.channelPartnerContractId === "new" ? null : channelContracts.find(c => c.id === state.channelPartnerContractId)?.channelId; st.channelDedicated = true; st.publicOpen = false; st.visibilityMode = "whitelist_only"; }
      }
      if (state.channelPartnerContractId === "new") {
        const channelId = "CH-" + Date.now().toString().slice(-6);
        const contractId = "CC-" + Date.now().toString().slice(-6);
        const paySummary = settlementMode === "卡差价" ? "推广链接分销"
          : settlementMode === "设备租赁" ? "设备月租 B2B"
          : settlementMode === "激活码" ? "激活码批发" : "向运营商付款";
        platformChannels.push({
          id: channelId, name: data.name.trim(), city: data.city, status: data.status,
          contactName: data.contactName, contactPhone: data.contactPhone,
          loginAccount: data.loginAccount.trim(),
          onboardDate: new Date().toISOString().slice(0, 10),
          createdByOperatorId: op.id, createdByOperatorName: op.name,
          signedOperators: [op.name], settlementMode,
          paySummary,
          poolCount: settlementMode === "人天池" ? 0 : 0,
          purchasedDays: 0, availableDays: 0, consumedDays: 0,
          linkOrders: settlementMode === "卡差价" ? 0 : undefined,
          monthCommission: settlementMode === "卡差价" ? 0 : undefined,
          whitelistCount: settlementMode === "设备租赁" ? 0 : undefined,
          codeInventory: settlementMode === "激活码" ? 0 : undefined,
          codesRedeemed: settlementMode === "激活码" ? 0 : undefined,
          dedicatedSite: dedicatedSiteName || undefined,
          billingStatus: settlementMode === "设备租赁" ? "待首缴" : undefined,
          staffCount: 0, riderCount: 0, teamCount: 1, monthConsume: 0, monthSwaps: 0
        });
        channelContracts.push({
          id: contractId, channelId, channelName: data.name.trim(),
          operatorId: op.id, operatorName: op.name, settlementMode,
          wholesalePrice, minDays, minCodes, codeSkuName, codeValidityDays, codeInventory: 0, codesRedeemed: 0,
          monthlyRent, dedicatedSiteId, dedicatedSiteName, whitelistCount: 0, billingStatus: "待首缴", sites: [],
          whitelistDefaultAccess: settlementMode === "设备租赁" ? (data.whitelistDefaultAccess || "paid") : undefined,
          crossNetworkEnabled: settlementMode === "设备租赁" ? data.crossNetworkEnabled === "1" : undefined,
          crossNetworkDepositPaid: settlementMode === "设备租赁" && data.crossNetworkEnabled === "1" ? false : undefined,
          crossNetworkDepositAmount: settlementMode === "设备租赁" ? 20000 : undefined,
          instantCommissionPayout: settlementMode === "卡差价" ? instantCommissionPayout : false,
          commissionRate: settlementMode === "卡差价" && instantCommissionPayout ? commissionRate : null,
          instantCommissionEnabledAt: settlementMode === "卡差价" && instantCommissionPayout ? new Date().toISOString().slice(0, 10) : null,
          status: data.contractStatus, validFrom: data.validFrom, validTo: data.validTo
        });
        if (settlementMode === "人天池") {
          operatorDayQuotaPrices.push({
            id: "OP-Q-" + Date.now().toString().slice(-4),
            operatorId: op.id, channelId, channelName: data.name.trim(),
            wholesalePrice, minDays, status: data.contractStatus === "启用" ? "生效" : "停用",
            validTo: data.validTo
          });
          createPendingPoolForChannel({
            channelId, channelName: data.name.trim(),
            operatorId: op.id, operatorName: op.name,
            wholesalePrice, validFrom: data.validFrom, validTo: data.validTo
          });
        }
        if (settlementMode === "设备租赁") {
          channelLeaseSummary.push({
            channelId, monthlyRent: monthlyRent || 12000, devicesCovered: 0, cabinets: 0, batteries: 0,
            whitelistCount: 0, dedicatedSiteId, dedicatedSiteName, nextDue: data.validFrom, billingStatus: "待首缴",
            monthSwaps: 0, operatorId: op.id, operatorName: op.name
          });
          channelSwapPolicy[channelId] = {
            crossNetworkEnabled: data.crossNetworkEnabled === "1",
            crossNetworkDepositPaid: data.crossNetworkEnabled === "1",
            crossNetworkDepositAmount: 20000, depositBalance: 0, creditLimit: 0, used: 0, available: 0,
            crossSwapEnabled: false, hostOperatorId: op.id
          };
        }
        if (settlementMode === "卡差价") {
          applyCardSkuPricingFromForm(channelId, data, true);
          channelSettlementModes.push({
            id: "CSM-" + channelId.slice(-4), channelId, mode: "卡差价", status: "启用",
            desc: instantCommissionPayout ? "推广链接分销 · 佣金即时分账" : "推广链接分销 · 佣金线下结算",
            cardSku: "包月30天卡", officialPrice: 299, channelPrice: 279, commissionPerOrder: 25,
            commissionRate, instantCommissionPayout, linkOrders: 0, monthCommission: 0, linkClicks: 0
          });
        }
        if (settlementMode === "激活码") {
          channelSettlementModes.push({
            id: "CSM-" + channelId.slice(-4), channelId, mode: "激活码", status: "启用",
            desc: "批发激活码 · 骑手核销获套餐", codeSkuName, wholesalePrice, codeValidityDays,
            codeInventory: 0, codesRedeemed: 0, codesIssued: 0, monthRedemptions: 0
          });
          CHANNEL_REGISTRY[channelId] = { id: channelId, name: data.name.trim(), settlementMode: "激活码", logo: "🎫", tree: "批发激活码 · 骑手核销获套餐" };
          CHANNEL_NAV[channelId] = ["overview", "channelSettlement", "activationCodes", "activationRecords", "orderAudit", "channelCredit", "employees"];
        }
      } else {
        const contract = channelContracts.find(c => c.id === state.channelPartnerContractId && c.operatorId === op.id);
        if (!contract) return;
        const ch = platformChannels.find(c => c.id === contract.channelId);
        if (ch) {
          ch.name = data.name.trim();
          ch.city = data.city;
          ch.status = data.status;
          ch.contactName = data.contactName;
          ch.contactPhone = data.contactPhone;
          ch.loginAccount = data.loginAccount.trim();
        }
        contract.channelName = data.name.trim();
        contract.wholesalePrice = wholesalePrice;
        contract.minDays = minDays;
        contract.minCodes = minCodes;
        contract.codeSkuName = codeSkuName || contract.codeSkuName;
        contract.codeValidityDays = codeValidityDays || contract.codeValidityDays;
        contract.monthlyRent = monthlyRent;
        contract.dedicatedSiteId = dedicatedSiteId;
        contract.dedicatedSiteName = dedicatedSiteName || contract.dedicatedSiteName;
        contract.status = data.contractStatus;
        contract.validFrom = data.validFrom;
        contract.validTo = data.validTo;
        if (contractSettlementMode(contract) === "卡差价") {
          contract.instantCommissionPayout = instantCommissionPayout;
          contract.commissionRate = instantCommissionPayout ? commissionRate : null;
          if (instantCommissionPayout && !contract.instantCommissionEnabledAt) {
            contract.instantCommissionEnabledAt = new Date().toISOString().slice(0, 10);
          }
          const csm = channelSettlementModes.find(m => m.channelId === contract.channelId);
          if (csm) {
            csm.instantCommissionPayout = instantCommissionPayout;
            csm.commissionRate = commissionRate;
            csm.desc = instantCommissionPayout ? "推广链接分销 · 佣金即时分账" : "推广链接分销 · 佣金线下结算";
          }
        }
        if (contractSettlementMode(contract) === "人天池") {
          const quota = operatorDayQuotaPrices.find(q => q.operatorId === op.id && q.channelId === contract.channelId);
          if (quota) {
            quota.channelName = data.name.trim();
            quota.wholesalePrice = wholesalePrice;
            quota.minDays = minDays;
            quota.status = data.contractStatus === "启用" ? "生效" : "停用";
            quota.validTo = data.validTo;
          }
        }
        if (contractSettlementMode(contract) === "设备租赁") {
          const lease = channelLeaseSummary.find(p => p.channelId === contract.channelId);
          if (lease && monthlyRent) lease.monthlyRent = monthlyRent;
          if (lease && dedicatedSiteName) { lease.dedicatedSiteName = dedicatedSiteName; lease.dedicatedSiteId = dedicatedSiteId; }
          contract.whitelistDefaultAccess = data.whitelistDefaultAccess || "paid";
          contract.crossNetworkEnabled = data.crossNetworkEnabled === "1";
          if (contract.crossNetworkEnabled && !contract.crossNetworkDepositPaid) {
            contract.crossNetworkDepositPaid = true;
            contract.crossNetworkDepositAmount = contract.crossNetworkDepositAmount || 20000;
          }
          const csm = channelSettlementModes.find(m => m.channelId === contract.channelId);
          if (csm) csm.crossNetworkEnabled = contract.crossNetworkEnabled;
          const pol = channelSwapPolicyFor(contract.channelId);
          pol.crossNetworkEnabled = contract.crossNetworkEnabled;
          if (contract.crossNetworkEnabled && !pol.crossNetworkDepositPaid) {
            pol.crossNetworkDepositPaid = true;
            pol.crossNetworkDepositAmount = 20000;
            pol.depositBalance = pol.depositBalance || 18000;
            pol.creditLimit = pol.creditLimit || 150000;
            pol.available = (pol.creditLimit || 150000) - (pol.used || 0);
            pol.crossSwapEnabled = true;
            pol.hostOperatorId = op.id;
          }
        }
        if (contractSettlementMode(contract) === "卡差价") {
          applyCardSkuPricingFromForm(contract.channelId, data, false);
        }
      }
      closeChannelPartnerForm();
      state.view = "channelSales";
      state.channelSalesTab = "contracts";
      render();
      const chStatus = data.status;
      const leaseStop = settlementMode === "设备租赁" && chStatus === "已停用";
      window.alert(leaseStop
        ? "演示：渠道商已设为「已停用」。设备租赁白名单用户不可取电，仍可还电入柜（骑手端选 lease_suspended 体验）。"
        : "演示：渠道商信息已保存（Mock）");
    }

    function myPlatformMarketingAgreements() {
      const op = currentEntity();
      if (!isOperatorRole()) return platformMarketingAgreements;
      return platformMarketingAgreements.filter(a => a.operatorId === op.id);
    }

    function myPlatformMarketingOrders() {
      const op = currentEntity();
      if (!isOperatorRole()) return platformMarketingOrders;
      return platformMarketingOrders.filter(o => (o.lockedOperatorId || o.activatedOperatorId) === op.id);
    }

    function myPlatformMarketingStatements() {
      const op = currentEntity();
      if (!isOperatorRole()) return platformMarketingStatements;
      return platformMarketingStatements.filter(s => s.operatorId === op.id);
    }

    function activatePlatformMarketingOrder() {
      showProtoToast("已废止「取电激活」：购时已锁定运营商并收款");
      return false;
    }

    function refundPlatformMarketingOrder(orderId) {
      const o = platformMarketingOrders.find(x => x.id === orderId);
      if (!o || o.status === "已退款") return false;
      o.status = "已退款";
      o.refundStatus = "运营商原路退";
      o.refundTime = new Date().toISOString().slice(0, 16).replace("T", " ");
      o.refundAmount = o.paidPrice;
      return true;
    }

    function confirmPlatformMarketingAgreement(agreementId) {
      const a = platformMarketingAgreements.find(x => x.id === agreementId);
      if (!a || a.status !== "待确认") return;
      a.status = "已启用";
      a.confirmedAt = new Date().toISOString().slice(0, 10);
    }

    function confirmPlatformMarketingStatement(statementId) {
      const s = platformMarketingStatements.find(x => x.id === statementId);
      if (s && s.status === "待确认") s.status = "已确认";
    }

    function openBindForm(sn) {
      state.view = "platformDevices";
      state.platformDeviceTab = "import";
      closeBindForm();
      render();
      window.alert("演示：请在「批量导入」填写「SN,运营商ID」完成归属（类型/参数由 IoT 回填）");
    }

    function closeBindForm() {
      state.bindInventorySn = null;
      const modal = document.querySelector("#bindModal");
      const mask = document.querySelector("#bindMask");
      if (modal) modal.classList.remove("open");
      if (mask) mask.classList.remove("open");
    }

    /** 按 SN 查询物联网平台设备主数据（演示 Mock） */
    function lookupIotDeviceBySn(sn) {
      const hit = platformDeviceInventory.find(i => i.sn === sn);
      if (hit) return { type: hit.type, city: hit.city, specs: hit.specs, source: hit.source || "物联网平台" };
      if (/^BAT[-_]/i.test(sn)) return { type: "battery", city: "上海", specs: "60V30Ah", source: "物联网平台·前缀推断" };
      if (/^CAB[-_]/i.test(sn)) return { type: "cabinet", city: "上海", specs: "12 仓", source: "物联网平台·前缀推断" };
      return null;
    }

    /** 导入：SN + 运营商 → IoT 补全类型/参数 → 写入台账 */
    function assignDeviceFromIot(sn, operatorId) {
      if (!sn || !operatorId) return { ok: false, reason: "缺少 SN 或运营商ID" };
      if (cabinets.some(c => c.sn === sn) || batteries.some(b => b.sn === sn)) {
        return { ok: false, reason: "已在台账" };
      }
      const iot = lookupIotDeviceBySn(sn);
      if (!iot) return { ok: false, reason: "IoT未找到该 SN" };
      const op = platformOperators.find(o => o.id === operatorId);
      if (!op) return { ok: false, reason: "运营商不存在" };
      if (op.status !== "在营") return { ok: false, reason: "运营商非在营" };
      const boundAt = new Date().toISOString().slice(0, 10);
      if (iot.type === "cabinet") {
        cabinets.push({
          sn, site: "未分配站点", city: iot.city, slots: String(iot.specs).includes("8") ? 8 : 12,
          online: false, lastSwap: "—", deviceOwnerId: op.id, deviceOwnerName: op.name,
          ownership: "自有", platformBound: true, boundAt, specs: iot.specs, iotSource: iot.source
        });
      } else {
        batteries.push({
          sn, site: "未分配站点", city: iot.city, soc: 100, health: "正常",
          inCab: "待入柜", deviceOwnerId: op.id, deviceOwnerName: op.name,
          platformBound: true, boundAt, specs: iot.specs, iotSource: iot.source
        });
      }
      const idx = platformDeviceInventory.findIndex(i => i.sn === sn);
      if (idx >= 0) platformDeviceInventory.splice(idx, 1);
      return { ok: true, type: iot.type, opName: op.name, specs: iot.specs };
    }

    function saveBindForm() {
      closeBindForm();
    }

    function saveL1PricingForm() {
      l1UnifiedPricing.cabinetFee = parseFloat(document.querySelector("#l1CabinetFee")?.value || l1UnifiedPricing.cabinetFee);
      l1UnifiedPricing.batteryFee = parseFloat(document.querySelector("#l1BatteryFee")?.value || l1UnifiedPricing.batteryFee);
      l1UnifiedPricing.effectiveFrom = document.querySelector("#l1EffectiveFrom")?.value || l1UnifiedPricing.effectiveFrom;
      l1UnifiedPricing.status = document.querySelector("#l1Status")?.value || l1UnifiedPricing.status;
      l1UnifiedPricing.updatedAt = new Date().toISOString().slice(0, 10);
      l1UnifiedPricing.updatedBy = "平台管理员";
      render();
      window.alert("演示：跨网设备服务费统价已更新，新清分将按新单价计算");
    }

    function savePlatformStandardDayPriceForm() {
      platformStandardDayPrice.price = parseFloat(document.querySelector("#stdDayPrice")?.value || platformStandardDayPrice.price);
      platformStandardDayPrice.effectiveFrom = document.querySelector("#stdDayEffectiveFrom")?.value || platformStandardDayPrice.effectiveFrom;
      platformStandardDayPrice.status = document.querySelector("#stdDayStatus")?.value || platformStandardDayPrice.status;
      platformStandardDayPrice.updatedAt = new Date().toISOString().slice(0, 10);
      platformStandardDayPrice.updatedBy = "平台管理员";
      platformFeeAccruals.forEach(a => {
        if (a.trigger === "确认消耗" || a.poolId) a.basePrice = platformAccrualDayPrice();
      });
      refreshPlatformFeeAccruals();
      render();
      window.alert("演示：人天标准日值已更新。B 端计提基数与新签约默认批发价将按 ¥" + platformStandardDayPrice.price + "/人天 展示");
    }

    function openPlatformFeeRateForm(opId) {
      const op = platformOperators.find(o => o.id === opId);
      if (!op) return;
      state.platformFeeRateEditId = opId;
      const cfg = operatorPlatformFeeConfig(opId);
      document.querySelector("#platformFeeRateFormTitle").textContent = op.name + " · 平台服务费比例";
      document.querySelector("#platformFeeRateForm").innerHTML = `
        <p style="grid-column:1/-1;font-size:12px;color:var(--muted);margin:0">${noteBtn("platform_operator_fee_rate")} C 端=套餐/自费支付分账；B 端=渠道人天确认消耗计提。保存后新订单按新比例计算。</p>
        <label>C 端抽成比例（%）<input name="cEndPct" type="number" min="0" max="100" step="0.01" value="${(cfg.cEndRate * 100).toFixed(2)}" required /></label>
        <label>B 端抽成比例（%）<input name="bEndPct" type="number" min="0" max="100" step="0.01" value="${(cfg.bEndRate * 100).toFixed(2)}" required /></label>
        <label>生效日期<input name="effectiveFrom" type="date" value="${cfg.effectiveFrom === "—" ? new Date().toISOString().slice(0, 10) : cfg.effectiveFrom}" /></label>
        <label>状态<select name="status"><option ${cfg.status === "生效" ? "selected" : ""}>生效</option><option ${cfg.status === "停用" ? "selected" : ""}>停用</option></select></label>
        <label style="grid-column:1/-1">备注<textarea name="remark" rows="2" placeholder="如：新入网扶持、联营优惠">${cfg.remark || ""}</textarea></label>`;
      document.querySelector("#platformFeeRateMask").classList.add("open");
      document.querySelector("#platformFeeRateModal").classList.add("open");
    }

    function closePlatformFeeRateForm() {
      document.querySelector("#platformFeeRateMask").classList.remove("open");
      document.querySelector("#platformFeeRateModal").classList.remove("open");
      state.platformFeeRateEditId = null;
    }

    function savePlatformFeeRateForm() {
      const opId = state.platformFeeRateEditId;
      const op = platformOperators.find(o => o.id === opId);
      if (!op) return;
      const form = document.querySelector("#platformFeeRateForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const cEndRate = Math.round(parseFloat(data.cEndPct) * 100) / 10000;
      const bEndRate = Math.round(parseFloat(data.bEndPct) * 100) / 10000;
      if (Number.isNaN(cEndRate) || Number.isNaN(bEndRate) || cEndRate < 0 || bEndRate < 0) {
        window.alert("请输入有效的抽成比例");
        return;
      }
      operatorPlatformFeeRates[opId] = {
        cEndRate, bEndRate,
        effectiveFrom: data.effectiveFrom || new Date().toISOString().slice(0, 10),
        status: data.status || "生效",
        updatedAt: new Date().toISOString().slice(0, 10),
        updatedBy: "平台管理员",
        remark: data.remark || ""
      };
      refreshPlatformFeeAccruals();
      closePlatformFeeRateForm();
      state.view = "operators";
      state.operatorsTab = "feeRate";
      render();
      window.alert("演示：" + op.name + " 平台服务费比例已更新为 C " + formatFeeRatePct(cEndRate) + " / B " + formatFeeRatePct(bEndRate));
    }

    function renderPlatformOverview() {
      const st = platformBizStats();
      const rangeHint = overviewRangeLabel();
      const opCards = platformOperators.map(op => {
        const agg = operatorAggregateStats(op.id);
        return `<article class="platform-op-card">
          <div class="platform-op-card-head">
            <div>
              <strong>${op.name}</strong>
              <span>${op.city} · ${op.id}</span>
            </div>
            ${tag(op.status)}
          </div>
          <div class="platform-op-card-metrics">
            <div class="platform-op-metric-row"><em>站点</em><b>${agg.sites}</b></div>
            <div class="platform-op-metric-row"><em>设备</em><b>${agg.cabinets + agg.batteries}</b><small>柜 ${agg.cabinets} · 电 ${agg.batteries}</small></div>
          </div>
        </article>`;
      }).join("");
      return `<div class="overview-workplace">
        <div class="overview-split-row overview-split-row-3 overview-split-row-platform">
          <section class="panel overview-kpi-panel">
            ${panelHead("业务快照", "实时 · 不受范围影响", "platform_stats")}
            <div class="panel-body">
              <div class="kpi-grid in-panel kpi-grid-snapshot">
                ${kpi("运营商", st.operators, "在营主体", "运", "platform_operators")}
                ${kpi("渠道商", st.channels, "签约 B 端", "渠", "platform_stats")}
                ${kpi("在营站点", st.sites, "全平台", "站", "platform_stats")}
                ${kpi("设备", st.devices, "柜 " + st.cabinets + " · 电 " + st.batteries, "设", "platform_device_bind")}
              </div>
            </div>
          </section>
          <section class="panel overview-kpi-panel">
            ${panelHead("经营指标", "随统计范围缩放", "platform_stats")}
            <div class="panel-body">
              ${overviewRangeSelectHtml("仅影响本卡五项")}
              <div class="kpi-grid in-panel kpi-grid-metrics">
                ${kpi("用户", scale(st.users), rangeHint + " · 注册骑手", "骑", "platform_stats")}
                ${kpi("套餐订单", scale(st.packageOrders), rangeHint + " · 累计笔数", "订", "platform_stats")}
                ${kpi("换电成功", scale(st.swapOrders), rangeHint + " · 累计笔数", "换", "platform_stats")}
                ${kpi("业务流水", "¥" + scaleMoney(st.turnover).toLocaleString("zh-CN"), rangeHint + " · 套餐 + 渠道批发", "流", "platform_stats")}
                ${kpi("平台营收", "¥" + scaleMoney(st.platformRevenue).toLocaleString("zh-CN"), rangeHint + " · C 端 1% + B 端计提", "收", "platform_stats")}
              </div>
            </div>
          </section>
          ${renderDataDrillPanel("platform")}
        </div>
        <section class="panel">
          ${panelHead("运营商汇总", "运营商 · 站点 · 设备", "platform_operators")}
          <div class="panel-body">
            <div class="platform-op-card-grid">${opCards || `<p class="site-busy-empty">暂无运营商</p>`}</div>
          </div>
        </section>
      </div>`;
    }

    function renderOperatorCreditEval() {
      const tab = state.operatorCreditTab || "assignments";
      const tabs = [["tierConfig", "档位配置"], ["assignments", "运营商定档"], ["logs", "变更记录"]];
      const sidebar = tabSidebar(tabs, tab, "opcredtab");
      let body = "";
      if (tab === "tierConfig") {
        body = `<section class="panel">
          ${panelHead("准入档位政策包", "A/B/C/D 四档；调整影响新定档与复审，已生效运营商须人工升降档", "operator_credit_eval")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>档位</th><th>最低保证金</th><th>信用封顶</th><th>跨网默认</th><th>说明（融资参考）</th><th>操作</th></tr></thead>
              <tbody>${operatorAdmissionTierConfig.map(t => `<tr>
                <td><strong>${t.code} ${t.name}</strong></td>
                <td>${formatMinDeposit(t)}</td>
                <td>${t.creditCap ? "¥" + t.creditCap.toLocaleString("zh-CN") : "0"}</td>
                <td>${t.crossNetworkDefault ? tag("开") : tag("关")}</td>
                <td>${t.remark}</td>
                <td><button type="button" class="link-btn" data-edit-admission-tier="${t.code}">编辑（演示）</button></td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("与保证金管理联动", "手工调信用额度时不得高于当前档位封顶", "operator_credit_eval")}
          <div class="panel-body"><p style="margin:0;font-size:13px">定档 / 降档时若当前额度高于新档封顶，系统自动压顶。运营商「服务保证金账户」只读展示档位摘要。</p></div>
        </section>`;
      } else if (tab === "assignments") {
        const pending = platformOperators.filter(op => {
          const p = operatorCreditProfile(op.id);
          return !p || p.status !== "已定档" || !p.tierCode;
        });
        const assigned = platformOperators.filter(op => {
          const p = operatorCreditProfile(op.id);
          return p && p.status === "已定档" && p.tierCode;
        });
        body = `${pending.length ? `<section class="panel">
          ${panelHead("待定档", "新入网须完成定档后方可按政策开放授信", "operator_credit_eval")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>运营商</th><th>入驻</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${pending.map(op => `<tr>
                <td><strong>${op.name}</strong><br><small>${op.id}</small></td>
                <td>${op.onboardDate}</td><td>${tag("待定档")}</td>
                <td><button type="button" class="link-btn" data-assign-tier="${op.id}">定档</button></td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>` : ""}
        <section class="panel">
          ${panelHead("已定档运营商", "支持升/降档；变更写入记录", "operator_credit_eval")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>运营商</th><th>当前档位</th><th>信用封顶</th><th>当前额度</th><th>最低保证金</th><th>跨网默认</th><th>渠道</th><th>下次复审</th><th>操作</th></tr></thead>
              <tbody>${assigned.map(op => {
                const prof = operatorCreditProfile(op.id);
                const tier = admissionTierByCode(prof.tierCode);
                const credit = creditForOperator(op.id);
                const chCount = operatorAggregateStats(op.id).channels;
                const chLimit = formatMaxChannels(tier);
                const chWarn = false; /* 2026-07-13：档位不限可签渠道数 */
                return `<tr>
                  <td><strong>${op.name}</strong><br><small>${op.id}</small></td>
                  <td>${tag(tierLabel(prof.tierCode))}</td>
                  <td>¥${(tier?.creditCap || 0).toLocaleString("zh-CN")}</td>
                  <td>¥${(credit?.creditLimit || 0).toLocaleString("zh-CN")}${credit && tier && credit.creditLimit > tier.creditCap ? " ⚠" : ""}</td>
                  <td>${formatMinDeposit(tier)}</td>
                  <td>${tier?.crossNetworkDefault ? tag("开") : tag("关")}</td>
                  <td>${chCount} / ${chLimit}${chWarn ? " ⚠" : ""}</td>
                  <td>${prof.nextReviewAt || "—"}</td>
                  <td>
                    <button type="button" class="link-btn" data-assign-tier="${op.id}">升降档</button>
                    <button type="button" class="link-btn" data-open-operator="${op.id}">详情</button>
                  </td>
                </tr>`;
              }).join("") || "<tr><td colspan='9'>暂无已定档运营商</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else {
        body = `<section class="panel">
          ${panelHead("档位变更记录", "入网定档、升档、降档、年度复审", "operator_credit_eval")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>运营商</th><th>原档位</th><th>新档位</th><th>原因</th><th>操作人</th></tr></thead>
              <tbody>${operatorCreditTierLogs.map(l => `<tr>
                <td>${l.at}</td>
                <td>${operatorNameById(l.operatorId)}<br><small>${l.operatorId}</small></td>
                <td>${l.fromTier ? tierLabel(l.fromTier) : "—"}</td>
                <td>${tierLabel(l.toTier)}</td>
                <td>${l.reason}</td>
                <td>${l.by}</td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无记录</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      return `${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("operator_credit_eval")}
          <strong>方案 B · 准入档位制</strong>：不做连续评分；入网定档 + 年度复审。与「渠道信用评估」独立。</div>
        ${pageWithTabs(sidebar, body)}`;
    }

    function renderOrderAudit() {
      const f = getPf();
      const rows = myOrderAuditEvents().filter(e => {
        if (f.eventType !== "全部" && e.eventType !== f.eventType) return false;
        if (f.keyword && !matchKw(e.userPhone, f.keyword) && !matchKw(e.refId, f.keyword) && !matchKw(e.summary, f.keyword)) return false;
        return true;
      });
      const types = ["全部", ...new Set(myOrderAuditEvents().map(e => e.eventType))];
      const scopeHint = isChannelRole()
        ? "仅展示<strong>本渠道成员</strong>相关事件（D-A2）。"
        : isPlatformRole() ? "全平台只读查询。" : "本运营商订单/服务变更。";
      return `${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">统一<strong>变更记录</strong>（D-A1）：跨模块时间线，用于客诉、对账与监管（C-02）。${scopeHint} 非新订单列表。</div>
        <section class="panel">
          ${panelHead("变更记录", `共 ${rows.length} 条 · 按时间倒序`, "orderAudit")}
          <div class="panel-body">
            <div class="detail-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px">
              <label class="detail-item"><span>关键词</span><input id="oaKeyword" value="${f.keyword || ""}" placeholder="手机/单号/摘要" style="width:100%;height:32px"></label>
              <label class="detail-item"><span>事件类型</span><select id="oaEventType">${types.map(t => `<option ${f.eventType === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>
            </div>
            <div class="orders-table-wrap">
              <table>
                <thead><tr><th>时间</th>${isPlatformRole() ? "<th>运营商</th>" : ""}<th>用户</th><th>事件</th><th>摘要</th><th>变更</th><th>操作人</th><th>关联</th></tr></thead>
                <tbody>${rows.map(e => `<tr>
                  <td>${e.time}</td>
                  ${isPlatformRole() ? `<td>${operatorNameById(e.operatorId)}</td>` : ""}
                  <td>${e.userPhone}<br><small>${e.userId}</small></td>
                  <td>${tag(e.eventType)}</td>
                  <td>${e.summary}</td>
                  <td><small>${e.before} → ${e.after}</small></td>
                  <td>${e.by}</td>
                  <td>${e.refId ? `<button type="button" class="link-btn" data-audit-ref="${e.refType}:${e.refId}">${e.refId}</button>` : "—"}</td>
                </tr>`).join("") || `<tr><td colspan="${isPlatformRole() ? 8 : 7}">暂无变更记录</td></tr>`}</tbody>
              </table>
            </div>
          </div>
        </section>`;
    }

    function renderDepositAccount() {
      const credit = myOperatorCredit();
      const prof = operatorCreditProfile(currentEntity().id);
      const tier = prof?.tierCode ? admissionTierByCode(prof.tierCode) : null;
      const cap = tier ? tier.creditCap : null;
      const recv = platformClearingReceiveAccount;
      const orders = myDepositRechargeOrders();
      const ledger = depositLedger.filter(l => l.operatorId === currentEntity().id);
      const pending = orders.filter(o => o.status === "待确认").length;
      return `${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("deposit_recharge")}${noteBtn("operator_deposit")}
          跨网清分与 B 端平台费优先从<strong>平台保证金</strong>划扣；余额为 0 才启用信用额度。充值须对公转账，平台确认后入账。</div>
        ${tier ? `<section class="panel">
          ${panelHead("准入档位（只读）", "平台定档政策包；授信上限由平台维护", "operator_credit_eval")}
          <div class="panel-body">
            <div class="detail-grid">
              <div class="detail-item"><span>当前档位</span><strong>${tierLabel(prof.tierCode)}</strong></div>
              <div class="detail-item"><span>最低保证金建议</span><strong>${formatMinDeposit(tier)}</strong></div>
              <div class="detail-item"><span>信用额度封顶</span><strong>${cap != null ? "¥" + cap.toLocaleString("zh-CN") : "—"}</strong></div>
              <div class="detail-item"><span>跨网默认</span><strong>${tier.crossNetworkDefault ? "允许" : "关闭"}</strong></div>
              <div class="detail-item"><span>档位用途</span><strong>可融资水平参考（与渠道数无关）</strong></div>
              <div class="detail-item"><span>下次复审</span><strong>${prof.nextReviewAt || "—"}</strong></div>
            </div>
          </div>
        </section>` : `<div class="pool-warn-banner" style="margin-bottom:14px">尚未完成平台准入定档，请联系平台管理员。${noteBtn("operator_credit_eval")}</div>`}
        <div class="kpi-grid">
          ${kpi("平台保证金", credit ? "¥" + credit.depositBalance.toLocaleString("zh-CN") : "—", credit && credit.depositBalance > 0 ? "当前扣款账户" : "已用尽", "保", "operator_deposit")}
          ${kpi("信用额度", credit ? "¥" + credit.creditLimit.toLocaleString("zh-CN") : "—", credit && credit.depositBalance <= 0 ? "已启用" : "未启用", "额", "operator_credit")}
          ${kpi("待确认充值", pending, "笔申请等待平台核对", "待", "deposit_recharge")}
          ${kpi("跨网状态", credit?.crossSwapEnabled ? "正常" : "已停", credit?.crossSwapEnabled ? "可跨网换电" : "信用额度用尽", "网", "operator_credit")}
        </div>
        <section class="panel">
          ${panelHead("平台清分收款专户", "对公转账至此账户；附言须含运营商 ID", "deposit_recharge")}
          <div class="panel-body">
            <div class="detail-grid">
              <div class="detail-item"><span>开户行</span><strong>${recv.bankName}</strong></div>
              <div class="detail-item"><span>户名</span><strong>${recv.accountName}</strong></div>
              <div class="detail-item"><span>账号</span><strong>${recv.accountNo}</strong></div>
              <div class="detail-item"><span>附言要求</span><strong>${recv.transferRemark}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel">
          ${panelHead("提交充值申请", "转账后填写流水信息，平台财务确认到账后增加保证金", "deposit_recharge")}
          <div class="panel-body">
            <form id="depositRechargeForm" class="detail-grid" style="grid-template-columns:repeat(2,1fr)">
              <label class="detail-item"><span>充值金额（元）*</span><input name="amount" type="number" min="1" step="0.01" placeholder="如 5000" style="width:100%;height:32px"></label>
              <label class="detail-item"><span>转账日期 *</span><input name="transferDate" type="date" value="${new Date().toISOString().slice(0, 10)}" style="width:100%;height:32px"></label>
              <label class="detail-item"><span>银行流水号/参考号 *</span><input name="transferRef" placeholder="对公回单流水号" style="width:100%;height:32px"></label>
              <label class="detail-item"><span>付款账户（可选）</span><input name="payerAccount" placeholder="对公账户后四位" style="width:100%;height:32px"></label>
              <label class="detail-item" style="grid-column:1/-1"><span>备注</span><input name="remark" placeholder="如：补足跨网清分" style="width:100%;height:32px"></label>
            </form>
            <div class="form-actions"><button type="button" class="btn primary" id="submitDepositRecharge">提交申请</button></div>
          </div>
        </section>
        <section class="panel">
          ${panelHead("我的充值申请", "待确认 / 已确认 / 已驳回", "deposit_recharge")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>单号</th><th>金额</th><th>转账日</th><th>流水号</th><th>提交时间</th><th>状态</th><th>确认信息</th></tr></thead>
              <tbody>${orders.map(o => `<tr>
                <td>${o.id}</td><td>¥${o.amount.toLocaleString("zh-CN")}</td><td>${o.transferDate}</td>
                <td>${o.transferRef}</td><td>${o.submitTime}</td><td>${tag(o.status)}</td>
                <td>${o.status === "已确认" ? o.confirmTime + " · " + o.confirmedBy : o.status === "已驳回" ? (o.rejectReason || "—") : "等待平台核对到账"}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无充值申请</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("保证金变动明细", "充值入账、日清划扣、平台费代扣", "operator_deposit", `<button type="button" class="link-btn" data-view-jump="interOp">查看往来账</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>类型</th><th>变动</th><th>余额</th><th>关联单</th><th>操作方</th></tr></thead>
              <tbody>${ledger.map(l => `<tr>
                <td>${l.time}</td><td>${l.type}</td>
                <td>${l.delta > 0 ? "+" : ""}¥${l.delta.toLocaleString("zh-CN")}</td>
                <td>¥${l.balanceAfter.toLocaleString("zh-CN")}</td>
                <td>${l.ref}</td><td>${l.by}</td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无变动</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderDepositManage() {
      const tab = state.depositTab;
      const tabs = [
        ["pending", "充值确认" + (pendingDepositRechargeCount() ? " (" + pendingDepositRechargeCount() + ")" : "")],
        ["accounts", "账户总览"],
        ["ledger", "变动明细"]
      ];
      const sidebar = tabSidebar(tabs, tab, "depstab");
      const recv = platformClearingReceiveAccount;
      let body = "";
      if (tab === "pending") {
        const pending = depositRechargeOrders.filter(o => o.status === "待确认");
        body = `<section class="panel">
          ${panelHead("待确认充值", "核对银行到账后确认入账", "deposit_manage")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>单号</th><th>运营商</th><th>金额</th><th>转账日</th><th>流水号</th><th>付款户</th><th>提交时间</th><th>备注</th><th>操作</th></tr></thead>
              <tbody>${pending.map(o => `<tr>
                <td>${o.id}</td>
                <td>${operatorNameById(o.operatorId)}<br><small>${o.operatorId}</small></td>
                <td><strong>¥${o.amount.toLocaleString("zh-CN")}</strong></td>
                <td>${o.transferDate}</td><td>${o.transferRef}</td><td>${o.payerAccount}</td>
                <td>${o.submitTime}</td><td>${o.remark || "—"}</td>
                <td>
                  <button type="button" class="link-btn" data-confirm-deposit="${o.id}">确认到账</button>
                  <button type="button" class="link-btn" data-reject-deposit="${o.id}">驳回</button>
                </td>
              </tr>`).join("") || "<tr><td colspan='9'>暂无待确认申请</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("近期已处理", "已确认 / 已驳回", "deposit_manage")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>单号</th><th>运营商</th><th>金额</th><th>状态</th><th>处理时间</th><th>处理人</th></tr></thead>
              <tbody>${depositRechargeOrders.filter(o => o.status !== "待确认").slice(0, 8).map(o => `<tr>
                <td>${o.id}</td><td>${operatorNameById(o.operatorId)}</td>
                <td>¥${o.amount.toLocaleString("zh-CN")}</td><td>${tag(o.status)}</td>
                <td>${o.confirmTime || "—"}</td><td>${o.confirmedBy || "—"}</td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "accounts") {
        body = `<section class="panel">
          ${panelHead("清分收款专户", "运营商对公充值收款账户", "deposit_manage")}
          <div class="panel-body detail-grid">
            <div class="detail-item"><span>开户行</span><strong>${recv.bankName}</strong></div>
            <div class="detail-item"><span>户名</span><strong>${recv.accountName}</strong></div>
            <div class="detail-item"><span>账号</span><strong>${recv.accountNo}</strong></div>
            <div class="detail-item"><span>附言</span><strong>${recv.transferRemark}</strong></div>
          </div>
        </section>
        <section class="panel">
          ${panelHead("运营商清分账户", "保证金余额与信用额度；调额不得高于档位封顶", "deposit_manage")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>运营商</th><th>保证金</th><th>信用额度</th><th>档位封顶</th><th>已占用</th><th>跨网</th><th>操作</th></tr></thead>
              <tbody>${platformOperators.map(op => {
                const c = creditForOperator(op.id);
                const cap = operatorCreditCap(op.id);
                const prof = operatorCreditProfile(op.id);
                return `<tr>
                  <td><strong>${op.name}</strong><br><small>${op.id}</small>${prof?.tierCode ? "<br><small>" + tierLabel(prof.tierCode) + "</small>" : ""}</td>
                  <td>¥${(c?.depositBalance || 0).toLocaleString("zh-CN")}</td>
                  <td>¥${(c?.creditLimit || 0).toLocaleString("zh-CN")}</td>
                  <td>¥${cap != null ? cap.toLocaleString("zh-CN") : "—"}</td>
                  <td>¥${(c?.used || 0).toLocaleString("zh-CN")}</td>
                  <td>${c?.crossSwapEnabled ? tag("开启") : tag("已停")}</td>
                  <td>
                    <button type="button" class="link-btn" data-manual-deposit="${op.id}">手工入账</button>
                    <button type="button" class="link-btn" data-adjust-credit-limit="${op.id}">调信用额度</button>
                  </td>
                </tr>`;
              }).join("")}</tbody>
            </table>
          </div>
        </section>`;
      } else {
        body = `<section class="panel">
          ${panelHead("全平台保证金账本", "对公充值、日清划扣、平台费代扣、手工调整", "deposit_manage")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>运营商</th><th>类型</th><th>变动</th><th>余额</th><th>关联单</th><th>操作方</th></tr></thead>
              <tbody>${depositLedger.map(l => `<tr>
                <td>${l.time}</td>
                <td>${operatorNameById(l.operatorId)}</td>
                <td>${l.type}</td>
                <td>${l.delta > 0 ? "+" : ""}¥${l.delta.toLocaleString("zh-CN")}</td>
                <td>¥${l.balanceAfter.toLocaleString("zh-CN")}</td>
                <td>${l.ref}</td><td>${l.by}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      const std = platformDepositStandard;
      const stdBanner = `<section class="panel"><div class="panel-body">
        <div class="platform-price-banner">渠道押金统一标准：电池 <strong>¥${std.battery.toLocaleString()}</strong>/块 · 换电柜 <strong>¥${std.cabinet.toLocaleString()}</strong>/台
        <button type="button" class="link-btn" data-edit-deposit-standard style="margin-left:12px">编辑标准（演示）</button></div>
      </div></section>`;
      return `${ownScopeBanner()}
        ${stdBanner}
        ${pageWithTabs(sidebar, body)}`;
    }

    function renderPlatformLeasing() {
      const tab = state.platformLeasingTab || "companies";
      const tabs = [["companies", "租赁公司"], ["bindings", "租赁关系绑定"]];
      const sidebar = tabSidebar(tabs, tab, "pltab");
      let body = "";
      if (tab === "companies") {
        body = `<section class="panel">
          ${panelHead("设备租赁公司", `共 ${platformLeasingCompanies.length} 家 · 平台维护出租方主体`, "platform_leasing_companies", `<button type="button" class="btn primary" data-new-leasing-company>+ 新增租赁公司</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>租赁公司</th><th>联系人</th><th>城市</th><th>状态</th><th>入驻</th><th>已绑定运营商</th><th>备注</th><th>操作</th></tr></thead>
              <tbody>${platformLeasingCompanies.map(l => {
                const binds = platformLeaseBindings.filter(b => b.lessorId === l.id && b.status === "启用");
                const bindTxt = binds.length ? binds.map(b => operatorLabel(b.operatorId)).join("、") : "—";
                return `<tr>
                  <td><strong>${l.name}</strong><br><small style="color:var(--muted)">${l.id}</small></td>
                  <td>${l.contactName}<br><small>${l.contactPhone}</small></td>
                  <td>${l.city}</td><td>${tag(l.status)}</td><td>${l.onboardDate}</td>
                  <td>${bindTxt}</td><td><small>${l.remark || "—"}</small></td>
                  <td><button type="button" class="link-btn" data-edit-leasing-company="${l.id}">编辑</button></td>
                </tr>`;
              }).join("")}</tbody>
            </table>
          </div>
        </section>`;
      } else {
        body = `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_lease_binding")} 绑定建立后，租赁公司登录方可向对应运营商发起协议签约；运营商档案来源于「运营商管理」。</div>
        <section class="panel">
          ${panelHead("租赁关系绑定", `共 ${platformLeaseBindings.length} 条`, "platform_lease_binding", `<button type="button" class="btn primary" data-new-lease-binding>+ 新建绑定</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>绑定编号</th><th>租赁公司</th><th>运营商</th><th>状态</th><th>绑定日</th><th>操作人</th><th>操作</th></tr></thead>
              <tbody>${platformLeaseBindings.map(b => `<tr>
                <td>${b.id}</td>
                <td>${lessorLabel(b.lessorId)}<br><small style="color:var(--muted)">${b.lessorId}</small></td>
                <td>${operatorLabel(b.operatorId)}<br><small style="color:var(--muted)">${b.operatorId}</small></td>
                <td>${tag(b.status)}</td><td>${b.boundAt}</td><td>${b.boundBy}</td>
                <td>${b.status === "启用" ? `<button type="button" class="link-btn" data-disable-lease-binding="${b.id}">停用</button>` : "—"}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无绑定</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      return `${ownScopeBanner()}${pageWithTabs(sidebar, body)}`;
    }

    function leaseBindingOperatorOptions(lessorId) {
      const opOpts = platformOperators.filter(o => o.status === "在营");
      return opOpts.map(o => {
        const bound = isLeaseBindingActive(lessorId, o.id);
        return `<option value="${o.id}" ${bound ? "disabled" : ""}>${o.name}（${o.id}）${bound ? " · 已绑定" : ""}</option>`;
      }).join("");
    }

    function refreshLeaseBindingOperatorSelect(lessorId) {
      const opSelect = document.querySelector("#leaseBindingOperatorSelect");
      if (!opSelect) return;
      opSelect.innerHTML = leaseBindingOperatorOptions(lessorId);
      const first = opSelect.querySelector("option:not([disabled])");
      if (first) opSelect.value = first.value;
    }

    function openLeaseBindingForm() {
      const lessorOpts = platformLeasingCompanies.filter(l => l.status === "在营");
      const defaultLessorId = lessorOpts[0]?.id || "";
      document.querySelector("#leaseBindingFormTitle").textContent = "新建租赁关系绑定";
      document.querySelector("#leaseBindingForm").innerHTML = `
        <p class="note" style="grid-column:1/-1;margin:0">在同一表单中选择租赁公司与运营商；绑定后租赁公司方可向该运营商发起租赁签约。</p>
        <label>租赁公司<select name="lessorId" required id="leaseBindingLessorSelect">
          ${lessorOpts.map(l => `<option value="${l.id}">${l.name}（${l.id}）</option>`).join("")}
        </select></label>
        <label>运营商<select name="operatorId" required id="leaseBindingOperatorSelect">
          ${leaseBindingOperatorOptions(defaultLessorId)}
        </select></label>
        <label style="grid-column:1/-1">备注<textarea name="remark" rows="2" placeholder="选填"></textarea></label>`;
      const lessorSelect = document.querySelector("#leaseBindingLessorSelect");
      lessorSelect.addEventListener("change", () => refreshLeaseBindingOperatorSelect(lessorSelect.value));
      refreshLeaseBindingOperatorSelect(defaultLessorId);
      document.querySelector("#leaseBindingModal").classList.add("open");
      document.querySelector("#leaseBindingMask").classList.add("open");
    }

    function closeLeaseBindingForm() {
      document.querySelector("#leaseBindingModal").classList.remove("open");
      document.querySelector("#leaseBindingMask").classList.remove("open");
    }

    function saveLeaseBindingForm() {
      const form = document.querySelector("#leaseBindingForm");
      const data = Object.fromEntries(new FormData(form).entries());
      const lessor = platformLeasingCompanies.find(l => l.id === data.lessorId);
      const op = platformOperators.find(o => o.id === data.operatorId);
      if (!lessor || !op) {
        window.alert("请选择租赁公司与运营商");
        return;
      }
      if (isLeaseBindingActive(lessor.id, op.id)) {
        window.alert(`${lessor.name} 与 ${op.name} 已绑定`);
        return;
      }
      platformLeaseBindings.unshift({
        id: "LB-" + String(platformLeaseBindings.length + 1).padStart(3, "0"),
        lessorId: lessor.id, operatorId: op.id, status: "启用",
        boundAt: new Date().toISOString().slice(0, 10), boundBy: "平台管理员", remark: data.remark || ""
      });
      closeLeaseBindingForm();
      state.view = "platformLeasing";
      state.platformLeasingTab = "bindings";
      render();
      window.alert("已建立绑定（演示）");
    }

    function renderOperators() {
      const tab = state.operatorsTab || "list";
      if (tab === "feeRate") {
        const f = getPf();
        const rows = platformOperators.filter(op => {
          const cfg = operatorPlatformFeeConfig(op.id);
          if (f.status && f.status !== "全部" && cfg.status !== f.status) return false;
          if (f.keyword && !matchKw(op.name, f.keyword) && !matchKw(op.id, f.keyword)) return false;
          return true;
        });
        return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("运营商平台服务费", "各运营商 C/B 端抽成比例 · 可不同", "platform_operator_fee_rate")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_operator_fee_rate")} 默认 1%；C 端=个人套餐/自费支付分账，B 端=渠道人天确认消耗计提。运营商在「平台服务费」页只读查看本主体适用比例。</p>
            <table>
              <thead><tr>
                <th>运营商</th><th>C 端比例</th><th>B 端比例</th><th>生效日</th><th>状态</th><th>备注</th><th>最近更新</th><th>操作</th>
              </tr></thead>
              <tbody>${rows.map(op => {
                const cfg = operatorPlatformFeeConfig(op.id);
                return `<tr>
                  <td><strong>${op.name}</strong><br><small style="color:var(--muted)">${op.id}</small></td>
                  <td><strong class="fee-platform">${formatFeeRatePct(cfg.cEndRate)}</strong></td>
                  <td><strong class="fee-platform">${formatFeeRatePct(cfg.bEndRate)}</strong></td>
                  <td>${cfg.effectiveFrom}</td><td>${tag(cfg.status)}</td>
                  <td style="white-space:normal;max-width:160px">${cfg.remark || "—"}</td>
                  <td><small>${cfg.updatedAt}<br>${cfg.updatedBy}</small></td>
                  <td><button type="button" class="link-btn" data-edit-platform-fee-rate="${op.id}">编辑</button></td>
                </tr>`;
              }).join("") || "<tr><td colspan='8'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      if (tab === "withdrawReview") {
        const f = getPf();
        const rows = operatorWithdrawalRequests.filter(w => {
          if (f.operatorId !== "全部" && w.operatorId !== f.operatorId) return false;
          if (f.status !== "全部" && w.status !== f.status) return false;
          return true;
        });
        const pending = rows.filter(w => w.status === "待审核").length;
        return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("运营商提现审核", `待审 ${pending} 条 · 共 ${rows.length} 条`, "platform_withdraw_review")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_withdraw_review")} 用户付款已实时清分；运营商提现须审核通过后打款至绑定账户。<strong>渠道商-设备租赁</strong>不适用。</p>
            <table>
              <thead><tr><th>申请单</th><th>运营商</th><th>金额</th><th>到账账户</th><th>本月待还预留</th><th>申请时间</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(w => `<tr>
                <td>${w.id}</td>
                <td>${operatorLabel(w.operatorId)}</td>
                <td><strong>¥${w.amount}</strong></td>
                <td><small>${w.accountLabel}</small></td>
                <td>${w.monthDueReserved ? "¥" + w.monthDueReserved.toLocaleString("zh-CN") : "—"}</td>
                <td>${w.applyTime}</td>
                <td>${tag(w.status)}${w.rejectReason ? `<br><small style="color:var(--red)">${w.rejectReason}</small>` : ""}</td>
                <td>${w.status === "待审核"
                  ? `<button type="button" class="link-btn" data-approve-withdraw="${w.id}">通过</button> · <button type="button" class="link-btn" data-reject-withdraw="${w.id}">驳回</button>`
                  : (w.withdrawTime || "—")}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      const f = getPf();
      const rows = platformOperators.filter(op => {
        if (f.status !== "全部" && op.status !== f.status) return false;
        if (f.city !== "全部" && op.city !== f.city) return false;
        if (f.keyword && !matchKw(op.name, f.keyword) && !matchKw(op.id, f.keyword) && !matchKw(op.contactName, f.keyword)) return false;
        return true;
      });
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("运营商列表", `共 ${rows.length} 家 · 含账户与清分摘要`, "platform_operators", `<button type="button" class="btn primary" data-new-operator>+ 新增运营商</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>运营商</th><th>联系人</th><th>城市</th><th>状态</th><th>入驻</th><th>准入档位</th>
                <th>平台费率</th><th>保证金</th><th>信用额度（已用/上限）</th><th>跨网</th><th>操作</th>
              </tr></thead>
              <tbody>${rows.map(op => {
                const credit = creditForOperator(op.id);
                const prof = operatorCreditProfile(op.id);
                const tierTxt = prof?.tierCode ? tierLabel(prof.tierCode) : tag("待定档");
                return `<tr>
                  <td><strong>${op.name}</strong><br><small style="color:var(--muted)">${op.id}</small></td>
                  <td>${op.contactName}<br><small>${op.contactPhone}</small></td>
                  <td>${op.city}</td><td>${tag(op.status)}</td><td>${op.onboardDate}</td>
                  <td>${prof?.tierCode ? tag(tierTxt) : tierTxt}</td>
                  <td><strong class="fee-platform">${operatorFeeRateSummary(op.id)}</strong><br><small style="color:var(--muted)">C / B</small></td>
                  <td>¥${(credit?.depositBalance || 0).toLocaleString("zh-CN")}</td>
                  <td>${credit ? "¥" + credit.used + " / ¥" + credit.creditLimit : "—"}<br><small>封顶 ¥${(operatorCreditCap(op.id) ?? "—")}</small></td>
                  <td>${credit?.crossSwapEnabled ? tag("开启") : tag("已停")}</td>
                  <td>
                    <button type="button" class="link-btn" data-open-operator="${op.id}">详情</button>
                    <button type="button" class="link-btn" data-edit-operator="${op.id}">编辑</button>
                  </td>
                </tr>`;
              }).join("") || "<tr><td colspan='11'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderDeviceBinding() {
      state.view = "platformDevices";
      state.platformDeviceTab = "import";
      return renderPlatformDevices();
    }


    function renderSmsAlertRecordsPanel() {
      const f = getPf();
      const rows = (typeof smsAlertRecords !== "undefined" ? smsAlertRecords : []).filter(r => {
        if (!f.keyword) return true;
        return matchKw(r.template, f.keyword) || matchKw(r.to, f.keyword) || matchKw(r.bizRef, f.keyword) || matchKw(r.toRole, f.keyword);
      });
      const tpls = (typeof smsAlertTemplates !== "undefined" ? smsAlertTemplates : []);
      return `
        <section class="panel">
          ${panelHead("预警短信模板", "一期：可配模板/接收人", "day_pool_warn")}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>模板ID</th><th>名称</th><th>接收人</th><th>渠道</th></tr></thead>
            <tbody>${tpls.map(x => `<tr><td>${x.id}</td><td>${x.name}</td><td>${x.receivers}</td><td>${x.channel}</td></tr>`).join("") || "<tr><td colspan='4'>—</td></tr>"}</tbody></table>
          </div>
        </section>
        <section class="panel" style="margin-top:16px">
          ${panelHead("发送记录", `共 ${rows.length} 条`, "day_pool_warn")}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>时间</th><th>模板</th><th>对象</th><th>手机</th><th>业务单</th><th>状态</th></tr></thead>
            <tbody>${rows.map(r => `<tr><td>${r.time}</td><td>${r.template}</td><td>${r.toRole}</td><td>${r.to}</td><td>${r.bizRef}</td><td>${tag(r.status)}</td></tr>`).join("") || "<tr><td colspan='6'>—</td></tr>"}</tbody></table>
          </div>
        </section>`;
    }

    function renderL1Pricing() {
      const tab = state.l1PricingTab || "crossNet";
      if (tab === "sms") {
        return `${ownScopeBanner()}${renderSmsAlertRecordsPanel()}`;
      }
      if (tab === "dayPrice") {
        const cityRows = typeof stdDayCityOverrides !== "undefined" ? stdDayCityOverrides : [];
        return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("人天标准日值", "全网默认 · B 端 1% 计提基数；运营商默认批发价（可改）", "platform_day_standard")}
          <div class="panel-body">
            <p style="font-size:13px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_standard_day_price")} 平台按此价格向运营商展示并计提 B 端 1%；运营商新建签约渠道时默认批发价与此相同，可在「定价管理」修改。城市覆盖见下表。</p>
            <form id="stdDayPriceForm" class="form-grid" style="max-width:480px">
              <label>标准日值（元/人天）<input id="stdDayPrice" type="number" min="0" step="0.01" value="${platformStandardDayPrice.price}" required /></label>
              <label>生效日期<input type="date" id="stdDayEffectiveFrom" value="${platformStandardDayPrice.effectiveFrom}" /></label>
              <label>状态<select id="stdDayStatus"><option ${platformStandardDayPrice.status === "生效" ? "selected" : ""}>生效</option><option ${platformStandardDayPrice.status === "停用" ? "selected" : ""}>停用</option></select></label>
            </form>
            <p style="font-size:12px;color:var(--muted);margin:12px 0">最近更新：${platformStandardDayPrice.updatedAt} · ${platformStandardDayPrice.updatedBy}</p>
            <button type="button" class="btn primary" id="saveStdDayPrice">发布全网默认日值（演示）</button>
            <p style="font-size:12px;color:var(--muted);margin:10px 0 0">改价<strong>不追溯</strong>历史消耗计提。</p>
          </div>
        </section>
        <section class="panel">
          ${panelHead("城市覆盖价", "默认全网日值；可按城市单独覆盖（演示）", "platform_day_standard")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>城市</th><th>标准日值</th><th>状态</th><th>更新</th><th>操作</th></tr></thead>
              <tbody>${cityRows.map(r => `<tr>
                <td><strong>${r.city}</strong></td>
                <td>¥${r.price}/人天</td>
                <td>${tag(r.status)}</td><td>${r.updatedAt}</td>
                <td><button type="button" class="link-btn" data-std-city-edit="${r.id}">编辑（演示）</button></td>
              </tr>`).join("") || "<tr><td colspan='5'>暂无城市覆盖</td></tr>"}</tbody>
            </table>
            <button type="button" class="btn" style="margin-top:10px" id="addStdDayCityOverride">+ 添加城市覆盖（演示）</button>
          </div>
        </section>`;
      }
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("跨网服务费 · 全网默认价", "跨运营商换电柜机/电池服务费；运营商往来账只读", "platform_l1_pricing")}
          <div class="panel-body">
            <form id="l1PricingForm" class="form-grid" style="max-width:480px">
              <label>柜机服务费（元/次）<input id="l1CabinetFee" type="number" min="0" step="0.01" value="${l1UnifiedPricing.cabinetFee}" required /></label>
              <label>电池服务费（元/次）<input id="l1BatteryFee" type="number" min="0" step="0.01" value="${l1UnifiedPricing.batteryFee}" required /></label>
              <label>生效日期<input type="date" id="l1EffectiveFrom" value="${l1UnifiedPricing.effectiveFrom}" /></label>
              <label>状态<select id="l1Status"><option ${l1UnifiedPricing.status === "生效" ? "selected" : ""}>生效</option><option ${l1UnifiedPricing.status === "停用" ? "selected" : ""}>停用</option></select></label>
            </form>
            <p style="font-size:12px;color:var(--muted);margin:12px 0">最近更新：${l1UnifiedPricing.updatedAt} · ${l1UnifiedPricing.updatedBy}。变更后 enrichSwapTriplet / 运营商往来账演示按新单价计算。</p>
            <button type="button" class="btn primary" id="saveL1Pricing">发布全网默认价（演示）</button>
            <p style="font-size:12px;color:var(--muted);margin:10px 0 0">改价<strong>不追溯</strong>历史跨网订单。城市覆盖见下表。</p>
          </div>
        </section>
        <section class="panel">
          ${panelHead("城市覆盖价", "默认全网价；可按城市单独覆盖柜机/电池单价", "platform_l1_pricing")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>城市</th><th>柜机费</th><th>电池费</th><th>状态</th><th>更新</th><th>操作</th></tr></thead>
              <tbody>${(typeof l1CityOverrides !== "undefined" ? l1CityOverrides : []).map(r => `<tr>
                <td><strong>${r.city}</strong></td>
                <td>¥${r.cabinetFee}</td><td>¥${r.batteryFee}</td>
                <td>${tag(r.status)}</td><td>${r.updatedAt}</td>
                <td><button type="button" class="link-btn" data-l1-city-edit="${r.id}">编辑（演示）</button></td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无城市覆盖</td></tr>"}</tbody>
            </table>
            <button type="button" class="btn" style="margin-top:10px" id="addL1CityOverride">+ 添加城市覆盖（演示）</button>
          </div>
        </section>
        <section class="panel">
          ${panelHead("定价影响范围", "只读说明", "inter_op_pricing")}
          <div class="panel-body">
            <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--muted);line-height:1.8">
              <li>个人套餐用户跨运营商换电：U≠C 代付柜机费，U≠B 代付电池费</li>
              <li>渠道成员<strong>允许跨网换电</strong>，与个人用户相同清分规则；userOwner=额度售卖方 U</li>
              <li>运营商后台「运营商往来账」展示平台统价，不可自行改价</li>
              <li>日清 ${INTER_OP_CLEAR_TIME}：优先划扣保证金，保证金为 0 才启用信用额度</li>
              <li>城市覆盖价优先于全网默认价；改价不追溯</li>
            </ul>
          </div>
        </section>`;
    }

    function renderPlatformUsers() {
      const tab = state.platformUsersTab || "info";
      const f = getPf();
      if (tab === "serviceChange") {
        const rows = serviceChangeRequests.filter(sc => {
          if (f.scId && sc.id !== f.scId) return false;
          if (f.orderId && !matchKw(sc.subId, f.orderId)) return false;
          if (f.phone && !matchKw(sc.phone, f.phone) && !matchKw(sc.user, f.phone)) return false;
          if (f.operatorId !== "全部" && sc.deviceOwnerId !== f.operatorId) return false;
          if (f.type !== "全部" && sc.type !== f.type) return false;
          if (f.status !== "全部") {
            const displayStatus = sc.status === "退款处理中" ? "待退款" : sc.status;
            if (displayStatus !== f.status && sc.status !== f.status) return false;
          }
          return true;
        });
        return `
          <section class="panel">
            ${panelHead("全平台服务变更", `共 ${rows.length} 条 · 冻结/解冻/中途完结`, "orders_service_change")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("orders_service_change")} 平台只读追溯；退款执行在运营商「退款管理」。</p>
              <table>
                <thead><tr>
                  <th>申请单</th><th>类型</th><th>套餐单</th><th>用户</th><th>运营商</th><th>站点</th>
                  <th>申请时间</th><th>应退/说明</th><th>状态</th><th>操作</th>
                </tr></thead>
                <tbody>${rows.map(sc => `<tr${f.scId === sc.id ? " style=\"background:#fffbe6\"" : ""}>
                  <td><strong>${sc.id}</strong></td>
                  <td>${tag(sc.type)}</td>
                  <td><button type="button" class="link-btn" data-audit-ref="package:${sc.subId}">${sc.subId}</button></td>
                  <td>${sc.user}<br><small>${sc.phone}</small></td>
                  <td>${operatorLabel(sc.deviceOwnerId)}</td>
                  <td>${sc.site}</td>
                  <td>${sc.applyTime}</td>
                  <td>${sc.amount ? "¥" + sc.amount : sc.detail || "—"}</td>
                  <td>${tag(sc.status === "退款处理中" ? "待退款" : sc.status)}</td>
                  <td><button type="button" class="link-btn" data-audit-ref="package:${sc.subId}">查看套餐</button></td>
                </tr>`).join("") || "<tr><td colspan='10'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`;
      }
      if (tab === "depositStats") {
        const summary = platformDepositSummaryByOperator().filter(r =>
          f.operatorId === "全部" || !f.operatorId || r.op.id === f.operatorId
        );
        const allHeld = summary.reduce((s, r) => s + r.heldAmount, 0);
        return `
          <section class="panel overview-kpi-panel">
            ${panelHead("用户押金统计", "按运营商只读汇总 · 实付在押不进平台/合伙人清分", "rider_battery_deposit")}
            <div class="panel-body">
              <div class="kpi-grid in-panel kpi-grid-4" style="margin-bottom:14px">
                ${kpi("全平台在押总额", "¥" + allHeld.toLocaleString("zh-CN"), "实付+退押中", "押", "rider_battery_deposit")}
                ${kpi("运营商数", summary.length, f.operatorId && f.operatorId !== "全部" ? "当前筛选" : "在营主体", "运", "platform_operators")}
              </div>
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("rider_battery_deposit")} 与「平台保证金」无关；押金数额由各运营商「定价管理 → 押金设置」配置。</p>
              <div class="orders-table-wrap">
                <table>
                  <thead><tr>
                    <th>运营商</th><th>实付在押总额</th><th>在押人数</th><th>信用免押</th><th>渠道担保</th><th>退押中金额</th>
                  </tr></thead>
                  <tbody>${summary.map(r => `<tr>
                    <td><strong>${r.op.name}</strong><br><small style="color:var(--muted)">${r.op.id}</small></td>
                    <td><strong>¥${r.heldAmount.toLocaleString("zh-CN")}</strong></td>
                    <td>${r.heldUsers}</td>
                    <td>${r.creditUsers}</td>
                    <td>${r.channelUsers}</td>
                    <td>¥${r.refundingAmount.toLocaleString("zh-CN")}</td>
                  </tr>`).join("") || "<tr><td colspan='6'>暂无</td></tr>"}</tbody>
                </table>
              </div>
            </div>
          </section>`;
      }
      const rows = users.map(platformUserProfile).filter(u => {
        if (!matchKw(u.id, f.keyword) && !matchKw(u.phone, f.keyword)) return false;
        if (f.operatorId !== "全部" && u.serviceOperatorId !== f.operatorId) return false;
        if (f.userType !== "全部" && u.userType !== f.userType) return false;
        if (f.userStatus !== "全部" && u.userStatus !== f.userStatus) return false;
        if (f.depositKind && f.depositKind !== "全部" && u.depositKind !== f.depositKind) return false;
        return true;
      });
      const pg = paginateList(rows, state.platformUsersPage, state.platformUsersPageSize);
      state.platformUsersPage = pg.page;
      return `
        <section class="panel">
          ${panelHead("用户信息", `共 ${pg.total} 人`, "platform_users")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>用户</th><th>用户状态</th><th>服务运营商</th><th>用户类型</th>
                <th>电池押金</th><th>套餐/权益</th><th>状态·生效周期</th><th>渠道商</th><th>持有电池</th>
              </tr></thead>
              <tbody>${pg.slice.map(u => `<tr>
                <td>${u.id}<br><small style="color:var(--muted)">${u.phone}</small></td>
                <td>${tag(u.userStatus)}</td>
                <td><strong>${u.serviceOperatorName}</strong><br><small style="color:var(--muted)">${u.serviceOperatorId}</small></td>
                <td>${u.userType}</td>
                <td>${riderDepositCellHtml({ kind: u.depositKind, label: u.depositLabel, sub: u.depositSub })}</td>
                <td>${u.pkgName}</td>
                <td>${tag(String(u.pkgStatus))}<br><small style="color:var(--muted)">${u.pkgPeriod}</small></td>
                <td>${u.channelName}</td>
                <td>${u.heldBattery}${u.heldBatteryHint ? `<br><small style="color:var(--muted)">${u.heldBatteryHint}</small>` : (u.batteryOwner !== "—" ? `<br><small style="color:var(--muted)">归属 ${u.batteryOwner}</small>` : "")}</td>
              </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
            </table>
            ${renderTablePager(pg, "pu-page")}
          </div>
        </section>`;
    }

    function renderPlatformOrders() {
      const tab = state.platformOrderTab;
      const tabDefs = [["package", "套餐购买订单"], ["swap", "换电订单"], ["channel", "渠道商订单"]];
      const sidebar = tabSidebar(tabDefs, tab, "potab");
      if (tab === "channel") {
        const f = getPf();
        const rows = channelSalesOrders.filter(o => {
          if (!matchKw(o.id, f.orderId)) return false;
          if (f.channelId !== "全部" && o.channelId !== f.channelId) return false;
          if (f.payChannel !== "全部" && o.payChannel !== f.payChannel) return false;
          if (f.orderStatus !== "全部" && o.orderStatus !== f.orderStatus) return false;
          if (f.payStatus !== "全部" && o.payStatus !== f.payStatus) return false;
          return true;
        });
        return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("渠道商批发订单", `共 ${rows.length} 笔人天采购`, "platform_channel_po")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_channel_po")}</p>
              <table>
                <thead><tr>
                  <th>批发单号</th><th>渠道商</th><th>售卖运营商</th><th>人天/金额</th>
                  <th>支付渠道</th><th>支付方式</th><th>订单状态</th><th>支付状态</th>
                  <th>下单时间</th><th>完成/确认</th><th>操作</th>
                </tr></thead>
                <tbody>${rows.map(o => `<tr>
                  <td>${o.id}${o.poolId ? `<br><small style="color:var(--muted)">${o.poolId}</small>` : ""}</td>
                  <td>${o.channelName}</td>
                  <td>${o.operatorName || operatorLabel(o.operatorId)}</td>
                  <td>${o.days.toLocaleString("zh-CN")} 人天<br><strong>¥${o.amount.toLocaleString("zh-CN")}</strong></td>
                  <td>${channelPayChannelLabel(o)}</td>
                  <td>${channelPayMethodLabel(o)}${o.offlineVoucher ? `<br><small>${o.offlineVoucher}</small>` : ""}</td>
                  <td>${tag(o.orderStatus)}</td>
                  <td>${tag(o.payStatus)}</td>
                  <td>${o.createdAt || "—"}</td>
                  <td>${o.payTime || "—"}</td>
                  <td>${channelPoActionCell(o, "platform")}</td>
                </tr>`).join("") || "<tr><td colspan='11'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      if (tab === "swap") {
        const f = getPf();
        const rows = swapOrders.filter(s => {
          const tri = enrichSwapTriplet(s);
          if (!matchKw(s.id, f.swapId) && !matchKw(s.phone, f.phone)) return false;
          if (f.operatorId !== "全部" && tri.userOwnerId !== f.operatorId) return false;
          if (f.status !== "全部" && s.status !== f.status) return false;
          return true;
        });
        const pkgMap = Object.fromEntries(packageOrders.map(p => [p.id, p]));
        return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("全平台换电订单", `共 ${rows.length} 条`, "orders_swap_triplet")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>换电单</th><th>用户</th><th>用户运营商</th><th>柜机运营商</th><th>电池运营商</th><th>跨网服务费</th><th>站点</th><th>权益</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
                <tbody>${rows.map(s => {
                  const tri = enrichSwapTriplet(s);
                  return `<tr>
                    <td>${s.id}</td><td>${s.user}<br><small>${s.phone}</small></td>
                    <td>${tri.userOwnerName}</td><td>${tri.cabinetOwnerName}</td><td>${tri.batteryOwnerName}</td>
                    <td>${swapL1FeeCell(s)}</td><td>${s.site}</td><td>${s.entitlementType || "—"}</td>
                    <td>${tag(s.status)}</td><td>${s.time}</td>
                    <td><button type="button" class="link-btn" data-open-swap="${s.id}">详情</button></td>
                  </tr>`;
                }).join("") || "<tr><td colspan='11'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      const f = getPf();
      const rows = packageOrders.filter(p => {
        if (!matchKw(p.id, f.orderId) && !matchKw(p.phone, f.phone)) return false;
        if (f.operatorId !== "全部" && p.deviceOwnerId !== f.operatorId) return false;
        if (f.serviceState !== "全部" && (p.serviceState || p.status) !== f.serviceState) return false;
        return true;
      });
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
          ${panelHead("全平台套餐订单", `共 ${rows.length} 条`, "platform_orders")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>套餐单号</th><th>用户</th><th>售卖运营商</th><th>站点</th><th>套餐</th><th>服务状态</th><th>生效周期</th><th>支付</th><th>操作</th></tr></thead>
              <tbody>${rows.map(p => `<tr>
                  <td>${p.id}</td><td>${p.user}<br><small>${p.phone}</small></td>
                  <td>${p.deviceOwnerName}</td><td>${p.site}</td><td>${p.pkg}</td>
                  <td>${serviceStateCell(p)}</td>
                  <td>${p.validFrom}<br><small>至 ${p.validTo}</small></td>
                  <td>¥${p.pay}</td>
                  <td><button type="button" class="link-btn" data-open-sub="${p.id}">详情</button></td>
                </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function allPlatformDeviceRows() {
      return [
        ...cabinets.map(c => ({ sn: c.sn, type: "cabinet", typeLabel: "换电柜", operatorId: c.deviceOwnerId, operatorName: c.deviceOwnerName, site: c.site, city: c.city, bindStatus: "已归属", boundAt: c.boundAt || "—", online: c.online, specs: c.specs || "—" })),
        ...batteries.map(b => ({ sn: b.sn, type: "battery", typeLabel: "电池", operatorId: b.deviceOwnerId, operatorName: b.deviceOwnerName, site: b.site, city: b.city, bindStatus: "已归属", boundAt: b.boundAt || "—", soc: b.soc, specs: b.specs || "—" }))
      ];
    }

    function renderPlatformDevices() {
      const tab = state.platformDeviceTab;
      const tabDefs = [["ledger", "设备台账"], ["import", "批量导入"]];
      const sidebar = tabSidebar(tabDefs, tab, "pdtab");
      if (tab === "import") {
        const iotCount = platformDeviceInventory.length;
        return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("批量导入设备", "SN + 运营商ID · 类型/参数由 IoT 回填", "platform_devices_import")}
            <div class="panel-body">
              <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_device_bind")}${noteBtn("platform_devices_import")}
                <strong>模板字段</strong>：SN、运营商ID。类型、城市、规格等按 SN 自动从物联网平台拉取；导入即归属运营商并进入「设备台账」（无待绑定队列）。演示 IoT 可查 ${iotCount} 台。</div>
              <form id="deviceImportForm" class="form-grid" style="max-width:640px">
                <label style="grid-column:1/-1">粘贴列表（每行：SN,运营商ID）
                  <textarea id="deviceImportText" rows="8" placeholder="CAB-NEW-003,OP-SX&#10;BAT-NEW-002,OP-LJZ"></textarea>
                </label>
              </form>
              <div style="display:flex;gap:8px;margin-top:12px">
                <button type="button" class="btn primary" id="deviceImportBtn">导入（演示）</button>
                <button type="button" class="link-btn" id="deviceImportTemplate">下载模板</button>
              </div>
            </div>
          </section>`)}`;
      }
      const f = getPf();
      const rows = allPlatformDeviceRows().filter(r => {
        if (f.type !== "全部" && r.type !== f.type) return false;
        if (f.operatorId !== "全部" && r.operatorId !== f.operatorId) return false;
        if (f.keyword && !matchKw(r.sn, f.keyword)) return false;
        return true;
      });
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
          ${panelHead("全平台设备台账", `共 ${rows.length} 台`, "platform_devices_import")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_operator_device_gate")} 归属运营商后，方可在「我的设备」维护并分配至站点。新设备请走「批量导入」。</p>
            <table>
              <thead><tr><th>SN</th><th>类型</th><th>规格</th><th>归属运营商</th><th>城市</th><th>站点</th><th>状态</th><th>归属日</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.sn}</td><td>${r.typeLabel}</td><td>${r.specs || "—"}</td>
                <td>${r.operatorName}</td><td>${r.city || "—"}</td><td>${r.site}</td>
                <td>${r.online === false ? tag("离线") : r.soc != null ? `SOC ${r.soc}%` : tag("在线")}</td>
                <td>${r.boundAt}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function renderPlatformChannels() {
      const f = getPf();
      const rows = platformChannels.filter(c => {
        if (f.status !== "全部" && c.status !== f.status) return false;
        if (f.keyword && !matchKw(c.name, f.keyword) && !matchKw(c.id, f.keyword) && !matchKw(c.contactName, f.keyword)) return false;
        return true;
      });
      return `${ownScopeBanner()}<section class="panel">
          ${panelHead("渠道商列表", `共 ${rows.length} 家`, "platform_channels")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_channels")}${noteBtn("channel_partner_manage")}${noteBtn("channel_no_receipt")}</p>
            <table>
              <thead><tr>
                <th>渠道商</th><th>结算模式</th><th>账号</th><th>联系人</th><th>状态</th><th>创建/维护方</th><th>签约运营商</th>
                <th>采购支付</th><th>经营摘要</th><th>人员</th>
              </tr></thead>
              <tbody>${rows.map(c => {
                const summary = c.settlementMode === "卡差价"
                  ? `链接成交 ${c.linkOrders || 0} 单 · 应结佣 ¥${c.monthCommission || 0}`
                  : c.settlementMode === "设备租赁"
                    ? `月租 ¥${(c.monthlyRent || 0).toLocaleString()} · 设备 ${channelRentDevices.filter(d => d.channelId === c.id).length} 台 · 白名单 ${c.riderCount || 0}`
                    : `额度池 ${c.poolCount} 个 · ${c.availableDays} / ${c.purchasedDays} 人天 · 月消耗 ${c.monthConsume}`;
                return `<tr>
                <td><strong>${c.name}</strong><br><small style="color:var(--muted)">${c.id}</small></td>
                <td>${settlementModeLabel(c.settlementMode || "人天池")}</td>
                <td>${c.loginAccount}</td>
                <td>${c.contactName}<br><small>${c.contactPhone}</small></td>
                <td>${tag(c.status)}</td>
                <td>${c.createdByOperatorName || "—"}<br><small style="color:var(--muted)">${c.createdByOperatorId || ""}</small></td>
                <td>${c.signedOperators.join("、")}</td>
                <td>${c.paySummary || "向运营商付款"}<br><small style="color:var(--muted)">${c.settlementMode === "设备租赁" ? "白名单套餐收款" : "无 C 端收款"}</small></td>
                <td><small>${summary}</small></td>
                <td>员工 ${c.staffCount} · 骑手 ${c.riderCount}<br><small>团队 ${c.teamCount}</small></td>
              </tr>`;
              }).join("") || "<tr><td colspan='10'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderPlatformMarketing() {
      const tab = state.platformMarketingTab;
      const tabDefs = [
        ["campaigns", "活动管理"], ["agreements", "运营商签约"], ["links", "链接与二维码"],
        ["pending", "成交订单"], ["settlements", "券核销结算"], ["statements", "营销对账"]
      ];
      const sidebar = tabSidebar(tabDefs, tab, "pmtab");
      const f = getPf();
      let body = "";

      if (tab === "campaigns") {
        const rows = platformMarketingCampaigns.filter(c => {
          if (f.status !== "全部" && c.status !== f.status) return false;
          if (f.keyword && !matchKw(c.name, f.keyword) && !matchKw(c.id, f.keyword)) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("营销活动", "二期 · 立减优惠券 · 购时锁运营商 · 款进运营商", "platform_marketing", noteBtn("platform_marketing") + phase2BadgeHtml())}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>活动</th><th>周期</th><th>SKU / 立减券</th><th>签约运营商</th><th>状态</th></tr></thead>
              <tbody>${rows.map(c => {
                const enrolled = platformMarketingAgreements.filter(a => a.campaignId === c.id && a.status === "已启用").length;
                const skuLines = c.skuPrices.map(s => {
                  const coupon = s.couponAmount != null ? s.couponAmount : Math.max(0, (s.officialPrice || 0) - (s.activityPrice || 0));
                  const pay = s.activityPrice != null ? s.activityPrice : (s.officialPrice - coupon);
                  return `${s.skuName} 原价 ¥${s.officialPrice} · <strong>立减 ¥${coupon}</strong> → 实付 ¥${pay}`;
                }).join("<br>");
                return `<tr>
                  <td><strong>${c.name}</strong><br><small>${c.id}</small></td>
                  <td>${c.startAt} ~ ${c.endAt}</td>
                  <td>${skuLines}</td>
                  <td>${enrolled} 家已启用</td>
                  <td>${tag(c.status)}</td>
                </tr>`;
              }).join("") || "<tr><td colspan='5'>暂无活动</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "agreements") {
        const rows = platformMarketingAgreements.filter(a => {
          if (f.operatorId !== "全部" && a.operatorId !== f.operatorId) return false;
          if (f.status !== "全部" && a.status !== f.status) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("运营商签约", "opt-in · 立减让利由 OP 承担 · 营销费协议月结", "platform_marketing")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>协议</th><th>运营商</th><th>活动</th><th>SKU</th><th>营销服务费/单</th><th>状态</th><th>确认日</th></tr></thead>
              <tbody>${rows.map(a => `<tr>
                <td>${a.id}</td>
                <td>${a.operatorName}<br><small>${a.operatorId}</small></td>
                <td>${a.campaignName}</td>
                <td>${a.skuName}</td>
                <td>¥${a.marketingServiceFee}</td>
                <td>${tag(a.status)}</td>
                <td>${a.confirmedAt || "—"}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无签约</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "links") {
        const rows = platformMarketingLinks.filter(l => {
          if (f.campaignId !== "全部" && l.campaignId !== f.campaignId) return false;
          if (f.status !== "全部" && l.status !== f.status) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("推广链接与二维码", "必须 op= · ch=PLATFORM · 24h 归因", "platform_marketing_collect")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">每条链接绑定<strong>已签约运营商</strong>；购买时锁定该 OP，用户款进其自商户。</p>
            <table>
              <thead><tr><th>用途</th><th>锁定运营商</th><th>链接码</th><th>URL</th><th>点击</th><th>成交</th><th>状态</th></tr></thead>
              <tbody>${rows.map(l => `<tr>
                <td>${l.purpose}</td>
                <td><strong>${l.operatorName || operatorLabel(l.operatorId)}</strong><br><small>${l.operatorId || "—"}</small></td>
                <td>${l.linkCode}</td>
                <td><small style="word-break:break-all">${l.linkUrl}</small></td>
                <td>${l.clicks}</td>
                <td>${l.conversions}</td>
                <td>${tag(l.status)}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无链接</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "pending") {
        const rows = platformMarketingOrders.filter(o => {
          if (f.activationStatus === "已退款" && o.status !== "已退款") return false;
          if (f.activationStatus === "服务中" && o.status !== "服务中") return false;
          if (f.activationStatus === "pending" || f.activationStatus === "activated") {
            /* 兼容旧筛选项：不再有待激活 */
            if (f.activationStatus === "pending") return false;
            if (f.activationStatus === "activated" && o.status !== "服务中") return false;
          } else if (f.activationStatus && f.activationStatus !== "全部" && o.status !== f.activationStatus) return false;
          if (f.keyword && !matchKw(o.id, f.keyword) && !matchKw(o.phone, f.keyword) && !matchKw(o.riderName, f.keyword)) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("成交订单", `共 ${rows.length} 笔 · 立减券 · 运营商收款`, "platform_marketing_collect")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_marketing_payout")} 支付成功即服务中；1% 按实付分账；立减额<strong>运营商让利</strong>；营销服务费协议记账。<strong>无平台代收/补贴/拨付。</strong></p>
            <table>
              <thead><tr><th>订单</th><th>用户</th><th>锁定运营商</th><th>原价/立减/实付</th><th>1%技服</th><th>营销费</th><th>状态</th></tr></thead>
              <tbody>${rows.map(o => `<tr>
                <td>${o.id}<br><small>${o.payTime}<br>${o.linkPurpose || o.linkCode}</small></td>
                <td>${o.riderName}<br><small>${o.phone}</small></td>
                <td><strong>${o.lockedOperatorName || o.activatedOperatorName || "—"}</strong><br><small>${o.lockedOperatorId || o.activatedOperatorId || ""}</small></td>
                <td>¥${o.officialPrice} − ¥${o.couponAmount || 0}<br><strong>实付 ¥${o.paidPrice}</strong></td>
                <td>¥${o.platformFee}</td>
                <td>${o.marketingServiceFee != null ? "¥" + o.marketingServiceFee : "—"}</td>
                <td>${tag(o.status)}${o.refundStatus ? `<br><small>${o.refundStatus}</small>` : ""}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无订单</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "settlements") {
        const rows = platformMarketingSettlements.filter(s => {
          if (f.operatorId !== "全部" && s.operatorId !== f.operatorId) return false;
          const t = s.settleAt || s.activatedAt || "";
          if (f.month && t && !t.startsWith(f.month)) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("券核销与营销费记账", "立减=运营商让利 · 无用户款拨付", "platform_marketing_payout")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>流水</th><th>订单</th><th>运营商</th><th>实付</th><th>立减券</th><th>1%技服</th><th>营销费</th><th>时间</th><th>状态</th></tr></thead>
              <tbody>${rows.map(s => `<tr>
                <td>${s.id}</td><td>${s.orderId}</td>
                <td>${s.operatorName}</td>
                <td>¥${s.paid}</td><td>¥${s.couponAmount != null ? s.couponAmount : "—"}</td>
                <td>¥${s.platformFee}</td><td>¥${s.marketingFee}</td>
                <td>${s.settleAt || s.activatedAt || "—"}</td><td>${tag(s.status)}</td>
              </tr>`).join("") || "<tr><td colspan='9'>暂无记录</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else {
        const rows = platformMarketingStatements.filter(s => {
          if (f.month !== "全部" && s.month !== f.month) return false;
          if (f.operatorId !== "全部" && s.operatorId !== f.operatorId) return false;
          if (f.status !== "全部" && s.status !== f.status) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("营销对账", "自然月 · 实付 / 立减让利 / 营销服务费", "platform_marketing_payout")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>账单</th><th>月份</th><th>运营商</th><th>成交笔数</th><th>实付合计</th><th>立减让利</th><th>营销费合计</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(s => `<tr>
                <td>${s.id}</td><td>${s.month}</td><td>${s.operatorName}</td>
                <td>${s.orderCount}</td>
                <td>¥${s.paidTotal != null ? s.paidTotal : s.payoutTotal || 0}</td>
                <td>¥${s.couponTotal != null ? s.couponTotal : "—"}</td>
                <td>¥${s.marketingFeeTotal}</td>
                <td>${tag(s.status)}</td>
                <td>${s.status === "待确认" ? `<button type="button" class="link-btn" data-pm-confirm-stmt="${s.id}">平台确认</button>` : "—"}</td>
              </tr>`).join("") || "<tr><td colspan='9'>本月无平台营销成交</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      return `${ownScopeBanner()}${pageWithTabs(sidebar, body)}`;
    }


    function renderPlatformFlows() {
      const tab = state.platformFlowTab;
      const tabDefs = [["userPay", "用户支付记录"], ["interOp", "运营商之间"], ["platformFee", "平台提成"]];
      const sidebar = tabSidebar(tabDefs, tab, "pftab");
      if (tab === "interOp") {
        const f = getPf();
        const rows = interOpDailyBills.filter(b => {
          if (f.operatorId !== "全部" && b.operatorId !== f.operatorId) return false;
          if (!matchDateStr(b.date, f.dateFrom, f.dateTo)) return false;
          return true;
        });
        return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("运营商间 跨网设备服务费清分流水", `日账单 ${rows.length} 条`, "platform_flows")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("inter_op")}${noteBtn("inter_op_privacy")} 平台视角可见双方运营商 ID，运营商后台只见代收/代付。</p>
              <table>
                <thead><tr><th>日账单</th><th>运营商</th><th>平台代付</th><th>平台代收</th><th>净额</th><th>换电笔数</th><th>扣款来源</th><th>状态</th></tr></thead>
                <tbody>${rows.map(b => `<tr>
                  <td>${b.id}<br><small>${b.date}</small></td>
                  <td>${operatorLabel(b.operatorId)}</td>
                  <td>¥${b.platformPayOut}</td><td>¥${b.platformPayIn}</td>
                  <td><strong>¥${b.net}</strong></td><td>${b.swapCount}</td>
                  <td>${b.deductSource}</td><td>${tag(b.status)}</td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      if (tab === "platformFee") {
        const f = getPf();
        const bRows = platformFeeAccruals.filter(r => {
          if (f.operatorId !== "全部" && r.operatorId !== f.operatorId) return false;
          if (f.trigger !== "全部" && r.trigger !== f.trigger) return false;
          return true;
        });
        const cRows = packageOrders.filter(p => {
          if (f.operatorId !== "全部" && p.deviceOwnerId !== f.operatorId) return false;
          if (f.trigger !== "全部" && f.trigger !== "支付成功") return false;
          return true;
        }).map(p => ({
          id: "PF-C-" + p.id, date: (p.payTime || "").slice(0, 10), operatorId: p.deviceOwnerId,
          channelName: "—", trigger: "支付成功", ref: p.id,
          amount: calcPlatformFeeAmount(p.pay, p.deviceOwnerId, "支付成功"),
          feeRate: operatorCEndFeeRate(p.deviceOwnerId),
          status: "已分账", deductPath: "支付通道分账"
        }));
        const rows = f.trigger === "确认消耗" ? bRows : f.trigger === "支付成功" ? cRows : bRows.concat(cRows);
        const total = rows.reduce((s, r) => s + (r.feeAmount || r.amount || 0), 0);
        return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("平台提成流水", `合计 ¥${total.toFixed(2)}`, "platform_flows")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("platform_fee")}${noteBtn("platform_operator_fee_rate")} 提成按各运营商 C/B 端配置比例计算。</p>
              <table>
                <thead><tr><th>流水号</th><th>日期</th><th>计提主体</th><th>场景</th><th>关联单</th><th>费率</th><th>提成</th><th>状态</th><th>扣款路径</th></tr></thead>
                <tbody>${rows.map(r => `<tr>
                  <td>${r.id}</td><td>${r.date}</td><td>${operatorLabel(r.operatorId)}</td>
                  <td>${r.trigger}</td><td>${r.swapId || r.ref || r.poolId || "—"}</td>
                  <td>${formatFeeRatePct(r.feeRate || (r.trigger === "支付成功" ? operatorCEndFeeRate(r.operatorId) : operatorBEndFeeRate(r.operatorId)))}</td>
                  <td class="fee-platform">¥${(r.feeAmount || r.amount || 0).toFixed(3)}</td>
                  <td>${tag(r.status)}</td><td>${r.deductPath}</td>
                </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      const f = getPf();
      const rows = fundReceipts.filter(r => {
        if (!matchKw(r.order, f.orderId)) return false;
        if (f.flowType !== "全部" && r.type !== f.flowType) return false;
        if (f.operatorId !== "全部" && r.deviceOwnerId !== f.operatorId) return false;
        return true;
      });
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
          ${panelHead("用户支付记录", `共 ${rows.length} 条`, "platform_flows")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>流水号</th><th>类型</th><th>关联单</th><th>用户</th><th>收款运营商</th><th>金额</th><th>平台费</th><th>通道</th><th>时间</th><th>状态</th></tr></thead>
              <tbody>${rows.map(r => {
                const pf = r.type === "套餐支付" && r.amount > 0 && r.deviceOwnerId
                  ? calcPlatformFeeAmount(r.amount, r.deviceOwnerId, "支付成功") : "—";
                return `<tr>
                  <td>${r.id}</td><td>${tag(r.type)}</td><td>${r.order}</td><td>${r.user || "—"}</td>
                  <td>${r.payee}</td><td>¥${r.amount}</td>
                  <td>${pf === "—" ? "—" : `<span class="fee-platform">¥${pf}</span>`}</td>
                  <td>${r.channel}</td><td>${r.time}</td><td>${tag(r.status)}</td>
                </tr>`;
              }).join("") || "<tr><td colspan='10'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function renderPlatformAccounts() {
      const base = platformMerchantAccount;
      const month = selectedPlatformAccountMonth();
      const a = platformAccountForMonth(month);
      const monthLabel = month.replace("-", "年") + "月";
      return `
        ${ownScopeBanner()}
        <div class="kpi-grid" style="grid-template-columns:repeat(4,minmax(120px,1fr))">
          ${kpi("账户余额", "¥" + a.balance.toLocaleString("zh-CN"), month + " 月末 · 可提现", "余", "platform_account")}
          ${kpi("冻结", "¥" + a.frozen.toLocaleString("zh-CN"), month + " · 处理中", "冻", "platform_account")}
          ${kpi(monthLabel + "提成", "¥" + a.total.toLocaleString("zh-CN"), "C 端+B 端", "收", "platform_fee")}
          ${kpi(monthLabel + "支付笔数", a.payCount, "套餐/自费", "笔", "platform_flows")}
        </div>
        <section class="panel">
          ${panelHead("平台收款商户", ENT.platform.name, "platform_account")}
          <div class="panel-body">
            <div class="detail-grid">
              <div class="detail-item"><span>微信商户号</span><strong>${base.wxMch}</strong></div>
              <div class="detail-item"><span>支付宝商户号</span><strong>${base.aliMch}</strong></div>
              <div class="detail-item"><span>结算银行</span><strong>${base.settleBank}</strong></div>
              <div class="detail-item"><span>结算账号</span><strong>${base.settleAccount}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel">
          ${panelHead(monthLabel + "营收构成", "技术服务费 1%", "platform_fee")}
          <div class="panel-body">
            <table>
              <thead><tr><th>来源</th><th>说明</th><th>笔数</th><th>金额</th></tr></thead>
              <tbody>
                <tr><td>C 端支付分账</td><td>套餐/自费支付成功时 1% 分账至平台商户</td><td>${a.payCount}</td><td class="fee-platform">¥${a.cEndSplit}</td></tr>
                <tr><td>B 端确认消耗计提</td><td>渠道人天确认消耗向额度售卖方运营商计提</td><td>${a.consumeFeeCount}</td><td class="fee-platform">¥${a.bEndAccrual}</td></tr>
                <tr><td>运营商间跨网设备服务费</td><td>平台代收代付清分（非平台营收，仅记账）</td><td>${a.interOpCount}</td><td>¥${a.l1Clearing}</td></tr>
                <tr><td><strong>合计</strong></td><td>平台技术服务费营收</td><td>—</td><td><strong class="fee-platform">¥${a.total}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>`;
    }

    function renderOverview() {
      if (isPlatformRole()) return renderPlatformOverview();
      if (isLeasingRole()) {
        const eid = currentEntity().id;
        const apps = financeApplications.filter(a => a.financierId === eid);
        const pendingApps = apps.filter(a => a.status === "已提交资方");
        const projects = financeProjects.filter(p => p.financierId === eid);
        const creditLimit = projects.reduce((s, p) => s + p.creditLimit, 0);
        const used = projects.reduce((s, p) => s + (p.usedAmount || 0), 0);
        const opCount = new Set(apps.map(a => a.operatorId)).size;
        const sched = financeRepaymentSchedules.filter(s => apps.some(a => a.id === s.applicationId));
        const monthDue = sched.filter(s => s.dueDate.startsWith("2026-06") && s.status !== "已还清").reduce((x, s) => x + s.dueAmount - s.paidAmount, 0);
        return `
          ${ownScopeBanner()}
          <div class="kpi-grid">
            ${kpi("授信项目", projects.length, "生效中", "项", "finance_projects")}
            ${kpi("授信总额", finYuan(creditLimit), "已占用 " + finYuan(used), "额", "finance_projects")}
            ${kpi("放款申请", apps.length, "待确认 " + pendingApps.length, "批", "finance_drawdown")}
            ${kpi("合作运营商", opCount + " 家", "平台已绑定", "运", "finance_drawdown")}
          </div>
          <section class="panel">
            ${panelHead("待确认放款申请", "快捷进入「放款申请」审核批次与预还款计划", "finance_drawdown")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>批次号</th><th>运营商</th><th>申请月</th><th>设备数</th><th>申请金额</th><th>状态</th><th>提交时间</th><th>操作</th></tr></thead>
                <tbody>${pendingApps.length ? pendingApps.map(a => `<tr>
                    <td>${a.id}</td>
                    <td>${entityNameById(a.operatorId)}</td>
                    <td>${a.month} · 第 ${a.batchNo} 批</td>
                    <td>${a.assetSns.length}</td>
                    <td>${finYuan(a.requestedAmount)}</td>
                    <td>${tag(a.status)}</td>
                    <td>${a.submittedAt || "—"}</td>
                    <td><button type="button" class="link-btn" data-view-jump="financeDrawdown">审核</button></td>
                  </tr>`).join("") : `<tr><td colspan="8">暂无待确认申请</td></tr>`}
                </tbody>
              </table>
            </div>
          </section>
          <section class="panel" style="margin-top:16px">
            ${panelHead("在贷还款概览", "2026-06 应还合计 " + finYuan(monthDue), "finance_repayments")}
            <div class="panel-body">
              <p style="font-size:13px;color:var(--muted);margin:0">正式还款计划见运营商「融资管理 · 还款日历」；资方侧首期在「放款申请」完成批次确认与借据录入演示。</p>
            </div>
          </section>`;
      }
      if (isChannelRole()) {
        const contract = myChannelContracts()[0];
        const contractPanel = contract ? `<section class="panel">
            ${panelHead("签约运营商", "结算模式与合同（只读）", "day_pool_contract")}
            <div class="panel-body">
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
                <div style="width:56px;height:56px;border-radius:12px;background:var(--primary,#1677ff);display:flex;align-items:center;justify-content:center;font-size:28px">${contract.operatorLogo || channelProfile().logo || "运"}</div>
                <div>
                  <strong style="font-size:18px">${contract.operatorName}</strong>
                  <div style="font-size:12px;color:var(--muted);margin-top:4px">结算模式：<strong>${contract.settlementMode}</strong> · 一期单运营商签约</div>
                </div>
              </div>
              <div class="detail-grid">
                <div class="detail-item"><span>运营商</span><strong>${contract.operatorName}</strong></div>
                <div class="detail-item"><span>结算模式</span><strong>${contract.settlementMode}</strong></div>
                ${contract.settlementMode === "卡差价" ? `<div class="detail-item"><span>卡批发价</span><strong>见 SKU 定价</strong></div>`
                  : contract.settlementMode === "设备租赁"
                    ? `<div class="detail-item"><span>月租合计</span><strong>¥${(contract.monthlyRent || 0).toLocaleString()}/月</strong></div>
                       <div class="detail-item"><span>专属站点</span><strong>${contract.dedicatedSiteName || "—"}</strong></div>
                       <div class="detail-item"><span>白名单</span><strong>${contract.whitelistCount || 0} 人 · 欠费停服</strong></div>`
                    : contract.settlementMode === "激活码"
                      ? `<div class="detail-item"><span>批发单价</span><strong>¥${contract.wholesalePrice}/码</strong></div>
                         <div class="detail-item"><span>套餐码</span><strong>${contract.codeSkuName || "—"} · ${contract.codeValidityDays || 30} 天</strong></div>`
                    : `<div class="detail-item"><span>批发单价</span><strong>¥${contract.wholesalePrice}/人天</strong></div>`}
                <div class="detail-item"><span>有效期</span><strong>${contract.validFrom} ~ ${contract.validTo}</strong></div>
                <div class="detail-item"><span>可用站点</span><strong>${channelContractSitesLabel(contract.sites)}</strong></div>
              </div>
            </div>
          </section>` : "";
        if (isCardChannel()) {
          const cid = channelEntityId();
          const orders = channelLinkOrders.filter(o => o.channelId === cid);
          const links = channelPromoLinksFor(cid);
          const monthKey = "2026-06";
          const monthOrders = orders.filter(o => payMonthKey(o.payTime) === monthKey);
          const monthCommission = monthOrders.reduce((s, o) => s + o.commission, 0);
          const totalClicks = links.reduce((s, x) => s + x.clicks, 0);
          const totalConv = links.reduce((s, x) => s + x.conversions, 0);
          return `
            ${ownScopeBanner()}
            <div class="kpi-grid">
              ${kpi("本月成交", monthOrders.length + " 单", monthKey + " 经链接购卡", "单", "channel_settlement_card")}
              ${kpi("本月应结佣", "¥" + monthCommission, "与运营商线下结算", "佣", "channel_card_margin")}
              ${kpi("推广链接", links.length + " 条", "点击 " + totalClicks + " · 成交 " + totalConv, "链", "module_channel_links")}
              ${kpi("签约运营商", contract ? contract.operatorName : "—", "渠道分销", "运", "day_pool_contract")}
            </div>
            ${contractPanel}
            ${renderDataDrillPanel("channel")}`;
        }
        if (isLeaseChannel()) {
          const lease = channelLeaseSummary.find(p => p.channelId === channelEntityId()) || {};
          const whitelist = channelLeaseWhitelist.filter(r => r.channelId === channelEntityId() && r.status === "启用");
          const overdue = lease.billingStatus && lease.billingStatus.includes("待");
          return `
            ${ownScopeBanner()}
            ${overdue ? `<div class="pool-warn-banner"><strong>月租待缴</strong>：${lease.billingStatus || "待缴纳"}，白名单用户将<strong>停服</strong>。
              <button type="button" class="link-btn" data-view-jump="rentPool">去缴纳</button></div>` : ""}
            <div class="kpi-grid">
              ${kpi("白名单", whitelist.length + " 人", "购渠道套餐", "白", "lease_whitelist")}
              ${kpi("月租合计", "¥" + (lease.monthlyRent || 0).toLocaleString(), lease.devicesCovered + " 台设备", "租", "channel_settlement_rent")}
              ${kpi("本月套餐", (lease.pkgOrdersMonth || 12) + " 单", "款入渠道账户", "购", "lease_whitelist_pkg")}
              ${kpi("专属站点", lease.dedicatedSiteName || "—", lease.billingStatus || "—", "站", "lease_dedicated_site")}
            </div>
            ${contractPanel}
            ${renderDataDrillPanel("channel")}`;
        }
        if (isActivationChannel()) {
          const mode = channelSettlementModes.find(m => m.channelId === channelEntityId());
          const codes = myActivationCodes();
          const redeemed = codes.filter(c => c.status === "已核销").length;
          const inventory = codes.filter(c => c.status !== "已核销" && c.status !== "已作废").length;
          return `
            ${ownScopeBanner()}
            <div class="kpi-grid">
              ${kpi("码库存", inventory + " 张", "未核销可用", "码", "channel_settlement_activation")}
              ${kpi("本月核销", (mode?.monthRedemptions || redeemed) + " 次", "一码一用", "核", "channel_settlement_activation")}
              ${kpi("批发单价", "¥" + (mode?.wholesalePrice || contract?.wholesalePrice || "—") + "/码", mode?.codeSkuName || contract?.codeSkuName || "30天包月", "价", "channel_settlement_activation")}
              ${kpi("签约运营商", contract ? contract.operatorName : "—", "激活码", "运", "day_pool_contract")}
            </div>
            ${contractPanel}
            ${renderDataDrillPanel("channel")}`;
        }
        const pools = myDayPools();
        const lowPool = pools.find(p => p.balancePct < 20);
        const poolAvail = pools.reduce((s, p) => s + p.availableDays, 0);
        const poolFrozen = pools.reduce((s, p) => s + p.frozenDays, 0);
        const riderCount = dayPoolRiders.filter(r => pools.some(p => p.id === r.poolId) && r.status === "在职").length;
        return `
          ${ownScopeBanner()}
          ${lowPool ? `<div class="pool-warn-banner">${noteBtn("day_pool_warn")}
            <div style="font-size:12px;margin-top:6px">已触发「不足在职骑手×10天」规则 → 短信已发渠道商+运营商（见短信记录）</div>
            <strong>人天额度池余额预警</strong>：${lowPool.name}（${lowPool.id}）可用余额仅 <strong>${lowPool.balancePct}%</strong>（${lowPool.availableDays} 人天）。
            <button type="button" class="link-btn" data-view-jump="dayPool">进入额度池</button></div>` : ""}
          <div class="kpi-grid">
            ${kpi("人天池可用", poolAvail + " 人天", "预占中 " + poolFrozen + " 人天", "池", "day_pool_panel")}
            ${kpi("在职骑手", riderCount, "已登记团队成员", "骑", "day_pool_channel")}
            ${kpi("签约运营商", contract ? contract.operatorName : "—", contract ? "批发 ¥" + contract.wholesalePrice + "/人天" : "", "运", "day_pool_contract")}
            ${kpi(lowPool ? "额度池预警" : "额度池数", lowPool ? lowPool.id + " · " + lowPool.balancePct + "%" : pools.length + " 个", lowPool ? "低于 20% 或不足在职×10天" : "向运营商采购", lowPool ? "!" : "池", lowPool ? "day_pool_warn" : "day_pool_purchase")}
          </div>
          ${contract ? `<section class="panel">
            ${panelHead("签约运营商", "批发价与合同（只读）；可用站点见额度使用规则", "day_pool_contract")}
            <div class="panel-body">
              <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px">
                <div style="width:56px;height:56px;border-radius:12px;background:var(--primary,#1677ff);display:flex;align-items:center;justify-content:center;font-size:28px">${contract.operatorLogo || "🚚"}</div>
                <div>
                  <strong style="font-size:18px">${contract.operatorName}</strong>
                  <div style="font-size:12px;color:var(--muted);margin-top:4px">结算模式：${contract.settlementMode || "人天池"} · 一期单运营商签约</div>
                </div>
              </div>
              <div class="detail-grid">
                <div class="detail-item"><span>运营商</span><strong>${contract.operatorName}</strong></div>
                <div class="detail-item"><span>批发单价</span><strong>¥${contract.wholesalePrice}/人天</strong></div>
                <div class="detail-item"><span>有效期</span><strong>${contract.validFrom} ~ ${contract.validTo}</strong></div>
                <div class="detail-item"><span>可用站点</span><strong>${channelContractSitesLabel(contract.sites)}</strong></div>
              </div>
            </div>
          </section>` : ""}
          ${renderDataDrillPanel("channel")}`;
      }
      const e = currentEntity();
      const dev = operatorDeviceBreakdown(e.id);
      const cabList = [...dev.ownCabList, ...dev.leaseCabList];
      const batList = [...dev.ownBatList, ...dev.leaseBatList];
      const cabOnline = cabList.filter(c => c.online).length;
      const cabRate = cabList.length ? Math.round(cabOnline / cabList.length * 1000) / 10 : 0;
      const batOnline = batList.filter(isBatteryOnline).length;
      const batRate = batList.length ? Math.round(batOnline / batList.length * 1000) / 10 : 0;
      const opSites = myOperatorSites();
      const siteOpen = opSites.filter(s => s.status === "在营").length;
      const siteBuilding = opSites.filter(s => s.status === "建设中").length;
      const siteClosed = opSites.filter(s => s.status === "已停用").length;
      const siteStatusSub = [
        "在营 " + siteOpen,
        siteBuilding ? "建设中 " + siteBuilding : "",
        siteClosed ? "停用 " + siteClosed : ""
      ].filter(Boolean).join(" · ");
      const us = users.filter(filterOwnRow);
      const activeUsers = us.filter(u => {
        const st = u.serviceState || "";
        return !u.pkg.includes("退款") && !u.pkg.includes("完结") && st !== "已冻结" && st !== "中途完结";
      }).length;
      const pkgPurchase = packageOrders.filter(filterOwnRow).reduce((s, o) => s + (o.pay || 0), 0);
      const siteStatsPanel = renderOverviewSiteStats();
      const powerStatsPanel = renderOverviewPowerStats();
      return `<div class="overview-workplace">
        <section class="panel overview-kpi-panel">
          ${panelHead("经营概览", "设备快照与经营指标", "overview_kpi_panel")}
          <div class="panel-body">
            <div class="kpi-grid in-panel kpi-grid-3">
              ${kpi("柜机", cabList.length, "在线 " + cabOnline + " 台 · " + cabRate + "%", "柜", "overview_cab_total")}
              ${kpi("电池", batList.length, "在线 " + batOnline + " 块 · " + batRate + "%", "电", "overview_bat_total")}
              ${kpi("站点", opSites.length, siteStatusSub || "暂无站点", "站", "overview_site_status")}
            </div>
            ${overviewRangeSelectHtml()}
            <div class="kpi-grid in-panel kpi-grid-2">
              ${kpi("套餐购买金额", "¥" + scaleMoney(pkgPurchase).toLocaleString("zh-CN"), overviewRangeLabel() + " · C 端实付合计", "购", "overview_pkg_pay")}
              ${kpi("活跃用户", scale(activeUsers), overviewRangeLabel() + " · 去重骑手", "骑", "overview_users")}
            </div>
          </div>
        </section>
        <div class="overview-split-row overview-split-row-3">
          ${renderDataDrillPanel("operator")}
          ${powerStatsPanel}
          ${siteStatsPanel}
        </div>
      </div>`;
    }

    function mySitePartners() {
      if (!isOperatorRole()) return [];
      return sitePartners.filter(p => p.operatorId === currentEntity().id);
    }

    function mySitePartnerBindings() {
      if (!isOperatorRole()) return [];
      return sitePartnerBindings.filter(b => b.operatorId === currentEntity().id);
    }

    function mySitePartnerSplitLines() {
      if (!isOperatorRole()) return [];
      const opId = currentEntity().id;
      const siteIds = new Set(myOperatorSites().map(s => s.id));
      return sitePartnerSplitLines.filter(l => siteIds.has(l.siteId));
    }

    function sitePartnerTypeTag(type) {
      return type === "公司" ? `<span class="tag neutral">公司</span>` : `<span class="tag">个人</span>`;
    }

    function sitePartnerBindingsForSite(siteId, operatorId) {
      return sitePartnerBindings.filter(b => b.siteId === siteId && b.operatorId === operatorId && b.status === "生效");
    }

    function sitePartnerTotalRate(siteId, operatorId) {
      return sitePartnerBindingsForSite(siteId, operatorId).reduce((s, b) => s + b.ratePct, 0);
    }

    function sitePartnersCellHtml(siteId, operatorId) {
      const list = sitePartnerBindingsForSite(siteId, operatorId);
      if (!list.length) return `<span style="color:var(--muted)">未配置</span>`;
      const total = sitePartnerTotalRate(siteId, operatorId);
      const rows = list.map(b => {
        const pending = b.pendingRatePct != null ? ` <small style="color:var(--warn)">→${b.pendingRatePct}%</small>` : "";
        const type = b.partnerType === "公司" ? "公司" : "个人";
        return `<div style="font-size:13px">${b.partnerName} <small style="color:var(--muted)">${type}</small> <strong>${b.ratePct}%</strong>${pending}</div>`;
      }).join("");
      return `${rows}<small style="color:var(--muted)">合计 ${total}%</small>`;
    }

    function canEditSitePartners() {
      return isEntityLogin() || employeeHasPerm("sites.edit") || employeeHasPerm("site_partners.edit");
    }

    function sitePartnerRateLabel(binding) {
      if (!binding) return "—";
      const pending = binding.pendingRatePct != null
        ? `<br><small style="color:var(--warn)">待生效 ${binding.pendingRatePct}%（次日 0:00）</small>`
        : "";
      const type = binding.partnerType === "公司" ? "公司" : "个人";
      return `${binding.partnerName} <small style="color:var(--muted)">${type}</small> · <strong>${binding.ratePct}%</strong>${pending}`;
    }

    function sitePartnerPendingEffectiveAt() {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10) + " 00:00";
    }

    function filterSitePartnerKeyword(row, keyword, fields) {
      if (!keyword || !String(keyword).trim()) return true;
      const kw = String(keyword).trim().toLowerCase();
      return fields.some(f => String(row[f] || "").toLowerCase().includes(kw));
    }

    function filterSitePartnerBySite(siteId, rowSiteId) {
      if (!siteId || siteId === "全部") return true;
      return rowSiteId === siteId;
    }

    function openNewSitePartnerForm() {
      openProtoForm({
        title: "新增站点合伙人",
        fields: [
          { name: "partnerType", label: "类型", type: "select", options: ["个人", "公司"], value: "个人" },
          { name: "name", label: "名称（个人姓名/公司全称）", value: "" },
          { name: "contactName", label: "联系人（公司必填）", value: "", required: false },
          { name: "phone", label: "手机/电话", value: "" },
          { name: "bankAccount", label: "收款账户", value: "" }
        ],
        submitLabel: "保存",
        onSubmit: (data) => {
          const name = (data.name || "").trim();
          if (!name) return "请填写名称";
          if (data.partnerType === "公司" && !(data.contactName || "").trim()) return "公司须填写联系人";
          const id = "SP-" + String(sitePartners.length + 1).padStart(2, "0");
          sitePartners.push({
            id, operatorId: currentEntity().id, partnerType: data.partnerType, name,
            contactName: (data.contactName || "").trim() || null,
            phone: (data.phone || "").trim() || "—",
            bankAccount: (data.bankAccount || "").trim() || "—",
            status: "启用"
          });
          return { successMessage: "已新增合伙人 " + name, afterClose: () => render() };
        }
      });
    }

    function openEditSitePartnerForm(partnerId) {
      const p = sitePartners.find(x => x.id === partnerId);
      if (!p || p.operatorId !== currentEntity().id) return;
      openProtoForm({
        title: "编辑合伙人 · " + p.name,
        fields: [
          { name: "partnerType", label: "类型", type: "select", options: ["个人", "公司"], value: p.partnerType || "个人" },
          { name: "name", label: "名称", value: p.name },
          { name: "contactName", label: "联系人", value: p.contactName || "", required: false },
          { name: "phone", label: "手机/电话", value: p.phone },
          { name: "bankAccount", label: "收款账户", value: p.bankAccount },
          { name: "status", label: "状态", type: "select", options: ["启用", "停用"], value: p.status }
        ],
        submitLabel: "保存",
        onSubmit: (data) => {
          p.partnerType = data.partnerType || p.partnerType || "个人";
          p.name = (data.name || "").trim() || p.name;
          p.contactName = (data.contactName || "").trim() || null;
          p.phone = data.phone || p.phone;
          p.bankAccount = data.bankAccount || p.bankAccount;
          p.status = data.status || p.status;
          sitePartnerBindings.filter(b => b.partnerId === p.id).forEach(b => {
            b.partnerName = p.name;
            b.partnerType = p.partnerType;
          });
          return { successMessage: "已保存", afterClose: () => {
            if (state.detailSitePartnersId) openSitePartnersDrawer(state.detailSitePartnersId);
            else render();
          }};
        }
      });
    }

    function openBindSitePartnerForm(siteId) {
      const site = sites.find(s => s.id === siteId);
      const opId = currentEntity().id;
      const partners = mySitePartners().filter(p => p.status === "启用");
      const boundIds = new Set(sitePartnerBindingsForSite(siteId, opId).map(b => b.partnerId));
      const available = partners.filter(p => !boundIds.has(p.id));
      if (!available.length) {
        showProtoToast(boundIds.size ? "该站已绑定全部合伙人，请先在档案中新增" : "请先在合伙人档案中新增合伙人");
        return;
      }
      const total = sitePartnerTotalRate(siteId, opId);
      openProtoForm({
        title: "添加合伙人 · " + (site?.name || siteId),
        fields: [
          { name: "partnerId", label: "合伙人", type: "select", options: available.map(p => p.id), optionLabels: Object.fromEntries(available.map(p => [p.id, `${p.name}（${p.partnerType || "个人"}）`])), value: available[0].id },
          { name: "ratePct", label: "本站分润比例（%）", type: "number", value: String(Math.min(20, 99 - total)) }
        ],
        submitLabel: "添加",
        onSubmit: (data) => {
          const rate = parseFloat(data.ratePct);
          if (!Number.isFinite(rate) || rate <= 0 || rate > 99) return "比例须为 1～99";
          if (total + rate > 99.009) return `本站合伙人比例合计不得超过 99%（当前已占 ${total}%）`;
          const p = sitePartners.find(x => x.id === data.partnerId);
          if (!p) return "请选择合伙人";
          sitePartnerBindings.push({
            id: "SPB-" + Date.now().toString().slice(-4), siteId, operatorId: opId,
            partnerId: p.id, partnerName: p.name, partnerType: p.partnerType || "个人",
            ratePct: rate, pendingRatePct: null, effectiveAt: new Date().toISOString().slice(0, 10), status: "生效"
          });
          return { successMessage: `已添加 ${p.name} · 本站 ${rate}%`, afterClose: () => openSitePartnersDrawer(siteId) };
        }
      });
    }

    function openEditSitePartnerBindingForm(bindingId) {
      const b = sitePartnerBindings.find(x => x.id === bindingId);
      if (!b) return;
      const others = sitePartnerTotalRate(b.siteId, b.operatorId) - b.ratePct;
      openProtoForm({
        title: "调整分润比例 · " + b.partnerName,
        fields: [
          { name: "ratePct", label: "新比例（%）", type: "number", value: String(b.pendingRatePct ?? b.ratePct) }
        ],
        submitLabel: "保存",
        onSubmit: (data) => {
          const rate = parseFloat(data.ratePct);
          if (!Number.isFinite(rate) || rate <= 0 || rate > 99) return "比例须为 1～99";
          if (others + rate > 99.009) return `本站合伙人比例合计不得超过 99%（其他合伙人已占 ${others}%）`;
          if (rate === b.ratePct) {
            b.pendingRatePct = null;
            b.pendingEffectiveAt = null;
          } else {
            b.pendingRatePct = rate;
            b.pendingEffectiveAt = sitePartnerPendingEffectiveAt();
          }
          return { successMessage: "已保存 · 新比例将于次日 0:00 生效", afterClose: () => openSitePartnersDrawer(b.siteId) };
        }
      });
    }

    function removeSitePartnerBinding(bindingId) {
      const b = sitePartnerBindings.find(x => x.id === bindingId);
      if (!b) return;
      const siteId = b.siteId;
      b.status = "已解绑";
      showProtoToast("已解绑 " + b.partnerName);
      openSitePartnersDrawer(siteId);
    }

    function openSitePartnersDrawer(siteId) {
      const site = sites.find(s => s.id === siteId);
      const opId = currentEntity().id;
      if (!site) return;
      state.detailSitePartnersId = siteId;
      const canEdit = canEditSitePartners() && !site.channelDedicated;
      const bindings = sitePartnerBindingsForSite(siteId, opId);
      const total = sitePartnerTotalRate(siteId, opId);
      document.querySelector("#drawerTitle").textContent = "站点合伙人 · " + site.name;
      document.querySelector("#drawerSub").textContent = site.id + " · 本站比例合计 " + total + "% / 99%";
      const rows = bindings.length ? bindings.map(b => {
        const pending = b.pendingRatePct != null ? `<br><small style="color:var(--warn)">待生效 ${b.pendingRatePct}%（${(b.pendingEffectiveAt || "次日 0:00").replace(" 00:00", "")}）</small>` : "";
        return `<tr>
          <td>${b.partnerName}<br>${sitePartnerTypeTag(b.partnerType)}</td>
          <td><strong>${b.ratePct}%</strong>${pending}</td>
          <td>${canEdit ? `<button type="button" class="link-btn" data-edit-site-partner-bind="${b.id}">调比例</button> · <button type="button" class="link-btn" data-remove-site-partner-bind="${b.id}">解绑</button>` : "—"}</td>
        </tr>`;
      }).join("") : `<tr><td colspan="3" style="color:var(--muted)">尚未配置合伙人</td></tr>`;
      document.querySelector("#drawerBody").innerHTML = `
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("site_partner_binding")} 一站可配置<strong>多位</strong>合伙人；同一合伙人可在其他站点另设比例。比例变更<strong>次日 0:00</strong>生效。</div>
        ${site.channelDedicated ? `<p class="perm-banner">渠道专属站默认不参与站点合伙人分润。</p>` : ""}
        <section class="panel" style="margin:0">
          ${panelHead("本站合伙人", "在站点管理中维护", "site_partner_binding", canEdit ? `<button type="button" class="btn primary" data-bind-site-partner="${siteId}">+ 添加合伙人</button>` : "")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table>
              <thead><tr><th>合伙人</th><th>本站比例</th><th>操作</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            ${total > 99 ? `<p class="perm-banner" style="margin-top:12px">⚠ 本站比例合计超过 99%，请调整。</p>` : ""}
          </div>
        </section>`;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindInteractiveActions(document.querySelector("#drawerBody"));
    }

    function renderPartnerOverview() {
      const p = currentSitePartner();
      if (!p) return "";
      const bindings = myPartnerBindings();
      const accrued = partnerAccruedTotal(p.id);
      const monthAmt = partnerMonthAccrued(p.id, "2026-06");
      const withdrawable = partnerWithdrawableBalance(p.id);
      const withdrawn = partnerWithdrawnTotal(p.id);
      const pending = partnerPendingWithdrawTotal(p.id);
      const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));
      const bindingRows = bindings.map(b => {
        const pending = b.pendingRatePct != null ? `<br><small style="color:var(--warn)">待生效 ${b.pendingRatePct}%</small>` : "";
        return `<tr>
          <td>${siteMap[b.siteId] || b.siteId}<br><small>${b.siteId}</small></td>
          <td><strong>${b.ratePct}%</strong>${pending}</td>
          <td>${(b.effectiveAt || "—").slice(0, 10)}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="3">暂无绑定站点</td></tr>`;
      const recent = myPartnerSplitLines().slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
      const recentRows = recent.map(r => `<tr>
        <td>${r.date}</td><td>${r.siteName}</td><td>${r.partnerRatePct}%</td>
        <td>¥${r.partnerAmount}</td><td><small>${r.orderRef}</small></td>
      </tr>`).join("") || `<tr><td colspan="5">暂无分润记录</td></tr>`;
      return `${ownScopeBanner()}
        <section class="panel">
          ${panelHead("经营概览", `关联合伙人运营商：${entityNameById(p.operatorId)}`, "partner_portal")}
          <div class="panel-body">
            <div class="kpi-grid in-panel" style="margin-bottom:16px">
              ${kpi("累计分润", "¥" + accrued.toFixed(2), "已确认切分", "累", "site_partner_split")}
              ${kpi("本月分润", "¥" + monthAmt.toFixed(2), "2026-06", "月", "site_partner_split")}
              ${kpi("可提现", "¥" + withdrawable.toFixed(2), pending ? "待审 ¥" + pending : "已扣已提", "提", "partner_withdraw")}
              ${kpi("绑定站点", String(bindings.length), withdrawn ? "已提 ¥" + withdrawn : "—", "站", "site_partner_binding")}
            </div>
            <p style="font-size:12px;color:var(--muted);margin:0 0 14px">${noteBtn("partner_portal")} 分润比例由运营商配置；您可查看明细并申请提现结算。</p>
          </div>
        </section>
        <section class="panel" style="margin-top:16px">
          ${panelHead("我的站点绑定", "只读 · 比例变更次日 0:00 生效", "partner_bindings_readonly")}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>站点</th><th>本站比例</th><th>生效日</th></tr></thead><tbody>${bindingRows}</tbody></table>
          </div>
        </section>
        <section class="panel" style="margin-top:16px">
          ${panelHead("最近分润", "近 5 笔", "site_partner_split", `<button type="button" class="link-btn" data-view-jump="partnerLedger">查看全部</button>`)}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>日期</th><th>站点</th><th>比例</th><th>分润额</th><th>关联单</th></tr></thead><tbody>${recentRows}</tbody></table>
          </div>
        </section>`;
    }

    function renderPartnerBindings() {
      const p = currentSitePartner();
      const bindings = myPartnerBindings();
      const siteMap = Object.fromEntries(sites.map(s => [s.id, s]));
      const rows = bindings.map(b => {
        const site = siteMap[b.siteId];
        const pending = b.pendingRatePct != null
          ? `<br><small style="color:var(--warn)">待生效 ${b.pendingRatePct}% · ${(b.pendingEffectiveAt || "次日 0:00").replace(" 00:00", "")}</small>`
          : "";
        return `<tr>
          <td>${site?.name || b.siteId}<br><small>${b.siteId}</small></td>
          <td>${site?.city || "—"}</td><td>${site?.type || "—"}</td>
          <td>${sitePartnerTypeTag(b.partnerType)}</td>
          <td><strong>${b.ratePct}%</strong>${pending}</td>
          <td>${(b.effectiveAt || "—").slice(0, 10)}</td>
        </tr>`;
      }).join("") || `<tr><td colspan="6">暂无绑定 · 请联系运营商在站点管理中配置</td></tr>`;
      return `${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("partner_bindings_readonly")} 本站分润比例由运营商在<strong>站点管理 → 合伙人</strong>维护；合伙人门户<strong>不可自行修改</strong>。</div>
        <section class="panel">
          ${panelHead("我的站点", `共 ${bindings.length} 个绑定站点`, "site_partner_binding")}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>站点</th><th>城市</th><th>类型</th><th>合伙人类型</th><th>本站比例</th><th>绑定生效日</th></tr></thead>
            <tbody>${rows}</tbody></table>
          </div>
        </section>`;
    }

    function renderPartnerLedger() {
      const f = getPf();
      const rows = myPartnerSplitLines().filter(r => {
        if (!filterSitePartnerBySite(f.siteId, r.siteId)) return false;
        if (!filterSitePartnerKeyword(r, f.keyword, ["siteName", "orderRef", "splitLabel"])) return false;
        if (!matchDateStr(r.date, f.dateFrom, f.dateTo)) return false;
        return true;
      }).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      const total = rows.reduce((s, r) => s + (r.partnerAmount || 0), 0);
      return `${ownScopeBanner()}
        <section class="panel">
          ${panelHead("分润明细", `共 ${rows.length} 笔 · 合计 ¥${total.toFixed(2)}`, "site_partner_split")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("site_partner_split")} 仅个人用户 C 端确认收入；渠道人天、设备租赁白名单不参与。</p>
            <table>
              <thead><tr><th>日期</th><th>站点</th><th>本站比例</th><th>计提基数</th><th>我的分润</th><th>切分标签</th><th>关联单</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.date}</td><td>${r.siteName}</td><td>${r.partnerRatePct}%</td>
                <td>¥${r.shareBase}</td><td><strong>¥${r.partnerAmount}</strong></td>
                <td><small>${r.splitLabel}</small></td><td>${r.orderRef}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无分润明细</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderPartnerWithdraw() {
      const p = currentSitePartner();
      const accrued = partnerAccruedTotal(p?.id);
      const withdrawable = partnerWithdrawableBalance(p?.id);
      const withdrawn = partnerWithdrawnTotal(p?.id);
      const pending = partnerPendingWithdrawTotal(p?.id);
      const rows = myPartnerWithdrawals();
      const applyBtn = `<button type="button" class="btn primary" data-apply-partner-withdraw>发起提现申请</button>`;
      return `${ownScopeBanner()}
        <section class="panel">
          ${panelHead("提现结算", `共 ${rows.length} 条申请`, "partner_withdraw", applyBtn)}
          <div class="panel-body">
            <div class="kpi-grid in-panel" style="margin-bottom:14px">
              ${kpi("累计分润", "¥" + accrued.toFixed(2), "台账累计", "累", "site_partner_split")}
              ${kpi("可提现余额", "¥" + withdrawable.toFixed(2), "已扣已提与待审", "提", "partner_withdraw")}
              ${kpi("已到账", "¥" + withdrawn.toFixed(2), "历史提现", "到", "partner_withdraw")}
              ${kpi("待审核", pending ? "¥" + pending : "—", "运营商处理中", "审", "partner_withdraw")}
            </div>
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("partner_withdraw")} 提现向<strong>运营商</strong>申请，审核后通过对公/代付打款；非平台审核流程。</p>
            <div class="orders-table-wrap">
            <table>
              <thead><tr><th>申请单</th><th>金额</th><th>到账账户</th><th>申请时间</th><th>审核</th><th>状态</th><th>到账时间</th></tr></thead>
              <tbody>${rows.map(w => `<tr>
                <td>${w.id}</td><td><strong>¥${w.amount}</strong></td><td><small>${w.accountLabel}</small></td>
                <td>${w.applyTime}</td>
                <td>${w.reviewedBy ? w.reviewedBy + "<br><small>" + (w.reviewTime || "") + "</small>" : "—"}</td>
                <td>${tag(w.status)}${w.rejectReason ? `<br><small style="color:var(--red)">${w.rejectReason}</small>` : ""}</td>
                <td>${w.paidTime || "—"}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无提现申请</td></tr>"}</tbody>
            </table>
            </div>
          </div>
        </section>`;
    }

    function renderPartnerAccount() {
      const p = currentSitePartner();
      if (!p) return "";
      return `${ownScopeBanner()}
        <section class="panel">
          ${panelHead("收款账户", "档案信息只读 · 变更请联系运营商", "partner_portal")}
          <div class="panel-body">
            <div class="detail-grid" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px">
              <div class="detail-item"><span>类型</span>${sitePartnerTypeTag(p.partnerType || "个人")}</div>
              <div class="detail-item"><span>名称</span>${p.name}</div>
              <div class="detail-item"><span>联系人</span>${p.contactName || "—"}</div>
              <div class="detail-item"><span>手机/电话</span>${p.phone}</div>
              <div class="detail-item"><span>收款账户</span>${p.bankAccount}</div>
              <div class="detail-item"><span>关联合伙人运营商</span>${entityNameById(p.operatorId)}</div>
              <div class="detail-item"><span>状态</span>${tag(p.status)}</div>
            </div>
            <p style="margin-top:16px;font-size:12px;color:var(--muted)">提现默认打款至上述账户；账户变更须由运营商在「站点合伙人 → 档案」中维护。</p>
          </div>
        </section>`;
    }

    function renderSites() {
      const f = getPf();
      const ss = myOperatorSites().filter(s => {
        if (!matchKw(s.name, f.siteName)) return false;
        if (f.city !== "全部" && s.city !== f.city) return false;
        if (f.status !== "全部" && s.status !== f.status) return false;
        return true;
      });
      const canEditSites = isEntityLogin() || employeeHasPerm("sites.edit");
      const policy = swapPolicyForOperator(currentEntity().id);
      const credit = operatorCreditAccounts.find(a => a.operatorId === currentEntity().id);
      const policyPanel = canEditSites ? `<section class="panel">
          ${panelHead("换电范围设置", "控制所属用户可换电的地理/主体范围", "swap_policy")}
          <div class="panel-body">
            <p style="font-size:12px;color:var(--muted);margin:0 0 14px">同运营商内<strong>任意站点</strong>均可购套餐、换电；仅跨网受下方开关与信用额度约束。${noteBtn("swap_policy_cross_net")}</p>
            <div style="display:grid;gap:12px;max-width:520px">
              <label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">
                <input type="checkbox" data-swap-policy="crossNetworkEnabled" ${policy.crossNetworkEnabled ? "checked" : ""} style="margin-top:3px" />
                <span><strong>允许跨网换电</strong><br><small style="color:var(--muted)">关闭后：向本运营商付费的用户不可在其他运营商换电；其他运营商用户也不可在本运营商站点换电</small></span>
              </label>
            </div>
            ${credit && !credit.crossSwapEnabled ? `<p class="perm-banner" style="margin-top:14px">⚠ 平台已因信用额度用尽关闭本运营商用户的<strong>跨网换电</strong>（与上方开关无关，恢复额度后自动解除）。</p>` : ""}
          </div>
        </section>` : "";
      return `
        ${ownScopeBanner()}
        ${policyPanel}
        <section class="panel">
          ${panelHead("站点列表", "本运营商名下站点（含筹备中、无设备站点）", "sites_panel", canEditSites ? `<button type="button" class="btn primary" data-new-site>+ 新增站点</button>` : "")}
          <div class="panel-body">
            <table>
              <thead><tr><th>站点</th><th>城市</th><th>类型</th><th>开放范围</th><th>站点合伙人</th><th>换电柜</th><th>电池</th><th>状态</th>${canEditSites ? "<th>操作</th>" : ""}</tr></thead>
              <tbody>${ss.map(s => {
                const partnerCell = s.channelDedicated
                  ? `<span style="color:var(--muted)">渠道专属</span><br><small>默认不参与</small>`
                  : sitePartnersCellHtml(s.id, s.operatorId);
                const partnerBtn = canEditSites && !s.channelDedicated
                  ? `<button type="button" class="link-btn" data-site-partners="${s.id}">合伙人</button>`
                  : "";
                return `<tr>
                <td>${s.name}<br><small style="color:var(--muted)">${s.id}</small></td>
                <td>${s.city}</td><td>${s.type}</td>
                <td>${s.channelDedicated ? `<span style="color:var(--brand)">渠道专用</span><br><small>仅白名单可见</small>` : "公众开放"}</td>
                <td>${partnerCell}</td>
                <td>${s.cabinets}</td><td>${s.batteries}</td><td>${tag(s.status)}</td>
                ${canEditSites ? `<td><button type="button" class="link-btn" data-edit-site="${s.id}">编辑</button>${partnerBtn ? " · " + partnerBtn : ""}</td>` : ""}
              </tr>`;
              }).join("") || `<tr><td colspan='${canEditSites ? 9 : 8}'>暂无</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderSitePartners() {
      const canEdit = isEntityLogin() || employeeHasPerm("site_partners.edit");
      const tabs = [["profiles", "合伙人档案"], ["bindings", "分润绑定一览"], ["ledger", "分润明细"]];
      const tab = state.sitePartnersTab || "profiles";
      const f = getPf();
      const partners = mySitePartners().filter(p => {
        if (f.siteId && f.siteId !== "全部") {
          const hasSite = mySitePartnerBindings().some(b => b.partnerId === p.id && b.siteId === f.siteId && b.status === "生效");
          if (!hasSite) return false;
        }
        return filterSitePartnerKeyword(p, f.keyword, ["name", "phone", "contactName"]);
      });
      const bindings = mySitePartnerBindings().filter(b => {
        if (b.status !== "生效") return false;
        if (!filterSitePartnerBySite(f.siteId, b.siteId)) return false;
        return filterSitePartnerKeyword(b, f.keyword, ["partnerName"]);
      });
      let body = "";
      if (tab === "profiles") {
        const addBtn = canEdit ? `<button type="button" class="btn primary" data-new-site-partner>+ 新增合伙人</button>` : "";
        body = `<section class="panel">
          ${panelHead("合伙人档案", "个人/公司 · 比例在站点管理中按站配置", "site_partner_panel", addBtn)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>类型</th><th>名称</th><th>联系人</th><th>手机/电话</th><th>收款账户</th><th>绑定站点数</th><th>状态</th>${canEdit ? "<th>操作</th>" : ""}</tr></thead>
              <tbody>${partners.map(p => {
                const cnt = bindings.filter(b => b.partnerId === p.id).length;
                return `<tr>
                  <td>${sitePartnerTypeTag(p.partnerType || "个人")}</td>
                  <td>${p.name}</td>
                  <td>${p.contactName || "—"}</td>
                  <td>${p.phone}</td><td>${p.bankAccount}</td><td>${cnt}</td><td>${tag(p.status)}</td>
                  ${canEdit ? `<td><button type="button" class="link-btn" data-edit-site-partner="${p.id}">编辑</button></td>` : ""}
                </tr>`;
              }).join("") || `<tr><td colspan='${canEdit ? 8 : 7}'>暂无合伙人</td></tr>`}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "ledger") {
        const rows = mySitePartnerSplitLines().filter(r => {
          if (!filterSitePartnerBySite(f.siteId, r.siteId)) return false;
          return filterSitePartnerKeyword(r, f.keyword, ["partnerName", "siteName", "orderRef"]);
        });
        body = `<section class="panel">
          ${panelHead("分润明细", "仅个人用户 C 端确认收入 · 平台 1% + 合伙人 R% + 运营商余量", "site_partner_split")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>日期</th><th>站点</th><th>合伙人</th><th>本站比例</th><th>计提基数</th><th>平台</th><th>合伙人</th><th>运营商</th><th>切分</th><th>关联单</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.date}</td><td>${r.siteName}</td><td>${r.partnerName}</td><td>${r.partnerRatePct}%</td>
                <td>¥${r.shareBase}</td><td>¥${r.platformAmount}</td><td>¥${r.partnerAmount}</td><td>¥${r.operatorAmount}</td>
                <td><small>${r.splitLabel}</small></td><td>${r.orderRef}</td>
              </tr>`).join("") || "<tr><td colspan='10'>暂无分润明细</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else {
        const siteMap = Object.fromEntries(sites.map(s => [s.id, s.name]));
        body = `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("site_partner_binding")} 请在<strong>站点管理 → 合伙人</strong>中配置。一站可多位合伙人；同一人可多站不同比例。演示：浦东站 <strong>王场地方 25% + 李物业 5%</strong>。</div>
        <section class="panel">
          ${panelHead("分润绑定一览", "站点 × 合伙人 · 只读汇总", "site_partner_binding")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>站点</th><th>合伙人</th><th>类型</th><th>本站比例</th><th>待生效</th><th>操作</th></tr></thead>
              <tbody>${bindings.map(b => {
                const pending = b.pendingRatePct != null ? `${b.pendingRatePct}% · ${(b.pendingEffectiveAt || "次日 0:00").replace(" 00:00", "")}` : "—";
                const siteName = siteMap[b.siteId] || b.siteId;
                return `<tr>
                  <td>${siteName}<br><small>${b.siteId}</small></td>
                  <td>${b.partnerName}</td>
                  <td>${sitePartnerTypeTag(b.partnerType)}</td>
                  <td><strong>${b.ratePct}%</strong></td>
                  <td>${pending}</td>
                  <td><button type="button" class="link-btn" data-site-partners="${b.siteId}">去站点配置</button></td>
                </tr>`;
              }).join("") || "<tr><td colspan='6'>暂无绑定 · 请至站点管理配置</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      return `${ownScopeBanner()}${pageWithTabs(tabSidebar(tabs, tab, "sptab"), body)}`;
    }

    function getSiteExpensePf() {
      if (!state.pf.siteExpenses) state.pf.siteExpenses = { ...PF_DEFAULTS.siteExpenses };
      return state.pf.siteExpenses;
    }

    function siteExpenseDateRange(sp) {
      const p = sp || getSiteExpensePf();
      if (p.dateFrom && p.dateTo) return { from: p.dateFrom, to: p.dateTo };
      return { from: "2026-06-01", to: "2026-06-30" };
    }

    function syncSiteExpenseRangeDates(pf) {
      if (pf.range === "lastMonth") { pf.dateFrom = "2026-05-01"; pf.dateTo = "2026-05-31"; }
      else if (pf.range === "quarter") { pf.dateFrom = "2026-04-01"; pf.dateTo = "2026-06-30"; }
      else { pf.dateFrom = "2026-06-01"; pf.dateTo = "2026-06-30"; pf.range = pf.range || "month"; }
    }

    function applySiteExpenseFiltersFromDom() {
      const sp = getSiteExpensePf();
      document.querySelectorAll("[data-site-expense-pf]").forEach(el => {
        sp[el.dataset.siteExpensePf] = el.value;
      });
      return sp;
    }

    function billInExpenseRange(bill, from, to) {
      return bill.periodStart <= to && bill.periodEnd >= from;
    }

    function paymentsInExpenseRange(bill, from, to) {
      return (bill.payments || []).filter(p => {
        const d = (p.payTime || "").slice(0, 10);
        return d >= from && d <= to;
      });
    }

    function siteExpenseProfile(siteId) {
      return siteExpenseProfiles.find(p => p.siteId === siteId && p.operatorId === currentEntity().id);
    }

    function mySiteExpenseProfiles() {
      const opId = currentEntity().id;
      return myOperatorSites().map(s => {
        const prof = siteExpenseProfiles.find(p => p.siteId === s.id && p.operatorId === opId);
        return { site: s, profile: prof || null };
      });
    }

    function siteExpenseBillsFor(siteId) {
      return siteExpenseBills
        .filter(b => b.siteId === siteId && b.operatorId === currentEntity().id)
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    }

    function mySiteExpenseBills() {
      return siteExpenseBills
        .filter(b => b.operatorId === currentEntity().id)
        .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    }

    function billPaidAmount(bill) {
      return (bill.payments || []).reduce((s, p) => s + p.amount, 0);
    }

    function billRemainAmount(bill) {
      return Math.max(0, +(bill.totalAmount - billPaidAmount(bill)).toFixed(2));
    }

    function syncBillStatus(bill) {
      const paid = billPaidAmount(bill);
      if (paid <= 0) bill.status = "待支付";
      else if (paid + 0.009 >= bill.totalAmount) bill.status = "已结清";
      else bill.status = "部分支付";
    }

    function expenseStatusTag(status) {
      const cls = status === "待支付" ? "risk" : status === "部分支付" ? "warn" : "";
      return cls ? `<span class="tag ${cls}">${status}</span>` : tag(status);
    }

    function formatExpenseFee(prof) {
      if (!prof) return "—";
      const venue = prof.venueFeeAmount ? `¥${prof.venueFeeAmount}/${prof.venueFeeUnit}` : "—";
      const elec = prof.electricityMode === "包月"
        ? `包月 ¥${prof.electricityFixedAmount || 0}`
        : `按量 ¥${prof.electricityUnitPrice || 0}/kWh`;
      return `${venue} · ${elec}`;
    }

    function openSiteExpenseDetail(siteId) {
      const site = sites.find(s => s.id === siteId);
      const prof = siteExpenseProfile(siteId);
      const bills = siteExpenseBillsFor(siteId);
      if (!site) return;
      state.detailSiteExpenseId = siteId;
      document.querySelector("#drawerTitle").textContent = "站点支出 · " + site.name;
      const profBlock = prof ? `
        <div class="detail-grid" style="margin-bottom:16px">
          <div class="detail-item"><span>场地所有人 ${noteBtn("site_expenses_landlord")}</span><strong>${prof.landlordName}</strong><br><small style="color:var(--muted)">${prof.landlordContact || ""} ${prof.landlordPhone || ""}</small></div>
          <div class="detail-item"><span>付费周期 ${noteBtn("site_expenses_cycle")}</span><strong>${prof.paymentCycle}</strong></div>
          <div class="detail-item"><span>场地费 ${noteBtn("site_expenses_venue")}</span><strong>¥${prof.venueFeeAmount}/${prof.venueFeeUnit}</strong></div>
          <div class="detail-item"><span>电费 ${noteBtn("site_expenses_electricity")}</span><strong>${prof.electricityMode === "包月" ? "包月 ¥" + prof.electricityFixedAmount : "按量 ¥" + prof.electricityUnitPrice + "/kWh"}</strong></div>
          <div class="detail-item"><span>收款方式 ${noteBtn("site_expenses_pay_method")}</span><strong>${prof.payMethod}</strong><br><small style="color:var(--muted)">${prof.payeeName}<br>${prof.payAccount}</small></div>
          ${prof.remark ? `<div class="detail-item" style="grid-column:1/-1"><span>备注</span>${prof.remark}</div>` : ""}
        </div>` : `<p class="perm-banner">尚未配置支出信息，请点击「编辑配置」完善。</p>`;
      const billRows = bills.length ? bills.map(b => {
        const paid = billPaidAmount(b);
        const remain = billRemainAmount(b);
        const payRows = (b.payments || []).length ? (b.payments || []).map(p => `<tr>
          <td>${p.payTime}</td><td>¥${p.amount.toFixed(2)}</td><td>${p.method}</td><td>${p.ref || "—"}</td><td>${p.operator}</td><td>${p.remark || "—"}</td>
        </tr>`).join("") : `<tr><td colspan="6" style="color:var(--muted)">暂无支付记录</td></tr>`;
        return `<tr>
          <td><strong>${b.periodStart}</strong> ~ ${b.periodEnd}</td>
          <td>¥${b.venueFee.toFixed(2)}</td>
          <td>${b.electricityKwh != null ? b.electricityKwh.toFixed(2) + " kWh" : "—"}<br><small>¥${b.electricityFee.toFixed(2)}</small></td>
          <td><strong>¥${b.totalAmount.toFixed(2)}</strong></td>
          <td>${expenseStatusTag(b.status)}<br><small style="color:var(--muted)">应付 ${b.dueDate}</small></td>
          <td>已付 ¥${paid.toFixed(2)}${remain > 0 ? `<br><small style="color:var(--red)">待付 ¥${remain.toFixed(2)}</small>` : ""}</td>
          <td>${remain > 0 ? `<button type="button" class="link-btn" data-register-expense-pay="${b.id}">登记支付</button>` : "—"}</td>
        </tr>
        <tr class="site-expense-pay-row"><td colspan="7" style="padding:0 0 12px 24px;background:var(--surface-soft)">
          <p style="font-size:12px;color:var(--muted);margin:8px 0 4px">支付记录 ${noteBtn("site_expenses_payment")}</p>
          <table style="width:100%;font-size:13px"><thead><tr><th>支付时间</th><th>金额</th><th>方式</th><th>流水号</th><th>经办人</th><th>备注</th></tr></thead><tbody>${payRows}</tbody></table>
        </td></tr>`;
      }).join("") : `<tr><td colspan="7">暂无周期账单</td></tr>`;
      document.querySelector("#drawerBody").innerHTML = `
        ${profBlock}
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <p style="margin:0;font-size:13px;color:var(--muted)">周期账单 ${noteBtn("site_expenses_bill")}</p>
          <button type="button" class="btn" data-edit-site-expense="${siteId}">编辑配置</button>
        </div>
        <div class="orders-table-wrap">
          <table>
            <thead><tr><th>账期</th><th>场地费</th><th>电费</th><th>合计</th><th>状态</th><th>实付/待付</th><th>操作</th></tr></thead>
            <tbody>${billRows}</tbody>
          </table>
        </div>`;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindDrawerActions();
    }

    function openSiteExpenseForm(siteId) {
      const site = sites.find(s => s.id === siteId);
      if (!site) return;
      let prof = siteExpenseProfile(siteId);
      if (!prof) {
        prof = {
          siteId, operatorId: currentEntity().id,
          landlordName: "", landlordPhone: "", landlordContact: "",
          venueFeeAmount: 0, venueFeeUnit: "月",
          electricityMode: "按量", electricityUnitPrice: 1.2, electricityFixedAmount: null,
          paymentCycle: "月结", payMethod: "对公转账", payeeName: "", payAccount: "", remark: ""
        };
      }
      openProtoForm({
        title: "站点支出配置 · " + site.name,
        fields: [
          { name: "landlordName", label: "场地所有人", value: prof.landlordName },
          { name: "landlordContact", label: "联系人", value: prof.landlordContact || "" },
          { name: "landlordPhone", label: "联系电话", value: prof.landlordPhone || "" },
          { name: "venueFeeAmount", label: "场地费金额（元）", type: "number", value: String(prof.venueFeeAmount || 0) },
          { name: "venueFeeUnit", label: "场地费周期", type: "select", options: ["月", "季", "年"], value: prof.venueFeeUnit || "月" },
          { name: "electricityMode", label: "电费模式", type: "select", options: ["按量", "包月"], value: prof.electricityMode || "按量" },
          { name: "electricityUnitPrice", label: "电费单价（元/kWh，按量时）", type: "number", value: String(prof.electricityUnitPrice ?? 1.2) },
          { name: "electricityFixedAmount", label: "包月电费（元，包月时）", type: "number", value: String(prof.electricityFixedAmount ?? 0) },
          { name: "paymentCycle", label: "付费周期", type: "select", options: ["月结", "季结", "年结"], value: prof.paymentCycle || "月结" },
          { name: "payMethod", label: "收款方式", type: "select", options: ["对公转账", "微信", "支付宝", "现金"], value: prof.payMethod || "对公转账" },
          { name: "payeeName", label: "收款户名", value: prof.payeeName || "" },
          { name: "payAccount", label: "收款账号", value: prof.payAccount || "" },
          { name: "remark", label: "备注", value: prof.remark || "", required: false }
        ],
        submitLabel: "保存",
        onSubmit: (data) => {
          const row = {
            siteId, operatorId: currentEntity().id,
            landlordName: (data.landlordName || "").trim(),
            landlordContact: (data.landlordContact || "").trim(),
            landlordPhone: (data.landlordPhone || "").trim(),
            venueFeeAmount: Number(data.venueFeeAmount) || 0,
            venueFeeUnit: data.venueFeeUnit,
            electricityMode: data.electricityMode,
            electricityUnitPrice: data.electricityMode === "按量" ? Number(data.electricityUnitPrice) || 0 : null,
            electricityFixedAmount: data.electricityMode === "包月" ? Number(data.electricityFixedAmount) || 0 : null,
            paymentCycle: data.paymentCycle,
            payMethod: data.payMethod,
            payeeName: (data.payeeName || "").trim(),
            payAccount: (data.payAccount || "").trim(),
            remark: (data.remark || "").trim()
          };
          const idx = siteExpenseProfiles.findIndex(p => p.siteId === siteId && p.operatorId === currentEntity().id);
          if (idx >= 0) siteExpenseProfiles[idx] = row;
          else siteExpenseProfiles.push(row);
          return {
            successMessage: "站点支出配置已保存",
            afterClose: () => {
              if (state.detailSiteExpenseId === siteId) openSiteExpenseDetail(siteId);
              else render();
            }
          };
        }
      });
    }

    function registerSiteExpensePayment(billId, data) {
      const bill = siteExpenseBills.find(b => b.id === billId);
      if (!bill) return "账单不存在";
      const amount = Number(data.amount);
      if (!amount || amount <= 0) return "请输入有效支付金额";
      if (!bill.payments) bill.payments = [];
      bill.payments.unshift({
        id: "SEP-" + Date.now().toString().slice(-6),
        payTime: new Date().toISOString().slice(0, 16).replace("T", " "),
        amount,
        method: data.method || "对公转账",
        ref: (data.ref || "").trim(),
        operator: currentEmployee()?.name || currentEntity().name,
        remark: (data.remark || "").trim()
      });
      syncBillStatus(bill);
      return null;
    }

    function renderSiteExpenses() {
      const canEdit = isEntityLogin() || employeeHasPerm("site_expenses.edit");
      const tab = state.siteExpenseTab || "sites";
      const sp = getSiteExpensePf();
      const { from, to } = siteExpenseDateRange(sp);
      const profiles = mySiteExpenseProfiles();
      const allBills = mySiteExpenseBills().filter(b => billInExpenseRange(b, from, to));
      const pendingBills = allBills.filter(b => b.status !== "已结清");
      const pendingAmount = pendingBills.reduce((s, b) => s + billRemainAmount(b), 0);
      const periodDue = allBills.reduce((s, b) => s + b.totalAmount, 0);
      const periodPaid = allBills.reduce((s, b) => s + paymentsInExpenseRange(b, from, to).reduce((x, p) => x + p.amount, 0), 0);
      const filterHint = from + " ~ " + to;
      const siteRows = profiles.map(({ site, profile }) => {
        const bills = siteExpenseBillsFor(site.id).filter(b => billInExpenseRange(b, from, to));
        const pending = bills.filter(b => b.status !== "已结清").length;
        const lastBill = bills.sort((a, b) => b.periodEnd.localeCompare(a.periodEnd))[0];
        const periodSiteDue = bills.reduce((s, b) => s + billRemainAmount(b), 0);
        return `<tr>
          <td>${site.name}<br><small style="color:var(--muted)">${site.id}</small></td>
          <td>${profile ? profile.landlordName : "—"}<br><small style="color:var(--muted)">${profile?.landlordContact || ""}</small></td>
          <td>${profile ? profile.paymentCycle : "—"}</td>
          <td>${profile ? formatExpenseFee(profile) : "—"}</td>
          <td>${profile ? `${profile.payMethod}<br><small style="color:var(--muted)">${profile.payeeName || "—"}</small>` : "—"}</td>
          <td>${pending ? `<span class="tag warn">${pending} 笔待付</span><br><small>待付 ¥${periodSiteDue.toFixed(2)}</small>` : tag("已结清")}</td>
          <td>${lastBill ? lastBill.periodStart + " ~ " + lastBill.periodEnd : "—"}</td>
          <td>
            <button type="button" class="link-btn" data-open-site-expense="${site.id}">账单明细</button>
            ${canEdit ? ` · <button type="button" class="link-btn" data-edit-site-expense="${site.id}">配置</button>` : ""}
          </td>
        </tr>`;
      }).join("") || `<tr><td colspan="8">暂无站点</td></tr>`;
      const billRows = allBills.sort((a, b) => b.periodStart.localeCompare(a.periodStart)).map(b => {
        const site = sites.find(s => s.id === b.siteId);
        const remain = billRemainAmount(b);
        const paysInRange = paymentsInExpenseRange(b, from, to);
        const paidInRange = paysInRange.reduce((s, p) => s + p.amount, 0);
        return `<tr>
          <td>${site?.name || b.siteId}</td>
          <td>${b.periodStart} ~ ${b.periodEnd}<br><small style="color:var(--muted)">应付 ${b.dueDate}</small></td>
          <td>¥${b.venueFee.toFixed(2)}</td>
          <td>${b.electricityKwh != null ? b.electricityKwh.toFixed(2) + " kWh / " : ""}¥${b.electricityFee.toFixed(2)}</td>
          <td><strong>¥${b.totalAmount.toFixed(2)}</strong></td>
          <td>${expenseStatusTag(b.status)}</td>
          <td>${paysInRange.length} 笔 · 已付 ¥${paidInRange.toFixed(2)}${remain > 0 ? `<br><small style="color:var(--red)">待付 ¥${remain.toFixed(2)}</small>` : ""}</td>
          <td>
            <button type="button" class="link-btn" data-open-site-expense="${b.siteId}">详情</button>
            ${canEdit && remain > 0 ? ` · <button type="button" class="link-btn" data-register-expense-pay="${b.id}">登记支付</button>` : ""}
          </td>
        </tr>`;
      }).join("") || `<tr><td colspan="8">当前筛选条件下暂无账单</td></tr>`;
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("站点支出", filterHint + " · 场地费 · 电费 · 周期账单", "site_expenses_panel")}
          <div class="panel-body">
            <div class="power-filter-bar" id="siteExpenseFilterBar" style="margin-bottom:16px">
              <div class="field">
                <label>账期起 ${noteBtn("site_expenses_time")}</label>
                <input type="date" data-site-expense-pf="dateFrom" value="${sp.dateFrom || from}">
              </div>
              <div class="field">
                <label>账期止</label>
                <input type="date" data-site-expense-pf="dateTo" value="${sp.dateTo || to}">
              </div>
              <div class="field">
                <label>快捷范围</label>
                <select data-site-expense-pf="range">
                  <option value="month"${sp.range === "month" ? " selected" : ""}>本月（2026-06）</option>
                  <option value="lastMonth"${sp.range === "lastMonth" ? " selected" : ""}>上月（2026-05）</option>
                  <option value="quarter"${sp.range === "quarter" ? " selected" : ""}>近 3 月（Q2）</option>
                </select>
              </div>
              <div class="field pf-actions">
                <label>&nbsp;</label>
                <button type="button" class="btn primary" data-site-expense-query>查询</button>
              </div>
            </div>
            <div class="kpi-grid in-panel" style="margin-bottom:16px">
              ${kpi("管理站点", profiles.length, "含筹备中站点", "站", "site_expenses_panel")}
              ${kpi("待付账单", pendingBills.length, "合计待付 ¥" + pendingAmount.toLocaleString("zh-CN", { minimumFractionDigits: 2 }), "单", "site_expenses_bill")}
              ${kpi("期间应付", "¥" + periodDue.toLocaleString("zh-CN", { minimumFractionDigits: 2 }), filterHint + " 账期合计", "应", "site_expenses_bill")}
              ${kpi("期间已付", "¥" + periodPaid.toLocaleString("zh-CN", { minimumFractionDigits: 2 }), "筛选期内支付流水", "付", "site_expenses_payment")}
            </div>
            ${tab === "sites" ? `
            <div class="orders-table-wrap">
              <table>
                <thead><tr>
                  <th>站点</th><th>场地所有人 ${noteBtn("site_expenses_landlord")}</th><th>付费周期 ${noteBtn("site_expenses_cycle")}</th>
                  <th>场地费/电费 ${noteBtn("site_expenses_venue")}</th><th>收款方式 ${noteBtn("site_expenses_pay_method")}</th>
                  <th>待付</th><th>最近账期</th><th>操作</th>
                </tr></thead>
                <tbody>${siteRows}</tbody>
              </table>
            </div>` : `
            <div class="orders-table-wrap">
              <table>
                <thead><tr>
                  <th>站点</th><th>账期</th><th>场地费</th><th>电费 ${noteBtn("site_expenses_electricity")}</th>
                  <th>合计</th><th>状态</th><th>支付记录</th><th>操作</th>
                </tr></thead>
                <tbody>${billRows}</tbody>
              </table>
            </div>`}
          </div>
        </section>`;
    }

    function cabinetBySn(sn) {
      return cabinets.find(c => c.sn === sn);
    }

    function cabinetBatteryStats(c) {
      const knownBats = batteries.filter(b => b.inCab === c.sn);
      const known = knownBats.length;
      const unknown = c.batteryUnknown || 0;
      const empty = Math.max(0, (c.slots || 0) - known - unknown);
      const swapAvailable = knownBats.filter(b => (b.soc || 0) >= 80 && (b.health || "").includes("正常")).length;
      return { known, unknown, empty, swapAvailable };
    }

    function cabinetDeployAddress(c) {
      if (c.deployAddress) return c.deployAddress;
      const siteMeta = sites.find(s => s.name === c.site);
      return siteMeta?.address || c.site || "—";
    }

    function cabinetHasSiteBinding(c) {
      if (!c?.site || c.site === "待绑定" || c.site === "—") return false;
      return myOperatorSites().some(s => s.name === c.site && s.status !== "已停用");
    }

    function moveCabinetTargetSites(currentSiteName) {
      return myOperatorSites().filter(s => s.status === "在营" && s.name !== currentSiteName);
    }

    function moveCabinetToSite(sn, targetSiteName, remark) {
      const c = cabinetBySn(sn);
      if (!c || !filterOwnRow(c)) return "无权操作该柜机";
      if (!cabinetHasSiteBinding(c)) return "该柜机尚未绑定站点，无法移柜";
      const site = sites.find(s => s.name === targetSiteName && s.operatorId === currentEntity().id);
      if (!site || site.status !== "在营") return "目标站点无效或不在营";
      if (site.name === c.site) return "目标站点不能与当前站点相同";
      const fromSite = c.site;
      c.site = site.name;
      c.city = site.city;
      c.deployAddress = site.address || c.deployAddress;
      const fa = financeAssets.find(a => a.sn === c.sn && a.type === "换电柜");
      if (fa) fa.site = site.name;
      myDeviceAlerts().filter(a => a.deviceSn === c.sn).forEach(a => { a.siteName = site.name; });
      if (Array.isArray(cabinetMoveLogs)) {
        cabinetMoveLogs.unshift({
          id: "CM-" + Date.now().toString().slice(-6),
          sn: c.sn,
          fromSite,
          toSite: site.name,
          operatorId: currentEntity().id,
          operatorName: currentEmployee()?.name || currentEntity().name,
          remark: (remark || "").trim(),
          movedAt: new Date().toISOString().slice(0, 16).replace("T", " ")
        });
      }
      return null;
    }

    function openMoveCabinetForm(sn) {
      const c = cabinetBySn(sn);
      if (!c || !filterOwnRow(c)) {
        showProtoToast("未找到该换电柜");
        return;
      }
      if (!cabinetHasSiteBinding(c)) {
        showProtoToast("该柜机尚未绑定站点，无法移柜");
        return;
      }
      const targets = moveCabinetTargetSites(c.site);
      if (!targets.length) {
        showProtoToast("暂无其他在营站点可移入");
        return;
      }
      openProtoForm({
        title: "移柜 · " + c.sn,
        fields: [
          { name: "fromSite", label: "当前站点", value: c.site, readonly: true },
          { name: "toSite", label: "目标站点", type: "select", options: targets.map(s => s.name), value: targets[0].name },
          { name: "remark", label: "移柜说明", required: false, value: "" }
        ],
        submitLabel: "确认移柜",
        onSubmit: (data) => {
          const fromSite = c.site;
          const err = moveCabinetToSite(sn, data.toSite, data.remark);
          if (err) return err;
          return {
            successMessage: `已将 ${sn} 从「${fromSite}」迁至「${data.toSite}」（演示）`,
            afterClose: () => render()
          };
        }
      });
    }

    function cabinetIccid(c) {
      if (c.iccid) return c.iccid;
      return iccidProfiles.find(i => i.boundDeviceSn === c.sn)?.iccid || "—";
    }

    function cabinetAssetCell(c) {
      const s = cabinetBatteryStats(c);
      return `<div class="cab-asset-cell">
        <div>已有电池数量 <strong>${s.known}</strong></div>
        <div>未知数量 <strong>${s.unknown}</strong></div>
        <div>未插电池数量 <strong>${s.empty}</strong></div>
      </div>`;
    }

    function filterCabinetRows(c, f) {
      if (f.deviceId && !matchKw(c.deviceId || "", f.deviceId)) return false;
      if (f.sn && !matchKw(c.sn, f.sn)) return false;
      if (f.deviceName && !matchKw(c.deviceName || "", f.deviceName)) return false;
      if (f.site !== "全部" && c.site !== f.site) return false;
      if (f.online === "online" && !c.online) return false;
      if (f.online === "offline" && c.online) return false;
      if (f.powerStatus !== "全部" && (c.powerStatus || "已通电") !== f.powerStatus) return false;
      if (f.deviceStatus !== "全部" && (c.deviceStatus || "启用") !== f.deviceStatus) return false;
      return true;
    }

    function cabinetMeta(c) {
      const cs = c.chargingService || {};
      return {
        qrBound: c.qrBound !== false,
        hardwareType: c.hardwareType || "HM221",
        hardwareVersion: c.hardwareVersion || "V3.0",
        softwareVersion: c.softwareVersion || "MASBG129PROD60@SG",
        bootVersion: c.bootVersion || "1",
        module4gType: c.module4gType || "ML307",
        exchangeableSpecs: c.exchangeableSpecs != null ? c.exchangeableSpecs : "48V/20Ah",
        swapMode: c.swapMode || "正常换电",
        bluetoothType: c.bluetoothType || "类型1-0000FFE0",
        serviceStatus: c.serviceStatus || c.deviceStatus || "启用",
        chargingService: {
          slotChargeRatio: cs.slotChargeRatio != null ? cs.slotChargeRatio : "80%",
          swapReserveSlots: cs.swapReserveSlots != null ? cs.swapReserveSlots : "2",
          exclusiveSigned: cs.exclusiveSigned != null ? cs.exclusiveSigned : "0",
          exclusiveSignable: cs.exclusiveSignable || "可签约",
          sharedSigned: cs.sharedSigned != null ? cs.sharedSigned : "4",
          sharedSignable: cs.sharedSignable || "可签约"
        }
      };
    }

    function cabinetPortRows(c) {
      if (c.ports && c.ports.length) return c.ports;
      const slots = c.slots || 12;
      const batsInCab = batteries.filter(b => b.inCab === c.sn);
      return Array.from({ length: slots }, (_, i) => {
        const bat = batsInCab[i] || null;
        const charging = bat && bat.soc < 95;
        return {
          portNo: i + 1,
          portStatus: bat ? `已插入 · ${bat.sn}` : "没有插上电池",
          serviceType: bat ? "换电" : "",
          current: bat ? "2.35" : "0.00",
          voltage: bat ? "54.20" : "0.00",
          portServiceStatus: "启用",
          chargedKwh: bat ? (bat.soc / 100 * 0.96).toFixed(2) : "0.00",
          chargeMinutes: bat ? Math.max(0, Math.round((100 - bat.soc) * 1.2)) : 0,
          chargerOn: charging,
          chargerCurrent: charging ? "5.00" : "0.00",
          chargerVoltage: charging ? "54.00" : "0.00",
          batCurrent: bat ? "0.00" : "0.00",
          batVoltage: bat ? "54.20" : "0.00",
          batVoltageDiff: bat ? "0.02" : "0.00",
          batSoc: bat ? bat.soc : null,
          batHealth: bat ? bat.health : null,
          batCommBoard: bat ? (c.commBoardId || "—") : "",
          batShellCode: bat ? bat.sn.replace("BAT-", "SH") : "",
          batTempMax: bat ? 32 : null,
          batTempMin: bat ? 28 : null
        };
      });
    }

    function renderCabinetDetail(c) {
      const meta = cabinetMeta(c);
      const iccid = cabinetIccid(c);
      const iccidMeta = iccidProfiles.find(i => i.iccid === iccid || i.boundDeviceSn === c.sn);
      const ports = cabinetPortRows(c);
      const opsDemo = isOperatorRole();
      const cell = (label, val) => `<div class="cab-detail-cell"><span>${label}</span><strong>${val}</strong></div>`;
      return `<div class="cab-detail-page">
        <div class="cab-breadcrumb">
          <button type="button" class="link-btn" data-cab-back>换电柜管理</button> &gt; 详情
        </div>
        <section class="panel">
          ${panelHead("换电柜 · 详情", `${c.deviceId || c.sn} · ${c.online ? "在线" : "离线"}`, "devices_cab")}
          <div class="panel-body" style="padding-top:0">
            <div class="cab-detail-grid">
              ${cell("设备编号", c.deviceId || "—")}
              ${cell("设备二维码", meta.qrBound ? `${tag("已绑定")}<br><button type="button" class="link-btn" data-cab-demo="更换二维码">更换二维码</button> · <button type="button" class="link-btn" data-cab-demo="查看二维码">查看二维码</button>` : tag("未绑定"))}
              ${cell("通讯板编号", c.commBoardId || "—")}
              ${cell("物联网卡编号", `${iccid}${iccidMeta ? `<br><small style="color:var(--muted)">${iccidMeta.carrier} · 到期 ${iccidMeta.expireDate}</small>` : ""}<br><button type="button" class="link-btn" data-cab-refresh-iccid="${c.sn}">刷新</button>`)}
              ${cell("设备名称", c.deviceName || "—")}
              ${cell("设备类型", c.deviceType || "换电柜")}
              ${cell("设备通电状态", c.powerStatus || "已通电")}
              ${cell("设备服务状态", tag(meta.serviceStatus))}
              ${cell("硬件种类", meta.hardwareType)}
              ${cell("硬件版本", meta.hardwareVersion)}
              ${cell("软件版本", meta.softwareVersion)}
              ${cell("BOOT版本", meta.bootVersion)}
              ${cell("4G模组类型", meta.module4gType)}
              ${cell("可换电池规格", meta.exchangeableSpecs || "—")}
              ${cell("已使用电量", c.usedPowerKwh != null ? c.usedPowerKwh : "—")}
              ${cell("投放地址", cabinetDeployAddress(c) || "—")}
              ${cell("电柜 SN", c.sn)}
              ${cell("所属站点", `${c.site}${opsDemo && cabinetHasSiteBinding(c) ? `<br><button type="button" class="link-btn" data-move-cab="${c.sn}">移柜</button>` : ""}`)}
              ${cell("权属", ownershipCell(c))}
              <div class="cab-detail-cell"><span>换电模式切换</span>
                <div class="cab-inline-ctrl">
                  <select data-cab-swap-mode="${c.sn}">
                    <option ${meta.swapMode === "正常换电" ? "selected" : ""}>正常换电</option>
                    <option ${meta.swapMode === "仅取电" ? "selected" : ""}>仅取电</option>
                    <option ${meta.swapMode === "仅还电" ? "selected" : ""}>仅还电</option>
                  </select>
                  ${opsDemo ? `<button type="button" class="btn" data-cab-confirm-swap="${c.sn}">确认切换</button>` : ""}
                </div>
              </div>
              <div class="cab-detail-cell"><span>蓝牙类型</span>
                <div class="cab-inline-ctrl">
                  <select data-cab-bt-type="${c.sn}">
                    <option ${meta.bluetoothType === "类型1-0000FFE0" ? "selected" : ""}>类型1-0000FFE0</option>
                    <option ${meta.bluetoothType === "类型2-0000FFE1" ? "selected" : ""}>类型2-0000FFE1</option>
                  </select>
                  ${opsDemo ? `<button type="button" class="btn" data-cab-confirm-bt="${c.sn}">确认切换</button>` : ""}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin-top:14px">
          ${panelHead("充电服务设置", "格口签约与保留策略", "devices_cab")}
          <div class="panel-body" style="padding-top:0">
            <div style="display:flex;justify-content:flex-end;margin-bottom:10px">
              ${opsDemo ? `<button type="button" class="btn" data-cab-demo="充电服务设置">设置</button>` : ""}
            </div>
            <div class="cab-charge-grid">
              <div class="cab-charge-item"><span>每格口充电签约比例</span><strong>${meta.chargingService.slotChargeRatio}</strong></div>
              <div class="cab-charge-item"><span>换电保留格口</span><strong>${meta.chargingService.swapReserveSlots}</strong></div>
              <div class="cab-charge-item"><span>专享已签约 / 可签约</span><strong>${meta.chargingService.exclusiveSigned} / ${meta.chargingService.exclusiveSignable}</strong></div>
              <div class="cab-charge-item"><span>共享已签约 / 可签约</span><strong>${meta.chargingService.sharedSigned} / ${meta.chargingService.sharedSignable}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel" style="margin-top:14px">
          ${panelHead("设备告警", "本柜 IoT Webhook 告警（一期真联调；原型 Mock）", "devices_cab")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table>
              <thead><tr><th>时间</th><th>级别</th><th>类型</th><th>消息</th><th>状态</th></tr></thead>
              <tbody>${(typeof deviceAlerts !== "undefined" ? deviceAlerts : []).filter(a => a.deviceSn === c.sn).map(a => `<tr>
                <td>${a.raisedAt || a.time || "—"}</td><td>${tag(a.severity || "中")}</td>
                <td>${a.alertType || a.type || "—"}</td><td style="white-space:normal">${a.message || "—"}</td>
                <td>${tag(a.status || "待处理")}</td>
              </tr>`).join("") || "<tr><td colspan='5'>暂无本柜告警</td></tr>"}</tbody>
            </table>
            <p style="font-size:12px;color:var(--muted);margin:8px 0 0">短信模板/接收人见平台告警配置；发送记录可查。</p>
          </div>
        </section>
        ${opsDemo ? `<div class="cab-ops-bar">
          <p style="width:100%;margin:0 0 8px;font-size:12px;color:var(--muted)">远程运维：原型为演示桩；生产接 IoT 真接口（2026-07-13 确认一期）</p>
          <button type="button" class="btn primary" data-cab-demo="查看电柜快照">查看电柜快照</button>
          <button type="button" class="btn primary" data-cab-demo="查看设备快照">查看设备快照</button>
          <button type="button" class="btn primary" data-cab-demo="查看发送请求记录">查看发送请求记录</button>
          <button type="button" class="btn primary" data-cab-ops-log>查看运维操作记录</button>
          <button type="button" class="btn" data-cab-demo="通电">通电</button>
          <button type="button" class="btn danger" data-cab-demo="断电">断电</button>
          <button type="button" class="btn" data-cab-demo="开启风扇">开启风扇</button>
          <button type="button" class="btn danger" data-cab-demo="关闭风扇">关闭风扇</button>
          <button type="button" class="btn" data-cab-demo="主板重启">主板重启</button>
          <button type="button" class="btn" data-cab-demo="更新设备版本号">更新设备版本号</button>
          <button type="button" class="btn" data-cab-demo="上传二维码">上传二维码</button>
          <button type="button" class="btn" data-cab-demo="反向供电配置">反向供电配置</button>
        </div>` : ""}
        <section class="panel">
          ${panelHead("端口状态", `共 ${ports.length} 个格口 · IoT 实时`, "devices_cab")}
          <div class="panel-body orders-table-wrap" style="padding-top:0">
            <table class="cab-port-table">
              <thead><tr>
                <th>端口编号</th><th>端口状态</th><th>服务类型</th><th>端口电流/电压</th>
                <th>端口服务状态</th><th>已充电量/充电时长</th><th>充电器开关</th><th>充电器控制/电流/电压</th>
                <th>电池电流/电压/压差</th><th>电池电量/健康</th><th>通讯板编号</th><th>外壳码</th><th>电池温度最高/最低</th><th>操作</th>
              </tr></thead>
              <tbody>${ports.map(p => `<tr>
                <td><strong>${p.portNo}</strong></td>
                <td style="white-space:normal;max-width:120px">${p.portStatus}</td>
                <td>${p.serviceType || "—"}</td>
                <td>电流: ${p.current}<br>电压: ${p.voltage}</td>
                <td>${tag(p.portServiceStatus)}${opsDemo ? `<br><button type="button" class="link-btn" data-cab-port-toggle="${c.sn}:${p.portNo}">切换状态</button>` : ""}</td>
                <td>${p.chargedKwh} kWh<br>充电时长: ${p.chargeMinutes}分钟</td>
                <td><span class="cab-toggle ${p.chargerOn ? "on" : ""}"><i></i>${p.chargerOn ? "开" : "关"}</span></td>
                <td>电流: ${p.chargerCurrent}<br>电压: ${p.chargerVoltage}</td>
                <td>电流: ${p.batCurrent}<br>电压: ${p.batVoltage}<br>压差: ${p.batVoltageDiff}</td>
                <td>${p.batSoc != null ? p.batSoc + "%" : "—"}<br>${p.batHealth ? tag(p.batHealth) : "—"}</td>
                <td>${p.batCommBoard || "—"}</td>
                <td>${p.batShellCode || "—"}</td>
                <td>${p.batTempMax != null ? p.batTempMax + "℃ / " + p.batTempMin + "℃" : "—"}</td>
                <td class="port-ops">${opsDemo ? `
                  <button type="button" class="link-btn" data-cab-port-cmd="${c.sn}:${p.portNo}:open">开门</button>
                  <button type="button" class="link-btn" data-cab-port-cmd="${c.sn}:${p.portNo}:refresh">刷新</button>
                  <button type="button" class="link-btn" data-cab-port-cmd="${c.sn}:${p.portNo}:charge">补电</button>
                  <button type="button" class="link-btn" data-cab-port-cmd="${c.sn}:${p.portNo}:powerOn">通电</button>
                  <button type="button" class="link-btn" data-cab-port-cmd="${c.sn}:${p.portNo}:powerOff">断电</button>` : "—"}
                </td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
      </div>`;
    }

    function openCabinetDetailPage(sn) {
      state.cabinetDetailSn = sn;
      state.view = "devices";
      state.deviceTab = "cabinet";
      closeDrawer();
      render();
    }

    function openCabinetDrawer(c, mode) {
      const stats = cabinetBatteryStats(c);
      const iccid = cabinetIccid(c);
      const iccidMeta = iccidProfiles.find(i => i.iccid === iccid || i.boundDeviceSn === c.sn);
      state.detailSubId = null;
      state.detailSwapId = null;
      state.detailLeaseId = null;
      if (mode === "compose") {
        document.querySelector("#drawerTitle").textContent = "电柜组成 · " + c.sn;
        document.querySelector("#drawerSub").textContent = `${c.deviceName || c.site} · ${c.slots} 仓口`;
        const modules = c.slotModules || [{ id: "M1", type: "主控", slots: c.slots, fw: "—" }];
        const slots = Array.from({ length: c.slots || 0 }, (_, i) => {
          const bat = batteries.find(b => b.inCab === c.sn);
          const occupied = i < stats.known;
          return `<div class="slot-chip ${occupied ? "on" : ""}" title="格口 ${i + 1}">${i + 1}${occupied ? "·电" : ""}</div>`;
        }).join("");
        document.querySelector("#drawerBody").innerHTML = `
          <div class="detail-grid">
            <div class="detail-item"><span>通讯板</span><strong>${c.commBoardId || "—"}</strong></div>
            <div class="detail-item"><span>ICCID</span><strong>${iccid}</strong></div>
            <div class="detail-item"><span>在线</span><strong>${c.online ? tag("在线") : tag("离线")}</strong></div>
            <div class="detail-item"><span>仓口总数</span><strong>${c.slots}</strong></div>
          </div>
          <section class="panel" style="margin:16px 0 0">
            ${panelHead("模块清单", `${modules.length} 个模块`, "devices_cab")}
            <div class="panel-body orders-table-wrap" style="padding-top:0">
              <table class="sub-table"><thead><tr><th>模块</th><th>类型</th><th>仓口</th><th>固件</th></tr></thead>
              <tbody>${modules.map(m => `<tr><td>${m.id}</td><td>${m.type}</td><td>${m.slots}</td><td>${m.fw}</td></tr>`).join("")}</tbody></table>
            </div>
          </section>
          <section class="panel" style="margin:16px 0 0">
            ${panelHead("格口快照", "演示布局", "devices_cab")}
            <div class="panel-body"><div class="slot-grid">${slots || "—"}</div>
              ${isOperatorRole() ? `<div style="margin-top:12px;display:flex;gap:8px"><button type="button" class="btn" data-cab-ops="${c.sn}" data-ops="slot">隔口开关</button><button type="button" class="btn" data-cab-ops="${c.sn}" data-ops="power">上下电</button></div>` : ""}
            </div>
          </section>`;
      } else if (mode === "edit") {
        document.querySelector("#drawerTitle").textContent = "编辑换电柜 · " + c.sn;
        document.querySelector("#drawerSub").textContent = c.deviceId || "—";
        document.querySelector("#drawerBody").innerHTML = `
          <form class="form-grid" id="cabEditForm">
            <div class="field"><label>设备名称</label><input name="deviceName" value="${c.deviceName || ""}" placeholder="如 浦东1号柜" /></div>
            <div class="field"><label>投放地址</label><input name="deployAddress" value="${cabinetDeployAddress(c)}" /></div>
            <div class="field"><label>所属站点</label><input value="${c.site}" readonly /></div>
            <div class="field"><label>设备状态</label>
              <select name="deviceStatus"><option ${(c.deviceStatus || "启用") === "启用" ? "selected" : ""}>启用</option><option ${c.deviceStatus === "停用" ? "selected" : ""}>停用</option></select>
            </div>
          </form>
          <div class="form-actions" style="margin-top:16px">
            <button type="button" class="btn primary" id="saveCabEdit" data-sn="${c.sn}">保存（演示）</button>
          </div>`;
      } else {
        openCabinetDetailPage(c.sn);
        return;
      }
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindDrawerActions();
    }

    function renderDevices() {
      const tab = state.deviceTab;
      const alertBadge = myDeviceAlerts().filter(a => a.status === "待处理").length ? " !" : "";
      const tabDefs = [["cabinet", "换电柜"], ["battery", "电池"], ["alerts", "设备告警" + alertBadge], ["iccid", "ICCID"]];
      const sidebar = tabSidebar(tabDefs, tab, "dtab");
      let body = "";
      if (tab === "cabinet" && state.cabinetDetailSn) {
        const detailCab = cabinetBySn(state.cabinetDetailSn);
        if (detailCab && filterOwnRow(detailCab)) {
          return `${ownScopeBanner()}${pageWithTabs(sidebar, renderCabinetDetail(detailCab))}`;
        }
        state.cabinetDetailSn = null;
      }
      if (tab === "cabinet") {
        const f = getPf();
        const rows = cabinets.filter(filterOwnRow).filter(c => filterCabinetRows(c, f));
        const canMoveCab = isOperatorRole();
        body = `
          <div class="cab-toolbar" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px">
            <button type="button" class="btn primary" data-pf-confirm>查询</button>
            <button type="button" class="btn" data-export-bat-flow>导出电池流转记录</button>
            <button type="button" class="btn" data-cab-ops-log>运维操作记录</button>
          </div>
          <div class="orders-table-wrap">
            <table class="cab-list-table">
              <thead><tr>
                <th>设备编号/电柜 SN ${noteBtn("devices_cab")}</th>
                <th>通讯板编号</th><th>物联网卡编号</th><th>设备名称</th>
                <th>投放地址</th><th>设备通电状态</th><th>已使用电量</th><th>可换电池数量</th>
                <th>柜内电池资产</th><th>设备状态</th><th>操作</th>
              </tr></thead>
              <tbody>${rows.map(c => {
                const stats = cabinetBatteryStats(c);
                return `<tr>
                  <td><strong>${c.deviceId || "—"}</strong><br><small style="color:var(--muted)">SN: ${c.sn}</small></td>
                  <td>${c.commBoardId || "—"}</td>
                  <td style="font-size:12px;max-width:120px;word-break:break-all">${cabinetIccid(c)}</td>
                  <td>${c.deviceName || "—"}</td>
                  <td style="white-space:normal;max-width:160px;font-size:12px">${cabinetDeployAddress(c)}</td>
                  <td>${tag(c.powerStatus || "已通电")}<br><small style="color:var(--muted)">${c.online ? "在线" : "离线"}</small></td>
                  <td>${c.usedPowerKwh != null ? c.usedPowerKwh : "—"}</td>
                  <td><strong>${stats.swapAvailable}</strong></td>
                  <td>${cabinetAssetCell(c)}</td>
                  <td>${tag(c.deviceStatus || "启用")}</td>
                  <td class="row-actions" style="white-space:nowrap">
                    <button type="button" class="link-btn" data-open-cab-compose="${c.sn}">电柜组成</button>
                    <button type="button" class="link-btn" data-edit-cab="${c.sn}">编辑</button>
                    ${canMoveCab && cabinetHasSiteBinding(c) ? `<button type="button" class="link-btn" data-move-cab="${c.sn}">移柜</button>` : ""}
                    <button type="button" class="link-btn" data-open-cab-detail="${c.sn}">查看详情</button>
                  </td>
                </tr>`;
              }).join("") || "<tr><td colspan='11'>暂无换电柜</td></tr>"}</tbody>
            </table>
          </div>`;
      } else if (tab === "battery") {
        const f = getPf();
        const rows = batteries.filter(filterOwnRow).filter(b => {
          if (!matchKw(b.sn, f.sn) && !matchKw(b.site, f.sn)) return false;
          if (f.site !== "全部" && b.site !== f.site) return false;
          return true;
        });
        body = `<table><thead><tr><th>电池 SN</th><th>站点</th><th>运营主体</th><th>权属</th><th>电量</th><th>健康</th><th>位置</th></tr></thead>
          <tbody>${rows.map(b => `<tr><td>${b.sn}</td><td>${b.site}</td><td>${b.deviceOwnerName}</td><td>${ownershipCell(b)}</td><td>${b.soc}%</td><td>${tag(b.health)}</td><td>${b.inCab}</td></tr>`).join("") || "<tr><td colspan='7'>暂无自有设备</td></tr>"}</tbody></table>`;
      } else if (tab === "alerts") {
        const rows = myDeviceAlerts();
        body = `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">IoT 上报为准；未正常弹电池可关联换电单（C-03）。</p>
          <table><thead><tr><th>时间</th><th>类型</th><th>等级</th><th>设备</th><th>站点</th><th>说明</th><th>状态</th><th>操作</th></tr></thead>
          <tbody>${rows.map(a => `<tr>
            <td>${a.raisedAt}</td><td>${alertTypeLabel(a.alertType)}</td><td>${tag(a.severity)}</td>
            <td>${a.deviceSn}</td><td>${a.siteName}</td><td>${a.message}</td><td>${tag(a.status)}</td>
            <td>${a.swapOrderId ? `<button type="button" class="link-btn" data-audit-ref="swap:${a.swapOrderId}">${a.swapOrderId}</button>` : "—"}
              ${a.status === "待处理" ? `<button type="button" class="link-btn" data-close-alert="${a.id}">关闭</button>` : ""}</td>
          </tr>`).join("") || "<tr><td colspan='8'>暂无告警</td></tr>"}</tbody></table>`;
      } else if (tab === "iccid") {
        const rows = myIccidProfiles();
        body = `<table><thead><tr><th>ICCID</th><th>号码</th><th>运营商</th><th>套餐</th><th>到期</th><th>状态</th><th>绑定设备</th></tr></thead>
          <tbody>${rows.map(i => `<tr>
            <td>${i.iccid}</td><td>${i.msisdn}</td><td>${i.carrier}</td><td>${i.packageName}</td><td>${i.expireDate}</td>
            <td>${tag(i.status)}</td><td>${i.boundDeviceSn}</td>
          </tr>`).join("") || "<tr><td colspan='7'>暂无 ICCID</td></tr>"}</tbody></table>
          <p style="font-size:12px;color:var(--muted);margin:12px 0 0">变更记录 Mock：${iccidChangeLogs.map(l => l.changeType + " " + l.iccid + " → " + l.toDeviceSn).join("；") || "—"}</p>`;
      }
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `${isOperatorRole() ? `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_operator_device_gate")} 设备须先由<strong>平台管理员</strong>绑定至本运营商，方可在此维护并分配至站点。</div>` : ""}<section class="panel">
          ${panelHead(tab === "cabinet" ? "换电柜管理" : "我的设备", tab === "cabinet" ? `共 ${cabinets.filter(filterOwnRow).length} 台 · IoT 实时快照` : "仅本人名下资产；含设备告警与 ICCID（C-03）", tab === "cabinet" ? "devices_cab" : tab === "battery" ? "devices_bat" : "devices_cab")}
          <div class="panel-body">${body}</div>
        </section>`)}`;
    }

    function depositCell(p) {
      if (p.depositWaiver) {
        const w = p.depositWaiver;
        return `${tag("信用免押")}<br><small style="color:var(--muted)">${w.type || "信用"} ${w.score != null ? w.score + "分" : ""}</small>`;
      }
      if (p.batteryDeposit == null) return "—";
      if (p.batteryDeposit === 0) return `${tag("无需押金")}`;
      const paid = (p.depositPaid || 0) >= p.batteryDeposit;
      return `¥${p.batteryDeposit}<br><small>${paid ? tag("实付押金") : tag("待付押")}</small>`;
    }

    function packageDepositDetailHtml(p) {
      if (p.depositWaiver) {
        const w = p.depositWaiver;
        const amt = w.waivedAmount != null ? w.waivedAmount : (p.batteryDeposit || 0);
        return `<strong>${tag("信用免押")}</strong>
          <br><small style="font-weight:400;color:var(--muted)">${w.type || "信用通道"} · ${w.score != null ? w.score + "分" : "—"} · 免押额 ¥${amt} · 未实收押金</small>`;
      }
      if (p.batteryDeposit == null) return "<strong>—</strong>";
      if (p.batteryDeposit === 0) {
        return `<strong>${tag("无需押金")}</strong><br><small style="font-weight:400;color:var(--muted)">本单不收电池押金</small>`;
      }
      const paidAmt = p.depositPaid || 0;
      const paid = paidAmt >= p.batteryDeposit;
      return `<strong>${tag("实付押金")} ¥${p.batteryDeposit}</strong>
        <br><small style="font-weight:400;color:var(--muted)">${paid ? "已收款" : "待付"} · 实收 ¥${paidAmt}</small>`;
    }

    function packageSettleSplit(p) {
      const pay = Math.round((Number(p.pay) || 0) * 100) / 100;
      const opId = p.deviceOwnerId;
      const feeCfg = operatorPlatformFeeConfig(opId);
      const platformFee = Math.round(calcPlatformFeeAmount(pay, opId, "支付成功") * 100) / 100;
      const site = sites.find(s => s.name === p.site && (!opId || s.operatorId === opId))
        || sites.find(s => s.name === p.site);
      const splitLines = sitePartnerSplitLines.filter(l => l.orderRef === p.id);
      const partners = [];
      let partnerTotal = 0;
      if (splitLines.length) {
        splitLines.forEach(l => {
          const amount = Math.round((l.partnerAmount || 0) * 100) / 100;
          partnerTotal += amount;
          partners.push({
            name: l.partnerName,
            ratePct: l.partnerRatePct,
            amount,
            note: l.splitLabel || ""
          });
        });
      } else if (site) {
        sitePartnerBindingsForSite(site.id, opId).forEach(b => {
          const amount = Math.round(pay * b.ratePct) / 100;
          partnerTotal += amount;
          partners.push({
            name: b.partnerName,
            ratePct: b.ratePct,
            amount,
            note: (b.partnerType === "公司" ? "公司" : "个人") + "合伙人"
          });
        });
      }
      partnerTotal = Math.round(partnerTotal * 100) / 100;
      const operatorAmt = Math.round((pay - platformFee - partnerTotal) * 100) / 100;
      return {
        pay,
        payout: p.payout || "—",
        platformFee,
        platformRateLabel: formatFeeRatePct(feeCfg.cEndRate),
        partners,
        partnerTotal,
        operatorAmt,
        operatorName: p.deviceOwnerName || operatorNameById(opId) || opId || "运营商",
        siteName: p.site || "—"
      };
    }

    function packageSettleSplitHtml(p) {
      const s = packageSettleSplit(p);
      const partnerRows = s.partners.length
        ? s.partners.map(x => `<tr>
            <td>站点合伙人 · ${x.name}</td>
            <td>${x.ratePct}%</td>
            <td><strong>¥${x.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
            <td><small style="color:var(--muted)">${x.note || s.siteName}</small></td>
          </tr>`).join("")
        : `<tr><td>站点合伙人</td><td>—</td><td><strong>¥0.00</strong></td><td><small style="color:var(--muted)">本站未配置合伙人</small></td></tr>`;
      return `<section class="panel" style="margin:16px 0 0">
        ${panelHead("清分分配", `${tag(s.payout)} · 套餐实付 ¥${s.pay.toLocaleString("zh-CN")}`, "payout_pkg")}
        <div class="panel-body" style="padding-top:0">
          <p style="font-size:12px;color:var(--muted);margin:0 0 10px">${noteBtn("payout_pkg")}${noteBtn("site_partner_split")}
            支付成功实时清分：平台 C 端服务费 + 站点合伙人分润 + 运营商净额（吸收尾差）。押金不参与本笔切分。</p>
          <table class="sub-table">
            <thead><tr><th>分账方</th><th>比例/规则</th><th>金额</th><th>说明</th></tr></thead>
            <tbody>
              <tr>
                <td>平台</td>
                <td>C 端 ${s.platformRateLabel}</td>
                <td><strong class="fee-platform">¥${s.platformFee.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small style="color:var(--muted)">技术服务费 · 进平台商户</small></td>
              </tr>
              ${partnerRows}
              <tr>
                <td>运营商 · ${s.operatorName}</td>
                <td>余量</td>
                <td><strong>¥${s.operatorAmt.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small style="color:var(--muted)">进运营商子商户 · 可提现</small></td>
              </tr>
              <tr>
                <td><strong>合计</strong></td>
                <td>—</td>
                <td><strong>¥${s.pay.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                <td><small style="color:var(--muted)">= 平台 + 合伙人 + 运营商</small></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>`;
    }

    function serviceStateCell(p) {
      const s = p.serviceState || p.status;
      if (s === "已冻结") return tag("已冻结");
      if (s === "中途完结" || p.status === "中途完结") return tag("中途完结");
      if (p.status === "退款中" || p.status === "待退款" || p.payout === "待退款") return tag("待退款");
      return tag(s === "服务中" ? "服务中" : s);
    }

    function pkgRefundSection(p) {
      if (!p.refundInfo) return "";
      const r = p.refundInfo;
      return `<section class="panel" style="margin:16px 0 0">
        ${panelHead("中途完结退款", r.refundStatus || "—", "orders_early_end")}
        <div class="panel-body" style="padding-top:0">
          <div class="detail-grid">
            <div class="detail-item"><span>未使用套餐</span><strong>¥${r.unusedService}</strong><br><small style="font-weight:400;color:var(--muted)">${r.unusedFormula || ""}</small></div>
            <div class="detail-item"><span>押金退还</span><strong>¥${r.depositRefund}</strong><br><small style="font-weight:400;color:var(--muted)">${r.depositStatus || ""}</small></div>
            <div class="detail-item"><span>应退合计</span><strong>¥${r.totalRefund}</strong></div>
            <div class="detail-item"><span>已退/待退</span><strong>¥${r.refunded} / ¥${r.pending}</strong></div>
          </div>
        </div>
      </section>`;
    }

    function pkgResumePickupSection(p) {
      if (!p.resumePendingPickup) return "";
      return `<section class="panel" style="margin:16px 0 0">
        ${panelHead("解冻后首服", "待领取电池", "orders_freeze")}
        <div class="panel-body" style="padding-top:0">
          <p style="font-size:13px;margin:0 0 8px">用户已自行解冻，<strong>首次服务须领取电池</strong>（扫码出电，非换电）。领取成功后恢复常规换电。</p>
          ${p.resumePickupNote ? `<p style="font-size:12px;color:var(--muted);margin:0">${p.resumePickupNote}</p>` : ""}
        </div>
      </section>`;
    }

    function pkgFreezeSection(p) {
      if (!p.freezeInfo) return "";
      const f = p.freezeInfo;
      return `<section class="panel" style="margin:16px 0 0">
        ${panelHead("冻结信息", "解冻后可继续使用原套餐", "orders_freeze")}
        <div class="panel-body" style="padding-top:0">
          <div class="detail-grid">
            <div class="detail-item"><span>申请时间</span><strong>${f.applyTime}</strong></div>
            <div class="detail-item"><span>冻结原因</span><strong>${f.reason}</strong></div>
            <div class="detail-item"><span>已冻结</span><strong>${f.frozenDays} 天</strong></div>
            <div class="detail-item"><span>顺延规则</span><strong>${f.resumeNote || "解冻后有效期顺延"}</strong></div>
          </div>
        </div>
      </section>`;
    }

    function pkgUsageText(p) {
      if (p.pkgType === "times") {
        const left = (p.swapLimit || 0) - p.swapUsed;
        return `已用 ${p.swapUsed}/${p.swapLimit} 次 · 剩 ${left} 次`;
      }
      return `期内已换电 ${p.swapUsed} 次`;
    }

    function swapsForPackage(subId) {
      return swapOrders.filter(s => s.subId === subId);
    }

    function swapOrderById(id) {
      return swapOrders.find(s => s.id === id);
    }

    function healthTag(health) {
      if (!health) return "—";
      return health.includes("预警") || health.includes("故障") ? tag(health) : tag(health);
    }

    function swapProgressSteps(s) {
      const doorIn = s.slotIn != null ? s.slotIn : 10;
      const doorOut = s.slotOut != null ? s.slotOut : 7;
      const doneN = s.status === "成功" ? 4 : s.status === "失败" ? 2 : 3;
      return [
        { title: doorIn + "号柜门已打开", hint: "" },
        { title: "请放入电池并关闭柜门", hint: "请务必确认插好电池" },
        { title: doorOut + "号柜门已打开", hint: "" },
        { title: "请取出电池并关闭柜门", hint: "" }
      ].map((step, i) => ({ ...step, done: i < doneN, fail: s.status === "失败" && i === doneN }));
    }

    function renderSwapLogTimeline(s, inline) {
      const steps = swapProgressSteps(s);
      const items = steps.map((st, i) => {
        const cls = ["swap-progress-item", st.done ? "done" : "", st.fail ? "fail" : "", !st.done && !st.fail && i === steps.findIndex(x => !x.done && !x.fail) ? "cur" : ""].filter(Boolean).join(" ");
        return `<div class="${cls}">
          <div class="swap-progress-rail"><span class="swap-progress-dot" aria-hidden="true"></span></div>
          <div class="swap-progress-body">
            <div class="swap-progress-title">${st.title}</div>
            ${st.hint ? `<div class="swap-progress-hint">${st.hint}</div>` : ""}
          </div>
        </div>`;
      }).join("");
      const timeline = `<div class="swap-progress">${items}</div>`;
      if (inline) {
        return `<section class="panel" style="margin:0">
          ${panelHead("换电进度", "骑手端过程步骤 · 与柜门交互一致", "orders_swap_log")}
          <div class="panel-body" style="padding-top:0">${timeline}</div>
        </section>`;
      }
      return `<details class="swap-log" open>
        <summary>换电进度${noteBtn("orders_swap_log")}</summary>
        ${timeline}
      </details>`;
    }

    function isChannelDaySwap(s) {
      return s.entitlementType === "渠道人天" || !!s.poolId;
    }

    function swapEntitlementCell(s, pkgMap) {
      if (isChannelDaySwap(s)) {
        return `<span class="tag warn">渠道人天</span>
          <br><small>${s.channelName || ENT.channel.name}</small>
          <br><small style="color:var(--muted)">${s.poolId || "—"}${s.poolConsume ? " · " + s.poolConsume : ""}</small>`;
      }
      if (pkgMap[s.subId]) {
        return `<span class="tag">个人套餐</span>
          <br><button type="button" class="link-btn" data-open-sub="${s.subId}">${s.subId}</button>`;
      }
      return `<span class="tag risk">个人套餐</span><br><span style="color:var(--red)">未关联套餐</span>`;
    }

    function swapAccrualTableHead() {
      return "<th>应分/消耗</th><th>清分/额度</th>";
    }

    function swapAccrualTableCells(s) {
      if (isChannelDaySwap(s)) {
        if (s.status !== "成功") return "<td>—</td><td>—</td>";
        return `<td>${s.dayQuota || 1} 人天</td><td>${tag(s.poolConsume || "额度消耗")}</td>`;
      }
      if (s.status !== "成功" || s.alloc == null) return "<td>—</td><td>—</td>";
      const total = s.alloc != null ? s.alloc : (s.op || 0);
      return `<td>¥${total}</td><td>${tag(s.accrual)}</td>`;
    }

    function swapTableRow(s, pkgMap) {
      const entCell = swapEntitlementCell(s, pkgMap);
      const cab = s.cabinet || {};
      const cabOnline = cab.online === false ? tag("离线") : "";
      const batIn = s.batIn ? `${s.batIn.sn}<br><small>${s.batIn.soc}% · ${s.batIn.health}</small>` : "—";
      const batOut = s.batOut ? `${s.batOut.sn}<br><small>${s.batOut.soc}% · ${s.batOut.health}</small>` : "—";
      const logN = swapProgressSteps(s).filter(x => x.done).length;
      const statusCell = s.failReason
        ? `${tag(s.status)}<br><small style="color:var(--muted)">${s.failReason}</small>`
        : tag(s.status);
      const t = enrichSwapTriplet(s);
      return `<tr>
        <td><button type="button" class="link-btn" data-open-swap="${s.id}">${s.id}</button></td>
        <td>${entCell}</td>
        <td>${s.user}<br><small style="color:var(--muted)">${s.phone || ""}</small></td>
        <td>${tripletOpCell(t.userOwnerId, t.userOwnerName)}</td>
        <td>${tripletOpCell(t.cabinetOwnerId, t.cabinetOwnerName)}</td>
        <td>${tripletOpCell(t.batteryOwnerId, t.batteryOwnerName)}</td>
        <td>${swapL1FeeCell(s)}</td>
        <td>${s.site}<br><small style="color:var(--muted)">${s.siteId || ""}</small></td>
        <td>${cab.sn || "—"}${cabOnline ? "<br>" + cabOnline : ""}<br><small>${cab.slots || "—"}仓</small></td>
        <td>${s.slotIn != null ? "#" + s.slotIn : "—"}</td><td>${batIn}</td>
        <td>${s.slotOut != null ? "#" + s.slotOut : "—"}</td><td>${batOut}</td>
        <td>${statusCell}</td><td>${s.time}<br><small style="color:var(--muted)">进度 ${logN}/4</small></td>
        ${swapAccrualTableCells(s)}
        <td><button type="button" class="link-btn" data-open-swap="${s.id}">详情</button></td>
      </tr>`;
    }

    function openSwapDetail(swapId) {
      const s = swapOrders.find(x => x.id === swapId);
      if (!s) return;
      const pkg = packageOrders.find(p => p.id === s.subId);
      const cab = s.cabinet || {};
      const subLink = pkg
        ? `<button type="button" class="link-btn" data-open-sub="${s.subId}">${s.subId}</button>`
        : `<span style="color:var(--red)">未关联套餐</span>`;
      state.detailSwapId = swapId;
      state.detailSubId = null;
      state.detailLeaseId = null;
      document.querySelector("#drawerTitle").textContent = "换电订单 · " + s.id;
      document.querySelector("#drawerSub").textContent = `${s.time} · ${s.user} · ${s.status}${s.failReason ? " · " + s.failReason : ""}`;
      const entDetail = isChannelDaySwap(s)
        ? `<div class="detail-item"><span>权益来源</span><strong><span class="tag warn">渠道人天</span><br>
            ${s.channelName || ENT.channel.name} · ${s.poolId || "—"}<br>
            <small style="font-weight:400;color:var(--muted)">${s.poolConsume || "—"}${s.dayQuota ? " · 消耗 " + s.dayQuota + " 人天" : ""}</small></strong></div>
          <div class="detail-item"><span>关联套餐</span><strong>—（非个人套餐）</strong></div>`
        : `<div class="detail-item"><span>权益来源</span><strong><span class="tag">个人套餐</span></strong></div>
          <div class="detail-item"><span>关联套餐</span><strong>${subLink}</strong></div>`;
      document.querySelector("#drawerBody").innerHTML = `
        <div class="detail-grid">
          ${entDetail}
          <div class="detail-item"><span>骑手</span><strong>${s.user}<br><small style="font-weight:400;color:var(--muted)">${s.phone || "—"}</small></strong></div>
          <div class="detail-item"><span>站点</span><strong>${s.site}<br><small style="font-weight:400;color:var(--muted)">${s.siteId || ""} · ${s.city}</small></strong></div>
          <div class="detail-item"><span>换电柜</span><strong>${cab.sn || "—"} · ${cab.slots || "—"}仓<br><small style="font-weight:400">${cab.online === false ? "离线" : "在线"}</small></strong></div>
          <div class="detail-item"><span>还电格口</span><strong>${s.slotIn != null ? "#" + s.slotIn : "—"}</strong></div>
          <div class="detail-item"><span>归还电池</span><strong>${s.batIn ? `${s.batIn.sn} · SOC ${s.batIn.soc}% · ${s.batIn.health}` : "—"}</strong></div>
          <div class="detail-item"><span>换电格口</span><strong>${s.slotOut != null ? "#" + s.slotOut : "—"}</strong></div>
          <div class="detail-item"><span>换出电池</span><strong>${s.batOut ? `${s.batOut.sn} · SOC ${s.batOut.soc}% · ${s.batOut.health}` : "—"}</strong></div>
          <div class="detail-item"><span>订单状态</span><strong>${tag(s.status)}</strong></div>
        </div>
        ${swapTripletDetailHtml(s)}
        ${renderSwapLogTimeline(s, true)}
      `;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function refundProgressMeta(rf) {
      const sc = rf.scId ? serviceChangeRequests.find(x => x.id === rf.scId) : null;
      const batteryOk = rf.status !== "已驳回" || !(rf.rejectReason || "").includes("还电");
      const steps = [
        { key: "apply", label: "用户申请", time: rf.applyTime, state: "done" },
        { key: "battery", label: "还电校验", time: batteryOk ? (sc?.applyTime || rf.applyTime) : null, state: rf.status === "已驳回" && !batteryOk ? "fail" : "done" },
        { key: "audit", label: "运营商审核", time: rf.processedTime && rf.status !== "已退款" ? rf.processedTime : null, state: rf.status === "待审核" ? "cur" : rf.status === "已驳回" ? "fail" : "done" },
        { key: "payout", label: "原路退款", time: rf.status === "已退款" ? rf.processedTime : null, state: rf.status === "已退款" ? "done" : rf.status === "待审核" ? "pending" : rf.status === "已驳回" ? "pending" : "cur" },
        { key: "done", label: "完成", time: rf.status === "已退款" ? rf.processedTime : null, state: rf.status === "已退款" ? "done" : "pending" }
      ];
      if (rf.status === "已驳回" && batteryOk) steps[2].state = "fail";
      if (rf.status === "已退款" && rf.processMode === "auto") steps[2].label = "系统自动审核";
      if (rf.coolingPeriod || rf.type === "冷静期退款") steps[2].label = "运营商审核（冷静期）";
      if (isDepositOnlyRefund(rf)) {
        steps[2].label = rf.status === "已退款" && rf.processMode === "auto" ? "系统自动退押" : "运营商审核（押金退还）";
      }
      return { steps, sc };
    }

    function refundProgressMini(rf) {
      const { steps } = refundProgressMeta(rf);
      return `<div class="refund-steps-mini" title="申请→还电→审核→退款→完成">${steps.map(s =>
        `<i class="${s.state === "done" ? "done" : s.state === "cur" ? "cur" : s.state === "fail" ? "fail" : ""}"></i>`
      ).join("")}</div>`;
    }

    function refundReceiptLines(rf) {
      const payLines = fundReceipts.filter(r => r.order === rf.orderId && r.amount > 0);
      const outLines = fundReceipts.filter(r => r.order === rf.orderId && r.amount < 0);
      const linked = outLines.filter(r => !r.note || r.note.includes(rf.id));
      if (rf.status === "已退款") return payLines.concat(linked.length ? linked : outLines);
      return payLines.concat(linked);
    }

    function refundAccrualLines(rf) {
      return accrualLedger.filter(a => a.order === rf.orderId && (a.type.includes("退款") || rf.status === "已退款"));
    }

    function openUserRefundDetail(rfId) {
      const rf = refundRequests.find(x => x.id === rfId);
      if (!rf) return;
      const { steps, sc } = refundProgressMeta(rf);
      const receipts = refundReceiptLines(rf);
      const accruals = refundAccrualLines(rf);
      const pkg = packageOrders.find(p => p.id === rf.orderId);
      document.querySelector("#drawerTitle").textContent = "退款详情 · " + rf.id;
      document.querySelector("#drawerSub").textContent = `${rf.type} · ${rf.user} · ${tag(rf.status).replace(/<[^>]+>/g, "")}`;
      document.querySelector("#drawerBody").innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><span>退款类型</span><strong>${rf.type}</strong></div>
          <div class="detail-item"><span>用户</span><strong>${rf.user}<br><small>${rf.phone}</small></strong></div>
          <div class="detail-item"><span>站点</span><strong>${rf.site}</strong></div>
          <div class="detail-item"><span>套餐</span><strong>${rf.pkgName}</strong></div>
          <div class="detail-item"><span>应退合计</span><strong>¥${rf.totalRefund}</strong>${rf.coolingPeriod ? `<br><small style="color:var(--muted)">建议套餐退 ¥${rf.suggestedRefund ?? rf.pkgRefund}（已用 ${rf.usedDays ?? "—"} 天）</small>` : ""}</div>
          <div class="detail-item"><span>平台费退还</span><strong>¥${platformFeeRefundOf(rf)}</strong><br><small style="color:var(--muted);font-weight:400">${isDepositOnlyRefund(rf) ? "押金未分账 · 无需冲正" : "按退套餐费比例冲正 C 端 1%"}</small></div>
          ${rf.coolingPeriod ? `<div class="detail-item"><span>冷静期</span><strong>开通后 3 天内 · 剩余 ${rf.coolingDaysLeft ?? "—"} 天</strong></div>` : ""}
          ${rf.operatorNote ? `<div class="detail-item" style="grid-column:1/-1"><span>审核备注</span><strong>${rf.operatorNote}</strong></div>` : ""}
          <div class="detail-item"><span>垫付</span><strong>${rf.needAdvance ? tag("须垫付") + "<br><small>" + (rf.advanceReason || "") + "</small>" : "—"}</strong></div>
          <div class="detail-item"><span>当前状态</span><strong>${tag(rf.status)}</strong></div>
        </div>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("退款进度", rf.status === "已退款" ? "已完成" : rf.status === "已驳回" ? "已终止" : "进行中", "orders_early_end")}
          <div class="panel-body" style="padding-top:0">
            <div class="refund-detail-steps">${steps.map(s => `<div class="rs-item ${s.state}">
              <span class="rs-dot"></span>
              <div><strong>${s.label}</strong>${s.time ? `<br><small style="color:var(--muted)">${s.time}</small>` : ""}${s.state === "fail" && rf.rejectReason ? `<br><small style="color:var(--red)">${rf.rejectReason}</small>` : ""}</div>
            </div>`).join("")}</div>
            ${rf.status === "待审核" && canAuditRefund() ? `<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
              <button type="button" class="btn primary" data-approve-refund="${rf.id}">${isDepositOnlyRefund(rf) ? "确认退押" : rf.coolingPeriod ? "确认退款（可改金额）" : "确认退款"}</button>
              <button type="button" class="btn" data-reject-refund="${rf.id}">驳回</button>
            </div>${isDepositOnlyRefund(rf) ? `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">${noteBtn("deposit_refund_mode")} 仅退押金，套餐继续有效；确认后原路退运营商子商户实收。</p>` : rf.coolingPeriod ? `<p style="font-size:12px;color:var(--muted);margin:8px 0 0">${noteBtn("refund_cooling_period")} 冷静期退款须运营商确认实退金额，系统仅提供建议值。</p>` : ""}` : rf.status === "待审核" ? `<p class="perm-banner" style="margin:12px 0 0">待有「退款确认操作」权限的员工审核</p>` : ""}
          </div>
        </section>
        <section class="panel" style="margin:16px 0 0">
          ${panelHead("关联单据", "服务变更 · 套餐 · 退款", "orders_service_change")}
          <div class="panel-body" style="padding-top:0">
            <table class="sub-table">
              <thead><tr><th>单据类型</th><th>单号</th><th>说明</th><th>操作</th></tr></thead>
              <tbody>
                ${sc ? `<tr><td>服务变更</td><td>${sc.id}</td><td>${sc.detail || "—"}</td><td>—</td></tr>` : ""}
                <tr><td>套餐订单</td><td>${rf.orderId}</td><td>${pkg ? pkg.pkg + " · ¥" + pkg.pay : "—"}</td>
                  <td><button type="button" class="link-btn" data-open-sub="${rf.orderId}">查看</button></td></tr>
                <tr><td>退款单</td><td>${rf.id}</td><td>套餐退 ¥${rf.pkgRefund} · 押金退 ${rf.depositRefund ? "¥" + rf.depositRefund : "—"}</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
        </section>
        <section class="panel" style="margin:0">
          ${panelHead("支付与退款流水", `共 ${receipts.length} 条`, "flows_receipt")}
          <div class="panel-body" style="padding-top:0">
            <table class="sub-table">
              <thead><tr><th>流水号</th><th>类型</th><th>金额</th><th>通道</th><th>时间</th><th>状态</th><th>备注</th></tr></thead>
              <tbody>${receipts.length ? receipts.map(r => `<tr>
                <td>${r.id}</td><td>${tag(r.type)}</td>
                <td><strong style="color:${r.amount < 0 ? "var(--red)" : "inherit"}">¥${r.amount}</strong></td>
                <td>${r.channel}</td><td>${r.time || "—"}</td><td>${tag(r.status)}</td>
                <td style="white-space:normal;max-width:160px"><small>${r.note || "—"}</small></td>
              </tr>`).join("") : "<tr><td colspan='7'>暂无流水</td></tr>"}</tbody>
            </table>
            ${accruals.length ? `<p style="font-size:12px;color:var(--muted);margin:12px 0 4px">清分冲正</p>
            <table class="sub-table"><thead><tr><th>台账</th><th>类型</th><th>变动</th><th>状态</th><th>说明</th></tr></thead>
            <tbody>${accruals.map(a => `<tr><td>${a.id}</td><td>${a.type}</td><td>¥${a.op}</td><td>${tag(a.settle)}</td><td>${a.note}</td></tr>`).join("")}</tbody></table>` : ""}
          </div>
        </section>`;
      state.detailRefundId = rfId;
      state.detailSubId = null;
      state.detailSwapId = null;
      state.detailLeaseId = null;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function openPackageDetail(subId) {
      const p = packageOrders.find(x => x.id === subId);
      if (!p) return;

      document.querySelector("#drawerTitle").textContent = "套餐订单 · " + p.id;
      document.querySelector("#drawerSub").textContent = `${p.pkg} · ${p.user} · ${p.status}`;
      document.querySelector("#drawerBody").innerHTML = `
        <div class="detail-grid">
          <div class="detail-item"><span>设备归属</span><strong>${p.deviceOwnerName || "—"}</strong></div>
          <div class="detail-item"><span>实付金额</span><strong>¥${p.pay}</strong></div>
          <div class="detail-item"><span>收款主体</span><strong>${PAYEE_OPERATOR}</strong></div>
          <div class="detail-item"><span>进件商户</span><strong>${PAYEE_MCH.wx}</strong></div>
          <div class="detail-item"><span>支付时间</span><strong>${p.payTime}</strong></div>
          <div class="detail-item"><span>服务状态</span><strong>${serviceStateCell(p)}</strong></div>
          <div class="detail-item"><span>电池押金</span>${packageDepositDetailHtml(p)}</div>
          <div class="detail-item"><span>购电站点</span><strong>${p.site || "—"}</strong></div>
          <div class="detail-item"><span>有效期起</span><strong>${p.validFrom}</strong></div>
          <div class="detail-item"><span>有效期止</span><strong>${p.validTo}</strong></div>
          ${p.endTime ? `<div class="detail-item"><span>完结时间</span><strong>${p.endTime}</strong></div>` : ""}
          <div class="detail-item"><span>清分状态</span><strong>${tag(p.payout || "—")}</strong></div>
        </div>
        <p style="font-size:12px;color:var(--muted);margin:0 0 12px">
          ${noteBtn("orders_deposit")} ${noteBtn("orders_deposit_waiver")} ${noteBtn("orders_freeze")} ${noteBtn("orders_early_end")}
          ${noteBtn("arch_b")} 支付成功即<strong>实时清分</strong>入账；运营商<strong>提现须平台审核</strong>；中途完结/冻结期间退款按规则冲正。</p>
        ${packageSettleSplitHtml(p)}
        ${pkgFreezeSection(p)}
        ${pkgResumePickupSection(p)}
        ${pkgRefundSection(p)}`;
      state.detailSubId = subId;
      state.detailSwapId = null;
      state.detailLeaseId = null;
      document.querySelector("#drawerMask").classList.add("open");
      document.querySelector("#orderDrawer").classList.add("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "false");
      bindNotes();
      bindDrawerActions();
    }

    function closeDrawer() {
      state.detailSubId = null;
      state.detailSwapId = null;
      state.detailLeaseId = null;
      state.detailOperatorId = null;
      state.detailRefundId = null;
      document.querySelector("#drawerMask").classList.remove("open");
      document.querySelector("#orderDrawer").classList.remove("open");
      document.querySelector("#orderDrawer").setAttribute("aria-hidden", "true");
    }

    function resolveOrderTab() {
      const fromView = { orderPackage: "package", orderSwap: "swap", orderFreeze: "freeze" };
      return fromView[state.view] || state.orderTab || "package";
    }

    function renderOrders() {
      const tab = resolveOrderTab();
      const legacyTabs = state.view === "orders";
      const orderTabDefs = [["package", "套餐购买订单"], ["swap", "换电订单"], ["freeze", "服务冻结"]];
      const orderSidebar = legacyTabs ? tabSidebar(orderTabDefs, tab, "otab") : "";
      const wrapOrderPage = (html) => legacyTabs ? `${pageWithTabs(orderSidebar, html)}` : html;
      if (tab === "package") {
        const rows = filterPackageList(packageOrders.filter(filterOwnRow));
        return `${ownScopeBanner()}${wrapOrderPage(`<section class="panel">
            ${panelHead("套餐购买订单", `共 ${rows.length} 条 · 支持单号/手机/时间筛选`, state.role === "operator" ? "orders_pkg_pay" : "orders_pkg")}
            <div class="panel-body orders-table-wrap">
              ${state.role === "operator" ? flowsArchBanner() : ""}
              <table>
                <thead><tr>
                  <th>套餐单号</th><th>用户</th><th>站点</th><th>套餐</th>
                  <th>押金 ${noteBtn("orders_deposit")}</th><th>服务状态</th><th>有效期</th><th>期内使用</th>
                  <th>累计应分</th><th>分账</th><th>操作</th>
                </tr></thead>
                <tbody>${rows.map(p => `<tr>
                  <td>${p.id}</td>
                  <td>${p.user}<br><small style="color:var(--muted)">${p.phone}</small></td>
                  <td>${p.site}</td>
                  <td>${p.pkg}</td>
                  <td>${depositCell(p)}</td>
                  <td>${serviceStateCell(p)}</td>
                  <td>${p.validFrom}<br><small style="color:var(--muted)">至 ${p.validTo}</small></td>
                  <td>${pkgUsageText(p)}</td>
                  <td>¥${p.accrued || 0}</td>
                  <td>${tag(p.payout || "—")}</td>
                  <td><button type="button" class="link-btn" data-open-sub="${p.id}">详情</button></td>
                </tr>`).join("") || "<tr><td colspan='11'>暂无自有设备订单</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      if (tab === "freeze") {
        const rows = filterServiceChanges(serviceChangeRequests.filter(r => filterOwnRow(r) && (r.type === "冻结" || r.type === "解冻")));
        return `${ownScopeBanner()}${wrapOrderPage(`<section class="panel">
            ${panelHead("服务冻结", `共 ${rows.length} 条 · 冻结/解冻记录`, "orders_freeze")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("orders_freeze")} 个人套餐用户在套餐有效期内且未持电池时，冻结/解冻<strong>满足条件即系统自动生效</strong>（无需运营商审核）。解冻后有效期顺延，<strong>首次服务为领取电池</strong>。本页只读查询。</p>
              <table>
                <thead><tr>
                  <th>记录单</th><th>类型</th><th>套餐单</th><th>用户</th><th>站点</th>
                  <th>时间</th><th>说明</th><th>状态</th><th>操作</th>
                </tr></thead>
                <tbody>${rows.length ? rows.map(sc => {
                  const action = `<button type="button" class="link-btn" data-open-sub="${sc.subId}">查看套餐</button>`;
                  return `<tr>
                    <td>${sc.id}</td>
                    <td>${tag(sc.type)}</td>
                    <td><button type="button" class="link-btn" data-open-sub="${sc.subId}">${sc.subId}</button></td>
                    <td>${sc.user}<br><small>${sc.phone}</small></td>
                    <td>${sc.site}</td>
                    <td>${sc.applyTime}</td>
                    <td style="white-space:normal;max-width:200px">${sc.detail}</td>
                    <td>${tag(sc.status)}</td>
                    <td>${action}</td>
                  </tr>`;
                }).join("") : "<tr><td colspan='9'>暂无冻结/解冻申请</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      if (tab === "service") {
        const rows = filterServiceChanges(serviceChangeRequests.filter(filterOwnRow));
        return `${ownScopeBanner()}${wrapOrderPage(`<section class="panel">
            ${panelHead("服务变更申请", `共 ${rows.length} 条`, "orders_service_change")}
            <div class="panel-body orders-table-wrap">
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">
                ${noteBtn("orders_early_end")} 退还<strong>未使用套餐费</strong>及<strong>电池押金</strong>（免押用户无押金退款项）。
                ${noteBtn("orders_freeze")} 冻结/解冻在个人用户满足条件时<strong>系统自动生效</strong>；解冻后首次服务为<strong>领取电池</strong>。</p>
              <table>
                <thead><tr>
                  <th>申请单</th><th>类型</th><th>套餐单</th><th>用户</th><th>站点</th>
                  <th>申请时间</th><th>说明</th><th>金额</th><th>状态</th><th>操作</th>
                </tr></thead>
                <tbody>${rows.length ? rows.map(sc => {
                  const action = `<button type="button" class="link-btn" data-open-sub="${sc.subId}">查看套餐</button>`;
                  return `<tr>
                    <td>${sc.id}</td>
                    <td>${tag(sc.type)}</td>
                    <td><button type="button" class="link-btn" data-open-sub="${sc.subId}">${sc.subId}</button></td>
                    <td>${sc.user}<br><small>${sc.phone}</small></td>
                    <td>${sc.site}</td>
                    <td>${sc.applyTime}</td>
                    <td style="white-space:normal;max-width:200px">${sc.detail}</td>
                    <td>${sc.amount ? "¥" + sc.amount : "—"}</td>
                    <td>${tag(sc.status)}</td>
                    <td>${action}</td>
                  </tr>`;
                }).join("") : "<tr><td colspan='10'>暂无服务变更申请</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      const rows = filterSwapList(swapOrders.filter(swapVisibleToOperator));
      const pkgMap = Object.fromEntries(packageOrders.map(p => [p.id, p]));
      const colSpan = 17;
      return `${ownScopeBanner()}${wrapOrderPage(`<section class="panel">
          ${panelHead("换电订单", "记录用户/柜机/电池三方运营商归属及 跨网设备服务费", "orders_swap")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("orders_swap_triplet")}${noteBtn("orders_swap_entitlement")} 用户运营商 U 向柜机运营商 C、电池运营商 B 支付设备服务费（C/B 与 U 相同则无该项费用）。</p>
            <table>
              <thead><tr>
                <th>换电单</th><th>权益来源</th><th>用户</th>
                <th>用户运营商</th><th>柜机运营商</th><th>电池运营商</th><th>跨网设备服务费</th>
                <th>站点</th><th>换电柜</th>
                <th>还电</th><th>归还电池</th><th>换电</th><th>换出电池</th><th>状态</th><th>时间</th>
                ${swapAccrualTableHead()}<th>操作</th>
              </tr></thead>
              <tbody>${rows.length ? rows.map(s => swapTableRow(s, pkgMap)).join("") : `<tr><td colspan="${colSpan}">暂无自有设备换电记录</td></tr>`}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function renderRefundManage() {
      const tab = state.refundTab || "queue";
      const settings = myRefundSettings();
      const mode = settings.mode || "manual";
      const allRows = myRefundRequests();
      const rows = filterRefundRequests(allRows);
      const pending = allRows.filter(r => r.status === "待审核").length;
      const advance = allRows.filter(r => r.status === "待审核" && r.needAdvance).length;
      const refundedMonth = allRows.filter(r => r.status === "已退款" && String(r.processedTime || "").startsWith("2026-06")).length;
      const tabDefs = [
        ["queue", "退款申请" + (pending ? " (" + pending + ")" : "")],
        ["settings", "退款设置"]
      ];
      const sidebar = tabSidebar(tabDefs, tab, "refund-tab");
      if (tab === "settings") {
        const autoActive = mode === "auto";
        const depMode = settings.depositRefundMode || "manual";
        const depAuto = depMode === "auto";
        const coolDays = settings.coolingPeriodDays ?? 3;
        return `${ownScopeBanner()}
          <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("refund_manage")}${noteBtn("refund_cooling_period")}${noteBtn("refund_mode_auto")}${noteBtn("refund_mode_manual")}${noteBtn("deposit_refund_mode")}
            套餐退款：<strong>${autoActive ? "自动" : "手动"}</strong> · 押金退还：<strong>${depAuto ? "自动" : "手动"}</strong> · 冷静期 <strong>${coolDays} 天</strong> · 最近更新 ${settings.updatedAt} · ${settings.updatedBy}</div>
          ${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("3 天冷静期", "开通后用户可申请退大部分费用；超过冷静期平台不主动退", "refund_cooling_period")}
            <div class="panel-body">
              <div class="detail-grid">
                <div class="detail-item"><span>冷静期时长</span><strong>${coolDays} 个自然日</strong><br><small style="color:var(--muted)">自支付成功/开通服务起算</small></div>
                <div class="detail-item"><span>审核方式</span><strong>${settings.coolingDefaultAudit !== false ? "须运营商审核" : "可配置"}</strong><br><small style="color:var(--muted)">不受自动退款模式影响</small></div>
                <div class="detail-item"><span>建议应退</span><strong>实付 × 剩余天数 ÷ 总天数</strong><br><small style="color:var(--muted)">押金按还电规则另计</small></div>
                <div class="detail-item"><span>超过冷静期</span><strong>不强制退款</strong><br><small style="color:var(--muted)">平台不主动退还；可走中途完结/SKU 退订</small></div>
              </div>
            </div>
          </section>
          <section class="panel">
            ${panelHead("套餐退款处理模式", "冷静期 / 中途完结 / SKU 退订；切换后对新申请立即生效", "refund_manage")}
            <div class="panel-body">
              <div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px">
                <button type="button" class="btn ${autoActive ? "primary" : ""}" data-refund-mode="auto" style="text-align:left;padding:16px;height:auto">
                  <strong>自动退款</strong>
                  <p style="margin:8px 0 0;font-size:12px;color:var(--muted);font-weight:normal">符合 §5.2.1 SKU 规则且已还电 → 系统自动原路退款。<strong>冷静期申请除外</strong>。</p>
                </button>
                <button type="button" class="btn ${!autoActive ? "primary" : ""}" data-refund-mode="manual" style="text-align:left;padding:16px;height:auto">
                  <strong>手动确认</strong>
                  <p style="margin:8px 0 0;font-size:12px;color:var(--muted);font-weight:normal">套餐类申请进入待审核；确认后<strong>系统自动执行</strong>原路退/垫付记账。</p>
                </button>
              </div>
            </div>
          </section>
          <section class="panel">
            ${panelHead("押金退还处理模式", "仅退电池押金（已还电）；与套餐退款模式独立配置", "deposit_refund_mode")}
            <div class="panel-body">
              <div class="detail-grid" style="grid-template-columns:repeat(2,1fr);gap:14px">
                <button type="button" class="btn ${depAuto ? "primary" : ""}" data-deposit-refund-mode="auto" style="text-align:left;padding:16px;height:auto">
                  <strong>自动退款</strong>
                  <p style="margin:8px 0 0;font-size:12px;color:var(--muted);font-weight:normal">已还电且无争议 → 系统自动原路退<strong>运营商子商户</strong>实收押金；套餐服务继续。</p>
                </button>
                <button type="button" class="btn ${!depAuto ? "primary" : ""}" data-deposit-refund-mode="manual" style="text-align:left;padding:16px;height:auto">
                  <strong>手动确认</strong>
                  <p style="margin:8px 0 0;font-size:12px;color:var(--muted);font-weight:normal">进入待审核；运营商确认后系统执行。演示：绿色出行=手动，陆家嘴=自动。</p>
                </button>
              </div>
              ${!canAuditRefund() ? `<p class="perm-banner" style="margin-top:14px">当前账号仅有查看权限，切换模式需「退款确认操作」权限。</p>` : ""}
              <p style="font-size:12px;color:var(--muted);margin:12px 0 0">${noteBtn("rider_battery_deposit")} 冷静期/中途完结单中的「押金子项」随主单审核，不受本模式单独开关影响。</p>
            </div>
          </section>
          <section class="panel">
            ${panelHead("自动退款适用规则（摘要）", "详见 PRD §5.2.1 与个人套餐定价与退款", "refund_mode_auto")}
            <div class="panel-body">
              <table>
                <thead><tr><th>类型 / SKU</th><th>门槛</th><th>说明</th></tr></thead>
                <tbody>
                  <tr><td><strong>冷静期退款</strong></td><td>开通后 ≤ ${coolDays} 天、已还电</td><td><strong>始终须运营商审核</strong>；实退金额由运营商决定</td></tr>
                  <tr><td>包月 / 7天</td><td>剩余 ≥ 1 天、未持电池</td><td>套餐模式=手动时须人工确认</td></tr>
                  <tr><td>1天 / 单次</td><td>购买后 24h 内、未换电</td><td>套餐模式=手动时须人工确认</td></tr>
                  <tr><td>中途完结</td><td>已还电；退未使用套餐费 + 押金</td><td>超过冷静期后的常规路径</td></tr>
                  <tr><td><strong>押金退还</strong></td><td>已还电、有在押实付</td><td>由「押金退还处理模式」决定自动/手动；不影响套餐有效期</td></tr>
                </tbody>
              </table>
              <p style="font-size:12px;color:var(--muted);margin:12px 0 0">${noteBtn("refund_platform_fee")} 支付渠道<strong>按比例原路退</strong>：退套餐费时平台 C 端 1% <strong>同步冲正退还</strong>（decision-008）。押金不参与清分，退押无平台费冲正。</p>
            </div>
          </section>`)}`;
      }
      const auditPerm = canAuditRefund();
      const depMode = settings.depositRefundMode || "manual";
      return `${ownScopeBanner()}
        <div class="kpi-grid">
          ${kpi("待审核", pending, advance ? advance + " 笔须运营商垫付" : "无待办", "审", "refund_manage")}
          ${kpi("本月已退", refundedMonth, "笔退款已完成", "退", "refund_manage")}
          ${kpi("套餐模式", mode === "auto" ? "自动" : "手动", mode === "auto" ? "合规单可免审" : "确认后系统执行", "套", "refund_mode_" + mode)}
          ${kpi("押金模式", depMode === "auto" ? "自动" : "手动", depMode === "auto" ? "还电后自动退押" : "待审确认后退押", "押", "deposit_refund_mode")}
        </div>
        ${pageWithTabs(sidebar, `<section class="panel">
          ${panelHead("退款申请", `共 ${rows.length} 条 · 套餐 ${mode === "auto" ? "自动" : "手动"} · 押金 ${depMode === "auto" ? "自动" : "手动"}`, "refund_manage")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("refund_manage")}${noteBtn("refund_cooling_period")}${noteBtn("deposit_refund_mode")}${noteBtn("refund_platform_fee")}${noteBtn("orders_early_end")} 含<strong>押金退还</strong>。确认后<strong>运营商子商户原路退</strong>用户；退套餐费时<strong>平台 1% 按比例冲正退还</strong>。</p>
            <table>
              <thead><tr>
                <th>退款单</th><th>类型</th><th>套餐单</th><th>用户</th><th>站点</th>
                <th>应退合计</th><th>退款进度</th><th>状态</th><th>垫付</th>
                <th>申请时间</th><th>处理信息</th><th>操作</th>
              </tr></thead>
              <tbody>${rows.length ? rows.map(r => {
                const auditBtns = r.status === "待审核" && auditPerm
                  ? `<button type="button" class="link-btn" data-approve-refund="${r.id}">确认退款</button>
                     <button type="button" class="link-btn" data-reject-refund="${r.id}">驳回</button>`
                  : r.status === "待审核" ? `<small style="color:var(--muted)">待授权</small>` : "";
                const actions = `<button type="button" class="link-btn" data-open-refund="${r.id}">详情</button>${auditBtns ? " " + auditBtns : ""}`;
                const processInfo = r.status === "已退款"
                  ? `${r.processedTime}<br><small>${r.processedBy}${r.processMode === "auto" ? " · 自动" : " · 手动"}</small>`
                  : r.status === "已驳回"
                    ? `${r.processedTime || "—"}<br><small>${r.rejectReason || "—"}</small>`
                    : "—";
                return `<tr>
                  <td>${r.id}${r.scId ? `<br><small style="color:var(--muted)">${r.scId}</small>` : ""}</td>
                  <td>${tag(r.type)}</td>
                  <td><button type="button" class="link-btn" data-open-sub="${r.orderId}">${r.orderId}</button></td>
                  <td>${r.user}<br><small>${r.phone}</small></td>
                  <td>${r.site}</td>
                  <td><strong>¥${r.totalRefund}</strong><br><small style="color:var(--muted)">套餐 ¥${r.pkgRefund}${r.depositRefund ? " + 押 ¥" + r.depositRefund : ""} · 平台费退还 ¥${platformFeeRefundOf(r)}${r.coolingPeriod ? "<br>建议套餐 ¥" + (r.suggestedRefund ?? r.pkgRefund) + " · 已用 " + (r.usedDays ?? "—") + " 天" : ""}</small></td>
                  <td>${refundProgressMini(r)}</td>
                  <td>${tag(r.status)}</td>
                  <td>${r.needAdvance ? tag("须垫付") : "—"}</td>
                  <td>${r.applyTime}</td>
                  <td style="white-space:normal;max-width:140px">${processInfo}</td>
                  <td style="white-space:normal">${actions}</td>
                </tr>`;
              }).join("") : "<tr><td colspan='12'>暂无退款申请</td></tr>"}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function accrualCols() {
      return "<th>平台 1%</th><th>渠道佣金</th><th>运营商净额</th><th>清分状态</th>";
    }

    function accrualCells(row) {
      const plat = row.platform != null ? `¥${row.platform}` : "—";
      const ch = row.channel != null ? `¥${row.channel}` : "—";
      return `<td>${plat}</td><td>${ch}</td><td>¥${row.op}</td><td>${tag(row.settle)}</td>`;
    }

    function flowsArchBanner() {
      return `<div class="perm-banner">${noteBtn("arch_b")} 支付架构 <strong>B</strong>：C 端骑手资金进入<strong>运营商</strong>进件商户；平台 1% 实时清分。骑士卡渠道开启<strong>佣金及时到付</strong>后，链接购卡佣金同步分账至渠道子商户。
        <br><small style="opacity:.85">${multiPartyCollectionExplore.summary} · 状态：${multiPartyCollectionExplore.status}</small></div>`;
    }

    function renderFlows() {
      const tab = state.flowTab;
      const arch = flowsArchBanner();
      const tabDefs = [["receipt", "资金实收"], ["accrual", "清分明细"], ["payout", "提现申请"]];
      const sidebar = tabSidebar(tabDefs, tab, "ftab");
      if (tab === "payout") {
        const f = getPf();
        const opId = currentEntity().id;
        const cleared = operatorClearedBalance(opId);
        const monthDue = operatorFinanceMonthDue(opId);
        const withdrawable = operatorWithdrawableBalance(opId);
        const withdrawn = operatorWithdrawnTotal(opId);
        const pendingWd = operatorPendingWithdrawTotal(opId);
        const rows = myOperatorWithdrawals().filter(w => {
          if (f.status !== "全部" && w.status !== f.status) return false;
          return true;
        });
        const applyBtn = `<button type="button" class="btn primary" data-apply-withdraw>发起提现申请</button>`;
        return `${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("提现申请", `共 ${rows.length} 条`, "flows_payout", applyBtn)}
            <div class="panel-body">
              ${arch}
              <div class="kpi-grid in-panel" style="margin-bottom:14px">
                ${kpi("已清分", "¥" + cleared.toLocaleString("zh-CN"), "实时入账", "清", "overview_cleared")}
                ${kpi("本月融资待还", "¥" + monthDue.toLocaleString("zh-CN"), "可提现须预留", "还", "finance_repayments")}
                ${kpi("可提现余额", "¥" + withdrawable.toLocaleString("zh-CN"), "已扣待还与待审", "提", "overview_withdrawable")}
                ${kpi("已提现", "¥" + withdrawn.toLocaleString("zh-CN"), pendingWd ? "待审 ¥" + pendingWd : "累计", "出", "flows_payout")}
              </div>
              <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("flows_payout")}${noteBtn("flows_withdraw_apply")} 支付成功即清分；提现须<strong>平台审核</strong>后打款至收款账户默认子商户。</p>
              <div class="orders-table-wrap">
              <table>
                <thead><tr><th>申请单</th><th>金额</th><th>到账账户</th><th>待还预留</th><th>申请时间</th><th>审核</th><th>状态</th><th>到账时间</th></tr></thead>
                <tbody>${rows.map(w => `<tr>
                  <td>${w.id}</td><td><strong>¥${w.amount}</strong></td><td><small>${w.accountLabel}</small></td>
                  <td>${w.monthDueReserved ? "¥" + w.monthDueReserved.toLocaleString("zh-CN") : "—"}</td>
                  <td>${w.applyTime}</td>
                  <td>${w.reviewedBy ? w.reviewedBy + "<br><small>" + (w.reviewTime || "") + "</small>" : "—"}</td>
                  <td>${tag(w.status)}${w.rejectReason ? `<br><small style="color:var(--red)">${w.rejectReason}</small>` : ""}</td>
                  <td>${w.withdrawTime || "—"}</td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无提现申请</td></tr>"}</tbody>
              </table>
              </div>
            </div>
          </section>`)}`;
      }
      if (tab === "accrual") {
        const f = getPf();
        const rows = accrualLedger.filter(filterOwnRow).filter(r => {
          if (!matchKw(r.order, f.orderId)) return false;
          if (f.settle !== "全部" && r.settle !== f.settle) return false;
          return true;
        });
        const hint = "<p style=\"font-size:12px;color:var(--muted);margin:0 0 12px\">" + noteBtn("flows_accrual") + " " + noteBtn("platform_no_share") + " C 端支付成功后实时清分至平台/运营商。</p>";
        return `${pageWithTabs(sidebar, `<section class="panel">
            ${panelHead("清分明细", "支付成功分账明细；退款冲正", "flows_accrual")}
            <div class="panel-body">
              ${arch}
              ${hint}
              <table>
                <thead><tr><th>台账号</th><th>类型</th><th>套餐单</th><th>站点</th>${accrualCols()}<th>说明</th></tr></thead>
                <tbody>${rows.map(r => `<tr>
                  <td>${r.id}</td><td>${r.type}</td><td>${r.order}</td><td>${r.site}</td>
                  ${accrualCells(r)}
                  <td><small style="color:var(--muted)">${r.note || ""}</small></td>
                </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
      }
      const rc = filterFundReceipts(fundReceipts.filter(filterOwnRow));
      const paySum = rc.filter(r => r.type === "套餐支付" && r.status === "成功").reduce((s, r) => s + r.net, 0);
      const refundSum = rc.filter(r => r.type.includes("退款") || r.type.includes("押金")).reduce((s, r) => s + r.net, 0);
      const hint = "<p style=\"font-size:12px;color:var(--muted);margin:0 0 12px\">" + noteBtn("flows_receipt") + " 实收 <strong>¥" + paySum.toFixed(2) + "</strong>，退款出款 <strong>¥" + Math.abs(refundSum).toFixed(2) + "</strong>。</p>";
      return `${ownScopeBanner()}${pageWithTabs(sidebar, `<section class="panel">
          ${panelHead("资金实收", "仅自有设备关联套餐", "flows_receipt")}
          <div class="panel-body">
            ${arch}
            ${hint}
            <table>
              <thead><tr><th>流水号</th><th>类型</th><th>套餐单</th><th>收款主体</th><th>商户号</th><th>用户</th><th>站点</th><th>实收</th><th>手续费</th><th>入账</th><th>通道</th><th>时间</th><th>状态</th></tr></thead>
              <tbody>${rc.map(r => `<tr>
                <td>${r.id}</td><td>${tag(r.type)}</td><td>${r.order}</td>
                <td>${r.payee}</td><td><small style="color:var(--muted)">${r.mch}</small></td>
                <td>${r.user}</td>
                <td>${r.site}</td>
                <td>¥${r.amount}</td><td>¥${Math.abs(r.fee)}</td>
                <td><strong>¥${r.net}</strong></td><td>${r.channel}</td><td>${r.time}</td><td>${tag(r.status)}</td>
              </tr>`).join("") || "<tr><td colspan='13'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`)}`;
    }

    function closeEmployeeForm() {
      state.employeeForm = null;
      document.querySelector("#employeeMask").classList.remove("open");
      document.querySelector("#employeeModal").classList.remove("open");
    }

    function permCheckboxes(selected) {
      const sel = selected || [];
      const perms = EMP_PERMISSIONS;
      return `<div class="perm-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px">
        ${perms.map(p => `<label style="display:flex;align-items:center;gap:6px;font-size:13px">
          <input type="checkbox" name="perm" value="${p.id}" ${sel.includes(p.id) ? "checked" : ""}> ${p.label}
        </label>`).join("")}
      </div>`;
    }

    function openEmployeeForm(mode, roleType, id) {
      const isEdit = mode === "edit";
      const entity = isEdit ? employeeById(id) : {};
      state.employeeForm = { mode, roleType: "staff", id: id || null };
      document.querySelector("#employeeFormTitle").textContent = (isEdit ? "编辑" : "新增") + "运营员工";
      const fields = `
          <label>姓名<input name="name" required value="${entity.name || ""}"></label>
          <label>手机号<input name="phone" value="${entity.phone || ""}"></label>
          <label>岗位<input name="jobTitle" value="${entity.jobTitle || ""}"></label>
          <label>状态<select name="status"><option ${(entity.status || "启用") === "启用" ? "selected" : ""}>启用</option><option ${entity.status === "停用" ? "selected" : ""}>停用</option></select></label>
          <fieldset style="border:0;padding:0;margin:0"><legend style="font-size:13px;color:var(--muted)">功能权限 ${noteBtn("employees_perms")}</legend>${permCheckboxes(entity.permissions)}</fieldset>`;
      document.querySelector("#employeeForm").innerHTML = fields;
      document.querySelector("#employeeMask").classList.add("open");
      document.querySelector("#employeeModal").classList.add("open");
    }

    function saveEmployeeForm() {
      const f = state.employeeForm;
      if (!f) return;
      const fd = new FormData(document.querySelector("#employeeForm"));
      const data = Object.fromEntries(fd.entries());
      const eid = currentEntity().id;
      if (!employeeStore[eid]) employeeStore[eid] = [];
      const isEdit = f.mode === "edit";
      const perms = fd.getAll("perm");
      const row = {
          id: f.id || "EMP-" + Date.now(),
          roleType: "staff",
          name: data.name,
          phone: data.phone,
          jobTitle: data.jobTitle,
          status: data.status,
          permissions: perms
        };
      if (isEdit) {
        const idx = employeeStore[eid].findIndex(x => x.id === f.id);
        if (idx >= 0) employeeStore[eid][idx] = { ...employeeStore[eid][idx], ...row };
      } else {
        employeeStore[eid].push(row);
      }
      closeEmployeeForm();
      render();
    }

    function renderEmployees() {
      if (isStaffLogin() && !employeeHasPerm("employees.view")) {
        return `${ownScopeBanner()}<p class="scope-hint">当前员工账号无「员工管理」权限。</p>`;
      }
      const canEdit = isEntityLogin() || employeeHasPerm("employees.edit");
      const f = getPf();
      const filterRow = (e) => {
        if (e.roleType !== "staff") return false;
        if (!matchKw(e.name, f.keyword) && !matchKw(e.phone || e.contact, f.keyword)) return false;
        if (f.roleType !== "全部" && e.roleType !== f.roleType) return false;
        if (f.status !== "全部" && e.status !== f.status) return false;
        return true;
      };
      const rows = myEmployees().filter(filterRow);
      const staffCount = myStaff().length;

      return `
        ${ownScopeBanner()}
        <div class="kpi-grid">
          ${kpi("运营员工", staffCount, "已配置权限", "员", "employees_panel")}
        </div>
        <section class="panel">
          ${panelHead("员工列表", isLeasingRole() ? "租金催收等运营岗位 · 可配置功能权限" : "辅助日常运营 · 可配置功能权限 · 可登录后台", "employees_panel", canEdit ? `<button type="button" class="btn primary" data-employee-add-staff>新增员工</button>` : "")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>姓名</th><th>手机</th><th>岗位</th><th>权限范围</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(e => `<tr>
                <td><strong>${e.name}</strong><br><small style="color:var(--muted)">${e.id}</small></td>
                <td>${e.phone || "—"}</td>
                <td>${e.jobTitle || "—"}</td>
                <td><small>${(e.permissions || []).slice(0, 4).map(pid => EMP_PERMISSIONS.find(x => x.id === pid)?.label || pid).join("、")}${(e.permissions || []).length > 4 ? "…" : ""}</small></td>
                <td>${tag(e.status)}</td>
                <td class="row-actions">${canEdit ? `<button type="button" class="link-btn" data-employee-edit="${e.id}">编辑</button>` : "—"}</td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无员工</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function appendPoolLedger(pool, type, deltaDays, ref, reason) {
      dayPoolLedger.unshift({
        id: "LG-" + Date.now().toString().slice(-6),
        poolId: pool.id, time: new Date().toISOString().slice(0, 16).replace("T", " "),
        type, deltaDays, balanceAfter: pool.availableDays, operator: "渠道商管理员", ref, reason
      });
    }

    function readPoolPurchasePaymentFromForm() {
      const payChannel = document.querySelector("#poolForm [name=payChannel]")?.value || "offline";
      const payMethod = payChannel === "online"
        ? (document.querySelector("#poolForm [name=onlinePayMethod]")?.value || "微信扫码")
        : (document.querySelector("#poolForm [name=offlinePayMethod]")?.value || "对公转账");
      return {
        payChannel,
        payMethod,
        orderStatus: payChannel === "online" ? "待支付" : "待确认到账",
        payStatus: payChannel === "online" ? "待支付" : "待付款"
      };
    }

    function appendChannelPurchaseOrder(poolId, days, unitPrice, orderNo) {
      const contract = myChannelContracts()[0];
      const sellerId = contract?.operatorId || "OP-SX";
      const channelId = currentEntity().id;
      const existing = poolForChannelSeller(channelId, sellerId);
      const resolvedPoolId = poolId || existing?.id || null;
      const pay = readPoolPurchasePaymentFromForm();
      const amount = Math.round(days * unitPrice * 100) / 100;
      channelSalesOrders.unshift({
        id: orderNo,
        channelId,
        channelName: currentEntity().name,
        operatorId: sellerId,
        operatorName: contract?.operatorName || PAYEE_OPERATOR,
        poolId: resolvedPoolId,
        days, unitPrice, amount,
        ...pay,
        createdAt: new Date().toISOString().slice(0, 19).replace("T", " "),
        payTime: null,
        paymentNo: pay.payChannel === "online" ? "WX-PAY-PENDING-" + Date.now().toString().slice(-4) : null,
        offlineVoucher: pay.payChannel === "offline" ? "已提交采购单" : null,
        confirmedBy: null, confirmedAt: null
      });
      return pay;
    }

    function openPoolForm(mode, poolId, riderId) {
      const pool = poolId ? dayPools.find(p => p.id === poolId) : (selectedDayPool() || myDayPools()[0]);
      const rider = riderId ? dayPoolRiders.find(r => r.id === riderId) : null;
      state.poolForm = { mode, poolId: pool ? pool.id : null, riderId: rider ? rider.id : null };
      const titles = {
        purchase: "购买人天额度", renew: "续费额度池", rule: "新增额度使用规则",
        register: "登记骑手", batchRegister: "批量登记骑手", allocate: "分配人天额度", recover: "收回人天额度", adjust: "额度调整",
        team: "新增骑手团队", teamPool: "设置团队消耗池", leaveTeam: "移出团队"
      };
      document.querySelector("#poolFormTitle").textContent = titles[mode] || "额度池";
      const teamForEdit = (mode === "teamPool" && poolId) ? dayPoolTeams.find(t => t.id === poolId) : null;
      let html = "";
      if (mode === "purchase" || mode === "create") {
        const contract = myChannelContracts()[0];
        const seller = contract ? contract.operatorName : PAYEE_OPERATOR;
        const sellerId = contract?.operatorId || "OP-SX";
        const price = contract ? contract.wholesalePrice : platformAccrualDayPrice();
        const existingPool = isChannelRole()
          ? poolForChannelSeller(currentEntity().id, sellerId)
          : pool;
        const targetPool = existingPool || pool;
        html = `
          ${targetPool ? `<label>入账额度池<input value="${targetPool.id} · ${targetPool.name}（唯一池）" readonly></label>` : `<p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">首单到账后将自动创建额度池，后续增购均入账同一池。</p>`}
          <label>渠道商<input value="${currentEntity().name}" readonly></label>
          <label>售卖方（运营商）<input value="${seller}" readonly></label>
          <label>购买人天数<input type="number" name="totalDays" value="1000" min="1"></label>
          <label>生效日期<input type="date" name="validFrom" value="2026-07-01"></label>
          <label>失效日期<input type="date" name="validTo" value="2027-06-30"></label>
          <label>批发单价（元/人天）<input type="number" name="wholesalePrice" value="${price}" step="0.1" readonly></label>
          <label>采购单号<input name="orderNo" value="PO-202607-NEW"></label>
          <label>支付渠道<select name="payChannel" id="poolPayChannel"><option value="online">在线支付</option><option value="offline">线下打款</option></select></label>
          <label id="poolOnlinePayWrap">在线方式<select name="onlinePayMethod"><option>微信扫码</option><option>支付宝扫码</option></select></label>
          <label id="poolOfflinePayWrap" style="display:none">线下方式<select name="offlinePayMethod"><option>对公转账</option></select></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("day_pool_one_per_operator")} ${noteBtn("day_pool_b2b_settlement")} ${noteBtn("channel_no_receipt")} 多次采购只增加<strong>批发订单</strong>与<strong>额度变动记录</strong>，不新建第二池。</p>
          <label>备注<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">向签约运营商增购人天</textarea></label>`;
      } else if (mode === "renew") {
        html = `
          <label>额度池<input value="${pool ? pool.id + " · " + pool.name : ""}" readonly></label>
          <label>续费人天数<input type="number" name="addDays" value="500" min="1"></label>
          <label>延长失效至<input type="date" name="validTo" value="${pool ? pool.validTo : ""}"></label>
          <label>续费原因<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">余额不足后续费</textarea></label>`;
      } else if (mode === "rule") {
        const teams = myChannelTeams().filter(t => resolveTeamPoolId(t));
        html = `
          <label>团队<select name="teamId" id="ruleTeamSelect">${teams.map(t => `<option value="${t.id}">${t.name}${t.isDefault ? "（默认）" : ""}</option>`).join("")}</select></label>
          <label>消耗额度池<input name="poolDisplay" id="rulePoolDisplay" readonly value="—"></label>
          <input type="hidden" name="poolId" id="rulePoolId" value="">
          <label>规则名称<input name="ruleName" value="新团队规则"></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">扣天/激活口径继承额度池<strong>平台统一四项</strong>（分配即开通），不在规则层配置站点或权益类型。</p>
          <label>团队额度上限（人天/结算周期）<input type="number" name="capDays" value="300"></label>`;
      } else if (mode === "register") {
        const teams = myChannelTeams();
        html = `
          <label>归属渠道商<input value="${currentEntity().name}" readonly></label>
          <label>所属团队<select name="teamId">${teams.map(t => `<option value="${t.id}">${t.name}${t.isDefault ? "（默认）" : ""}</option>`).join("")}</select></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">${noteBtn("day_pool_identity")} 若骑手有<strong>生效中个人套餐</strong>，须先退订或冻结后再登记；不可个人+渠道双身份。</p>
          <label>手机号<input name="phone" placeholder="13800001111"></label>
          <label>姓名<input name="riderName" placeholder="骑手姓名"></label>
          <p style="font-size:12px;color:var(--muted);margin:0">演示：输入 138****1028（张骑手·个人包月）将拦截登记。</p>`;
      } else if (mode === "batchRegister") {
        const teams = myChannelTeams();
        html = `
          <label>所属团队<select name="teamId">${teams.map(t => `<option value="${t.id}">${t.name}${t.isDefault ? "（默认）" : ""}</option>`).join("")}</select></label>
          <label style="grid-column:1/-1">批量数据<textarea name="batchLines" rows="8" placeholder="每行：手机号,姓名&#10;13800001111,张三&#10;13900002222,李四" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius);font-family:monospace;font-size:12px"></textarea></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">支持逗号/制表符分隔；已登记在职或仍有个人套餐的行将记入失败清单。</p>`;
      } else if (mode === "leaveTeam") {
        html = `
          <label>骑手<input value="${rider ? rider.name + " · 剩余 " + (rider.remainingDays || 0) + " 人天" : ""}" readonly></label>
          <label>退出原因<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">渠道商移除出团队</textarea></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">未使用人天将<strong>自动回池</strong>；终止渠道权益，不向骑手退款。</p>`;
      } else if (mode === "allocate") {
        html = `
          <label>额度池<input value="${pool ? pool.id + " · 可用 " + pool.availableDays + " 人天" : ""}" readonly></label>
          <label>骑手<input value="${rider ? rider.name + " · " + rider.id : ""}" readonly></label>
          <label>分配人天数<input type="number" name="days" value="30" min="1" max="${pool ? pool.availableDays : 999}"></label>
          <label>备注<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">分配给骑手换电使用</textarea></label>`;
      } else if (mode === "recover") {
        html = `
          <label>额度池<input value="${pool ? pool.id : ""}" readonly></label>
          <label>骑手<input value="${rider ? rider.name + " · 剩余 " + (rider.remainingDays || 0) + " 人天" : ""}" readonly></label>
          <label>收回人天数<input type="number" name="days" value="${rider ? rider.remainingDays : 0}" min="1" max="${rider ? rider.remainingDays : 0}"></label>
          <label>收回原因<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">手动收回未使用额度</textarea></label>`;
      } else if (mode === "adjust") {
        const recoverWin = pool ? poolExpiredRecoveryWindow(pool) : null;
        html = `
          <label>额度池<input value="${pool ? pool.id + " · " + pool.name + " · 可用 " + pool.availableDays + " 人天" : ""}" readonly></label>
          <input type="hidden" name="poolId" value="${pool ? pool.id : ""}">
          <label>调整类型<select name="adjustType"><option value="充值">充值</option><option value="赠送">赠送</option><option value="退款">退款</option><option value="修正">修正</option>${recoverWin ? `<option value="过期恢复">过期恢复</option>` : ""}</select></label>
          <label>人天数<input type="number" name="adjustDays" value="${recoverWin ? Math.min(100, recoverWin.maxDays) : 100}" min="1" ${recoverWin ? `max="${recoverWin.maxDays}"` : ""}></label>
          ${recoverWin ? `<p style="font-size:12px;color:var(--warn);margin:0;grid-column:1/-1">可恢复过期额度 <strong>${recoverWin.maxDays}</strong> 人天，须在 <strong>${recoverWin.deadline}</strong> 前操作（仅运营商）。</p>` : ""}
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">「退款」「修正」为扣减：填写正数，系统将记为负向变动；扣减后可用余额不得为负。协商退款选「退款」。</p>
          <label>原因/协商单号<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)">线下协商退款，扣减未使用购买额度</textarea></label>`;
      } else if (mode === "team") {
        const multi = myDayPools().length > 1;
        const defPool = defaultChannelPoolId();
        const defP = defPool ? poolById(defPool) : null;
        html = `
          <label>团队名称<input name="teamName" placeholder="如：浦东早班队"></label>
          ${multi ? `<label>消耗额度池<select name="poolId">${myDayPools().map(p => `<option value="${p.id}">${p.name} · ${p.sellerName}</option>`).join("")}</select></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">当前有 <strong>${myDayPools().length}</strong> 个额度池，须指定本团队从哪个池扣减人天。</p>`
            : `<label>消耗额度池<input readonly value="${defP ? defP.name + "（唯一池，自动绑定）" : "—"}"></label><input type="hidden" name="poolId" value="${defPool || ""}">`}
          <label>备注<textarea name="remark" rows="2" style="padding:8px;border:1px solid var(--line);border-radius:var(--radius)"></textarea></label>`;
      } else if (mode === "teamPool" && teamForEdit) {
        html = `
          <label>团队<input readonly value="${teamForEdit.name}${teamForEdit.isDefault ? "（默认团队）" : ""}"></label>
          <input type="hidden" name="teamId" value="${teamForEdit.id}">
          <label>消耗额度池<select name="poolId">${myDayPools().map(p => `<option value="${p.id}"${p.id === resolveTeamPoolId(teamForEdit) ? " selected" : ""}>${p.name} · ${p.sellerName}</option>`).join("")}</select></label>
          <p style="font-size:12px;color:var(--muted);margin:0;grid-column:1/-1">修改后该团队骑手后续预占/消耗从新池扣减；已分配未用人天仍在原池余额。</p>`;
      }
      document.querySelector("#poolForm").innerHTML = html;
      const paySel = document.querySelector("#poolPayChannel");
      const syncPoolPayFields = () => {
        const online = paySel && paySel.value === "online";
        const onWrap = document.querySelector("#poolOnlinePayWrap");
        const offWrap = document.querySelector("#poolOfflinePayWrap");
        if (onWrap) onWrap.style.display = online ? "" : "none";
        if (offWrap) offWrap.style.display = online ? "none" : "";
      };
      if (paySel) { paySel.onchange = syncPoolPayFields; syncPoolPayFields(); }
      const ruleTeamSel = document.querySelector("#ruleTeamSelect");
      const syncRulePoolFromTeam = () => {
        if (!ruleTeamSel) return;
        const team = dayPoolTeams.find(t => t.id === ruleTeamSel.value);
        const pid = team ? resolveTeamPoolId(team) : "";
        const p = poolById(pid);
        const disp = document.querySelector("#rulePoolDisplay");
        const hid = document.querySelector("#rulePoolId");
        if (disp) disp.value = p ? `${p.name}（${p.id}）` : (pid || "—");
        if (hid) hid.value = pid || "";
      };
      if (ruleTeamSel) { ruleTeamSel.onchange = syncRulePoolFromTeam; syncRulePoolFromTeam(); }
      document.querySelector("#poolModal").classList.add("open");
      document.querySelector("#poolMask").classList.add("open");
    }

    function closePoolForm() {
      state.poolForm = null;
      document.querySelector("#poolModal").classList.remove("open");
      document.querySelector("#poolMask").classList.remove("open");
    }

    function savePoolForm() {
      const form = state.poolForm;
      if (!form) return;
      const mode = form.mode;
      const pool = dayPools.find(p => p.id === (form.poolId || state.dayPoolSelectedId)) || selectedDayPool();
      const rider = form.riderId ? dayPoolRiders.find(r => r.id === form.riderId) : null;

      if (mode === "renew" && pool) {
        const add = parseInt(document.querySelector("#poolForm [name=addDays]")?.value || "0", 10);
        pool.availableDays += add;
        pool.totalDays += add;
        pool.balancePct = Math.round(pool.availableDays / pool.totalDays * 1000) / 10;
        if (pool.balancePct >= 20) pool.status = "使用中";
        pool.warnSms = false;
        appendPoolLedger(pool, "续费入账", add, pool.orderNo, document.querySelector("#poolForm [name=remark]")?.value || "续费");
        dayPoolExceptions.filter(e => e.poolId === pool.id && e.type === "预占失败" && e.status === "待重试").forEach(e => {
          e.status = "已自动重试";
          e.retrySource = "续费触发";
        });
      } else if ((mode === "purchase" || mode === "create")) {
        const days = parseInt(document.querySelector("#poolForm [name=totalDays]")?.value || "1000", 10);
        const orderNo = document.querySelector("#poolForm [name=orderNo]")?.value || "PO-NEW";
        const contract = myChannelContracts()[0];
        const sellerId = contract?.operatorId || "OP-SX";
        const existingPool = isChannelRole()
          ? poolForChannelSeller(currentEntity().id, sellerId)
          : (form.poolId ? poolById(form.poolId) : null);
        const price = parseFloat(document.querySelector("#poolForm [name=wholesalePrice]")?.value || String(platformAccrualDayPrice()));
        const pay = appendChannelPurchaseOrder(existingPool?.id || null, days, price, orderNo);
        window.alert(pay.payChannel === "online"
          ? "采购单 " + orderNo + " 已创建，支付成功后入账" + (existingPool ? "池 " + existingPool.id : "（首单将创建唯一额度池）")
          : "采购单 " + orderNo + " 已创建，运营商确认到账后入账" + (existingPool ? "池 " + existingPool.id : "（首单将创建唯一额度池）"));
      } else if (mode === "rule") {
        const teamId = document.querySelector("#poolForm [name=teamId]")?.value;
        const team = dayPoolTeams.find(t => t.id === teamId);
        const poolId = document.querySelector("#poolForm [name=poolId]")?.value || (team ? resolveTeamPoolId(team) : state.dayPoolSelectedId);
        if (!team || !poolId) {
          window.alert("请选择已绑定额度池的团队");
          return;
        }
        dayPoolRules.push({
          id: "RULE-" + Date.now().toString().slice(-4), poolId,
          teamId, teamName: team.name,
          name: document.querySelector("#poolForm [name=ruleName]")?.value || team.name,
          capDays: parseInt(document.querySelector("#poolForm [name=capDays]")?.value || "0", 10),
          status: "启用", validFrom: "2026-06-10", validTo: "2026-12-31", hitRiders: 0
        });
        const p = dayPools.find(x => x.id === poolId);
        if (p && p.status === "待配置") p.status = "使用中";
      } else if (mode === "register") {
        const teamId = document.querySelector("#poolForm [name=teamId]")?.value || "TEAM-DEFAULT";
        const team = dayPoolTeams.find(t => t.id === teamId);
        const phone = document.querySelector("#poolForm [name=phone]")?.value || "";
        if (userHasActivePersonalPackage(phone)) {
          window.alert("该手机号对应骑手仍有生效中个人套餐，请先退订或冻结套餐后再加入渠道团队。");
          return;
        }
        const name = document.querySelector("#poolForm [name=riderName]")?.value || "新骑手";
        const id = "U" + Date.now().toString().slice(-4);
        const poolId = team ? resolveTeamPoolId(team) : (defaultChannelPoolId() || "QP-2601");
        dayPoolRiders.push({
          id, name, phone, teamId, team: team ? team.name : "默认团队", poolId,
          site: document.querySelector("#poolForm [name=site]")?.value || "浦东骑手驿站", city: "上海",
          status: "在职", allocatedDays: 0, usedDays: 0, remainingDays: 0, quotaStatus: "未分配",
          todayEligibility: "未分配", todaySwaps: 0, ruleId: "—"
        });
        if (team) team.riderCount = (team.riderCount || 0) + 1;
      } else if (mode === "batchRegister") {
        const teamId = document.querySelector("#poolForm [name=teamId]")?.value || "TEAM-DEFAULT";
        const team = dayPoolTeams.find(t => t.id === teamId);
        const site = document.querySelector("#poolForm [name=site]")?.value || "浦东骑手驿站";
        const lines = (document.querySelector("#poolForm [name=batchLines]")?.value || "").split(/\n/).map(l => l.trim()).filter(Boolean);
        const results = [];
        lines.forEach((line, i) => {
          const parts = line.split(/[,\t，\s]+/).filter(Boolean);
          const phone = parts[0] || "";
          const name = parts[1] || ("新骑手" + (i + 1));
          if (!phone) {
            results.push({ phone: line, name: "—", ok: false, reason: "格式错误" });
            return;
          }
          if (userHasActivePersonalPackage(phone)) {
            results.push({ phone, name, ok: false, reason: "仍有生效中个人套餐" });
            return;
          }
          if (dayPoolRiders.some(r => r.phone === phone && r.status === "在职")) {
            results.push({ phone, name, ok: false, reason: "已登记在职" });
            return;
          }
          const id = "U" + Date.now().toString().slice(-4) + i;
          const poolId = team ? resolveTeamPoolId(team) : (defaultChannelPoolId() || "QP-2601");
          dayPoolRiders.push({
            id, name, phone, teamId, team: team ? team.name : "默认团队", poolId, site, city: "上海",
            status: "在职", allocatedDays: 0, usedDays: 0, remainingDays: 0, quotaStatus: "未分配",
            todayEligibility: "未分配", todaySwaps: 0, ruleId: "—"
          });
          if (team) team.riderCount = (team.riderCount || 0) + 1;
          results.push({ phone, name, ok: true, reason: "登记成功" });
        });
        const okN = results.filter(r => r.ok).length;
        window.alert("批量登记完成：成功 " + okN + " 条，失败 " + (results.length - okN) + " 条\n\n" +
          results.map(r => (r.ok ? "✓ " : "✗ ") + r.phone + " " + r.name + (r.ok ? "" : " — " + r.reason)).join("\n"));
      } else if (mode === "team") {
        const poolId = document.querySelector("#poolForm [name=poolId]")?.value || defaultChannelPoolId();
        const name = document.querySelector("#poolForm [name=teamName]")?.value || "新团队";
        dayPoolTeams.push({
          id: "TEAM-" + Date.now().toString().slice(-4), channelId: currentEntity().id, name, poolId,
          isDefault: false, riderCount: 0, status: "启用",
          createdAt: new Date().toISOString().slice(0, 10),
          remark: document.querySelector("#poolForm [name=remark]")?.value || ""
        });
        const ch = platformChannels.find(c => c.id === currentEntity().id);
        if (ch) ch.teamCount = (ch.teamCount || 0) + 1;
      } else if (mode === "teamPool") {
        const teamId = document.querySelector("#poolForm [name=teamId]")?.value;
        const team = dayPoolTeams.find(t => t.id === teamId);
        const newPoolId = document.querySelector("#poolForm [name=poolId]")?.value;
        if (team && newPoolId) {
          team.poolId = newPoolId;
          dayPoolRiders.filter(r => r.teamId === teamId && r.status === "在职").forEach(r => { r.poolId = newPoolId; });
        }
      } else if (mode === "leaveTeam" && rider) {
        const team = dayPoolTeams.find(t => t.id === rider.teamId);
        const remark = document.querySelector("#poolForm [name=remark]")?.value || "移出团队";
        recycleChannelRiderToPool(rider, remark, "渠道商管理员");
        rider.status = "已退出";
        if (team && team.riderCount > 0) team.riderCount -= 1;
      } else if (mode === "allocate" && pool && rider) {
        const days = parseInt(document.querySelector("#poolForm [name=days]")?.value || "0", 10);
        if (days > 0 && days <= pool.availableDays) {
          pool.availableDays -= days;
          pool.balancePct = Math.round(pool.availableDays / pool.totalDays * 1000) / 10;
          rider.allocatedDays = (rider.allocatedDays || 0) + days;
          rider.remainingDays = (rider.remainingDays || 0) + days;
          rider.quotaStatus = "使用中";
          rider.todayEligibility = rider.todayEligibility === "预占失败" ? "预占失败" : (rider.todayEligibility === "未分配" ? "已预占" : (rider.todayEligibility || "已预占"));
          appendPoolLedger(pool, "分配出账", -days, rider.id, document.querySelector("#poolForm [name=remark]")?.value || "分配给骑手");
          dayPoolAllocationLogs.unshift({
            id: "AL-" + Date.now().toString().slice(-4), poolId: pool.id, riderId: rider.id, riderName: rider.name,
            type: "分配", days, time: new Date().toISOString().slice(0, 16).replace("T", " "),
            operator: "渠道商管理员", poolBalanceAfter: pool.availableDays,
            remark: document.querySelector("#poolForm [name=remark]")?.value || ""
          });
        }
      } else if (mode === "recover" && pool && rider) {
        const days = Math.min(parseInt(document.querySelector("#poolForm [name=days]")?.value || "0", 10), rider.remainingDays || 0);
        if (days > 0) {
          pool.availableDays += days;
          pool.balancePct = Math.round(pool.availableDays / pool.totalDays * 1000) / 10;
          rider.remainingDays -= days;
          rider.allocatedDays = Math.max(0, (rider.allocatedDays || 0) - days);
          if (rider.remainingDays <= 0) rider.quotaStatus = "已收回";
          appendPoolLedger(pool, "收回入账", days, rider.id, document.querySelector("#poolForm [name=remark]")?.value || "收回至额度池");
          dayPoolAllocationLogs.unshift({
            id: "AL-" + Date.now().toString().slice(-4), poolId: pool.id, riderId: rider.id, riderName: rider.name,
            type: "收回", days, time: new Date().toISOString().slice(0, 16).replace("T", " "),
            operator: "渠道商管理员", poolBalanceAfter: pool.availableDays,
            remark: document.querySelector("#poolForm [name=remark]")?.value || ""
          });
        }
      } else if (mode === "adjust") {
        const poolId = document.querySelector("#poolForm [name=poolId]")?.value || form.poolId;
        const p = dayPools.find(x => x.id === poolId);
        if (p) {
          const adjustType = document.querySelector("#poolForm [name=adjustType]")?.value || "充值";
          const rawDays = parseInt(document.querySelector("#poolForm [name=adjustDays]")?.value || "0", 10);
          const remark = document.querySelector("#poolForm [name=remark]")?.value || "";
          if (adjustType === "过期恢复") {
            const win = poolExpiredRecoveryWindow(p);
            if (!win) {
              window.alert("该池无可恢复过期额度或已超过 30 天恢复期");
              return;
            }
            if (rawDays <= 0 || rawDays > win.maxDays) {
              window.alert("恢复人天数须在 1～" + win.maxDays + " 之间");
              return;
            }
            p.availableDays += rawDays;
            p.totalDays += rawDays;
            p.expiredDays -= rawDays;
            if (p.status === "已过期" && p.availableDays > 0) p.status = "使用中";
            p.balancePct = p.totalDays ? Math.round(p.availableDays / p.totalDays * 1000) / 10 : 0;
            appendPoolLedger(p, "过期恢复", rawDays, remark.slice(0, 20) || "过期恢复", remark);
          } else {
            const isDeduct = adjustType === "退款" || adjustType === "修正";
            const delta = isDeduct ? -rawDays : rawDays;
            if (isDeduct && p.availableDays + delta < 0) {
              window.alert("扣减后可用余额不能为负（当前可用 " + p.availableDays + " 人天）");
              return;
            }
            p.availableDays += delta;
            if (!isDeduct) p.totalDays += rawDays;
            p.balancePct = p.totalDays ? Math.round(p.availableDays / p.totalDays * 1000) / 10 : 0;
            appendPoolLedger(p, adjustType, delta, remark.slice(0, 20) || "协商单", remark);
          }
        }
      }
      state.view = "dayPool";
      render();
      window.alert("演示：已保存（Mock 数据已更新）");
    }

    function retryPoolException(exId) {
      const ex = dayPoolExceptions.find(e => e.id === exId);
      if (!ex) return;
      ex.status = "已重试";
      ex.retrySource = "管理员手动";
      const pool = dayPools.find(p => p.id === ex.poolId);
      if (pool && pool.availableDays >= ex.affected) {
        dayPoolRiders.filter(r => r.todayEligibility === "预占失败" && r.poolId === ex.poolId).forEach(r => {
          r.todayEligibility = "已预占";
          r.failReason = null;
        });
      }
      render();
    }

    function openPricingForm(id) {
      const isNew = !id || id === "new";
      const row = isNew ? null : operatorPkgPrices.find(r => r.id === id);
      if (!isNew && !row) return;
      state.pricingEditId = isNew ? "new" : id;
      const cities = ["上海", "杭州"];
      if (isNew) {
        document.querySelector("#pricingFormTitle").textContent = "新增 SKU · 个人套餐";
        document.querySelector("#pricingForm").innerHTML = `
          <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0">按城市+SKU 统一定价，不绑定站点；1天/单次为渠道兜底必选 SKU。</p>
          <label>城市<select name="city">${cities.map(c => `<option>${c}</option>`).join("")}</select></label>
          <label>套餐 SKU<select name="pkgPreset" id="pricingPkgPreset"></select></label>
          <label>零售价（元）<input name="retailPrice" type="number" min="0.1" step="0.1" value="299" required /></label>
          <label>渠道兜底<select name="channelFallback"><option value="0">否</option><option value="1">是（必选上架）</option></select></label>
          <label>状态<select name="status"><option selected>生效</option><option>停用</option></select></label>`;
        const syncPreset = () => {
          const city = document.querySelector("#pricingForm [name=city]")?.value || "上海";
          const presets = [
            { pkg: "包月30天", pkgType: "monthly", validityHours: null, channelFallback: false, retailPrice: 299 },
            { pkg: "7天套餐", pkgType: "weekly", validityHours: null, channelFallback: false, retailPrice: 89 },
            { pkg: "1天套餐", pkgType: "daily", validityHours: 24, channelFallback: true, retailPrice: 29 },
            { pkg: "单次换电", pkgType: "single", validityHours: 24, channelFallback: true, retailPrice: 9.9 },
            { pkg: "次卡10次", pkgType: "times", validityHours: null, channelFallback: false, retailPrice: 89 },
            { pkg: "30天畅换", pkgType: "monthly", validityHours: null, channelFallback: false, retailPrice: 329 }
          ].filter(p => !operatorPkgPrices.some(r => r.operatorId === currentEntity().id && r.city === city && r.pkg === p.pkg));
          const sel = document.querySelector("#pricingPkgPreset");
          if (!sel) return;
          if (!presets.length) {
            sel.innerHTML = `<option value="">（该城市 SKU 已配齐）</option>`;
            return;
          }
          sel.innerHTML = presets.map(p => `<option value="${p.pkg}" data-type="${p.pkgType}" data-hours="${p.validityHours ?? ""}" data-fallback="${p.channelFallback ? 1 : 0}" data-price="${p.retailPrice}">${p.pkg}</option>`).join("");
          const first = presets[0];
          document.querySelector("#pricingForm [name=retailPrice]").value = first.retailPrice;
          document.querySelector("#pricingForm [name=channelFallback]").value = first.channelFallback ? "1" : "0";
        };
        syncPreset();
        document.querySelector("#pricingForm [name=city]")?.addEventListener("change", syncPreset);
        document.querySelector("#pricingPkgPreset")?.addEventListener("change", e => {
          const opt = e.target.selectedOptions[0];
          if (!opt?.dataset.price) return;
          document.querySelector("#pricingForm [name=retailPrice]").value = opt.dataset.price;
          document.querySelector("#pricingForm [name=channelFallback]").value = opt.dataset.fallback || "0";
        });
      } else {
        document.querySelector("#pricingFormTitle").textContent = "编辑零售价 · " + row.pkg;
        document.querySelector("#pricingForm").innerHTML = `
          <label>城市<input name="city" value="${row.city}" readonly /></label>
          <label>套餐<input name="pkg" value="${row.pkg}" readonly /></label>
          <label>零售价（元）<input name="retailPrice" type="number" min="0.1" step="0.1" value="${row.retailPrice}" required /></label>
          <label>渠道兜底<input value="${row.channelFallback ? "是（必选）" : "否"}" readonly /></label>
          <label>状态<select name="status"><option ${row.status === "生效" ? "selected" : ""}>生效</option><option ${row.status === "停用" ? "selected" : ""}>停用</option></select></label>`;
      }
      document.querySelector("#pricingModal").classList.add("open");
      document.querySelector("#pricingMask").classList.add("open");
    }

    function closePricingForm() {
      state.pricingEditId = null;
      document.querySelector("#pricingModal").classList.remove("open");
      document.querySelector("#pricingMask").classList.remove("open");
    }

    function savePricingForm() {
      const form = document.querySelector("#pricingForm");
      const retailPrice = parseFloat(form.querySelector("[name=retailPrice]")?.value);
      const status = form.querySelector("[name=status]")?.value || "生效";
      if (!Number.isFinite(retailPrice) || retailPrice <= 0) {
        window.alert("请填写有效零售价");
        return;
      }
      if (state.pricingEditId === "new") {
        const city = form.querySelector("[name=city]")?.value || "上海";
        const opt = form.querySelector("[name=pkgPreset]")?.selectedOptions[0];
        const pkg = opt?.value;
        if (!pkg) {
          window.alert("请选择套餐 SKU，或该城市已无可用 SKU 模板");
          return;
        }
        if (operatorPkgPrices.some(r => r.operatorId === currentEntity().id && r.city === city && r.pkg === pkg)) {
          window.alert("该城市已存在同名 SKU");
          return;
        }
        const id = "OP-P-" + String(Date.now()).slice(-6);
        operatorPkgPrices.push({
          id,
          operatorId: currentEntity().id,
          city,
          pkg,
          pkgType: opt.dataset.type || "monthly",
          validityHours: opt.dataset.hours ? parseInt(opt.dataset.hours, 10) : null,
          channelFallback: form.querySelector("[name=channelFallback]")?.value === "1",
          retailPrice,
          status,
          updatedAt: new Date().toISOString().slice(0, 10)
        });
        closePricingForm();
        state.view = "pricing";
        state.pricingTab = "pkg";
        render();
        window.alert("演示：SKU 已新增（仅本地 Mock）");
        return;
      }
      const row = operatorPkgPrices.find(r => r.id === state.pricingEditId);
      if (!row) return;
      row.retailPrice = retailPrice;
      row.status = status;
      row.updatedAt = new Date().toISOString().slice(0, 10);
      closePricingForm();
      state.view = "pricing";
      render();
      window.alert("演示：零售价已更新（仅本地 Mock）");
    }

    function cardPricingContracts() {
      return myChannelContracts().filter(c => contractSettlementMode(c) === "卡差价");
    }

    function openCardPricingForm(id) {
      const isNew = !id || id === "new";
      const sku = isNew ? null : channelSalePackages.find(s => s.id === id);
      if (!isNew && !sku) return;
      state.cardPricingEditId = isNew ? "new" : id;
      const contracts = cardPricingContracts();
      const pkgRows = operatorPkgPrices.filter(r => r.operatorId === currentEntity().id && r.status === "生效");
      if (isNew) {
        if (!contracts.length) {
          window.alert("请先在「渠道管理 → 签约渠道」新增卡差价签约");
          return;
        }
        document.querySelector("#cardPricingFormTitle").textContent = "新增渠道分销价";
        document.querySelector("#cardPricingForm").innerHTML = `
          <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0">基于个人套餐 SKU 为分销渠道配置正式价、专享价与佣金；专享价须 ≤ 正式价。</p>
          <label>渠道商<select name="channelId" required>${contracts.map(c => `<option value="${c.channelId}">${c.channelName}</option>`).join("")}</select></label>
          <label>关联 SKU<select name="basePkg" id="cardPricingBasePkg">${pkgRows.map(p => `<option value="${p.id}" data-price="${p.retailPrice}" data-name="${p.pkg}">${p.city} · ${p.pkg}（零售 ¥${p.retailPrice}）</option>`).join("")}</select></label>
          <label>正式零售价（元）<input name="officialPrice" type="number" min="0.1" step="0.1" value="${pkgRows[0]?.retailPrice ?? 299}" required /></label>
          <label>渠道专享价（元）<input name="channelPrice" type="number" min="0.1" step="0.1" value="${Math.max(1, (pkgRows[0]?.retailPrice ?? 299) - 20)}" required /></label>
          <label>佣金/单（元）<input name="commissionPerOrder" type="number" min="0" step="0.1" value="25" required /></label>
          <label>状态<select name="status"><option selected>启用</option><option>停用</option></select></label>`;
        document.querySelector("#cardPricingBasePkg")?.addEventListener("change", e => {
          const opt = e.target.selectedOptions[0];
          const price = parseFloat(opt?.dataset.price || "0");
          if (!Number.isFinite(price)) return;
          document.querySelector("#cardPricingForm [name=officialPrice]").value = price;
          document.querySelector("#cardPricingForm [name=channelPrice]").value = Math.max(0.1, price - 20);
        });
      } else {
        const contract = channelContracts.find(c => c.channelId === sku.channelId);
        document.querySelector("#cardPricingFormTitle").textContent = "编辑分销价 · " + sku.name;
        document.querySelector("#cardPricingForm").innerHTML = `
          <label>渠道商<input value="${contract?.channelName || sku.channelId}" readonly /></label>
          <label>SKU<input value="${sku.name}" readonly /></label>
          <label>正式零售价（元）<input name="officialPrice" type="number" min="0.1" step="0.1" value="${sku.officialPrice}" required /></label>
          <label>渠道专享价（元）<input name="channelPrice" type="number" min="0.1" step="0.1" value="${sku.channelPrice}" required /></label>
          <label>佣金/单（元）<input name="commissionPerOrder" type="number" min="0" step="0.1" value="${sku.commissionPerOrder}" required /></label>
          <label>状态<select name="status"><option ${sku.status === "启用" ? "selected" : ""}>启用</option><option ${sku.status === "停用" ? "selected" : ""}>停用</option></select></label>`;
      }
      document.querySelector("#cardPricingModal").classList.add("open");
      document.querySelector("#cardPricingMask").classList.add("open");
    }

    function closeCardPricingForm() {
      state.cardPricingEditId = null;
      document.querySelector("#cardPricingModal").classList.remove("open");
      document.querySelector("#cardPricingMask").classList.remove("open");
    }

    function saveCardPricingForm() {
      const form = document.querySelector("#cardPricingForm");
      const officialPrice = parseFloat(form.querySelector("[name=officialPrice]")?.value);
      const channelPrice = parseFloat(form.querySelector("[name=channelPrice]")?.value);
      const commissionPerOrder = parseFloat(form.querySelector("[name=commissionPerOrder]")?.value);
      const status = form.querySelector("[name=status]")?.value || "启用";
      if (!Number.isFinite(officialPrice) || !Number.isFinite(channelPrice) || !Number.isFinite(commissionPerOrder)) {
        window.alert("请填写完整价格");
        return;
      }
      if (channelPrice > officialPrice) {
        window.alert("渠道专享价不能高于正式零售价");
        return;
      }
      if (state.cardPricingEditId === "new") {
        const channelId = form.querySelector("[name=channelId]")?.value;
        const baseId = form.querySelector("[name=basePkg]")?.value;
        const base = operatorPkgPrices.find(p => p.id === baseId);
        if (!channelId || !base) {
          window.alert("请选择渠道与 SKU");
          return;
        }
        if (channelSalePackages.some(s => s.channelId === channelId && s.name === base.pkg)) {
          window.alert("该渠道已配置此 SKU 分销价");
          return;
        }
        const suffix = String(Date.now()).slice(-4);
        channelSalePackages.push({
          id: "PKG-" + channelId.replace(/-/g, "") + suffix,
          channelId,
          skuId: "SKU-" + channelId.slice(-4) + "-" + suffix,
          name: base.pkg,
          officialPrice,
          channelPrice,
          commissionPerOrder,
          validityDays: base.pkgType === "weekly" ? 7 : base.pkgType === "daily" || base.pkgType === "single" ? 1 : 30,
          status
        });
        closeCardPricingForm();
        state.view = "pricing";
        state.pricingTab = "card";
        render();
        window.alert("演示：渠道分销价已新增（仅本地 Mock）");
        return;
      }
      const sku = channelSalePackages.find(s => s.id === state.cardPricingEditId);
      if (!sku) return;
      sku.officialPrice = officialPrice;
      sku.channelPrice = channelPrice;
      sku.commissionPerOrder = commissionPerOrder;
      sku.status = status;
      closeCardPricingForm();
      state.view = "pricing";
      state.pricingTab = "card";
      render();
      window.alert("演示：渠道分销价已更新（仅本地 Mock）");
    }

    function operatorQuotaRows() {
      return operatorDayQuotaPrices.filter(r => r.operatorId === currentEntity().id);
    }

    function defaultQuotaRow() {
      return operatorQuotaRows().find(r => r.channelId === "*");
    }

    function dayPoolContractsWithoutQuota() {
      return dayPoolContractsForQuota().filter(c => !quotaPriceForChannel(c.channelId));
    }

    function dayPoolContractsForQuota() {
      return myChannelContracts().filter(c => contractSettlementMode(c) === "人天池");
    }

    function quotaPriceForChannel(channelId) {
      return operatorDayQuotaPrices.find(q => q.operatorId === currentEntity().id && q.channelId === channelId);
    }

    function syncQuotaNewFormState() {
      const form = document.querySelector("#quotaPricingForm");
      const saveBtn = document.querySelector("#saveQuotaPricingForm");
      if (!form) return;
      const sel = form.querySelector("[name=channelId]");
      const canSave = sel && sel.selectedOptions[0] && sel.selectedOptions[0].dataset.configured !== "1";
      form.querySelectorAll("[name=wholesalePrice],[name=minDays],[name=validTo],[name=status]").forEach(el => {
        el.disabled = !canSave;
      });
      if (saveBtn) saveBtn.disabled = !canSave;
    }

    function bindQuotaNewFormHandlers() {
      const form = document.querySelector("#quotaPricingForm");
      const sel = form?.querySelector("[name=channelId]");
      if (!sel) return;
      sel.onchange = () => {
        const opt = sel.selectedOptions[0];
        const to = form.querySelector("[name=validTo]");
        const wp = form.querySelector("[name=wholesalePrice]");
        const md = form.querySelector("[name=minDays]");
        if (opt?.dataset.configured === "1") {
          if (wp) wp.value = opt.dataset.price || platformAccrualDayPrice();
          if (md) md.value = opt.dataset.mindays || "500";
          if (to && opt.dataset.to) to.value = opt.dataset.to;
        } else if (opt) {
          if (to && opt.dataset.to) to.value = opt.dataset.to;
          if (wp) wp.value = platformAccrualDayPrice();
          if (md) md.value = opt.dataset.mindays || "500";
        }
        syncQuotaNewFormState();
      };
    }

    function openQuotaPricingForm(id) {
      const isNew = !id || id === "new";
      const row = isNew ? null : operatorDayQuotaPrices.find(r => r.id === id);
      if (!isNew && !row) return;
      state.quotaPricingEditId = isNew ? "new" : id;
      const std = platformAccrualDayPrice();
      const saveBtn = document.querySelector("#saveQuotaPricingForm");
      if (isNew) {
        const contracts = dayPoolContractsForQuota();
        const pending = dayPoolContractsWithoutQuota();
        document.querySelector("#quotaPricingFormTitle").textContent = "新增渠道批发价";
        if (!contracts.length) {
          document.querySelector("#quotaPricingForm").innerHTML = `
            <p style="grid-column:1/-1;font-size:13px;color:var(--muted);margin:0">暂无人天池签约渠道。请先在「渠道管理 → 签约渠道」新增<strong>人天池</strong>签约后再配置批发价。</p>
            <p style="grid-column:1/-1;font-size:12px;color:var(--muted);margin:8px 0 0">签约完成后，可在此为人天池渠道单独设定批发单价与最低起购量；未单独定价时继承「默认批发价」。</p>`;
          if (saveBtn) saveBtn.disabled = true;
        } else {
          const options = contracts.map(c => {
            const q = quotaPriceForChannel(c.channelId);
            if (q) {
              return `<option value="${c.channelId}" disabled data-configured="1" data-name="${c.channelName}" data-price="${q.wholesalePrice}" data-mindays="${q.minDays}" data-to="${q.validTo || c.validTo}">${c.channelName}（已配置 · ¥${q.wholesalePrice}/人天）</option>`;
            }
            return `<option value="${c.channelId}" data-configured="0" data-name="${c.channelName}" data-to="${c.validTo}" data-mindays="${c.minDays || 500}">${c.channelName}（待配置）</option>`;
          }).join("");
          const hint = pending.length
            ? `共 ${contracts.length} 家人天池签约渠道，<strong>${pending.length}</strong> 家待配置批发价。`
            : `<span style="color:var(--warn)">所有人天池签约渠道均已配置批发价</span>；可在列表中「编辑」修改，或至「渠道管理」新增签约后再配置。`;
          const firstPending = pending[0];
          document.querySelector("#quotaPricingForm").innerHTML = `
            <p style="grid-column:1/-1;font-size:12px;color:var(--muted);margin:0">${hint}</p>
            <label style="grid-column:1/-1">渠道商<select name="channelId">${options}</select></label>
            <label>平台标准价（只读）<input value="¥${std}/人天" readonly /></label>
            <label>我的批发价（元/人天）<input name="wholesalePrice" type="number" min="0.1" step="0.1" value="${firstPending ? std : (quotaPriceForChannel(contracts[0].channelId)?.wholesalePrice || std)}" required /></label>
            <label>最低起购（人天）<input name="minDays" type="number" min="1" step="1" value="${firstPending?.minDays || contracts[0]?.minDays || 500}" required /></label>
            <label>有效期至<input name="validTo" type="date" value="${firstPending?.validTo || contracts[0]?.validTo || "2026-12-31"}" required /></label>
            <label>状态<select name="status"><option selected>生效</option><option>停用</option></select></label>`;
          const sel = document.querySelector("#quotaPricingForm [name=channelId]");
          if (firstPending) sel.value = firstPending.channelId;
          bindQuotaNewFormHandlers();
          syncQuotaNewFormState();
        }
      } else if (row.channelId === "*") {
        if (saveBtn) saveBtn.disabled = false;
        document.querySelector("#quotaPricingFormTitle").textContent = "设置默认批发价（无渠道）";
        document.querySelector("#quotaPricingForm").innerHTML = `
          <p class="form-span-2" style="font-size:12px;color:var(--muted);margin:0"><strong>无渠道默认价</strong>：新建人天池签约未单独定价时继承此批发价与最低起购；已有签约渠道以各自合同价为准。</p>
          <label>适用范围<input value="默认批发价（无指定渠道）" readonly /></label>
          <label>平台标准价（只读）<input value="¥${std}/人天" readonly /></label>
          <label>我的批发价（元/人天）<input name="wholesalePrice" type="number" min="0.1" step="0.1" value="${row.wholesalePrice}" required /></label>
          <label>最低起购（人天）<input name="minDays" type="number" min="1" step="1" value="${row.minDays}" required /></label>
          <label>有效期至<input name="validTo" type="date" value="${row.validTo}" required /></label>
          <label>状态<select name="status"><option ${row.status === "生效" ? "selected" : ""}>生效</option><option ${row.status === "停用" ? "selected" : ""}>停用</option></select></label>`;
      } else {
        if (saveBtn) saveBtn.disabled = false;
        document.querySelector("#quotaPricingFormTitle").textContent = "编辑渠道批发价 · " + row.channelName;
        document.querySelector("#quotaPricingForm").innerHTML = `
          <label>渠道商<input value="${row.channelName}" readonly /></label>
          <label>平台标准价（只读）<input value="¥${std}/人天" readonly /></label>
          <label>我的批发价（元/人天）<input name="wholesalePrice" type="number" min="0.1" step="0.1" value="${row.wholesalePrice}" required /></label>
          <label>最低起购（人天）<input name="minDays" type="number" min="1" step="1" value="${row.minDays}" required /></label>
          <label>有效期至<input name="validTo" type="date" value="${row.validTo}" required /></label>
          <label>状态<select name="status"><option ${row.status === "生效" ? "selected" : ""}>生效</option><option ${row.status === "停用" ? "selected" : ""}>停用</option></select></label>`;
      }
      document.querySelector("#quotaPricingModal").classList.add("open");
      document.querySelector("#quotaPricingMask").classList.add("open");
    }

    function closeQuotaPricingForm() {
      state.quotaPricingEditId = null;
      const saveBtn = document.querySelector("#saveQuotaPricingForm");
      if (saveBtn) saveBtn.disabled = false;
      document.querySelector("#quotaPricingModal").classList.remove("open");
      document.querySelector("#quotaPricingMask").classList.remove("open");
    }

    function saveQuotaPricingForm() {
      const form = document.querySelector("#quotaPricingForm");
      const wholesalePrice = parseFloat(form.querySelector("[name=wholesalePrice]")?.value);
      const minDays = parseInt(form.querySelector("[name=minDays]")?.value, 10);
      const validTo = form.querySelector("[name=validTo]")?.value;
      const status = form.querySelector("[name=status]")?.value || "生效";
      if (!Number.isFinite(wholesalePrice) || wholesalePrice <= 0 || !Number.isFinite(minDays) || minDays < 1 || !validTo) {
        window.alert("请填写完整有效参数");
        return;
      }
      const opId = currentEntity().id;
      if (state.quotaPricingEditId === "new") {
        const channelSel = form.querySelector("[name=channelId]");
        const opt = channelSel?.selectedOptions[0];
        if (!channelSel) {
          window.alert("暂无人天池签约渠道");
          return;
        }
        if (opt?.dataset.configured === "1" || opt?.disabled) {
          window.alert("该渠道已配置批发价，请关闭弹窗后在列表中点击「编辑」修改");
          return;
        }
        const channelId = channelSel.value;
        const channelName = opt?.dataset.name || channelId;
        if (!channelId) return;
        operatorDayQuotaPrices.push({
          id: "OP-Q-" + String(Date.now()).slice(-6),
          operatorId: opId, channelId, channelName,
          wholesalePrice, minDays, status, validTo
        });
        const contract = channelContracts.find(c => c.operatorId === opId && c.channelId === channelId);
        if (contract) {
          contract.wholesalePrice = wholesalePrice;
          contract.minDays = minDays;
          contract.validTo = validTo;
        }
        closeQuotaPricingForm();
        state.view = "pricing";
        state.pricingTab = "quota";
        render();
        window.alert("演示：渠道批发价已新增（仅本地 Mock）");
        return;
      }
      const row = operatorDayQuotaPrices.find(r => r.id === state.quotaPricingEditId);
      if (!row) return;
      row.wholesalePrice = wholesalePrice;
      row.minDays = minDays;
      row.validTo = validTo;
      row.status = status;
      if (row.channelId !== "*") {
        const contract = channelContracts.find(c => c.operatorId === opId && c.channelId === row.channelId);
        if (contract) {
          contract.wholesalePrice = wholesalePrice;
          contract.minDays = minDays;
          contract.validTo = validTo;
        }
      }
      closeQuotaPricingForm();
      state.view = "pricing";
      state.pricingTab = "quota";
      render();
      window.alert(row.channelId === "*" ? "演示：默认批发价已更新（仅本地 Mock）" : "演示：渠道批发价已更新（仅本地 Mock）");
    }

    function renderPricing() {
      const tab = state.pricingTab;
      let body = "";
      if (tab === "pkg") {
        const rows = operatorPkgPrices.filter(r => r.operatorId === currentEntity().id);
        const depCfg = myPersonalDepositSettings();
        body = `<section class="panel">
          ${panelHead("个人套餐零售价", "按城市+SKU 统一定价，<strong>不绑定站点</strong>；须保留<strong>1天+单次</strong>渠道兜底 SKU", "pricing_pkg", `<button type="button" class="btn primary" data-new-pricing-sku>+ 新增 SKU</button>`)}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("pricing_deposit")} 个人用户信用不足须实缴电池押金 <strong>¥${depCfg.amount}</strong>（「押金设置」可改）；免押达标则实收 ¥0。</p>
            <table>
              <thead><tr><th>城市</th><th>套餐</th><th>有效期</th><th>渠道兜底</th><th>零售价</th><th>状态</th><th>更新时间</th><th>操作</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.city}</td><td>${r.pkg}</td>
                <td>${r.validityHours ? r.validityHours + "h" : "按 SKU"}</td>
                <td>${r.channelFallback ? tag("必选") : "—"}</td>
                <td>¥${r.retailPrice}</td><td>${tag(r.status)}</td><td>${r.updatedAt}</td>
                <td><button type="button" class="link-btn" data-edit-pricing="${r.id}">编辑</button></td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "deposit") {
        const cfg = myPersonalDepositSettings();
        body = `<section class="panel">
          ${panelHead("押金设置", "个人套餐 · 信用不足须缴纳的电池押金数额", "pricing_deposit")}
          <div class="panel-body">
            <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("pricing_deposit")}${noteBtn("rider_battery_deposit")}${noteBtn("orders_deposit_waiver")}
              适用对象：<strong>个人套餐用户</strong> · 信用免押失败时实缴 · 购套餐<strong>同笔支付</strong>进运营商子商户 · 不参与清分</div>
            <div class="detail-grid" style="margin-bottom:16px">
              <div class="detail-item"><span>适用用户</span><strong>个人套餐</strong><br><small style="color:var(--muted)">渠道人天 / 设备租赁白名单不适用</small></div>
              <div class="detail-item"><span>触发条件</span><strong>信用不足不免押</strong><br><small style="color:var(--muted)">芝麻 / 微信支付分等未达标</small></div>
              <div class="detail-item"><span>免押达标</span><strong>实收 ¥0</strong><br><small style="color:var(--muted)">仍须遵守还电与退押规则</small></div>
              <div class="detail-item"><span>最近更新</span><strong>${cfg.updatedAt || "—"}</strong><br><small style="color:var(--muted)">${cfg.updatedBy || "—"}</small></div>
            </div>
            <form id="personalDepositForm" class="detail-grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;align-items:end">
              <label style="display:flex;flex-direction:column;gap:6px;font-size:13px">
                <span>电池押金数额（元）</span>
                <input name="amount" type="number" min="0" step="1" required value="${cfg.amount}" style="height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">
              </label>
              <label style="display:flex;flex-direction:column;gap:6px;font-size:13px">
                <span>启用实缴押金</span>
                <select name="enabled" style="height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">
                  <option value="1" ${cfg.enabled !== false ? "selected" : ""}>启用（信用不足须缴）</option>
                  <option value="0" ${cfg.enabled === false ? "selected" : ""}>关闭（本运营商暂不收个人押金）</option>
                </select>
              </label>
              <label class="form-span-2" style="display:flex;flex-direction:column;gap:6px;font-size:13px;grid-column:1/-1">
                <span>说明（对内）</span>
                <input name="note" value="${(cfg.note || "").replace(/"/g, "&quot;")}" placeholder="可选" style="height:36px;padding:0 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface)">
              </label>
              <div style="grid-column:1/-1;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                <button type="submit" class="btn primary" data-save-personal-deposit>保存押金设置</button>
                <small style="color:var(--muted)">[假设] 保存后对新购套餐立即生效；在途订单沿用下单时数额</small>
              </div>
            </form>
            <table style="margin-top:20px">
              <thead><tr><th>场景</th><th>用户动作</th><th>押金应收</th></tr></thead>
              <tbody>
                <tr><td>信用达标（免押）</td><td>购个人套餐</td><td><strong>¥0</strong>（信用免押）</td></tr>
                <tr><td>信用不足</td><td>购个人套餐</td><td><strong>¥${cfg.enabled === false ? 0 : cfg.amount}</strong>（实付 · 同笔）</td></tr>
                <tr><td>渠道人天 / 租赁白名单</td><td>开服务</td><td>不适用 · 渠道担保</td></tr>
              </tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "quota") {
        const rows = operatorQuotaRows();
        const std = platformAccrualDayPrice();
        const def = defaultQuotaRow();
        const quotaActions = def
          ? `<button type="button" class="btn" data-edit-quota-pricing="${def.id}">设置默认批发价</button><button type="button" class="btn primary" data-new-quota-pricing>+ 新增渠道批发价</button>`
          : `<button type="button" class="btn primary" data-new-quota-default>+ 设置默认批发价</button><button type="button" class="btn primary" data-new-quota-pricing>+ 新增渠道批发价</button>`;
        body = `<section class="panel">
          ${panelHead("人天批发价", "默认价供无渠道/新建签约继承；各渠道可单独覆盖", "pricing_quota", quotaActions)}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("pricing_quota")} 平台标准人天价（只读）：<strong class="fee-platform">¥${std}/人天</strong> — B 端 1% 平台费按此计提。</p>
            <table>
              <thead><tr><th>渠道商</th><th>平台标准价</th><th>我的批发价</th><th>最低起购</th><th>有效期至</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.channelName}${r.channelId === "*" ? `<br><small style="color:var(--muted)">无渠道 · 新建签约继承</small>` : ""}</td>
                <td><span class="fee-platform">¥${std}/人天</span> <small style="color:var(--muted)">只读</small></td>
                <td>¥${r.wholesalePrice}/人天${r.wholesalePrice !== std ? ` <small style="color:var(--warn)">已调整</small>` : ""}</td>
                <td>${r.minDays} 人天</td><td>${r.validTo}</td><td>${tag(r.status)}</td>
                <td><button type="button" class="link-btn" data-edit-quota-pricing="${r.id}">${r.channelId === "*" ? "设置" : "编辑"}</button></td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无批发价，请先设置默认批发价</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "card") {
        const contracts = myChannelContracts().filter(c => contractSettlementMode(c) === "卡差价");
        const rows = contracts.flatMap(c => channelLinkSkus.filter(s => s.channelId === c.channelId).map(s => ({ ...s, channelName: c.channelName, contractId: c.id, validTo: c.validTo, status: c.status })));
        body = `<section class="panel">
          ${panelHead("渠道分销价", "按签约渠道分别设定正式价、专享价与佣金", "pricing_card", `<button type="button" class="btn primary" data-new-card-pricing>+ 新增分销价</button>`)}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("pricing_card")} 多分销渠道（如骑士卡、闪送骑士卡）<strong>各签各价</strong>；亦可在此直接维护，或至「渠道管理 → 签约渠道」批量配置。</p>
            <table>
              <thead><tr><th>渠道商</th><th>SKU</th><th>正式零售价</th><th>渠道专享价</th><th>佣金/单</th><th>有效期至</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.channelName}</td>
                <td>${r.name}</td>
                <td>¥${r.officialPrice}</td>
                <td>¥${r.channelPrice}</td>
                <td>¥${r.commissionPerOrder}</td>
                <td>${r.validTo}</td>
                <td>${tag(r.status)}</td>
                <td>
                  <button type="button" class="link-btn" data-edit-card-pricing="${r.id}">编辑</button>
                  <button type="button" class="link-btn" data-edit-channel-partner="${r.contractId}">签约</button>
                </td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无渠道分销签约</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }
      return `${ownScopeBanner()}${body}`;
    }

    function renderChannelSales() {
      if (state.channelSalesTab === "pools") state.channelSalesTab = "assets";
      const tab = state.channelSalesTab;
      const tabs = [["contracts", "签约渠道"], ["orders", "服务订单"], ["assets", "渠道权益"], ["platformMarketing", "平台营销"]];
      const sidebar = tabSidebar(tabs, tab, "cstab");
      let body = "";
      if (tab === "platformMarketing") {
        const op = currentEntity();
        const agreements = myPlatformMarketingAgreements();
        const orders = myPlatformMarketingOrders();
        const statements = myPlatformMarketingStatements();
        const campaign = platformMarketingCampaigns[0];
        const hasEnrollment = agreements.some(a => a.status === "已启用");
        const sku30 = campaign?.skuPrices.find(s => s.skuId === "SKU-30D");
        const coupon30 = sku30?.couponAmount != null ? sku30.couponAmount : Math.max(0, (sku30?.officialPrice || 0) - (sku30?.activityPrice || 0));
        body = `<section class="panel">
          ${panelHead("平台营销协议", "二期 · 自愿参与 · 立减券面额只读 · 营销费协议月结", "platform_marketing", noteBtn("platform_marketing") + phase2BadgeHtml())}
          <div class="panel-body orders-table-wrap">
            ${!hasEnrollment && !agreements.length
              ? `<p style="color:var(--muted);margin:0 0 12px">未参与平台营销。确认协议后，平台可生成带本 OP 的推广链接。</p>`
              : ""}
            ${campaign ? `<p style="font-size:12px;color:var(--muted);margin:0 0 12px">进行中活动：<strong>${campaign.name}</strong>（${campaign.id}）· 30天卡原价 ¥${sku30?.officialPrice || "—"} · <strong>立减 ¥${coupon30}</strong> → 实付 ¥${sku30?.activityPrice || "—"}</p>` : ""}
            <table>
              <thead><tr><th>活动</th><th>SKU</th><th>立减券 / 实付</th><th>营销服务费/单</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${agreements.length ? agreements.map(a => {
                const sku = campaign?.skuPrices.find(s => s.skuId === a.skuId);
                const coupon = sku?.couponAmount != null ? sku.couponAmount : Math.max(0, (sku?.officialPrice || 0) - (sku?.activityPrice || 0));
                const pay = sku?.activityPrice != null ? sku.activityPrice : ((sku?.officialPrice || 0) - coupon);
                return `<tr>
                  <td>${a.campaignName}</td><td>${a.skuName}</td>
                  <td>立减 ¥${coupon} → 实付 ¥${pay}</td>
                  <td>¥${a.marketingServiceFee}</td>
                  <td>${tag(a.status)}</td>
                  <td>${a.status === "待确认" ? `<button type="button" class="link-btn" data-pm-confirm-agreement="${a.id}">确认参与</button>` : "—"}</td>
                </tr>`;
              }).join("") : `<tr><td colspan="6">暂无协议 · ${op.name} 尚未签约平台营销活动</td></tr>`}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("本运营商锁定成交", "购时已锁定本 OP · 款进本运营商子商户", "platform_marketing_collect")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>订单</th><th>用户</th><th>原价/立减/实付</th><th>营销费</th><th>支付时间</th><th>状态</th></tr></thead>
              <tbody>${orders.length ? orders.map(o => `<tr>
                <td>${o.id}</td><td>${o.riderName}<br><small>${o.phone}</small></td>
                <td>¥${o.officialPrice} − ¥${o.couponAmount || 0}<br><strong>¥${o.paidPrice}</strong></td>
                <td>¥${o.marketingServiceFee != null ? o.marketingServiceFee : "—"}</td>
                <td>${o.payTime || "—"}</td>
                <td>${tag(o.status)}</td>
              </tr>`).join("") : "<tr><td colspan='6'>暂无锁定至本运营商的 platform 订单</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("营销对账", "月度营销服务费确认 · 立减=本 OP 让利", "platform_marketing_payout")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>月份</th><th>笔数</th><th>实付合计</th><th>立减让利</th><th>营销费合计</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${statements.length ? statements.map(s => `<tr>
                <td>${s.month}</td><td>${s.orderCount}</td>
                <td>¥${s.paidTotal != null ? s.paidTotal : "—"}</td>
                <td>¥${s.couponTotal != null ? s.couponTotal : "—"}</td>
                <td>¥${s.marketingFeeTotal}</td>
                <td>${tag(s.status)}</td>
                <td>${s.status === "待确认" ? `<button type="button" class="link-btn" data-pm-confirm-stmt-op="${s.id}">确认对账</button>` : "—"}</td>
              </tr>`).join("") : "<tr><td colspan='7'>暂无对账单</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
        return `${ownScopeBanner()}${pageWithTabs(sidebar, body)}`;
      }
      if (tab === "contracts") {
        const rows = myChannelContracts();
        const addBtn = `<button type="button" class="btn primary" data-new-channel-partner>+ 新增渠道商</button>`;
        body = `<section class="panel">
          ${panelHead("签约渠道商", "四模式签约：人天池 / 卡差价 / 设备租赁 / 激活码", "channel_sales", addBtn)}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("channel_partner_manage")}${noteBtn("channel_partner_rights")} 同一运营商可签多个分销渠道，<strong>各渠道独立配置套餐与专享价</strong>；汇总对比见「定价管理 → 渠道分销价」。</p>
            <table>
              <thead><tr><th>合同</th><th>渠道商</th><th>结算模式</th><th>批发/定价</th><th>权益概要</th><th>有效期</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(c => `<tr>
                <td>${c.id}</td>
                <td>${c.channelName}<br><small style="color:var(--muted)">${c.channelId}</small></td>
                <td>${settlementModeLabel(contractSettlementMode(c))}</td>
                <td>${contractPricingCell(c)}</td>
                <td>${contractTermsCell(c)}</td>
                <td>${c.validFrom} ~ ${c.validTo}</td>
                <td>${tag(c.status)}${(() => { const ch = platformChannels.find(p => p.id === c.channelId); return ch?.status === "已停用" ? `<br>${tag("渠道已停用")}` : ""; })()}</td>
                <td><button type="button" class="link-btn" data-edit-channel-partner="${c.id}">编辑</button></td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无签约渠道，点击「+ 新增渠道商」创建</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("渠道商权益与信用", "按结算模式展示权益 · 人天池/设备租赁适用信用评估", "channel_partner_rights")}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;margin:0 0 12px"><label><input type="checkbox" id="depositStopOnShort" checked /> 押金不足时停服（一期可配 · 2026-07-13）</label></p>
            <table>
              <thead><tr><th>渠道商</th><th>结算模式</th><th>信用分</th><th>信用额度</th><th>应押/缺口</th><th>待审凭证</th><th>操作</th></tr></thead>
              <tbody>${rows.map(c => {
                if (!channelUsesCreditEval(c.channelId)) {
                  return `<tr>
                    <td>${c.channelName}</td><td>${settlementModeLabel(contractSettlementMode(c))}</td>
                    <td colspan="4"><small style="color:var(--muted)">分销渠道不适用渠道信用（用户直购，无渠道统管押金）</small></td>
                    <td>—</td>
                  </tr>`;
                }
                const prof = channelCreditProfiles.find(p => p.channelId === c.channelId);
                const pending = channelDepositProofs.filter(p => p.channelId === c.channelId && p.status === "待审核").length;
                const gap = prof ? (prof.gap || Math.max(0, prof.requiredDeposit - (prof.creditedAmount || 0))) : 0;
                return `<tr>
                  <td>${c.channelName}</td><td>${settlementModeLabel(contractSettlementMode(c))}</td>
                  <td>${prof ? prof.creditScore + " · " + prof.creditLevel : "—"}</td>
                  <td>¥${(prof?.creditLimit || 0).toLocaleString()}</td>
                  <td>${prof ? "应押 ¥" + prof.requiredDeposit.toLocaleString() + (gap > 0 ? `<br><small style="color:var(--warn)">缺口 ¥${gap.toLocaleString()}</small>` : "") : "—"}</td>
                  <td>${pending || "—"}</td>
                  <td><button type="button" class="link-btn" data-adjust-channel-credit="${c.channelId}">调整额度</button></td>
                </tr>`;
              }).join("") || "<tr><td colspan='7'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "orders") {
        const dayOrders = myOperatorDayOrders();
        const rentOrders = myOperatorRentOrders();
        const actOrders = myOperatorActivationOrders();
        body = `
          <section class="panel">
            ${panelHead("人天批发订单", "PO- · 到账后额度池入账", "day_pool_purchase")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>采购单</th><th>渠道商</th><th>人天/金额</th><th>支付</th><th>订单状态</th><th>支付状态</th><th>完成</th><th>操作</th>
                </tr></thead>
                <tbody>${dayOrders.map(o => `<tr>
                  <td>${o.id}${o.poolId ? `<br><small>${o.poolId}</small>` : ""}</td>
                  <td>${o.channelName}</td>
                  <td>${o.days} 人天<br>¥${o.amount.toLocaleString("zh-CN")}</td>
                  <td>${channelPayChannelLabel(o)} · ${channelPayMethodLabel(o)}</td>
                  <td>${tag(o.orderStatus)}</td><td>${tag(o.payStatus)}</td>
                  <td>${o.payTime || "—"}</td>
                  <td>${channelPoActionCell(o, "operator")}</td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无人天批发订单</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("设备月租订单", "MO- · 到账后账期生效", "channel_settlement_rent")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>充值单</th><th>渠道商</th><th>账期</th><th>金额</th><th>覆盖设备</th><th>支付</th><th>状态</th><th>操作</th>
                </tr></thead>
                <tbody>${rentOrders.map(o => `<tr>
                  <td>${o.id}</td><td>${o.channelName}</td><td>${o.period || "—"}</td>
                  <td>¥${o.amount.toLocaleString("zh-CN")}</td><td>${o.devicesCovered} 台</td>
                  <td>${o.payMethod}${o.offlineVoucher ? `<br><small>${o.offlineVoucher}</small>` : ""}</td>
                  <td>${tag(o.orderStatus)}</td>
                  <td>${b2bOrderActionCell(o, "operator", "rent")}</td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无设备月租订单</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("激活码批发订单", "AC- · 到账后码库存入库 · 一码一用", "channel_settlement_activation")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>批发单</th><th>渠道商</th><th>套餐码</th><th>数量</th><th>金额</th><th>支付</th><th>状态</th><th>操作</th>
                </tr></thead>
                <tbody>${actOrders.map(o => `<tr>
                  <td>${o.id}</td><td>${o.channelName}</td><td>${o.skuName}<br><small>${o.validityDays} 天/码</small></td>
                  <td>${o.qty} 码</td><td>¥${o.amount.toLocaleString("zh-CN")}</td>
                  <td>${o.payMethod}${o.offlineVoucher ? `<br><small>${o.offlineVoucher}</small>` : ""}</td>
                  <td>${tag(o.orderStatus)}</td>
                  <td>${b2bOrderActionCell(o, "operator", "act")}</td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无激活码批发订单</td></tr>"}</tbody>
              </table>
            </div>
          </section>`;
      } else {
        const pools = mySoldDayPools();
        const ledgerRows = dayPoolLedger.filter(l => pools.some(p => p.id === l.poolId)).slice(0, 12);
        const cardContracts = myChannelContracts().filter(c => contractSettlementMode(c) === "卡差价");
        const rentContracts = myChannelContracts().filter(c => contractSettlementMode(c) === "设备租赁");
        const actContracts = myChannelContracts().filter(c => contractSettlementMode(c) === "激活码");
        body = `
          <section class="panel">
            ${panelHead("已售额度池（人天池）", "一运营商一池；采购款到账即结清", "channel_sales", `${noteBtn("day_pool_one_per_operator")}${noteBtn("day_pool_b2b_settlement")}`)}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>额度池</th><th>购买方</th><th>总量</th><th>可用</th><th>已消耗</th><th>批发单价</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>${pools.map(p => `<tr>
                  <td><strong>${p.name}</strong><br><small>${p.id}</small></td>
                  <td>${p.ownerName}</td><td>${p.totalDays} 人天</td>
                  <td>${p.availableDays}</td><td>${p.consumedDays}</td>
                  <td>¥${p.wholesalePrice}/人天</td><td>${poolStatusTag(p.status)}</td>
                  <td><button type="button" class="link-btn" data-pool-adjust="${p.id}">额度调整</button></td>
                </tr>`).join("") || "<tr><td colspan='8'>暂无人天池额度池</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("渠道分销概况", "推广链接成交与佣金（无批发入库）", "channel_settlement_card")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>渠道商</th><th>SKU</th><th>专享价</th><th>佣金/单</th><th>链接成交</th><th>状态</th></tr></thead>
                <tbody>${cardContracts.length ? cardContracts.flatMap(c =>
                  channelSalePackages.filter(s => s.channelId === c.channelId).map(s => {
                    const conv = channelLinkOrders.filter(o => o.channelId === c.channelId && o.skuId === s.skuId).length;
                    return `<tr>
                    <td>${c.channelName}</td><td>${s.name}</td>
                    <td>¥${s.channelPrice}</td><td>¥${s.commissionPerOrder}</td>
                    <td>${conv} 单</td>
                    <td>${tag(s.status)}</td>
                  </tr>`;
                  })
                ).join("") : "<tr><td colspan='6'>暂无渠道分销签约</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("设备租赁概况", "租赁设备 · 专属站点 · 白名单", "channel_settlement_rent", noteBtn("lease_dedicated_site"))}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>渠道商</th><th>专属站点</th><th>月租</th><th>设备</th><th>白名单</th><th>账期</th><th>操作</th></tr></thead>
                <tbody>${rentContracts.map(c => {
                  const lease = channelLeaseSummary.find(p => p.channelId === c.channelId);
                  const devs = channelRentDevices.filter(d => d.channelId === c.channelId);
                  return `<tr>
                    <td>${c.channelName}</td>
                    <td>${c.dedicatedSiteName || lease?.dedicatedSiteName || "—"}<br><button type="button" class="link-btn" data-create-dedicated-site="${c.channelId}">管理站点</button></td>
                    <td>¥${(lease?.monthlyRent || c.monthlyRent || 0).toLocaleString()}/月</td>
                    <td>${devs.length} 台<br><button type="button" class="link-btn" data-edit-channel-partner="${c.id}">维护设备</button></td>
                    <td>${c.whitelistCount || lease?.whitelistCount || 0} 人</td>
                    <td>${lease?.billingStatus || c.billingStatus || "—"}</td>
                    <td><button type="button" class="link-btn" data-edit-channel-partner="${c.id}">编辑签约</button></td>
                  </tr>`;
                }).join("") || "<tr><td colspan='7'>暂无设备租赁签约渠道</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("租赁设备明细（设备租赁）", "运营商维护 SN 与站点 · 月租见签约统一价", "channel_settlement_rent", `<button type="button" class="btn" data-add-lease-device>+ 绑定设备</button>`)}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>渠道商</th><th>SN</th><th>类型</th><th>站点</th><th>状态</th></tr></thead>
                <tbody>${rentContracts.flatMap(c => channelRentDevices.filter(d => d.channelId === c.channelId).map(d =>
                  `<tr><td>${c.channelName}</td><td>${d.sn}</td><td>${d.type}</td><td>${d.site}</td><td>${tag(d.status)}</td></tr>`
                )).join("") || "<tr><td colspan='5'>暂无租赁设备</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("激活码概况", "批发库存 · 核销 · B 端 1% 计提", "channel_settlement_activation")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>渠道商</th><th>套餐码</th><th>批发单价</th><th>库存</th><th>已核销</th><th>状态</th></tr></thead>
                <tbody>${actContracts.map(c => `<tr>
                  <td>${c.channelName}</td><td>${c.codeSkuName || "30天包月"} · ${c.codeValidityDays || 30}天</td>
                  <td>¥${c.wholesalePrice}/码</td><td>${c.codeInventory ?? "—"}</td><td>${c.codesRedeemed ?? "—"}</td>
                  <td>${tag(c.status)}</td>
                </tr>`).join("") || "<tr><td colspan='6'>暂无激活码签约</td></tr>"}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("额度变动记录（人天池）", "采购入账 / 调账 / 分配 / 预占 / 确认", "day_pool_ledger")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>时间</th><th>额度池</th><th>类型</th><th>变动</th><th>余额后</th><th>关联单</th><th>说明</th></tr></thead>
                <tbody>${ledgerRows.map(l => `<tr>
                  <td>${l.time}</td><td>${l.poolId}</td><td>${tag(l.type)}</td>
                  <td>${l.deltaDays > 0 ? "+" : ""}${l.deltaDays} 人天</td>
                  <td>${l.balanceAfter}</td><td>${l.ref || "—"}</td><td>${l.reason || "—"}</td>
                </tr>`).join("") || "<tr><td colspan='7'>暂无变动记录</td></tr>"}</tbody>
              </table>
            </div>
          </section>`;
      }
      return `${ownScopeBanner()}${pageWithTabs(sidebar, body)}`;
    }

    function renderInterOp() {
      const pf = getPf();
      const range = pf.range || "7";
      const { from, to } = interOpDateRange(range);
      const rangeLabel = interOpRangeLabel(range);
      const allLedger = myInterOpLedger();
      const allDaily = myInterOpDailyBills();
      const rows = allLedger.filter(r => matchDateStr(r.date, from, to));
      const daily = allDaily.filter(b => matchDateStr(b.date, from, to));
      const period = myInterOpPeriodBills();
      const series = interOpDailySeries(allDaily, from, to);
      const credit = myOperatorCredit();
      const pendingPay = rows.filter(r => r.status === "待日清").reduce((s, r) => {
        const v = interOpRowView(r);
        return v.direction === "平台代付" ? s + v.amount : s;
      }, 0);
      const pendingIn = rows.filter(r => r.status === "待日清").reduce((s, r) => {
        const v = interOpRowView(r);
        return v.direction === "平台代收" ? s + v.amount : s;
      }, 0);
      const sumPayOut = daily.reduce((s, b) => s + b.platformPayOut, 0);
      const sumPayIn = daily.reduce((s, b) => s + b.platformPayIn, 0);
      const sumNet = daily.reduce((s, b) => s + b.net, 0);
      const sumSwaps = daily.reduce((s, b) => s + b.swapCount, 0);
      const chartLabels = series.map(p => p.label);
      const payOutSeries = series.map(p => +p.payOut.toFixed(2));
      const payInSeries = series.map(p => +p.payIn.toFixed(2));
      const netSeries = series.map(p => +p.net.toFixed(2));
      const swapSeries = series.map(p => p.swapCount);
      const usingCredit = credit && credit.depositBalance <= 0;
      const creditWarn = credit && !credit.crossSwapEnabled
        ? `<div class="pool-warn-banner">⚠ 保证金已用尽且信用额度已用尽，已关闭所属用户（个人+渠道）<strong>跨网换电</strong>。${noteBtn("operator_deposit")}${noteBtn("operator_credit")}</div>`
        : (usingCredit && credit.available < credit.creditLimit * 0.1
          ? `<div class="pool-warn-banner">平台保证金为 0，当前占用信用额度；余额不足 10%，请关注跨站风险。${noteBtn("operator_credit")}</div>`
          : (credit && credit.depositBalance > 0
            ? `<div class="platform-price-banner" style="margin-bottom:14px">当前清分扣款账户：<strong>平台保证金</strong>（余额 ¥${credit.depositBalance.toLocaleString("zh-CN")}）；信用额度未启用。${noteBtn("operator_deposit")}</div>`
            : (usingCredit ? `<div class="pool-warn-banner">平台保证金已用尽，清分占用<strong>信用额度</strong>（允许欠费）。${noteBtn("operator_deposit")}${noteBtn("operator_credit")}</div>` : "")));
      const deductMode = operatorDeductMode(credit);
      return `${ownScopeBanner()}
        <div class="platform-price-banner">${noteBtn("inter_op_pricing")}
          <strong>平台统价</strong>：单次柜机使用费 <span class="fee-platform">¥${l1UnifiedPricing.cabinetFee}/次</span>，
          单次电池使用费 <span class="fee-platform">¥${l1UnifiedPricing.batteryFee}/次</span> — 由平台统一管控，运营商只读。
          每日 <strong>${INTER_OP_CLEAR_TIME}</strong> 日清（<strong>保证金优先</strong>，保证金为 0 才启用信用额度）。${noteBtn("inter_op_clearing")}
        </div>
        ${creditWarn}
        <p style="margin:0 0 14px;font-size:13px">${noteBtn("operator_deposit")} 保证金不足？<button type="button" class="link-btn" data-view-jump="depositAccount">前往保证金账户对公充值</button></p>
        <div class="kpi-grid">
          ${kpi("平台保证金", credit ? "¥" + credit.depositBalance.toLocaleString("zh-CN") : "—", deductMode === "保证金" ? "当前扣款账户" : "已用尽", "保", "operator_deposit")}
          ${kpi("信用额度", credit ? "¥" + credit.creditLimit.toLocaleString("zh-CN") : "—", usingCredit ? "已启用" : "保证金>0 未启用", "额", "operator_credit")}
          ${kpi("信用已占用", credit && usingCredit ? "¥" + credit.used.toFixed(1) : "—", usingCredit ? "允许欠费" : "—", "占", "operator_credit")}
          ${kpi("信用可用", credit && usingCredit ? "¥" + credit.available.toFixed(1) : "—", credit && !credit.crossSwapEnabled ? "已停跨网" : "跨网换电", "可", "operator_credit")}
          ${kpi("待日清代付", "¥" + pendingPay.toFixed(2), rangeLabel + " · 扣款：" + deductMode, "付", "inter_op_privacy")}
          ${kpi("待日清代收", "¥" + pendingIn.toFixed(2), rangeLabel + " · 计入保证金", "收", "inter_op_privacy")}
          ${kpi("范围代付合计", "¥" + sumPayOut.toFixed(2), rangeLabel + " · " + sumSwaps + " 笔跨站", "出", "inter_op_clearing")}
          ${kpi("范围代收合计", "¥" + sumPayIn.toFixed(2), rangeLabel, "入", "inter_op_clearing")}
          ${kpi("范围净额", fmtInterOpMoney(sumNet), from + " ~ " + to, "净", "inter_op_clearing")}
        </div>
        <section class="panel">
          ${panelHead("往来趋势", `${rangeLabel}（${from} ~ ${to}）· 由日清账单聚合`, "inter_op_clearing")}
          <div class="panel-body">
            <div class="inter-op-charts">
              <article class="drill-card">
                <div class="drill-card-head"><strong>平台代付（应付）</strong><span class="drill-card-sum">¥${sumPayOut.toFixed(2)}</span></div>
                <div class="drill-card-sub">${rangeLabel}合计 · 最高 ¥${Math.max(...payOutSeries, 0).toFixed(2)} ${noteBtn("data_drill_spark")}</div>
                ${renderSparkChart(payOutSeries, chartLabels, "#dc2626")}
              </article>
              <article class="drill-card">
                <div class="drill-card-head"><strong>平台代收（应收）</strong><span class="drill-card-sum">¥${sumPayIn.toFixed(2)}</span></div>
                <div class="drill-card-sub">${rangeLabel}合计 · 最高 ¥${Math.max(...payInSeries, 0).toFixed(2)}</div>
                ${renderSparkChart(payInSeries, chartLabels, "#0d9488")}
              </article>
              <article class="drill-card">
                <div class="drill-card-head"><strong>日清净额</strong><span class="drill-card-sum">${fmtInterOpMoney(sumNet)}</span></div>
                <div class="drill-card-sub">${rangeLabel} · 跨站 ${sumSwaps} 笔 · 负值为净支出</div>
                ${renderSparkChart(netSeries, chartLabels, "#2563eb", true)}
              </article>
            </div>
          </div>
        </section>
        <section class="panel">
          ${panelHead("跨网设备服务费明细", `${rangeLabel} · ${rows.length} 条 · 仅展示平台代收/代付`, "inter_op_privacy")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>换电单</th><th>日期</th><th>站点</th>
                <th>柜机费</th><th>电池费</th><th>平台方向</th><th>金额</th><th>日清批次</th><th>状态</th>
              </tr></thead>
              <tbody>${rows.map(r => {
                const v = interOpRowView(r);
                return `<tr class="${r.id === "IO-001" ? "site-stats-total" : ""}">
                <td>${r.swapId}</td><td>${r.date}</td><td>${r.site}</td>
                <td>${r.cabinetFee ? '<span class="fee-platform">¥' + r.cabinetFee.toFixed(2) + "</span>" : "—"}</td>
                <td>${r.batteryFee ? '<span class="fee-platform">¥' + r.batteryFee.toFixed(2) + "</span>" : "—"}</td>
                <td>${v.direction}</td>
                <td>${v.amount ? "¥" + v.amount.toFixed(2) : "—"}</td>
                <td><small>${r.clearBatch}</small></td>
                <td>${tag(r.status)}</td>
              </tr>`;
              }).join("") || "<tr><td colspan='9'>该时间范围内暂无往来记录</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("日清账单", `${rangeLabel} · ${daily.length} 条 · 每日 ${INTER_OP_CLEAR_TIME} 汇总`, "inter_op_clearing")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>账单</th><th>日期</th><th>平台代付</th><th>平台代收</th><th>净额</th><th>扣款来源</th><th>跨站笔数</th><th>清分时间</th><th>状态</th>
              </tr></thead>
              <tbody>${daily.map(b => `<tr>
                <td>${b.id}</td><td>${b.date}</td>
                <td>¥${b.platformPayOut.toFixed(2)}</td><td>¥${b.platformPayIn.toFixed(2)}</td>
                <td>${b.net < 0 ? "¥" + b.net.toFixed(2) : "+¥" + b.net.toFixed(2)}</td>
                <td>${b.deductSource || operatorDeductMode(credit)}</td>
                <td>${b.swapCount}</td><td><small>${b.clearedAt}</small></td><td>${tag(b.status)}</td>
              </tr>`).join("") || "<tr><td colspan='9'>该时间范围内暂无日账单</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("周/月汇总", "由日账单聚合", "inter_op_clearing")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>账单</th><th>周期</th><th>类型</th><th>天数</th><th>代付</th><th>代收</th><th>净额</th><th>状态</th></tr></thead>
              <tbody>${period.map(b => `<tr>
                <td>${b.id}</td><td>${b.period}</td><td>${b.type}</td><td>${b.days}</td>
                <td>¥${b.platformPayOut.toFixed(2)}</td><td>¥${b.platformPayIn.toFixed(2)}</td>
                <td>¥${b.net.toFixed(2)}</td><td>${tag(b.status)}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无周期账单</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("案例 #3", "个人用户 · 跨站换电 · U→B", "inter_op_case3")}
          <div class="panel-body"><p style="margin:0;font-size:13px;color:var(--muted)">
            个人套餐用户（额度售卖方 U）在滨江柜机换出陆家嘴电池：U 经平台代付柜机 ¥0.5 + 电池 ¥0.1（IO-001）。
            运营商后台只见「平台代付/代收」，不见对手方名称。渠道成员跨网规则与个人用户一致（案例 <code>SW-CHANNEL-CROSS</code>）。
          </p></div>
        </section>`;
    }

    function renderPlatformFee() {
      const accruals = myPlatformFeeAccruals();
      const bills = myPlatformFeeBills();
      const eid = currentEntity().id;
      const feeCfg = operatorPlatformFeeConfig(eid);
      const totalAccrued = accruals.reduce((s, r) => s + r.feeAmount, 0);
      const totalOwed = bills.reduce((s, r) => s + r.owed, 0);
      const prepay = bills[0]?.prepayBalance || 0;
      return `${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("platform_operator_fee_rate")}
          <strong>本主体适用平台服务费比例</strong>（平台统一配置，只读）：
          C 端 <span class="fee-platform">${formatFeeRatePct(feeCfg.cEndRate)}</span> ·
          B 端 <span class="fee-platform">${formatFeeRatePct(feeCfg.bEndRate)}</span>
          · 生效 ${feeCfg.effectiveFrom}${feeCfg.remark ? " · " + feeCfg.remark : ""}
        </div>
        <div class="pool-hero">${noteBtn("platform_fee")}${noteBtn("platform_fee_trigger")}${noteBtn("platform_standard_day_price")}
          <h2>平台技术服务费</h2>
          <p>C 端：支付成功分账 <strong>${formatFeeRatePct(feeCfg.cEndRate)}</strong>（已确认）。B 端渠道人天：<strong>确认消耗</strong> — 按平台标准人天价 ¥${platformAccrualDayPrice()}/人天 × <strong>${formatFeeRatePct(feeCfg.bEndRate)}</strong> 向额度售卖方 U 计提；<strong>优先划扣保证金</strong>。</p>
        </div>
        <div class="kpi-grid">
          ${kpi("本月计提", "¥" + totalAccrued.toFixed(2), accruals.length + " 笔消耗", "计", "platform_fee")}
          ${kpi("待代扣", "¥" + accruals.filter(a => a.status === "待代扣").reduce((s, a) => s + a.feeAmount, 0).toFixed(2), operatorDeductMode(myOperatorCredit()) + "代扣队列", "扣", "platform_fee")}
          ${kpi("欠费金额", "¥" + totalOwed.toFixed(2), bills.length ? bills[0].status : "—", "欠", "platform_fee")}
          ${kpi("预存户余额", "¥" + prepay.toFixed(2), "兜底扣费账户", "存", "platform_fee")}
        </div>
        <section class="panel">
          ${panelHead("消耗计提明细", "确认消耗 → 额度售卖方 U", "platform_fee_trigger")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>日期</th><th>渠道商</th><th>额度池</th><th>换电单</th><th>骑手</th>
                <th>平台计提基数</th><th>合同批发价</th><th>费率</th><th>服务费</th><th>计提主体</th><th>触发</th><th>代扣路径</th><th>状态</th>
              </tr></thead>
              <tbody>${accruals.map(a => `<tr>
                <td>${a.date}</td><td>${a.channelName}</td><td>${a.poolId}</td>
                <td>${a.swapId}</td><td>${a.riderId}</td>
                <td><strong class="fee-platform">¥${a.basePrice}/人天</strong></td>
                <td>¥${(a.contractWholesalePrice ?? a.basePrice)}/人天${(a.contractWholesalePrice ?? a.basePrice) !== a.basePrice ? ` <small style="color:var(--muted)">≠计提基数</small>` : ""}</td>
                <td>${formatFeeRatePct(a.feeRate)}</td>
                <td>¥${a.feeAmount.toFixed(3)}</td><td><small>${a.feeTarget || "额度售卖方U"}</small></td>
                <td><small>${a.trigger}</small></td>
                <td>${a.deductPath}</td><td>${tag(a.status)}</td>
              </tr>`).join("") || "<tr><td colspan='13'>暂无计提</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("月结账单", "已扣、欠费与预存户", "platform_fee")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>账单</th><th>账期</th><th>计提合计</th><th>已代扣</th><th>欠费</th><th>预存余额</th><th>状态</th></tr></thead>
              <tbody>${bills.map(b => `<tr>
                <td>${b.id}</td><td>${b.month}</td>
                <td>¥${b.accrued.toFixed(2)}</td><td>¥${b.deducted.toFixed(2)}</td>
                <td>¥${b.owed.toFixed(2)}</td><td>¥${b.prepayBalance.toFixed(2)}</td>
                <td>${tag(b.status)}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无账单</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderActivationCodes() {
      const cid = channelEntityId();
      const codes = myActivationCodes();
      const rows = codes.map(c => `<tr>
        <td><code>${c.code}</code></td><td>${c.skuName}</td><td>${c.validityDays} 天</td>
        <td>${tag(c.status)}</td><td>${c.issuedTo || "—"}</td><td>${c.redeemedAt || "—"}</td><td>${c.batchId || "—"}</td>
      </tr>`).join("");
      const stats = { 未发放: 0, 已发放: 0, 已核销: 0, 已作废: 0 };
      codes.forEach(c => { if (stats[c.status] != null) stats[c.status]++; });
      return `${ownScopeBanner()}
        <div class="kpi-grid" style="margin-bottom:14px">
          ${kpi("未发放", stats.未发放, "可发放", "码", "channel_settlement_activation")}
          ${kpi("已发放", stats.已发放, "待骑手核销", "发", "channel_settlement_activation")}
          ${kpi("已核销", stats.已核销, "一码一用", "核", "channel_settlement_activation")}
          ${kpi("已作废", stats.已作废, "不可再用", "废", "channel_settlement_activation")}
        </div>
        <section class="panel">
          ${panelHead("激活码库存", "一码一用 · 渠道自行发放 · 骑手不经平台付款", "channel_settlement_activation", `<button type="button" class="btn" data-mock-import-act>批量导入</button>`)}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>激活码</th><th>套餐</th><th>服务天数</th><th>状态</th><th>发放批次/对象</th><th>核销时间</th><th>采购单</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='7'>暂无激活码</td></tr>"}</tbody></table>
          </div>
        </section>`;
    }

    function renderActivationRecords() {
      const rows = myActivationRedemptions().map(r => `<tr>
        <td>${r.redeemedAt}</td><td><code>${r.code}</code></td><td>${r.userName}<br><small>${r.phone}</small></td>
        <td>${r.skuName} · ${r.validityDays}天</td><td>${r.pkgValidTo}</td>
        <td>¥${r.platformFeeBase.toFixed(2)}</td><td>¥${r.platformFee.toFixed(2)}</td>
      </tr>`).join("");
      return `${ownScopeBanner()}
        <section class="panel">
          ${panelHead("核销记录", "码核销成功即开通套餐；平台 B 端 1% 向运营商计提（与人天池同类费率）", "channel_settlement_activation", noteBtn("platform_fee_trigger"))}
          <div class="panel-body orders-table-wrap">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">计提基数 = 平台标准人天价（¥${platformAccrualDayPrice()}）× 码对应服务人天 × 运营商 B 端费率；与批发单价无关。</p>
            <table><thead><tr><th>核销时间</th><th>激活码</th><th>用户</th><th>开通套餐</th><th>有效期至</th><th>计提基数</th><th>平台 1%</th></tr></thead>
            <tbody>${rows || "<tr><td colspan='7'>暂无核销记录</td></tr>"}</tbody></table>
          </div>
        </section>`;
    }

    function renderChannelSettlement() {
      const cid = channelEntityId();
      const mode = channelSettlementModes.find(m => m.channelId === cid);
      const contract = myChannelContracts()[0];
      if (isCardChannel() && mode) {
        const skus = channelLinkSkus.filter(s => s.channelId === cid);
        const instant = channelInstantCommissionEnabled(cid);
        return `
          ${ownScopeBanner()}
          <div class="pool-hero">
            <h2>渠道分销 · ${channelProfile().name}</h2>
            <p>推广<strong>专属购卡链接</strong>；用户按渠道专享价（如包月 <strong>¥${mode.channelPrice}</strong>，低于正式价 ¥${mode.officialPrice}）<strong>直购</strong>；订单与用户带渠道标记。${instant
              ? `佣金<strong>及时到付</strong>（实付 × <strong>${formatCommissionRate(contract?.commissionRate || mode.commissionRate)}</strong> 即时分账）。`
              : `运营商按单支付佣金 <strong>¥${mode.commissionPerOrder}</strong>（线下结算）。`}</p>
          </div>
          <div class="kpi-grid">
            ${kpi("链接成交", mode.linkOrders + " 单", "点击 " + mode.linkClicks, "单", "channel_settlement_card")}
            ${instant
              ? kpi("佣金比例", formatCommissionRate(contract?.commissionRate || mode.commissionRate), "支付成功即时分账", "佣", "channel_instant_commission")
              : kpi("单均佣金", "¥" + mode.commissionPerOrder, mode.cardSku, "佣", "channel_card_margin")}
            ${kpi(instant ? "本月已分账佣金" : "本月应结佣", "¥" + mode.monthCommission, instant ? "已即时到付" : "线下与运营商结", "结", "channel_card_margin")}
            ${kpi("签约运营商", contract?.operatorName || "—", "渠道分销", "运", "day_pool_contract")}
          </div>
          <section class="panel">
            ${panelHead("SKU 与专享价", "正式价 / 渠道专享价 / 佣金", "channel_settlement_card")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr><th>SKU</th><th>正式零售价</th><th>渠道专享价</th><th>佣金/单</th><th>有效期</th></tr></thead>
                <tbody>${skus.map(s => `<tr>
                  <td><strong>${s.name}</strong><br><small>${s.id}</small></td>
                  <td>¥${s.officialPrice}</td><td><strong>¥${s.channelPrice}</strong></td>
                  <td>¥${s.commissionPerOrder}</td><td>${s.validityDays} 天</td>
                </tr>`).join("")}</tbody>
              </table>
            </div>
          </section>
          <section class="panel">
            ${panelHead("结算规则", "推广链接 · 用户直购 · 佣金结算", "channel_card_margin")}
            <div class="panel-body"><ol style="margin:0;padding-left:20px;font-size:13px;color:var(--muted);line-height:1.8">
              <li>运营商与渠道协商各 SKU <strong>渠道专享价</strong>（≤ 正式零售价）与<strong>佣金</strong></li>
              <li>渠道在「套餐与链接」为各套餐<strong>新建多条推广链接</strong>并标注用途；可<strong>生成二维码</strong>；用户扫码/点击<strong>直达运营商小程序</strong></li>
              <li>用户完成<strong>注册登录与实名认证</strong>后购套餐；点击链接起 <strong>24h</strong> 内购买授权 SKU 均享<strong>渠道专享价</strong></li>
              <li>支付由<strong>平台代收</strong>至运营商子商户，成功<strong>实时清分</strong> 1%</li>
              <li>${instant
                ? `已开启<strong>佣金及时到付</strong>：渠道佣金 = 实付 × ${formatCommissionRate(contract?.commissionRate || mode.commissionRate)}，支付成功<strong>即时分账</strong>至渠道收款账户`
                : "佣金见「佣金对账」，运营商与渠道<strong>线下结算</strong>"}</li>
              <li>订单与用户写入<strong>渠道来源标记</strong>；换电权益即时开通</li>
            </ol></div>
          </section>`;
      }
      if (isLeaseChannel() && mode) {
        const lease = channelLeaseSummary.find(p => p.channelId === channelEntityId()) || {};
        const pol = channelSwapPolicyFor(channelEntityId());
        const freeCnt = channelLeaseWhitelist.filter(r => r.channelId === channelEntityId() && r.status === "启用" && r.whitelistAccess === "free").length;
        const paidCnt = channelLeaseWhitelist.filter(r => r.channelId === channelEntityId() && r.status === "启用" && r.whitelistAccess === "paid").length;
        return `
          ${ownScopeBanner()}
          <div class="pool-hero">${noteBtn("channel_settlement_rent")}${noteBtn("lease_dedicated_site")}${noteBtn("lease_whitelist_access")}
            <h2>设备租赁 · ${channelProfile().name}</h2>
            <p>渠道可视为<strong>小型运营商</strong>（设备租赁、userOwner=渠道）。运营商维护 <strong>${mode.devicesCovered || lease.devicesCovered || 0}</strong> 台租赁设备（月租 <strong>¥${(mode.monthlyRent || 0).toLocaleString()}</strong>）；白名单 <strong>${mode.whitelistCount || lease.whitelistCount || 0} 人</strong>（免费 ${freeCnt} / 付费 ${paidCnt}）。专属站：<strong>${mode.dedicatedSite || lease.dedicatedSiteName || contract?.dedicatedSiteName || "—"}</strong>。跨网：${pol.crossNetworkEnabled ? tag("已开通") : tag("未开通")}。</p>
          </div>
          <div class="kpi-grid">
            ${kpi("白名单用户", (mode.whitelistCount || lease.whitelistCount || 0) + " 人", `免费 ${freeCnt} · 付费 ${paidCnt}`, "白", "lease_whitelist_access")}
            ${kpi("月租合计", "¥" + (mode.monthlyRent || 0).toLocaleString(), "设备 " + (mode.devicesCovered || 0) + " 台", "租", "channel_settlement_rent")}
            ${kpi("跨网保证金", pol.crossNetworkDepositPaid ? "¥" + (pol.crossNetworkDepositAmount || 20000).toLocaleString() : "未缴", pol.crossNetworkEnabled ? "平台代收" : "未开通跨网", "跨", "channel_lease_crossnet")}
            ${kpi("签约运营商", contract?.operatorName || "—", "设备出租方", "运", "day_pool_contract")}
          </div>
          <section class="panel">
            ${panelHead("结算规则（演示）", "设备租赁 · 白名单免费/付费", "channel_settlement_rent")}
            <div class="panel-body"><ol style="margin:0;padding-left:20px;font-size:13px;color:var(--muted);line-height:1.8">
              <li>运营商维护<strong>租赁设备清单</strong>与<strong>专属站点</strong>（专用·不对公众开放；小程序<strong>仅白名单可见</strong>）</li>
              <li><strong>白名单免费</strong>：B2B 月租已覆盖，名单内骑手<strong>免 C 端购套餐</strong>即可换电</li>
              <li><strong>白名单付费</strong>：名单内骑手须购买「<strong>白名单套餐</strong>」（款进渠道收款账户）后方可换电</li>
              <li>渠道在「白名单用户」<strong>自行添加/移除</strong>骑手，添加时选择免费或付费类型</li>
              <li>渠道按月向运营商支付设备月租（MO-）；<strong>欠费停服</strong></li>
              <li>可选开通<strong>跨网换电</strong>：须向平台缴纳跨网保证金；骑手在他网换电产生<strong>跨网设备服务费</strong>，由渠道保证金/信用额度支付（规则同运营商）</li>
            </ol></div>
          </section>`;
      }
      if (isActivationChannel() && mode) {
        const contract = myChannelContracts()[0];
        return `
          ${ownScopeBanner()}
          <div class="pool-hero">${noteBtn("channel_settlement_activation")}
            <h2>激活码 · ${channelProfile().name}</h2>
            <p>向运营商批发<strong>激活码</strong>（<strong>一码一用</strong>）；渠道自行发放；骑手在小程序输入激活码开通套餐，<strong>不经平台收款</strong>。平台 1% 在<strong>码核销成功</strong>时向运营商计提（B 端费率，基数=标准人天价×服务人天）。</p>
          </div>
          <div class="kpi-grid">
            ${kpi("码库存", (mode.codeInventory || contract?.codeInventory || 0) + " 张", "已批发未核销", "码", "channel_settlement_activation")}
            ${kpi("本月核销", (mode.monthRedemptions || 0) + " 次", "累计 " + (mode.codesRedeemed || contract?.codesRedeemed || 0), "核", "channel_settlement_activation")}
            ${kpi("批发单价", "¥" + (mode.wholesalePrice || contract?.wholesalePrice || "—") + "/码", mode.codeSkuName || "30天包月", "价", "channel_settlement_activation")}
            ${kpi("签约运营商", contract?.operatorName || "—", "激活码", "运", "day_pool_contract")}
          </div>
          <section class="panel">
            ${panelHead("结算规则", "激活码 · 参考人天池 B 端计提", "channel_settlement_activation")}
            <div class="panel-body"><ol style="margin:0;padding-left:20px;font-size:13px;color:var(--muted);line-height:1.8">
              <li>渠道通过<strong>服务订单 AC-</strong>向运营商批发激活码；运营商<strong>手动确认到账</strong>后入库</li>
              <li>渠道在「激活码」管理库存、发放；<strong>一码仅可核销一次</strong></li>
              <li>骑手小程序输入激活码 → 开通对应套餐权益；<strong>用户不向平台/运营商在线付款</strong></li>
              <li>平台 1%：<strong>核销成功时</strong>按「标准人天价 × 服务人天 × 运营商 B 端费率」向 U 计提（与人天池确认消耗同类，与批发单价无关）</li>
              <li>换电权益与个人套餐相同；跨网费规则同其他用户</li>
            </ol></div>
          </section>`;
      }
      const pools = myDayPools();
      return `
        ${ownScopeBanner()}
        <div class="pool-hero">${noteBtn("day_pool_panel")}
          <h2>人天池结算 · ${channelProfile().name}</h2>
          <p>向签约运营商采购人天额度；<strong>换电或持电池</strong>均确认消耗 1 人天/骑手/日。当前池 <strong>${mode?.poolId || pools[0]?.id || "—"}</strong>，在职骑手 <strong>${mode?.activeRiders || 0}</strong> 人。</p>
        </div>
        <section class="panel">
          ${panelHead("当前结算模式", "人天池（启用）", "day_pool_panel")}
          <div class="panel-body">
            <p style="margin:0 0 12px;font-size:13px">批发 ¥${mode?.wholesalePrice || contract?.wholesalePrice || "—"}/人天 · 详见「人天额度池」各 Tab。</p>
            <button type="button" class="btn primary" data-view-jump="dayPool">进入人天额度池</button>
          </div>
        </section>`;
    }

    function renderChannelLinks() {
      const cid = channelEntityId();
      const packages = channelPackagesFor(cid);
      const links = channelPromoLinksFor(cid);
      const form = state.channelLinkForm;
      const newLinkForm = form ? `
        <div class="field-card" style="margin-bottom:16px;padding:16px;border:1px solid var(--border);border-radius:8px">
          <p style="font-size:13px;font-weight:600;margin:0 0 12px">新建推广链接</p>
          <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:12px;align-items:end">
            <label style="font-size:12px">所属套餐
              <select id="newLinkPackage" style="width:100%;margin-top:4px">
                ${packages.map(p => `<option value="${p.id}"${p.id === form.packageId ? " selected" : ""}>${p.name} · ¥${p.channelPrice}</option>`).join("")}
              </select>
            </label>
            <label style="font-size:12px">链接用途
              <input id="newLinkPurpose" type="text" value="${form.purpose || ""}" placeholder="如 App 首页 Banner" style="width:100%;margin-top:4px" />
            </label>
            <div style="display:flex;gap:8px">
              <button type="button" class="btn primary" data-save-promo-link>生成链接</button>
              <button type="button" class="link-btn" data-cancel-promo-link>取消</button>
            </div>
          </div>
        </div>` : "";
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("可销售套餐", "价格由运营商签约配置 · 渠道可为本套餐生成多条推广链接", "channel_settlement_card", `<button type="button" class="btn primary" data-new-promo-link>+ 新建链接</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>套餐</th><th>正式价</th><th>渠道专享价</th><th>佣金/单</th><th>推广链接数</th><th>累计点击</th><th>累计成交</th><th>状态</th></tr></thead>
              <tbody>${packages.map(p => {
                const st = packageLinkStats(p.id);
                return `<tr>
                  <td><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.skuId}</small></td>
                  <td>¥${p.officialPrice}</td>
                  <td><strong>¥${p.channelPrice}</strong></td>
                  <td>¥${p.commissionPerOrder}</td>
                  <td>${st.linkCount} 条</td>
                  <td>${st.clicks}</td>
                  <td>${st.conversions}</td>
                  <td>${tag(p.status)}</td>
                </tr>`;
              }).join("") || "<tr><td colspan='8'>暂无可售套餐</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("推广链接", "同一套餐可多条 · 二维码 · 直达运营商小程序 · 24h 归因", "module_channel_links")}
          <div class="panel-body">
            ${newLinkForm}
            <div class="orders-table-wrap">
              <table>
                <thead><tr><th>套餐</th><th>链接用途</th><th>链接码</th><th>点击</th><th>成交</th><th>创建日</th><th>状态</th><th>小程序链接</th><th>操作</th></tr></thead>
                <tbody>${links.map(l => {
                  const pkg = packages.find(p => p.id === l.packageId);
                  return `<tr>
                    <td>${pkg ? pkg.name : l.skuId}<br><small>¥${pkg?.channelPrice || "—"}</small></td>
                    <td><strong>${l.purpose}</strong></td>
                    <td><small>${l.linkCode}</small></td>
                    <td>${l.clicks}</td>
                    <td>${l.conversions}</td>
                    <td>${l.createdAt}</td>
                    <td>${tag(l.status)}</td>
                    <td><small style="word-break:break-all;max-width:180px;display:block">${l.linkUrl}</small></td>
                    <td class="row-actions">
                      <button type="button" class="link-btn" data-show-qr="${l.id}">二维码</button>
                      <button type="button" class="link-btn" data-copy-link="${l.linkUrl}">复制</button>
                      ${l.status === "启用" ? `<button type="button" class="link-btn" data-toggle-promo-link="${l.id}">停用</button>` : `<button type="button" class="link-btn" data-toggle-promo-link="${l.id}">启用</button>`}
                    </td>
                  </tr>`;
                }).join("") || "<tr><td colspan='9'>暂无推广链接，点击「+ 新建链接」</td></tr>"}</tbody>
              </table>
            </div>
          </div>
        </section>`;
    }

    function renderChannelOrders() {
      const cid = channelEntityId();
      const all = channelLinkOrders.filter(o => o.channelId === cid);
      const orders = filterChannelLinkOrders(all);
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("购卡记录", "仅展示经本渠道推广链接成交的套餐购买 · 共 " + all.length + " 笔，筛选后 " + orders.length + " 笔", "module_channel_orders")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>订单</th><th>用户</th><th>套餐</th><th>实付</th><th>佣金</th><th>结算</th><th>链接用途</th><th>链接码</th><th>支付时间</th><th>状态</th></tr></thead>
              <tbody>${orders.map(o => `<tr>
                <td>${o.id}</td>
                <td>${o.riderName}<br><small>${o.phone}</small></td>
                <td>${o.skuName}<br><small style="color:var(--muted)">正式 ¥${o.officialPrice}</small></td>
                <td><strong>¥${o.paidPrice}</strong></td>
                <td>¥${o.commission}${o.commissionRate ? `<br><small>${formatCommissionRate(o.commissionRate)}</small>` : ""}</td>
                <td>${tag(o.commissionSettlement || commissionSettlementLabel(cid))}</td>
                <td>${o.linkPurpose || "—"}</td>
                <td><small>${o.linkCode}</small></td>
                <td>${o.payTime}</td>
                <td>${tag(o.status)}</td>
              </tr>`).join("") || "<tr><td colspan='10'>暂无购卡记录</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderCommissionStatement() {
      const cid = channelEntityId();
      const f = getPf();
      const instant = channelInstantCommissionEnabled(cid);
      const contract = cardContractForChannel(cid);
      const months = commissionMonthsForChannel(cid);
      const monthRows = (f.month && f.month !== "全部" ? [f.month] : months).map(m => commissionMonthSummary(cid, m));
      const grand = monthRows.reduce((acc, r) => ({
        orderCount: acc.orderCount + r.orderCount,
        totalPaid: acc.totalPaid + r.totalPaid,
        totalCommission: acc.totalCommission + r.totalCommission,
        totalFee: acc.totalFee + r.totalFee
      }), { orderCount: 0, totalPaid: 0, totalCommission: 0, totalFee: 0 });
      const focusMonth = f.month && f.month !== "全部" ? f.month : (months[0] || "");
      const focus = focusMonth ? commissionMonthSummary(cid, focusMonth) : null;
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${instant
          ? `已开启<strong>佣金及时到付</strong> · 佣金比例 <strong>${formatCommissionRate(contract?.commissionRate)}</strong> · 支付成功<strong>即时分账</strong>至渠道子商户 · 平台 1% 同步清分`
          : `佣金按<strong>自然月</strong>汇总 · 用户经链接购卡由平台<strong>代收</strong> · 支付成功<strong>实时清分</strong> 1% · 渠道佣金由运营商<strong>线下结算</strong>`}</div>
        <div class="kpi-grid">
          ${kpi("统计月份", (f.month && f.month !== "全部" ? f.month : months.length + " 个月"), focus ? focus.orderCount + " 笔成交" : "—", "月", "channel_card_margin")}
          ${kpi("实付合计", "¥" + (focus ? focus.totalPaid : grand.totalPaid).toLocaleString(), "用户支付总额", "付", "channel_settlement_card")}
          ${kpi(instant ? "已分账佣金" : "应结佣金", "¥" + (focus ? focus.totalCommission : grand.totalCommission).toLocaleString(), instant ? "已即时到付" : "线下与运营商结", "佣", "channel_card_margin")}
          ${kpi("平台 1%", "¥" + (focus ? focus.totalFee : grand.totalFee).toFixed(2), "已清分", "服", "platform_fee")}
        </div>
        <section class="panel">
          ${panelHead("月度佣金汇总", instant ? "按自然月统计 · 佣金已即时分账" : "按自然月统计链接购卡与应结佣金", "channel_card_margin")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>月份</th><th>成交笔数</th><th>实付合计</th><th>${instant ? "已分账佣金" : "应结佣金"}</th><th>平台 1%</th><th>结算状态</th></tr></thead>
              <tbody>${monthRows.map(r => `<tr>
                <td><strong>${r.month}</strong></td>
                <td>${r.orderCount}</td>
                <td>¥${r.totalPaid.toLocaleString()}</td>
                <td><strong style="color:var(--green)">¥${r.totalCommission.toLocaleString()}</strong></td>
                <td>¥${r.totalFee.toFixed(2)}</td>
                <td>${tag(r.orderCount ? (instant ? "已即时分账" : "待线下结算") : "无成交")}</td>
              </tr>`).join("") || "<tr><td colspan='6'>暂无对账数据</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        ${focus && focus.orders.length ? `<section class="panel">
          ${panelHead(focusMonth + " 明细", "该月经链接购卡订单", "module_channel_orders")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>订单</th><th>用户</th><th>套餐</th><th>实付</th><th>佣金</th><th>结算方式</th><th>链接用途</th><th>支付时间</th></tr></thead>
              <tbody>${focus.orders.map(o => `<tr>
                <td>${o.id}</td><td>${o.riderName}<br><small>${o.phone}</small></td><td>${o.skuName}</td>
                <td>¥${o.paidPrice}</td><td>¥${o.commission}</td>
                <td>${tag(o.commissionSettlement || commissionSettlementLabel(cid))}</td>
                <td>${o.linkPurpose || "—"}</td><td>${o.payTime}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>` : ""}`;
    }

    function renderRentPool() {
      const cid = channelEntityId();
      const lease = channelLeaseSummary.find(p => p.channelId === cid) || {};
      const contract = myChannelContracts()[0];
      const ledger = channelRentLedger.filter(l => l.channelId === cid);
      const orders = channelRentTopupOrders.filter(o => o.channelId === cid);
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("channel_settlement_rent")} 月租合计 <strong>¥${(lease.monthlyRent || contract?.monthlyRent || 0).toLocaleString()}/月</strong> · 账期 <strong>${lease.billingStatus || "—"}</strong> · 欠费<strong>停服</strong>（白名单用户不可换电）</div>
        <div class="kpi-grid">
          ${kpi("本月月租", "¥" + (lease.monthlyRent || 0).toLocaleString(), lease.devicesCovered + " 台设备", "租", "channel_settlement_rent")}
          ${kpi("白名单", (lease.whitelistCount || 0) + " 人", "购渠道套餐", "白", "lease_whitelist")}
          ${kpi("本月换电", (lease.monthSwaps || 0) + " 次", "白名单不计费", "换", "channel_settlement_rent")}
          ${kpi("下次账期", lease.nextDue || "—", "建议提前 3 天缴纳", "日", "channel_settlement_rent")}
        </div>
        <section class="panel">
          ${panelHead("月租账单", "向运营商支付设备月租", "channel_settlement_rent", `<button type="button" class="btn primary" data-rent-topup>提交月租缴纳（演示）</button>`)}
          <div class="panel-body">
            <div class="detail-grid">
              <div class="detail-item"><span>月租合计</span><strong>¥${(lease.monthlyRent || 0).toLocaleString()}/月</strong></div>
              <div class="detail-item"><span>租赁设备</span><strong>${lease.cabinets || 0} 柜 + ${lease.batteries || 0} 电</strong></div>
              <div class="detail-item"><span>专属站点</span><strong>${lease.dedicatedSiteName || contract?.dedicatedSiteName || "—"}</strong></div>
              <div class="detail-item"><span>签约运营商</span><strong>${lease.operatorName || "—"}</strong></div>
            </div>
          </div>
        </section>
        <section class="panel">
          ${panelHead("月租订单 MO-", "对公/在线向运营商付款", "day_pool_b2b_settlement")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>订单</th><th>账期</th><th>金额</th><th>设备数</th><th>付款</th><th>状态</th></tr></thead>
              <tbody>${orders.map(o => `<tr>
                <td>${o.id}</td><td>${o.period}</td><td>¥${o.amount.toLocaleString()}</td>
                <td>${o.devicesCovered} 台</td><td>${o.payMethod}</td><td>${tag(o.orderStatus)}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("月租与换电记录", "入账/增租/白名单换电", "channel_settlement_rent")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>类型</th><th>金额</th><th>关联</th><th>说明</th></tr></thead>
              <tbody>${ledger.map(l => `<tr>
                <td>${l.time}</td><td>${tag(l.type)}</td>
                <td>${l.delta > 0 ? "¥" + l.delta.toLocaleString() : "—"}</td>
                <td>${l.ref}</td><td>${l.note}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderRentDevices() {
      const cid = channelEntityId();
      const devices = channelRentDevices.filter(d => d.channelId === cid);
      const contract = myChannelContracts()[0];
      const lease = channelLeaseSummary.find(p => p.channelId === cid) || {};
      const isOp = isOperatorRole();
      const addBtn = isOp ? `<button type="button" class="btn primary" data-add-lease-device>+ 绑定设备</button>` : "";
      const siteBtn = isOp ? `<button type="button" class="link-btn" data-create-dedicated-site>新建专属站点</button>` : "";
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("lease_dedicated_site")} 专属站：<strong>${contract?.dedicatedSiteName || "—"}</strong> · 签约月租 <strong>¥${(contract?.monthlyRent || lease?.monthlyRent || 0).toLocaleString()}/月</strong> ${siteBtn}</div>
        <section class="panel">
          ${panelHead("租赁设备", "SN 与部署站点 · 月租为签约统一价", "module_rent_devices", addBtn)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>SN</th><th>类型</th><th>站点</th><th>本月换电</th><th>状态</th></tr></thead>
              <tbody>${devices.map(d => `<tr>
                <td>${d.sn}</td><td>${d.type}</td><td>${d.site}</td>
                <td>${d.swapCount} 次</td>
                <td>${tag(d.status)}</td>
              </tr>`).join("")}</tbody>
            </table>
            <p style="font-size:12px;color:var(--muted);margin:12px 0 0">在租 ${devices.filter(d => d.status === "在租").length} 台 · 月租按签约 <strong>¥${(contract?.monthlyRent || 0).toLocaleString()}/月</strong> 统一收取，不按单台计价</p>
          </div>
        </section>`;
    }

    function renderLeaseBatteryHold() {
      const cid = channelEntityId();
      const rows = channelBatteryHolders.filter(r => r.channelId === cid && r.status !== "已移除");
      const holding = rows.filter(r => r.batterySn);
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("lease_battery_hold")} 当前 <strong>${holding.length}</strong> 名白名单用户持有电池 · 数据来自换电/IoT 同步</div>
        <section class="panel">
          ${panelHead("电池持有", "白名单用户 ↔ 当前电池", "lease_battery_hold")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>用户</th><th>手机</th><th>电池 SN</th><th>SOC</th><th>取电时间</th><th>站点</th><th>状态</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td><strong>${r.userName}</strong><br><small>${r.userId}</small></td>
                <td>${r.phone}</td>
                <td>${r.batterySn ? `<strong>${r.batterySn}</strong>` : "—"}</td>
                <td>${r.soc != null ? r.soc + "%" : "—"}</td>
                <td>${r.since || "—"}</td>
                <td>${r.site}</td>
                <td>${tag(r.status)}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无白名单用户</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderLeasePkgPricing() {
      const cid = channelEntityId();
      const skus = channelLeasePkgSkus.filter(s => s.channelId === cid);
      const orders = channelLeasePkgOrders.filter(o => o.channelId === cid);
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("lease_whitelist_pkg")} 以下套餐<strong>仅白名单用户</strong>可在小程序购买；支付进入<strong>本渠道收款账户</strong>（演示：1678901234***）。</div>
        <section class="panel">
          ${panelHead("白名单套餐定价", "渠道自定 · 运营商不代设 C 端价", "lease_whitelist_pkg", `<button type="button" class="btn primary" data-edit-lease-pkg>编辑价格（演示）</button>`)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>SKU</th><th>套餐名</th><th>零售价</th><th>有效期</th><th>状态</th></tr></thead>
              <tbody>${skus.map(s => `<tr>
                <td>${s.id}</td><td><strong>${s.name}</strong></td><td>¥${s.price}</td>
                <td>${s.validityDays} 天</td><td>${tag(s.status)}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("白名单购套餐订单", "收款方 = 本渠道子商户", "lease_whitelist_pkg")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>订单</th><th>用户</th><th>套餐</th><th>实付</th><th>子商户</th><th>支付时间</th></tr></thead>
              <tbody>${orders.map(o => `<tr>
                <td>${o.id}</td><td>${o.userName}<br><small>${o.phone}</small></td><td>${o.skuName}</td>
                <td>¥${o.amount}</td><td>${o.subMch}</td><td>${o.payTime}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderLeaseWhitelist() {
      const cid = channelEntityId();
      const rows = channelLeaseWhitelist.filter(r => r.channelId === cid);
      const contract = myChannelContracts()[0];
      const isCh = isChannelRole();
      const addBtn = isCh ? `<button type="button" class="btn primary" data-add-whitelist-user>+ 添加白名单</button>` : "";
      return `
        ${ownScopeBanner()}
        <div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("lease_whitelist")}${noteBtn("lease_whitelist_access")} 白名单由<strong>渠道自行维护</strong>（扁平名单，<strong>无团队</strong>）。<strong>白名单免费</strong>：B2B 月租覆盖，免购套餐换电；<strong>白名单付费</strong>：须购<strong>白名单套餐</strong>后方可换电。签约默认类型：<strong>${contract?.whitelistDefaultAccess === "free" ? "白名单免费" : "白名单付费"}</strong>。</div>
        <section class="panel">
          ${panelHead("白名单用户", "添加/移除可换电骑手 · 区分免费/付费", "lease_whitelist", addBtn)}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>骑手</th><th>手机</th><th>白名单类型</th><th>套餐状态</th><th>添加时间</th><th>本月换电</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.name}</td><td>${r.phone}</td>
                <td>${whitelistAccessLabel(r.whitelistAccess || "paid")}</td>
                <td>${r.whitelistAccess === "free" ? "—" : tag(r.pkgStatus || "—")}</td>
                <td>${r.addedAt}<br><small>${r.addedBy || "—"}</small></td>
                <td>${r.swaps || 0}</td><td>${tag(r.status)}</td>
                <td>${isCh && r.status === "启用" ? `<button type="button" class="link-btn" data-remove-whitelist="${r.id}">移除</button>` : "—"}</td>
              </tr>`).join("")}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderChannelInterOp() {
      const cid = channelEntityId();
      const pol = channelSwapPolicyFor(cid);
      const contract = myChannelContracts()[0];
      const rows = myChannelInterOpLedger();
      const pendingPay = rows.filter(r => r.status === "待日清").reduce((s, r) => s + (r.cabinetFee || 0) + (r.batteryFee || 0), 0);
      const creditWarn = pol.crossNetworkEnabled && !pol.crossNetworkDepositPaid
        ? `<div class="pool-warn-banner">⚠ 跨网已签约但未缴平台保证金，跨网换电不可用。${noteBtn("channel_lease_crossnet")}</div>`
        : (pol.crossSwapEnabled === false
          ? `<div class="pool-warn-banner">⚠ 渠道信用额度不足，已关闭跨网换电。${noteBtn("channel_lease_crossnet")}</div>`
          : "");
      const rowHtml = rows.map(r => `<tr>
        <td>${r.swapId}</td><td>${r.date}</td><td>${r.site}</td>
        <td>${tag("平台代付")}</td>
        <td>¥${((r.cabinetFee || 0) + (r.batteryFee || 0)).toFixed(2)}</td>
        <td><small>${r.feeType}</small></td><td>${tag(r.status)}</td>
      </tr>`).join("");
      return `${ownScopeBanner()}
        <div class="platform-price-banner">${noteBtn("channel_inter_op")}${noteBtn("channel_lease_crossnet")}
          设备租赁渠道开通跨网后，本渠道骑手在他网换电的<strong>跨网设备服务费</strong>经平台代收代付；渠道只见平台代付/代收，不见对手方运营商。
          统价：柜 ¥${l1UnifiedPricing.cabinetFee}/次 · 电 ¥${l1UnifiedPricing.batteryFee}/次。
        </div>
        ${creditWarn}
        <div class="kpi-grid">
          ${kpi("跨网开关", pol.crossNetworkEnabled ? "已开通" : "未开通", contract?.crossNetworkDepositPaid ? "保证金已缴" : "—", "跨", "channel_lease_crossnet")}
          ${kpi("跨网保证金", pol.depositBalance != null ? "¥" + pol.depositBalance.toLocaleString() : "—", "应缴 ¥" + (pol.crossNetworkDepositAmount || 20000).toLocaleString(), "保", "channel_lease_crossnet")}
          ${kpi("信用可用", pol.available != null ? "¥" + pol.available.toLocaleString() : "—", pol.crossSwapEnabled === false ? "已停跨网" : "跨网扣款", "额", "day_pool_channel")}
          ${kpi("待日清代付", "¥" + pendingPay.toFixed(2), "近期待清分", "付", "channel_inter_op")}
        </div>
        <section class="panel">
          ${panelHead("跨网往来明细", "本渠道骑手在他网换电 · 平台代收代付", "channel_inter_op")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>换电单</th><th>日期</th><th>站点</th><th>方向</th><th>金额</th><th>费用项</th><th>状态</th></tr></thead>
              <tbody>${rowHtml || "<tr><td colspan='7'>暂无跨网往来</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderChannelCredit() {
      if (isCardChannel()) {
        return `${ownScopeBanner()}
          <section class="panel">
            ${panelHead("渠道信用额度", "分销渠道不适用", "channel_settlement_card")}
            <div class="panel-body">
              <p style="margin:0;font-size:13px;color:var(--muted);line-height:1.8">
                <strong>${channelProfile().name}</strong> 为<strong>推广分销渠道</strong>：用户经链接直购套餐，按个人用户规则处理押金/免押，<strong>不涉及</strong>渠道统管骑手与渠道信用评估。<br>
                渠道信用额度仅适用于<strong>人天池</strong>、<strong>设备租赁</strong>等统管骑手/设备的结算模式。
              </p>
            </div>
          </section>`;
      }
      const profile = channelCreditProfiles.find(p => p.channelId === channelEntityId());
      if (!profile) return `${ownScopeBanner()}<p class="scope-hint">暂无渠道信用档案。</p>`;
      const std = platformDepositStandard;
      const proofs = channelDepositProofs.filter(p => p.channelId === channelEntityId());
      const isOp = isOperatorRole();
      const isCh = isChannelRole();
      const gap = profile.gap || Math.max(0, profile.requiredDeposit - (profile.creditedAmount || profile.creditLimit || 0));
      const depOk = gap <= 0;
      const tierRows = creditTierConfig.map(t => `<tr><td>${t.tier}</td><td>${t.scoreMin}–${t.scoreMax}</td><td>${t.deductRatio}%</td></tr>`).join("");
      const proofRows = proofs.map(p => `<tr>
        <td>${p.id}</td><td>¥${p.amount.toLocaleString()}</td><td>${p.transferRef}</td><td>${p.transferDate}</td>
        <td>${tag(p.status)}</td><td>${p.reviewTime || p.submitTime}</td>
        <td>${isOp && p.status === "待审核" ? `<button type="button" class="link-btn" data-approve-deposit-proof="${p.id}">通过</button> <button type="button" class="link-btn" data-reject-deposit-proof="${p.id}">驳回</button>` : "—"}</td>
      </tr>`).join("");
      const opAdjust = isOp ? `<button type="button" class="btn" data-adjust-channel-credit="${profile.channelId}">调整信用额度</button>` : "";
      const chSubmit = isCh && gap > 0 ? `<button type="button" class="btn primary" data-submit-deposit-proof>提交打款凭证</button>` : "";
      return `
        ${ownScopeBanner()}
        <section class="panel">
          ${panelHead("渠道信用额度", "平台评估 · 运营商可调整 · 渠道提交凭证审核", "day_pool_channel", opAdjust + chSubmit)}
          <div class="panel-body">
            <div class="platform-price-banner" style="margin-bottom:14px">平台统一押金标准：电池 <strong>¥${std.battery.toLocaleString()}</strong>/块 · 换电柜 <strong>¥${std.cabinet.toLocaleString()}</strong>/台（${std.updatedAt} 更新）</div>
            <div class="kpi-grid">
              ${kpi("信用评分", profile.creditScore, profile.creditLevel + " · " + (profile.evalBy || "平台"), "信", "day_pool_channel")}
              ${kpi("信用额度", "¥" + profile.creditLimit.toLocaleString(), profile.operatorOverride ? "运营商已调整" : "平台评估", "额", "day_pool_channel")}
              ${kpi("应押总额", "¥" + profile.requiredDeposit.toLocaleString(), profile.ridersOnBook + " 在册骑手", "押", "orders_deposit")}
              ${kpi("待补缴", depOk ? "¥0" : "¥" + gap.toLocaleString(), depOk ? "已覆盖" : "请提交凭证", depOk ? "✓" : "!", "orders_deposit")}
            </div>
            <div class="detail-grid" style="margin-top:16px">
              <div class="detail-item"><span>信用抵扣额</span><strong>¥${(profile.creditedAmount || profile.creditLimit).toLocaleString()}</strong></div>
              <div class="detail-item"><span>单骑手标准</span><strong>¥${profile.perDeviceDeposit.battery}/电池</strong></div>
              <div class="detail-item"><span>渠道用户策略</span><strong>${profile.channelUserDepositPolicy}</strong></div>
              <div class="detail-item"><span>最近评估</span><strong>${profile.updatedAt}</strong></div>
            </div>
            ${profile.alert ? `<div class="pool-warn-banner" style="margin-top:16px">${profile.alert}</div>` : ""}
          </div>
        </section>
        <section class="panel">
          ${panelHead("分级抵扣规则", "平台可配置 · 按信用评分映射", "day_pool_channel")}
          <div class="panel-body orders-table-wrap">
            <table><thead><tr><th>等级</th><th>得分区间</th><th>抵扣比例</th></tr></thead><tbody>${tierRows}</tbody></table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("押金补缴凭证", isOp ? "渠道提交 · 运营商审核" : "提交线下打款凭证", "day_pool_channel")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>凭证号</th><th>金额</th><th>流水号</th><th>转账日</th><th>状态</th><th>时间</th><th>操作</th></tr></thead>
              <tbody>${proofRows || "<tr><td colspan='7'>暂无凭证</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function renderDayPool() {
      syncTeamRiderCounts();
      if (isOrgAdminLogin()) state.dayPoolTab = "consume";
      const teamBanner = isTeamAdminLogin() ? (() => {
        const team = dayPoolTeams.find(t => t.id === teamAdminScopeTeamId());
        return `<div class="perm-banner" style="margin-bottom:14px">团队管理员 · <strong>${team ? team.name : "—"}</strong>：仅可查看本团队消耗明细并导出（只读，不可登记/调额）。</div>`;
      })() : "";
      const pools = myDayPools().filter(p => {
        const f = getPf();
        if (!matchKw(p.id, f.poolId) && !matchKw(p.name, f.poolId)) return false;
        if (f.status !== "全部" && p.status !== f.status) return false;
        return true;
      });
      if (!state.dayPoolSelectedId && pools[0]) state.dayPoolSelectedId = pools[0].id;
      const sel = selectedDayPool();
      const isSeller = false;
      const tab = state.dayPoolTab;
      const tabs = isOrgAdminLogin() ? [["consume", "消耗明细"]] : [
        ["pools", "额度池"], ["teams", "骑手团队"], ["riders", "骑手登记"], ["allocations", "额度分配"],
        ["rules", "额度使用规则"], ["consume", "消耗明细"], ["retail", "零售价"],
        ["exceptions", "异常记录"], ["ledger", "额度明细"]
      ];
      const sidebar = tabSidebar(tabs, tab, "dptab");

      let body = "";
      if (tab === "pools") {
        body = `<section class="panel">
          ${panelHead("额度池列表", "一运营商一池；增购入账同一池，见额度明细", "day_pool_panel", canEditDayPool() ? `<button type="button" class="btn primary" data-pool-form="purchase">增购人天额度</button>` : "")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr>
                <th>额度池</th><th>${isSeller ? "购买方" : "售卖方"}</th><th>总购买</th><th>赠送</th>
                <th>预占/冻结</th><th>已消耗</th><th>可用余额</th><th>余额比例</th>
                <th>有效期</th><th>状态</th><th>操作</th>
              </tr></thead>
              <tbody>${pools.map(p => `<tr class="${p.id === (sel && sel.id) ? "site-stats-total" : ""}" data-select-pool="${p.id}" style="cursor:pointer">
                <td><strong>${p.name}</strong><br><small style="color:var(--muted)">${p.id}</small></td>
                <td>${isSeller ? p.ownerName : p.sellerName}</td>
                <td>${p.totalDays - p.giftedDays} 人天</td>
                <td>${p.giftedDays || "—"}</td>
                <td>${p.frozenDays}</td>
                <td>${p.consumedDays}</td>
                <td><strong>${p.availableDays}</strong></td>
                <td>${p.balancePct < 20 ? tag("余额不足 " + p.balancePct + "%") : p.balancePct + "%"}</td>
                <td>${p.validFrom} ~ ${p.validTo}</td>
                <td>${poolStatusTag(p.status)}${p.warnSms ? "<br><small>已短信预警</small>" : ""}</td>
                <td class="row-actions">
                  <button type="button" class="link-btn" data-select-pool="${p.id}">详情</button>
                  ${canEditDayPool() ? `<button type="button" class="link-btn" data-pool-form="renew" data-pool-id="${p.id}">续费</button>` : ""}
                </td>
              </tr>`).join("") || "<tr><td colspan='11'>暂无额度池</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
        if (sel) {
          body += `<section class="panel">
            ${panelHead(sel.name + " 详情", sel.id + " · 订单 " + sel.orderNo, "day_pool_ledger")}
            <div class="panel-body">
              <div class="detail-grid">
                <div class="detail-item"><span>扣天口径</span><strong>${sel.deductMode}</strong></div>
                <div class="detail-item"><span>激活时机</span><strong>${sel.activationMode}</strong></div>
                <div class="detail-item"><span>池过期退款</span><strong>${sel.poolExpiryRefund}</strong></div>
                <div class="detail-item"><span>批发单价</span><strong>¥${sel.wholesalePrice}/人天</strong></div>
                <div class="detail-item"><span>可退款购买额度</span><strong>${Math.max(0, sel.availableDays - sel.giftedDays)} 人天</strong></div>
              </div>
              <div class="usage-bar"><i style="width:${Math.min(100, sel.balancePct)}%"></i></div>
              <small style="color:var(--muted)">已消耗 ${sel.consumedDays} · 预占 ${sel.frozenDays} · 可用 ${sel.availableDays} / 总量 ${sel.totalDays}</small>
              <div class="stat-pills">
                <span class="stat-pill">底层 <strong>分钟账本</strong>（1人天=1440分钟）</span>
                <span class="stat-pill">今日预占 <strong>${sel.frozenDays}</strong> 人天</span>
                <span class="stat-pill">今日确认 <strong>7</strong> 人天（含 1 人仅持电池）</span>
              </div>
            </div>
          </section>`;
        }
      } else if (tab === "teams") {
        const f = getPf();
        const multiPool = myDayPools().length > 1;
        const teams = myChannelTeams().filter(t => {
          if (!matchKw(t.name, f.keyword)) return false;
          if (f.poolId !== "全部" && resolveTeamPoolId(t) !== f.poolId) return false;
          return true;
        });
        const poolHint = multiPool
          ? `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("day_pool_team")} 当前仅 1 个额度池，所有团队<strong>自动绑定</strong>该池扣减。</div>`
          : `<div class="platform-price-banner" style="margin-bottom:14px">${noteBtn("day_pool_team")} 当前仅 1 个额度池，所有团队<strong>自动绑定</strong>该池扣减。</div>`;
        body = `${poolHint}<section class="panel">
          ${panelHead("骑手团队", "创建团队、分配骑手；团队绑定消耗额度池", "day_pool_team", canEditDayPool() ? `<button type="button" class="btn primary" data-pool-form="team">新增团队</button>` : "")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>团队</th><th>消耗额度池</th><th>在职骑手</th><th>默认</th><th>创建时间</th><th>备注</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>${teams.map(t => `<tr>
                <td><strong>${t.name}</strong><br><small>${t.id}</small></td>
                <td>${teamPoolCell(t)}</td>
                <td>${t.riderCount || 0}</td>
                <td>${t.isDefault ? tag("默认") : "—"}</td>
                <td>${t.createdAt || "—"}</td>
                <td>${t.remark || "—"}</td>
                <td>${tag(t.status)}</td>
                <td class="row-actions">
                  ${canEditDayPool() && multiPool ? `<button type="button" class="link-btn" data-pool-form="teamPool" data-pool-id="${t.id}">设置消耗池</button>` : (multiPool ? "" : `<small style="color:var(--muted)">自动绑定</small>`)}
                </td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无团队</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "rules") {
        const f = getPf();
        const rules = dayPoolRules.filter(r => myDayPools().some(p => p.id === r.poolId)).filter(r => {
          if (f.poolId !== "全部" && r.poolId !== f.poolId) return false;
          if (f.teamId !== "全部" && r.teamId !== f.teamId) return false;
          if (f.status !== "全部" && r.status !== f.status) return false;
          return true;
        });
        const cfgPool = selectedDayPool() || pools[0];
        const cfgCard = cfgPool ? `<section class="panel">
          ${panelHead("额度池规则", "平台统一；B 端结算节奏由双方线下协商", "day_pool_contract")}
          <div class="panel-body">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("day_pool_identity")} 登记渠道团队前须无生效中个人套餐（可退订或冻结后加入）。</p>
            <div class="detail-grid">
              <div class="detail-item"><span>额度池</span><strong>${cfgPool.name}（${cfgPool.id}）</strong></div>
              <div class="detail-item"><span>扣天口径</span><strong>${cfgPool.deductMode}</strong></div>
              <div class="detail-item"><span>激活时机</span><strong>${cfgPool.activationMode}</strong></div>
              <div class="detail-item"><span>池过期退款</span><strong>${cfgPool.poolExpiryRefund}</strong></div>
            </div>
          </div>
        </section>` : "";
        body = `${cfgCard}${isChannelRole() ? `<div class="perm-banner" style="margin-bottom:14px">${noteBtn("day_pool_b2b_refund")} 人天额度池<strong>不支持在线退款</strong>；须与签约运营商线下协商，由运营商后台扣减额度。</div>` : ""}<section class="panel">
          ${panelHead("额度使用规则", "按团队配置周期额度上限；扣天/激活继承池级平台四项", "day_pool_rules", canEditDayPool() ? `<button type="button" class="btn primary" data-pool-form="rule">新增规则</button>` : "")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>规则</th><th>团队</th><th>额度池</th><th>团队上限</th><th>已用/上限</th><th>命中骑手</th><th>有效期</th><th>状态</th></tr></thead>
              <tbody>${rules.map(r => `<tr>
                <td><strong>${r.name}</strong><br><small>${r.id}</small></td>
                <td>${r.teamName || "—"}</td>
                <td>${r.poolId}</td>
                <td>${r.capDays || "—"} 人天/周期</td>
                <td>${r.capUsed != null ? r.capUsed + " / " + r.capDays : "—"}</td>
                <td>${r.hitRiders}</td>
                <td>${r.validFrom} ~ ${r.validTo}</td><td>${tag(r.status)}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无规则</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "riders") {
        const f = getPf();
        const riders = dayPoolRiders.filter(r => {
          if (!matchOrgScope(r)) return false;
          if (f.teamId !== "全部" && r.teamId !== f.teamId) return false;
          if (!matchKw(r.phone, f.keyword) && !matchKw(r.name, f.keyword) && !matchKw(r.id, f.keyword)) return false;
          if (f.quotaStatus !== "全部" && r.quotaStatus !== f.quotaStatus) return false;
          return myDayPools().some(p => p.id === r.poolId);
        });
        body = `<section class="panel">
          ${panelHead("登记骑手", "校验个人/渠道互斥；退出团队自动回池", "day_pool_channel", canEditDayPool() ? `<button type="button" class="btn primary" data-pool-form="register">登记骑手</button> <button type="button" class="btn" data-pool-form="batchRegister">批量导入</button>` : "")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>骑手</th><th>团队</th><th>消耗池</th><th>在职状态</th><th>已分配</th><th>已消耗</th><th>剩余额度</th><th>额度状态</th><th>今日权益</th><th>操作</th></tr></thead>
              <tbody>${riders.map(r => {
                const p = poolById(r.poolId);
                return `<tr>
                <td>${r.name}<br><small>${r.id} · ${r.phone}</small></td>
                <td>${r.team || "—"}</td>
                <td><small>${p ? p.name : r.poolId}</small></td>
                <td>${tag(r.status)}</td>
                <td>${r.allocatedDays || 0} 人天</td><td>${r.usedDays || 0} 人天</td>
                <td><strong>${r.remainingDays || 0}</strong> 人天</td>
                <td>${tag(r.quotaStatus || "未分配")}</td>
                <td>${eligibilityTag(r.todayEligibility)}${r.failReason ? `<br><small style="color:var(--red)">${r.failReason}</small>` : ""}</td>
                <td class="row-actions">${canEditDayPool() && r.status === "在职" ? `<button type="button" class="link-btn" data-pool-form="leaveTeam" data-rider-id="${r.id}">移出团队</button>` : "—"}</td>
              </tr>`;
              }).join("") || "<tr><td colspan='10'>暂无登记骑手</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "allocations") {
        const f = getPf();
        const riders = dayPoolRiders.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (f.poolId !== "全部" && r.poolId !== f.poolId) return false;
          if (f.riderId && !matchKw(r.id, f.riderId) && !matchKw(r.name, f.riderId)) return false;
          return true;
        });
        const logs = dayPoolAllocationLogs.filter(l => {
          if (!myDayPools().some(p => p.id === l.poolId)) return false;
          if (f.poolId !== "全部" && l.poolId !== f.poolId) return false;
          if (f.riderId && !matchKw(l.riderId, f.riderId) && !matchKw(l.riderName, f.riderId)) return false;
          if (f.type !== "全部" && l.type !== f.type) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("骑手额度分配", "从额度池分配给骑手；未使用额度可收回至池", "day_pool_allocate")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>骑手</th><th>团队</th><th>消耗池</th><th>已分配</th><th>已消耗</th><th>剩余可收回</th><th>额度状态</th><th>操作</th></tr></thead>
              <tbody>${riders.map(r => `<tr>
                <td>${r.name}<br><small>${r.id}</small></td>
                <td>${r.team || "—"}</td>
                <td><small>${(poolById(r.poolId) || {}).name || r.poolId}</small></td>
                <td>${r.allocatedDays || 0} 人天</td><td>${r.usedDays || 0} 人天</td>
                <td><strong>${r.remainingDays || 0}</strong> 人天</td>
                <td>${tag(r.quotaStatus || "未分配")}</td>
                <td class="row-actions">
                  ${canEditDayPool() && r.status === "在职" ? `<button type="button" class="link-btn" data-pool-form="allocate" data-pool-id="${r.poolId}" data-rider-id="${r.id}">分配</button>` : ""}
                  ${canEditDayPool() && (r.remainingDays || 0) > 0 ? `<button type="button" class="link-btn" data-pool-form="recover" data-pool-id="${r.poolId}" data-rider-id="${r.id}">收回</button>` : ""}
                </td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无骑手</td></tr>"}</tbody>
            </table>
          </div>
        </section>
        <section class="panel">
          ${panelHead("分配/收回明细", "渠道商操作留痕；含购买与消耗记录", "day_pool_purchase")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>额度池</th><th>操作</th><th>骑手</th><th>人天数</th><th>池余额后</th><th>操作人</th><th>备注</th></tr></thead>
              <tbody>${logs.map(l => `<tr>
                <td>${l.time}</td><td>${l.poolId}</td><td>${tag(l.type)}</td>
                <td>${l.riderName !== "—" ? l.riderName + "<br><small>" + l.riderId + "</small>" : "—"}</td>
                <td>${l.type === "收回" || l.type === "消耗" ? "-" : "+"}${l.days}</td>
                <td>${l.poolBalanceAfter}</td><td>${l.operator}</td><td>${l.remark || "—"}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无明细</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "consume") {
        const f = getPf();
        const sub = state.dayPoolConsumeSubTab || "rider";
        const subTabs = [["rider", "骑手日消耗"], ["swaps", "换电同步"], ["summary", "团队汇总"]];
        const subSidebar = innerTabSidebar(subTabs, sub, "dpconsume-sub");
        const exportBtn = isTeamAdminLogin() && employeeHasPerm("day_pool.export")
          ? `<button type="button" class="btn primary" id="btnExportOrgConsume">导出本团队 CSV</button>` : "";
        const teamFilterName = f.teamId !== "全部" ? (dayPoolTeams.find(t => t.id === f.teamId) || {}).name : null;
        const riderRows = dayPoolRiderDailyConsume.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (!matchTeamScope(r)) return false;
          if (teamFilterName && r.team !== teamFilterName) return false;
          if (f.dateFrom && r.date < f.dateFrom) return false;
          if (f.dateTo && r.date > f.dateTo) return false;
          if (f.riderId && !matchKw(r.riderId, f.riderId) && !matchKw(r.riderName, f.riderId)) return false;
          return true;
        });
        const swapRows = channelRiderSwapSync.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (!matchTeamScope(r)) return false;
          if (teamFilterName && r.team !== teamFilterName) return false;
          if (f.riderId && !matchKw(r.riderId, f.riderId) && !matchKw(r.riderName, f.riderId)) return false;
          return true;
        });
        const sumRows = dayPoolDailyConsume.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (!matchTeamScope(r)) return false;
          if (teamFilterName && r.team !== teamFilterName) return false;
          if (f.dateFrom && r.date < f.dateFrom) return false;
          if (f.dateTo && r.date > f.dateTo) return false;
          return true;
        });
        const consumeBanner = `<div class="perm-banner" style="margin-bottom:14px">${noteBtn("day_pool_consume")} <strong>渠道商说明</strong>：骑手当天<strong>未换电但持有电池</strong>也视为使用服务并确认 1 人天；<strong>不持电池且未换电</strong>则不产生消耗。</div>`;
        if (sub === "rider") {
          body = `${consumeBanner}${pageWithInnerTabs(subSidebar, `<section class="panel">
            ${panelHead("骑手日消耗明细", "每骑手每日 1 条；含换电次数与持有电池数", "day_pool_consume", exportBtn)}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>日期</th><th>骑手</th><th>团队</th><th>站点</th>
                  <th>换电次数</th><th>持有电池</th><th>确认人天</th><th>确认原因</th><th>状态</th>
                </tr></thead>
                <tbody>${riderRows.map(r => `<tr>
                  <td>${r.date}</td>
                  <td>${r.riderName}<br><small>${r.riderId}</small></td>
                  <td>${r.team || "—"}</td><td>${r.site}</td>
                  <td>${r.swapCount}</td><td>${r.batteryHeld}</td>
                  <td><strong>${r.confirmedDays}</strong></td>
                  <td>${r.confirmReason === "持电池" ? tag("持电池") : r.confirmReason === "换电" ? tag("换电") : "—"}</td>
                  <td>${tag(r.status)}</td>
                </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
        } else if (sub === "swaps") {
          body = `${consumeBanner}${pageWithInnerTabs(subSidebar, `<section class="panel">
            ${panelHead("换电同步记录", "每次换电实时同步至渠道商", "day_pool_swap_sync")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>同步时间</th><th>换电单</th><th>骑手</th><th>团队</th><th>站点</th><th>跨网</th><th>状态</th>
                </tr></thead>
                <tbody>${swapRows.map(r => `<tr>
                  <td>${r.syncedAt}</td><td>${r.swapId}</td>
                  <td>${r.riderName}<br><small>${r.riderId}</small></td>
                  <td>${r.team || "—"}</td><td>${r.site}</td>
                  <td>${r.crossNet ? tag("跨网") : "—"}</td><td>${tag(r.status)}</td>
                </tr>`).join("") || "<tr><td colspan='7'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
        } else {
          body = `${consumeBanner}${pageWithInnerTabs(subSidebar, `<section class="panel">
            ${panelHead("团队每日汇总", "预占/确认/释放与换电、持电池勾稽", "day_pool_reserve")}
            <div class="panel-body orders-table-wrap">
              <table>
                <thead><tr>
                  <th>日期</th><th>团队</th><th>站点</th>
                  <th>预占</th><th>确认消耗</th><th>释放</th>
                  <th>换电用户</th><th>换电次数</th><th>仅持电池</th><th>未消耗</th>
                </tr></thead>
                <tbody>${sumRows.map(r => `<tr>
                  <td>${r.date}</td><td>${r.team || "—"}</td><td>${r.site}</td>
                  <td>${r.reserved}</td><td>${r.confirmed}</td><td>${r.released}</td>
                  <td>${r.swapUsers}</td><td>${r.swapCount}</td>
                  <td>${r.batteryOnlyUsers || 0}</td><td>${r.unreleased}</td>
                </tr>`).join("") || "<tr><td colspan='10'>暂无</td></tr>"}</tbody>
              </table>
            </div>
          </section>`)}`;
        }
      } else if (tab === "retail") {
        const f = getPf();
        const contract = myChannelContracts()[0];
        const wholesale = contract ? contract.wholesalePrice : platformAccrualDayPrice();
        const rows = operatorPkgPrices.filter(r => {
          if (f.city !== "全部" && r.city !== f.city) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("骑手零售价（只读）", "运营商城市级统一定价，不区分站点；无预占人天时默认推荐<strong>1天/单次</strong>兜底 SKU（购后24h）", "day_pool_retail")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>城市</th><th>套餐</th><th>有效期</th><th>渠道兜底</th><th>零售价</th><th>合同批发价</th><th>状态</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.city}</td><td>${r.pkg}</td>
                <td>${r.validityHours ? r.validityHours + "h" : "—"}</td>
                <td>${r.channelFallback ? tag("兜底") : "—"}</td>
                <td>¥${r.retailPrice}</td><td>¥${wholesale}/人天</td>
                <td>${tag(r.status)}</td>
              </tr>`).join("") || "<tr><td colspan='7'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "exceptions") {
        const f = getPf();
        const rows = dayPoolExceptions.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (f.type !== "全部" && r.type !== f.type) return false;
          if (f.status !== "全部" && r.status !== f.status) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("异常记录", "预占失败整批处理；支付退款资格/额度人工处理", "day_pool_insufficient")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>异常</th><th>额度池</th><th>类型</th><th>日期</th><th>影响人数</th><th>说明</th><th>状态</th><th>重试来源</th><th>操作</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.id}</td><td>${r.poolId}</td><td>${r.type}</td><td>${r.batchDate}</td>
                <td>${r.affected}</td><td>${r.detail}</td><td>${tag(r.status)}</td><td>${r.retrySource}</td>
                <td>${r.status === "待重试" && canEditDayPool() ? `<button type="button" class="link-btn" data-retry-ex="${r.id}">手动重试</button>` : "—"}</td>
              </tr>`).join("") || "<tr><td colspan='9'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      } else if (tab === "ledger") {
        const f = getPf();
        const rows = dayPoolLedger.filter(r => {
          if (!myDayPools().some(p => p.id === r.poolId)) return false;
          if (f.poolId !== "全部" && r.poolId !== f.poolId) return false;
          if (f.type !== "全部" && !r.type.includes(f.type.replace("预占", "资格预占").replace("确认消耗", "确认消耗").replace("释放", "释放"))) return false;
          return true;
        });
        body = `<section class="panel">
          ${panelHead("额度明细账本", "购买/分配/收回/预占/消耗全链路留痕；余额不得为负", "day_pool_ledger")}
          <div class="panel-body orders-table-wrap">
            <table>
              <thead><tr><th>时间</th><th>额度池</th><th>类型</th><th>变动（人天）</th><th>余额后</th><th>操作人</th><th>关联</th><th>原因</th></tr></thead>
              <tbody>${rows.map(r => `<tr>
                <td>${r.time}</td><td>${r.poolId}</td><td>${r.type}</td>
                <td>${r.deltaDays > 0 ? "+" : ""}${r.deltaDays === 0 ? "冻结→消耗" : r.deltaDays}</td>
                <td>${r.balanceAfter}</td><td>${r.operator}</td><td>${r.ref}</td><td>${r.reason}</td>
              </tr>`).join("") || "<tr><td colspan='8'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
      }

      const warnPool = pools.find(p => p.balancePct < 20);
      return `
        ${ownScopeBanner()}
        ${teamBanner}
        ${isTeamAdminLogin() ? "" : `<div class="pool-hero">${noteBtn("day_pool_panel")}${noteBtn("day_pool_channel")}${noteBtn("entitlement_api")}
          <h2>渠道商人天额度池</h2>
          <p>向运营商采购额度池 → 创建<strong>骑手团队</strong>并绑定消耗池 → 登记/分配骑手。00:00 预占；<strong>换电或持电池</strong>确认消耗；每次换电同步渠道商。</p>
        </div>`}
        ${!isTeamAdminLogin() && warnPool ? `<div class="pool-warn-banner">${noteBtn("day_pool_warn")}${noteBtn("day_pool_insufficient")}
          <strong>${warnPool.name}</strong> 可用余额 <strong>${warnPool.balancePct}%</strong>（${warnPool.availableDays}/${warnPool.totalDays} 人天）。
          ${canEditDayPool() ? `<button type="button" class="link-btn" data-pool-form="renew" data-pool-id="${warnPool.id}">立即续费</button>` : ""}
        </div>` : ""}
        ${!isTeamAdminLogin() && isChannelRole() ? `<div class="perm-banner" style="margin-bottom:14px">${noteBtn("day_pool_b2b_refund")} 额度池<strong>不支持在线退款</strong>，需与签约运营商线下协商。</div>` : ""}
        ${pageWithTabs(sidebar, body)}`;
    }

    function renderUsers() {
      const f = getPf();
      const opId = currentEntity().id;
      const st = operatorRiderDepositStats(opId);
      const us = users.filter(filterOwnRow).filter(u => {
        if (!matchKw(u.id, f.userId)) return false;
        if (!matchKw(u.phone, f.phone)) return false;
        if (f.pkgService !== "全部" && userPkgServiceType(u) !== f.pkgService) return false;
        if (f.serviceState !== "全部" && (u.serviceState || "") !== f.serviceState) return false;
        const dep = riderBatteryDepositInfo(u);
        if (f.depositKind && f.depositKind !== "全部" && dep.kind !== f.depositKind) return false;
        return true;
      });
      return `
        ${ownScopeBanner()}
        <section class="panel overview-kpi-panel">
          ${panelHead("骑手电池押金", "购套餐同笔实收 · 不参与平台/合伙人清分", "rider_battery_deposit")}
          <div class="panel-body">
            <div class="kpi-grid in-panel kpi-grid-4">
              ${kpi("实付在押总额", "¥" + st.heldAmount.toLocaleString("zh-CN"), "含退押中", "押", "rider_battery_deposit")}
              ${kpi("实付在押人数", st.heldUsers, "当前在账", "人", "rider_battery_deposit")}
              ${kpi("信用免押", st.creditUsers, "芝麻/支付分", "免", "orders_deposit_waiver")}
              ${kpi("渠道担保", st.channelUsers, "人天/白名单押金算渠道", "渠", "rider_battery_deposit")}
            </div>
            ${st.refundingAmount > 0 ? `<p style="margin:10px 0 0;font-size:12px;color:var(--muted)">其中退押处理中 <strong>¥${st.refundingAmount.toLocaleString("zh-CN")}</strong></p>` : ""}
          </div>
        </section>
        <section class="panel">
          ${panelHead("用户列表", `共 ${us.length} 人`, "users_panel")}
          <div class="panel-body">
            <p style="font-size:12px;color:var(--muted);margin:0 0 12px">${noteBtn("users_panel")}${noteBtn("rider_battery_deposit")} 押金类型：<strong>实付在押</strong> / <strong>信用免押</strong> / <strong>渠道担保</strong>。</p>
            <table>
              <thead><tr>
                <th>用户</th><th>套餐/服务</th><th>人天池权益</th><th>电池押金</th><th>期内换电</th><th>最近换电</th>
              </tr></thead>
              <tbody>${us.map(u => {
                const dep = riderBatteryDepositInfo(u);
                return `<tr>
                <td>${u.id}<br><small style="color:var(--muted)">${u.phone}</small></td>
                <td>${tag(u.serviceState || u.pkg)}<br><small style="color:var(--muted)">${u.pkg}</small></td>
                <td>${u.poolEligibility ? eligibilityTag(u.poolEligibility) + (u.poolTeam ? `<br><small>${u.poolTeam}</small>` : "") + (u.poolFailReason ? `<br><small style="color:var(--red)">${u.poolFailReason} · 可自费</small>` : "") : "—"}</td>
                <td>${riderDepositCellHtml(dep)}</td>
                <td>${scale(u.swaps)}</td>
                <td>${u.last}</td>
              </tr>`;
              }).join("") || "<tr><td colspan='6'>暂无</td></tr>"}</tbody>
            </table>
          </div>
        </section>`;
    }

    function openNoteModal(noteId) {
      const n = MODULE_NOTES[noteId];
      if (!n) return;
      document.querySelector("#noteTitle").textContent = n.title;
      document.querySelector("#noteBody").innerHTML = n.content;
      document.querySelector("#noteModal").classList.add("open");
      document.querySelector("#noteMask").classList.add("open");
    }

    function bindInteractiveActions(root) {
      if (!root) return;
      root.querySelectorAll("[data-cab-ops]").forEach(btn => {
        btn.onclick = () => {
          const sn = btn.dataset.cabOps;
          const op = btn.dataset.ops === "slot" ? "隔口开关" : "上下电";
          window.alert(`[Web 运维演示] ${sn} · ${op} 指令已下发（D17）`);
        };
      });
      root.querySelectorAll("[data-open-cab-detail]").forEach(btn => {
        btn.onclick = () => openCabinetDetailPage(btn.dataset.openCabDetail);
      });
      root.querySelectorAll("[data-cab-back]").forEach(btn => {
        btn.onclick = () => { state.cabinetDetailSn = null; render(); };
      });
      root.querySelectorAll("[data-cab-demo]").forEach(btn => {
        btn.onclick = () => window.alert(`[IoT 远程运维 · 演示桩] ${btn.dataset.cabDemo} 已模拟下发；生产接真实 IoT 指令接口`);
      });
      root.querySelectorAll("[data-cab-refresh-iccid]").forEach(btn => {
        btn.onclick = () => window.alert("演示：已刷新物联网卡状态");
      });
      root.querySelectorAll("[data-cab-confirm-swap]").forEach(btn => {
        btn.onclick = () => {
          const c = cabinetBySn(btn.dataset.cabConfirmSwap);
          const sel = root.querySelector(`[data-cab-swap-mode="${c?.sn}"]`);
          if (!c || !sel) return;
          c.swapMode = sel.value;
          window.alert(`演示：换电模式已切换为「${sel.value}」`);
          render();
        };
      });
      root.querySelectorAll("[data-cab-confirm-bt]").forEach(btn => {
        btn.onclick = () => {
          const c = cabinetBySn(btn.dataset.cabConfirmBt);
          const sel = root.querySelector(`[data-cab-bt-type="${c?.sn}"]`);
          if (!c || !sel) return;
          c.bluetoothType = sel.value;
          window.alert(`演示：蓝牙类型已切换为「${sel.value}」`);
          render();
        };
      });
      root.querySelectorAll("[data-cab-port-cmd]").forEach(btn => {
        btn.onclick = () => {
          const [sn, port, cmd] = (btn.dataset.cabPortCmd || "").split(":");
          const labels = { open: "开门", refresh: "刷新", charge: "补电", powerOn: "通电", powerOff: "断电" };
          window.alert(`[Web 运维演示] ${sn} · 端口 ${port} · ${labels[cmd] || cmd}（D17）`);
        };
      });
      root.querySelectorAll("[data-cab-port-toggle]").forEach(btn => {
        btn.onclick = () => {
          const [sn, port] = (btn.dataset.cabPortToggle || "").split(":");
          window.alert(`演示：${sn} 端口 ${port} 服务状态已切换`);
        };
      });
      root.querySelectorAll("[data-open-cab-compose]").forEach(btn => {
        btn.onclick = () => {
          const c = cabinetBySn(btn.dataset.openCabCompose);
          if (c) openCabinetDrawer(c, "compose");
        };
      });
      root.querySelectorAll("[data-edit-cab]").forEach(btn => {
        btn.onclick = () => {
          const c = cabinetBySn(btn.dataset.editCab);
          if (c) openCabinetDrawer(c, "edit");
        };
      });
      root.querySelectorAll("[data-move-cab]").forEach(btn => {
        btn.onclick = () => openMoveCabinetForm(btn.dataset.moveCab);
      });
      root.querySelectorAll("[data-export-bat-flow]").forEach(btn => {
        btn.onclick = () => window.alert("演示：已生成电池流转记录 CSV（近 30 天 · 按 SN 汇总）");
      });
      root.querySelectorAll("[data-cab-ops-log]").forEach(btn => {
        btn.onclick = () => {
          state.deviceTab = "alerts";
          render();
        };
      });
      const saveCabBtn = root.querySelector("#saveCabEdit");
      if (saveCabBtn) {
        saveCabBtn.onclick = () => {
          const c = cabinetBySn(saveCabBtn.dataset.sn);
          if (!c) return;
          const form = document.querySelector("#cabEditForm");
          if (form) {
            c.deviceName = form.querySelector("[name=deviceName]")?.value || "";
            c.deployAddress = form.querySelector("[name=deployAddress]")?.value || "";
            c.deviceStatus = form.querySelector("[name=deviceStatus]")?.value || "启用";
          }
          closeDrawer();
          render();
          window.alert("换电柜信息已保存（演示）");
        };
      }
      root.querySelectorAll("[data-open-data-panel]").forEach(btn => {
        btn.onclick = () => openDataPanel(btn.dataset.openDataPanel);
      });
      root.querySelectorAll("[data-copy-link]").forEach(btn => {
        btn.onclick = () => {
          const url = btn.dataset.copyLink;
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(url).then(() => showProtoToast("已复制小程序链接"));
          } else {
            openProtoCopyUrl(url, "复制小程序链接");
          }
        };
      });
      root.querySelectorAll("[data-show-qr]").forEach(btn => {
        btn.onclick = () => {
          const link = channelPromoLinks.find(l => l.id === btn.dataset.showQr);
          openQrModal(link);
        };
      });
      root.querySelectorAll("[data-new-promo-link]").forEach(btn => {
        btn.onclick = () => {
          const pkgs = channelPackagesFor(channelEntityId());
          state.channelLinkForm = { packageId: pkgs[0]?.id || "", purpose: "" };
          render();
        };
      });
      root.querySelectorAll("[data-cancel-promo-link]").forEach(btn => {
        btn.onclick = () => { state.channelLinkForm = null; render(); };
      });
      if (root === document) {
      const savePromoLink = document.querySelector("[data-save-promo-link]");
      if (savePromoLink) {
        savePromoLink.onclick = () => {
          const packageId = document.querySelector("#newLinkPackage")?.value;
          const purpose = document.querySelector("#newLinkPurpose")?.value;
          if (!createPromoLink(channelEntityId(), packageId, purpose)) {
            window.alert("请填写链接用途");
            return;
          }
          state.channelLinkForm = null;
          window.alert("演示：推广链接已生成");
          render();
        };
      }
      }
      root.querySelectorAll("[data-toggle-promo-link]").forEach(btn => {
        btn.onclick = () => {
          const link = channelPromoLinks.find(l => l.id === btn.dataset.togglePromoLink);
          if (!link) return;
          link.status = link.status === "启用" ? "停用" : "启用";
          render();
        };
      });
      root.querySelectorAll("[data-rent-topup]").forEach(btn => {
        btn.onclick = () => openRentTopupForm();
      });
      root.querySelectorAll("[data-dtab]").forEach(btn => {
        btn.onclick = () => { state.deviceTab = btn.dataset.dtab; state.cabinetDetailSn = null; render(); };
      });
      root.querySelectorAll("[data-otab]").forEach(btn => {
        btn.onclick = () => { state.orderTab = btn.dataset.otab; render(); };
      });
      root.querySelectorAll("[data-ftab]").forEach(btn => {
        btn.onclick = () => { state.flowTab = btn.dataset.ftab; render(); };
      });
      root.querySelectorAll("[data-emptab]").forEach(btn => {
        btn.onclick = () => { state.employeeTab = btn.dataset.emptab; render(); };
      });
      root.querySelectorAll("[data-dptab]").forEach(btn => {
        btn.onclick = () => { state.dayPoolTab = btn.dataset.dptab; render(); };
      });
      root.querySelectorAll("[data-dpconsume-sub]").forEach(btn => {
        btn.onclick = () => { state.dayPoolConsumeSubTab = btn.dataset.dpconsumeSub; render(); };
      });
      root.querySelectorAll("[data-prtab]").forEach(btn => {
        btn.onclick = () => { state.pricingTab = btn.dataset.prtab; render(); };
      });
      root.querySelectorAll("[data-pu-page]").forEach(btn => {
        btn.onclick = () => {
          if (btn.disabled) return;
          const p = Number(btn.dataset.puPage);
          if (!Number.isFinite(p) || p < 1) return;
          state.platformUsersPage = p;
          render();
        };
      });
      const personalDepForm = root.querySelector("#personalDepositForm");
      if (personalDepForm) {
        personalDepForm.onsubmit = (e) => {
          e.preventDefault();
          const fd = new FormData(personalDepForm);
          const amount = parseFloat(fd.get("amount"));
          if (Number.isNaN(amount) || amount < 0) {
            window.alert("请填写有效的押金数额（≥ 0）");
            return;
          }
          const cfg = myPersonalDepositSettings();
          cfg.amount = Math.round(amount * 100) / 100;
          cfg.enabled = String(fd.get("enabled")) !== "0";
          cfg.note = String(fd.get("note") || "").trim();
          cfg.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
          cfg.updatedBy = currentEmployee()?.name || currentEntity().name;
          if (typeof showProtoToast === "function") showProtoToast("押金设置已保存（演示 · 本地 Mock）");
          else window.alert("押金设置已保存（演示 · 本地 Mock）");
          render();
        };
      }
      root.querySelectorAll("[data-cstab]").forEach(btn => {
        btn.onclick = () => { state.channelSalesTab = btn.dataset.cstab; render(); };
      });
      root.querySelectorAll("[data-potab]").forEach(btn => {
        btn.onclick = () => { state.platformOrderTab = btn.dataset.potab; render(); };
      });
      root.querySelectorAll("[data-pftab]").forEach(btn => {
        btn.onclick = () => { state.platformFlowTab = btn.dataset.pftab; render(); };
      });
      root.querySelectorAll("[data-pdtab]").forEach(btn => {
        btn.onclick = () => { state.platformDeviceTab = btn.dataset.pdtab; render(); };
      });
      root.querySelectorAll("[data-pctab]").forEach(btn => {
        btn.onclick = () => { state.platformChannelTab = btn.dataset.pctab; render(); };
      });
      root.querySelectorAll("[data-pmtab]").forEach(btn => {
        btn.onclick = () => { state.platformMarketingTab = btn.dataset.pmtab; render(); };
      });
      root.querySelectorAll("[data-pm-activate]").forEach(btn => {
        btn.onclick = () => { activatePlatformMarketingOrder(); };
      });
      root.querySelectorAll("[data-pm-refund]").forEach(btn => {
        btn.onclick = () => {
          if (refundPlatformMarketingOrder(btn.dataset.pmRefund)) {
            showProtoToast("演示：锁定运营商原路退款成功");
            render();
          }
        };
      });
      root.querySelectorAll("[data-pm-confirm-stmt]").forEach(btn => {
        btn.onclick = () => { confirmPlatformMarketingStatement(btn.dataset.pmConfirmStmt); showProtoToast("平台已确认对账单"); render(); };
      });
      root.querySelectorAll("[data-pm-confirm-stmt-op]").forEach(btn => {
        btn.onclick = () => { confirmPlatformMarketingStatement(btn.dataset.pmConfirmStmtOp); showProtoToast("运营商已确认营销对账"); render(); };
      });
      root.querySelectorAll("[data-pm-confirm-agreement]").forEach(btn => {
        btn.onclick = () => { confirmPlatformMarketingAgreement(btn.dataset.pmConfirmAgreement); showProtoToast("已确认参与平台营销活动"); render(); };
      });
      if (root === document) {
      const importBtn = document.querySelector("#deviceImportBtn");
      if (importBtn) {
        importBtn.onclick = () => {
          const raw = (document.querySelector("#deviceImportText")?.value || "").trim();
          if (!raw) { window.alert("请粘贴「SN,运营商ID」列表"); return; }
          let ok = 0;
          const fails = [];
          raw.split("\n").forEach(line => {
            const parts = line.split(/[,，\t]/).map(s => s.trim()).filter(Boolean);
            if (parts.length < 2 || !parts[0]) return;
            const sn = parts[0];
            const operatorId = parts[1];
            const res = assignDeviceFromIot(sn, operatorId);
            if (res.ok) ok++;
            else fails.push(sn + "（" + res.reason + "）");
          });
          state.platformDeviceTab = "ledger";
          const msg = "演示：成功导入 " + ok + " 台" + (fails.length ? "；失败 " + fails.length + "：" + fails.slice(0, 5).join("、") + (fails.length > 5 ? "…" : "") : "，已进入设备台账");
          window.alert(msg);
          render();
        };
      }
      const tplBtn = document.querySelector("#deviceImportTemplate");
      if (tplBtn) tplBtn.onclick = () => downloadCsv("device-import-template.csv", "SN,运营商ID\nCAB-NEW-003,OP-SX\nBAT-NEW-002,OP-LJZ");
      }
      root.querySelectorAll("[data-select-pool]").forEach(el => {
        el.onclick = e => {
          if (e.target.closest("[data-pool-form]")) return;
          state.dayPoolSelectedId = el.dataset.selectPool;
          state.dayPoolTab = "pools";
          render();
        };
      });
      root.querySelectorAll("[data-select-pool-only]").forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          state.dayPoolSelectedId = btn.dataset.selectPoolOnly;
          render();
        };
      });
      root.querySelectorAll("[data-edit-pricing]").forEach(btn => {
        btn.onclick = () => openPricingForm(btn.dataset.editPricing);
      });
      root.querySelectorAll("[data-new-pricing-sku]").forEach(btn => {
        btn.onclick = () => openPricingForm("new");
      });
      root.querySelectorAll("[data-new-card-pricing]").forEach(btn => {
        btn.onclick = () => openCardPricingForm("new");
      });
      root.querySelectorAll("[data-edit-card-pricing]").forEach(btn => {
        btn.onclick = () => openCardPricingForm(btn.dataset.editCardPricing);
      });
      root.querySelectorAll("[data-edit-quota-pricing]").forEach(btn => {
        btn.onclick = () => openQuotaPricingForm(btn.dataset.editQuotaPricing);
      });
      root.querySelectorAll("[data-new-quota-pricing]").forEach(btn => {
        btn.onclick = () => openQuotaPricingForm("new");
      });
      root.querySelectorAll("[data-new-quota-default]").forEach(btn => {
        btn.onclick = () => {
          const opId = currentEntity().id;
          if (!defaultQuotaRow()) {
            const std = platformAccrualDayPrice();
            operatorDayQuotaPrices.push({
              id: "OP-Q-DEF-" + String(Date.now()).slice(-4),
              operatorId: opId, channelId: "*", channelName: "默认批发价",
              wholesalePrice: std, minDays: 500, status: "生效", validTo: "2026-12-31"
            });
          }
          openQuotaPricingForm(defaultQuotaRow().id);
        };
      });
      root.querySelectorAll("[data-pool-form]").forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          if (btn.dataset.poolId) state.dayPoolSelectedId = btn.dataset.poolId;
          openPoolForm(btn.dataset.poolForm, btn.dataset.poolId, btn.dataset.riderId);
        };
      });
      root.querySelectorAll("[data-pool-adjust]").forEach(btn => {
        btn.onclick = () => openPoolForm("adjust", btn.dataset.poolAdjust);
      });
      const exportOrgBtn = document.querySelector("#btnExportOrgConsume");
      if (exportOrgBtn) exportOrgBtn.onclick = () => exportOrgConsumeCsv();
      root.querySelectorAll("[data-retry-ex]").forEach(btn => {
        btn.onclick = () => retryPoolException(btn.dataset.retryEx);
      });
      root.querySelectorAll("[data-employee-add-staff]").forEach(btn => {
        btn.onclick = () => openEmployeeForm("add", "staff");
      });
      root.querySelectorAll("[data-employee-edit]").forEach(btn => {
        btn.onclick = () => {
          const emp = employeeById(btn.dataset.employeeEdit);
          if (emp) openEmployeeForm("edit", emp.roleType, emp.id);
        };
      });
      root.querySelectorAll("[data-open-lease]").forEach(btn => {
        btn.onclick = () => openLeaseDetail(btn.dataset.openLease);
      });
      root.querySelectorAll("[data-confirm-lease]").forEach(btn => {
        btn.onclick = () => {
          if (confirmLeaseContract(btn.dataset.confirmLease)) {
            window.alert("已确认，变更将于次月 1 日生效（新签立即进入履约）。");
            closeDrawer();
            render();
          }
        };
      });
      root.querySelectorAll("[data-reject-lease]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "拒绝签约",
            fields: [{ name: "reason", label: "拒绝原因", value: "条款不接受" }],
            onSubmit: (data) => {
              if (rejectLeaseContract(btn.dataset.rejectLease, data.reason)) {
                closeDrawer();
                return { afterClose: () => render() };
              }
              return "操作失败";
            }
          });
        };
      });
      root.querySelectorAll("[data-pay-rent]").forEach(btn => {
        btn.onclick = () => openRentPayForm(btn.dataset.payRent);
      });
      root.querySelectorAll("[data-pay-manual]").forEach(btn => {
        btn.onclick = () => openRentPayForm(btn.dataset.payManual);
      });
      root.querySelectorAll("[data-confirm-rent-offline]").forEach(btn => {
        btn.onclick = () => {
          if (confirmLeaseOfflineTicket(btn.dataset.confirmRentOffline)) render();
        };
      });
      root.querySelectorAll("[data-reject-rent-offline]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "驳回线下到账",
            fields: [{ name: "reason", label: "驳回原因", value: "转账金额或流水号不符" }],
            onSubmit: (data) => {
              if (rejectLeaseOfflineTicket(btn.dataset.rejectRentOffline, data.reason)) {
                return { afterClose: () => render() };
              }
              return "操作失败";
            }
          });
        };
      });
      root.querySelectorAll("[data-adjust-channel-credit]").forEach(btn => {
        btn.onclick = () => {
          const prof = channelCreditProfiles.find(p => p.channelId === btn.dataset.adjustChannelCredit);
          if (!prof) return;
          openProtoForm({
            title: "调整渠道信用额度",
            fields: [{ name: "amount", label: "信用额度（元）", type: "number", value: String(prof.creditLimit) }],
            onSubmit: (data) => {
              const v = Number(data.amount);
              if (!Number.isFinite(v) || v < 0) return "请输入有效金额";
              prof.operatorOverride = v;
              prof.creditLimit = v;
              prof.creditedAmount = Math.min(prof.requiredDeposit, v);
              prof.gap = Math.max(0, prof.requiredDeposit - prof.creditedAmount);
              prof.alert = prof.gap > 0 ? "押金缺口 ¥" + prof.gap.toLocaleString() + "，请提交打款凭证" : null;
              return {
                successMessage: "已调整 " + btn.dataset.adjustChannelCredit + " 信用额度为 ¥" + v.toLocaleString("zh-CN"),
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-approve-deposit-proof]").forEach(btn => {
        btn.onclick = () => {
          const p = channelDepositProofs.find(x => x.id === btn.dataset.approveDepositProof);
          if (!p) return;
          p.status = "已通过";
          p.reviewedBy = currentEntity().name;
          p.reviewTime = new Date().toISOString().slice(0, 16).replace("T", " ");
          const prof = channelCreditProfiles.find(x => x.channelId === p.channelId);
          if (prof) { prof.paidDeposit = (prof.paidDeposit || 0) + p.amount; prof.gap = Math.max(0, (prof.gap || 0) - p.amount); prof.alert = prof.gap > 0 ? "押金缺口 ¥" + prof.gap.toLocaleString() : null; }
          render();
        };
      });
      root.querySelectorAll("[data-reject-deposit-proof]").forEach(btn => {
        btn.onclick = () => {
          const p = channelDepositProofs.find(x => x.id === btn.dataset.rejectDepositProof);
          if (!p) return;
          p.status = "已驳回";
          p.reviewedBy = currentEntity().name;
          p.reviewTime = new Date().toISOString().slice(0, 16).replace("T", " ");
          render();
        };
      });
      root.querySelectorAll("[data-submit-deposit-proof]").forEach(btn => {
        btn.onclick = () => {
          const cid = channelEntityId();
          openProtoForm({
            title: "提交打款凭证",
            fields: [
              { name: "amount", label: "补缴金额（元）", type: "number", value: "10000" },
              { name: "transferRef", label: "银行流水号", value: "20260612" + Date.now().toString().slice(-6) }
            ],
            submitLabel: "提交",
            onSubmit: (data) => {
              const amount = Number(data.amount);
              if (!Number.isFinite(amount) || amount <= 0) return "请输入有效补缴金额";
              if (!data.transferRef?.trim()) return "请填写银行流水号";
              channelDepositProofs.unshift({
                id: "DP-" + Date.now().toString().slice(-6), channelId: cid, amount, transferRef: data.transferRef.trim(),
                transferDate: new Date().toISOString().slice(0, 10), status: "待审核",
                submitTime: new Date().toISOString().slice(0, 16).replace("T", " "), reviewedBy: null, reviewTime: null
              });
              return {
                successMessage: "已提交打款凭证，等待运营商审核",
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-edit-deposit-standard]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "编辑全平台押金标准",
            fields: [
              { name: "battery", label: "电池押金标准（元/块）", type: "number", value: String(platformDepositStandard.battery) },
              { name: "cabinet", label: "换电柜押金标准（元/台）", type: "number", value: String(platformDepositStandard.cabinet) }
            ],
            onSubmit: (data) => {
              const bat = Number(data.battery);
              const cab = Number(data.cabinet);
              if (!Number.isFinite(bat) || !Number.isFinite(cab)) return "请输入有效金额";
              platformDepositStandard.battery = bat;
              platformDepositStandard.cabinet = cab;
              platformDepositStandard.updatedAt = new Date().toISOString().slice(0, 10);
              return { successMessage: "已更新全平台押金标准", afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-collect-follow]").forEach(btn => {
        btn.onclick = () => handleCollectFollow(btn.dataset.collectFollow);
      });
      root.querySelectorAll("[data-new-lease]").forEach(btn => {
        btn.onclick = () => openLeaseForm(null, "new");
      });
      root.querySelectorAll("[data-lease-agreements-tab]").forEach(btn => {
        btn.onclick = () => { state.leaseAgreementsTab = btn.dataset.leaseAgreementsTab; render(); };
      });
      root.querySelectorAll("[data-open-device-list]").forEach(btn => {
        btn.onclick = () => openDeviceListDetail(btn.dataset.openDeviceList);
      });
      root.querySelectorAll("[data-new-device-list]").forEach(btn => {
        btn.onclick = () => openDeviceListForm(null, false);
      });
      root.querySelectorAll("[data-import-device-list]").forEach(btn => {
        btn.onclick = () => openDeviceListForm(null, true);
      });
      root.querySelectorAll("[data-edit-device-list]").forEach(btn => {
        btn.onclick = () => { closeDrawer(); openDeviceListForm(btn.dataset.editDeviceList, false); };
      });
      root.querySelectorAll("[data-replace-device-list]").forEach(btn => {
        btn.onclick = () => openDeviceReplaceForm(btn.dataset.replaceDeviceList);
      });
      root.querySelectorAll("[data-jump-device-lists]").forEach(btn => {
        btn.onclick = () => { closeLeaseForm(); state.leaseAgreementsTab = "deviceLists"; render(); };
      });
      root.querySelectorAll("[data-edit-lease]").forEach(btn => {
        btn.onclick = () => openLeaseForm(btn.dataset.editLease, btn.dataset.leaseChange ? "change" : "edit");
      });
      root.querySelectorAll("[data-mock-action]").forEach(btn => {
        btn.onclick = () => window.alert("演示环境：" + btn.dataset.mockAction);
      });
      root.querySelectorAll("[data-open-operator]").forEach(btn => {
        btn.onclick = () => openOperatorDetail(btn.dataset.openOperator);
      });
      root.querySelectorAll("[data-edit-operator]").forEach(btn => {
        btn.onclick = () => { closeDrawer(); openOperatorForm(btn.dataset.editOperator); };
      });
      root.querySelectorAll("[data-edit-platform-fee-rate]").forEach(btn => {
        btn.onclick = () => { closeDrawer(); openPlatformFeeRateForm(btn.dataset.editPlatformFeeRate); };
      });
      root.querySelectorAll("[data-new-operator]").forEach(btn => {
        btn.onclick = () => openOperatorForm(null);
      });
      root.querySelectorAll("[data-pltab]").forEach(btn => {
        btn.onclick = () => { state.platformLeasingTab = btn.dataset.pltab; render(); };
      });
      root.querySelectorAll("[data-new-lease-binding]").forEach(btn => {
        btn.onclick = () => openLeaseBindingForm();
      });
      root.querySelectorAll("[data-disable-lease-binding]").forEach(btn => {
        btn.onclick = () => {
          const b = platformLeaseBindings.find(x => x.id === btn.dataset.disableLeaseBinding);
          if (!b || b.status !== "启用") return;
          openProtoConfirm({
            title: "停用绑定",
            message: `停用 ${lessorLabel(b.lessorId)} ↔ ${operatorLabel(b.operatorId)} 绑定？`,
            confirmLabel: "停用",
            onConfirm: () => { b.status = "已停用"; render(); }
          });
        };
      });
      root.querySelectorAll("[data-new-leasing-company]").forEach(btn => {
        btn.onclick = () => openLeasingCompanyForm(null);
      });
      root.querySelectorAll("[data-edit-leasing-company]").forEach(btn => {
        btn.onclick = () => openLeasingCompanyForm(btn.dataset.editLeasingCompany);
      });
      root.querySelectorAll("[data-new-site]").forEach(btn => {
        btn.onclick = () => openSiteForm(null);
      });
      root.querySelectorAll("[data-edit-site]").forEach(btn => {
        btn.onclick = () => openSiteForm(btn.dataset.editSite);
      });
      root.querySelectorAll("[data-site-expense-tab]").forEach(btn => {
        btn.onclick = () => { state.siteExpenseTab = btn.dataset.siteExpenseTab; render(); };
      });
      root.querySelectorAll("[data-sptab]").forEach(btn => {
        btn.onclick = () => { state.sitePartnersTab = btn.dataset.sptab; render(); };
      });
      root.querySelectorAll("[data-new-site-partner]").forEach(btn => {
        btn.onclick = () => openNewSitePartnerForm();
      });
      root.querySelectorAll("[data-edit-site-partner]").forEach(btn => {
        btn.onclick = () => openEditSitePartnerForm(btn.dataset.editSitePartner);
      });
      root.querySelectorAll("[data-bind-site-partner]").forEach(btn => {
        btn.onclick = () => openBindSitePartnerForm(btn.dataset.bindSitePartner);
      });
      root.querySelectorAll("[data-site-partners]").forEach(btn => {
        btn.onclick = () => openSitePartnersDrawer(btn.dataset.sitePartners);
      });
      root.querySelectorAll("[data-edit-site-partner-bind]").forEach(btn => {
        btn.onclick = () => openEditSitePartnerBindingForm(btn.dataset.editSitePartnerBind);
      });
      root.querySelectorAll("[data-remove-site-partner-bind]").forEach(btn => {
        btn.onclick = () => removeSitePartnerBinding(btn.dataset.removeSitePartnerBind);
      });
      root.querySelectorAll("[data-apply-withdraw]").forEach(btn => {
        btn.onclick = () => openApplyWithdrawForm();
      });
      root.querySelectorAll("[data-apply-partner-withdraw]").forEach(btn => {
        btn.onclick = () => openPartnerWithdrawForm();
      });
      root.querySelectorAll("[data-approve-withdraw]").forEach(btn => {
        btn.onclick = () => approveOperatorWithdraw(btn.dataset.approveWithdraw);
      });
      root.querySelectorAll("[data-reject-withdraw]").forEach(btn => {
        btn.onclick = () => {
          const wid = btn.dataset.rejectWithdraw;
          openProtoForm({
            title: "驳回提现申请",
            fields: [{ name: "reason", label: "驳回原因", value: "可提现余额不足或资料不符" }],
            submitLabel: "确认驳回",
            onSubmit: (data) => {
              rejectOperatorWithdraw(wid, data.reason);
              return { successMessage: "已驳回", afterClose: () => {} };
            }
          });
        };
      });
      root.querySelectorAll("[data-open-site-expense]").forEach(btn => {
        btn.onclick = () => openSiteExpenseDetail(btn.dataset.openSiteExpense);
      });
      root.querySelectorAll("[data-edit-site-expense]").forEach(btn => {
        btn.onclick = () => openSiteExpenseForm(btn.dataset.editSiteExpense);
      });
      root.querySelectorAll("[data-register-expense-pay]").forEach(btn => {
        btn.onclick = () => {
          const bill = siteExpenseBills.find(b => b.id === btn.dataset.registerExpensePay);
          if (!bill) return;
          const prof = siteExpenseProfile(bill.siteId);
          const remain = billRemainAmount(bill);
          openProtoForm({
            title: "登记支付 · " + bill.id,
            fields: [
              { name: "amount", label: "支付金额（元）", type: "number", value: String(remain) },
              { name: "method", label: "支付方式", type: "select", options: ["对公转账", "微信", "支付宝", "现金"], value: prof?.payMethod || "对公转账" },
              { name: "ref", label: "流水号/凭证号", value: "" },
              { name: "remark", label: "备注", value: "", required: false }
            ],
            submitLabel: "登记",
            onSubmit: (data) => {
              const err = registerSiteExpensePayment(bill.id, data);
              if (err) return err;
              return {
                successMessage: "支付已登记，账单状态已更新",
                afterClose: () => {
                  if (state.detailSiteExpenseId === bill.siteId) openSiteExpenseDetail(bill.siteId);
                  else render();
                }
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-new-channel-partner]").forEach(btn => {
        btn.onclick = () => openChannelPartnerForm(null);
      });
      root.querySelectorAll("[data-edit-channel-partner]").forEach(btn => {
        btn.onclick = () => openChannelPartnerForm(btn.dataset.editChannelPartner);
      });
      root.querySelectorAll("[data-bind-device]").forEach(btn => {
        btn.onclick = () => openBindForm(btn.dataset.bindDevice);
      });
      root.querySelectorAll("[data-confirm-channel-po]").forEach(btn => {
        btn.onclick = () => { if (confirmChannelSalesOrder(btn.dataset.confirmChannelPo)) render(); };
      });
      root.querySelectorAll("[data-confirm-card-order]").forEach(btn => {
        btn.onclick = () => { if (confirmChannelCardOrder(btn.dataset.confirmCardOrder)) render(); };
      });
      root.querySelectorAll("[data-confirm-rent-order]").forEach(btn => {
        btn.onclick = () => { if (confirmChannelRentOrder(btn.dataset.confirmRentOrder)) render(); };
      });
      root.querySelectorAll("[data-confirm-act-order]").forEach(btn => {
        btn.onclick = () => { if (confirmChannelActivationOrder(btn.dataset.confirmActOrder)) render(); };
      });
      root.querySelectorAll("[data-edit-lease-pkg]").forEach(btn => {
        btn.onclick = () => {
          const cid = channelEntityId();
          const skus = channelLeasePkgSkus.filter(s => s.channelId === cid);
          const main = skus.find(s => s.id === "LP-30") || skus[0];
          if (!main) return;
          openProtoForm({
            title: "编辑白名单套餐价格",
            fields: [
              { name: "skuId", label: "SKU", value: main.id, readonly: true },
              { name: "name", label: "套餐名", value: main.name },
              { name: "price", label: "零售价（元）", type: "number", value: main.price },
              { name: "validityDays", label: "有效期（天）", type: "number", value: main.validityDays }
            ],
            submitLabel: "保存",
            onSubmit: (data) => {
              const price = parseFloat(data.price);
              const days = parseInt(data.validityDays, 10);
              if (!Number.isFinite(price) || price <= 0) return "请填写有效零售价";
              if (!Number.isFinite(days) || days <= 0) return "请填写有效天数";
              main.name = (data.name || "").trim() || main.name;
              main.price = price;
              main.validityDays = days;
              main.updatedAt = new Date().toISOString().slice(0, 10);
              return { successMessage: "已更新 " + main.id + " · ¥" + price, afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-add-whitelist-user]").forEach(btn => {
        btn.onclick = () => {
          const contract = myChannelContracts()[0];
          const defaultAccess = contract?.whitelistDefaultAccess || "paid";
          openProtoForm({
            title: "添加白名单用户",
            fields: [
              { name: "name", label: "骑手姓名", value: "新骑手" },
              { name: "phone", label: "手机号", value: "138****0000" },
              { name: "whitelistAccess", label: "白名单类型", type: "select", options: ["paid", "free"], optionLabels: { paid: "白名单付费（须购套餐）", free: "白名单免费（月租覆盖）" }, value: defaultAccess }
            ],
            submitLabel: "添加",
            onSubmit: (data) => {
              const name = (data.name || "").trim();
              const phone = (data.phone || "").trim();
              const access = data.whitelistAccess === "free" ? "free" : "paid";
              if (!name || !phone) return "请填写骑手姓名和手机号";
              const uid = "U" + Date.now().toString().slice(-4);
              channelLeaseWhitelist.unshift({
                id: uid, channelId: channelEntityId(),
                name, phone, whitelistAccess: access,
                pkgStatus: access === "free" ? "—" : "未购",
                swaps: 0, status: "启用",
                addedAt: new Date().toISOString().slice(0, 10), addedBy: "渠道管理员", lastSwap: "—"
              });
              channelBatteryHolders.unshift({
                channelId: channelEntityId(), userId: uid, userName: name, phone,
                batterySn: null, soc: null, since: null, site: "—", status: "未持有"
              });
              return {
                successMessage: "已添加白名单：" + name + "（" + (access === "free" ? "免费" : "付费") + "）",
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-remove-whitelist]").forEach(btn => {
        btn.onclick = () => {
          const r = channelLeaseWhitelist.find(x => x.id === btn.dataset.removeWhitelist);
          if (r) r.status = "已移除";
          render();
        };
      });
      root.querySelectorAll("[data-add-lease-device]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "绑定租赁设备",
            fields: [
              { name: "sn", label: "设备 SN", value: "CAB-NEW-001" },
              { name: "type", label: "类型", type: "select", options: ["换电柜", "电池"], value: "换电柜" }
            ],
            submitLabel: "绑定",
            onSubmit: (data) => {
              const sn = (data.sn || "").trim();
              if (!sn) return "请填写设备 SN";
              channelRentDevices.push({
                channelId: "CH-RENT", sn, type: data.type || "换电柜", site: "京东物流专属站", siteId: "ST-SH-JD",
                status: "在租", swapCount: 0
              });
              return {
                successMessage: "已绑定设备 " + sn + "（月租仍按签约统一价）",
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-create-dedicated-site]").forEach(btn => {
        btn.onclick = () => showProtoToast("演示：可在「签约渠道 → 编辑」中选择「+ 新建专属站点」并填写站点名称。");
      });
      root.querySelectorAll("[data-mock-import-act]").forEach(btn => {
        btn.onclick = () => showProtoToast("演示：批量导入激活码");
      });
      root.querySelectorAll("[data-simulate-online-pay]").forEach(btn => {
        btn.onclick = () => {
          const o = channelSalesOrders.find(x => x.id === btn.dataset.simulateOnlinePay);
          if (!o || o.payChannel !== "online" || o.orderStatus === "已完成") return;
          o.orderStatus = "已完成";
          o.payStatus = "已付款";
          o.payTime = new Date().toISOString().slice(0, 19).replace("T", " ");
          if (!o.paymentNo) o.paymentNo = (o.payMethod.includes("微信") ? "WX" : "ALI") + Date.now();
          creditPoolFromChannelOrder(o);
          window.alert("演示：支付回调成功，订单 " + o.id + " 已实时更新为已完成");
          render();
        };
      });
      root.querySelectorAll("[data-depstab]").forEach(btn => {
        btn.onclick = () => { state.depositTab = btn.dataset.depstab; render(); };
      });
      if (root === document) {
      const submitDepBtn = document.querySelector("#submitDepositRecharge");
      if (submitDepBtn) {
        submitDepBtn.onclick = () => {
          const form = document.querySelector("#depositRechargeForm");
          if (!form) return;
          const data = Object.fromEntries(new FormData(form).entries());
          const err = submitDepositRecharge(data);
          if (err) { window.alert(err); return; }
          window.alert("已提交充值申请，请等待平台财务核对银行到账后确认入账。");
          render();
        };
      }
      }
      root.querySelectorAll("[data-confirm-deposit]").forEach(btn => {
        btn.onclick = () => {
          if (confirmDepositRecharge(btn.dataset.confirmDeposit)) {
            window.alert("已确认到账，保证金余额已增加。");
            render();
          }
        };
      });
      root.querySelectorAll("[data-reject-deposit]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "驳回保证金充值",
            fields: [{ name: "reason", label: "驳回原因", value: "转账金额与申请不一致" }],
            onSubmit: (data) => {
              if (rejectDepositRecharge(btn.dataset.rejectDeposit, data.reason)) {
                return { afterClose: () => render() };
              }
              return "操作失败";
            }
          });
        };
      });
      root.querySelectorAll("[data-manual-deposit]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "手工入账",
            fields: [
              { name: "amount", label: "入账金额（元）", type: "number", value: "1000" },
              { name: "remark", label: "备注", value: "线下补录" }
            ],
            onSubmit: (data) => {
              const amt = Number(data.amount);
              if (!amt || amt <= 0) return "请输入有效金额";
              const remark = (data.remark || "").trim() || "手工入账";
              appendDepositLedger(btn.dataset.manualDeposit, "手工入账", amt, remark, "平台财务");
              return { afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-adjust-credit-limit]").forEach(btn => {
        btn.onclick = () => {
          const opId = btn.dataset.adjustCreditLimit;
          const credit = creditForOperator(opId);
          if (!credit) return;
          const cap = operatorCreditCap(opId);
          const prof = operatorCreditProfile(opId);
          if (!prof?.tierCode) {
            showProtoToast("该运营商尚未定档，请先在「运营商信用评估」完成定档。");
            return;
          }
          const hint = cap != null ? `档位封顶 ¥${cap.toLocaleString("zh-CN")}` : "";
          openProtoForm({
            title: "调整信用额度上限",
            fields: [{ name: "limit", label: hint ? `信用额度上限（元，${hint}）` : "信用额度上限（元）", type: "number", value: String(credit.creditLimit) }],
            onSubmit: (data) => {
              const v = Number(data.limit);
              if (isNaN(v) || v < 0) return "请输入有效额度";
              if (cap != null && v > cap) return `不得超过档位封顶 ¥${cap.toLocaleString("zh-CN")}。`;
              credit.creditLimit = v;
              credit.available = Math.max(0, v - credit.used);
              credit.crossSwapEnabled = credit.available > 0 || credit.depositBalance > 0;
              return { afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-opcredtab]").forEach(btn => {
        btn.onclick = () => { state.operatorCreditTab = btn.dataset.opcredtab; render(); };
      });
      root.querySelectorAll("[data-assign-tier]").forEach(btn => {
        btn.onclick = () => {
          const opId = btn.dataset.assignTier;
          const prof = operatorCreditProfile(opId);
          const def = prof?.tierCode || "B";
          openProtoForm({
            title: "运营商定档",
            fields: [
              { name: "tierCode", label: "档位（A/B/C/D）", value: def },
              { name: "reason", label: "变更原因", value: prof?.tierCode ? "年度复审/人工升降档" : "入网审批通过" }
            ],
            onSubmit: (data) => {
              const code = (data.tierCode || "").trim().toUpperCase().slice(0, 1);
              if (!admissionTierByCode(code)) return "无效档位，请输入 A/B/C/D";
              const reason = (data.reason || "").trim() || "定档";
              const err = assignOperatorTier(opId, code, reason, "平台管理员");
              if (err) return err;
              const tier = admissionTierByCode(code);
              const credit = creditForOperator(opId);
              if (credit && credit.creditLimit === 0 && tier.creditCap > 0) {
                credit.creditLimit = tier.creditCap;
                credit.available = Math.max(0, tier.creditCap - credit.used);
              }
              return {
                successMessage: `已定为 ${tierLabel(code)}；信用封顶 ¥${tier.creditCap.toLocaleString("zh-CN")}。`,
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-edit-admission-tier]").forEach(btn => {
        btn.onclick = () => {
          const tier = admissionTierByCode(btn.dataset.editAdmissionTier);
          if (!tier) return;
          openProtoForm({
            title: `${tier.code} 档 · ${tier.name}`,
            fields: [
              { name: "creditCap", label: "信用封顶（元）", type: "number", value: String(tier.creditCap) },
              { name: "minDeposit", label: "最低保证金（元，D档填0表示全额预存）", type: "number", value: String(tier.minDeposit) }
            ],
            onSubmit: (data) => {
              const cap = Number(data.creditCap);
              if (isNaN(cap) || cap < 0) return "请输入有效信用封顶";
              tier.creditCap = cap;
              const minD = Number(data.minDeposit);
              if (!isNaN(minD)) tier.minDeposit = minD;
              return {
                successMessage: "档位政策已更新（仅影响后续定档校验）",
                afterClose: () => render()
              };
            }
          });
        };
      });
      if (root === document) {
      const saveL1Btn = document.querySelector("#saveL1Pricing");
      if (saveL1Btn) saveL1Btn.onclick = saveL1PricingForm;
      const saveStdDayBtn = document.querySelector("#saveStdDayPrice");
      if (saveStdDayBtn) saveStdDayBtn.onclick = savePlatformStandardDayPriceForm;
      const oaKw = document.querySelector("#oaKeyword");
      const oaType = document.querySelector("#oaEventType");
      if (oaKw) oaKw.onchange = () => { getPf().keyword = oaKw.value; render(); };
      if (oaType) oaType.onchange = () => { getPf().eventType = oaType.value; render(); };
      }
      root.querySelectorAll("[data-audit-ref]").forEach(btn => {
        btn.onclick = () => {
          const [type, id] = (btn.dataset.auditRef || "").split(":");
          navigateAuditRef(type, id);
          render();
        };
      });
      root.querySelectorAll("[data-close-alert]").forEach(btn => {
        btn.onclick = () => {
          const a = deviceAlerts.find(x => x.id === btn.dataset.closeAlert);
          if (!a || a.status !== "待处理") return;
          openProtoForm({
            title: "关闭告警",
            fields: [{ name: "note", label: "关闭说明", value: "现场已处理" }],
            submitLabel: "关闭告警",
            onSubmit: (data) => {
              a.status = "已关闭";
              a.handleNote = (data.note || "").trim() || "已关闭";
              a.handledBy = currentEmployee()?.name || currentEntity().name;
              return { afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-refund-tab]").forEach(btn => {
        btn.onclick = () => {
          state.refundTab = btn.dataset.refundTab;
          render();
        };
      });
      root.querySelectorAll("[data-refund-mode]").forEach(btn => {
        btn.onclick = () => {
          if (!canAuditRefund()) {
            window.alert("当前账号无「退款确认操作」权限，无法切换模式。");
            return;
          }
          const settings = myRefundSettings();
          settings.mode = btn.dataset.refundMode;
          settings.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
          settings.updatedBy = currentEmployee()?.name || currentEntity().name;
          render();
        };
      });
      root.querySelectorAll("[data-deposit-refund-mode]").forEach(btn => {
        btn.onclick = () => {
          if (!canAuditRefund()) {
            window.alert("当前账号无「退款确认操作」权限，无法切换模式。");
            return;
          }
          const settings = myRefundSettings();
          settings.depositRefundMode = btn.dataset.depositRefundMode;
          settings.updatedAt = new Date().toISOString().slice(0, 16).replace("T", " ");
          settings.updatedBy = currentEmployee()?.name || currentEntity().name;
          render();
        };
      });
      root.querySelectorAll("[data-approve-refund]").forEach(btn => {
        btn.onclick = () => promptApproveRefund(btn.dataset.approveRefund);
      });
      root.querySelectorAll("[data-reject-refund]").forEach(btn => {
        btn.onclick = () => {
          const rf = refundRequests.find(x => x.id === btn.dataset.rejectRefund);
          if (!rf || rf.status !== "待审核") return;
          if (!canAuditRefund()) return;
          openProtoForm({
            title: "驳回退款",
            fields: [{ name: "reason", label: "驳回原因", value: "仍持有电池，请先还电" }],
            onSubmit: (data) => {
              const reason = (data.reason || "").trim();
              if (!reason) return "请填写驳回原因";
              rf.status = "已驳回";
              rf.rejectReason = reason;
              rf.processedTime = new Date().toISOString().slice(0, 16).replace("T", " ");
              rf.processedBy = currentEmployee()?.name || currentEntity().name;
              const sc = serviceChangeRequests.find(x => x.id === rf.scId);
              if (sc) sc.status = "已驳回";
              return { afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-view-jump]").forEach(btn => {
        btn.onclick = () => {
          if (btn.dataset.empTab) state.employeeTab = btn.dataset.empTab;
          if (btn.dataset.depstabJump) state.depositTab = btn.dataset.depstabJump;
          state.view = btn.dataset.viewJump;
          closeDrawer();
          render();
        };
      });
      root.querySelectorAll("[data-open-refund]").forEach(btn => {
        btn.onclick = () => openUserRefundDetail(btn.dataset.openRefund);
      });
      root.querySelectorAll("[data-open-sub]").forEach(btn => {
        btn.onclick = () => openPackageDetail(btn.dataset.openSub);
      });
      root.querySelectorAll("[data-open-swap]").forEach(btn => {
        btn.onclick = () => openSwapDetail(btn.dataset.openSwap);
      });
      root.querySelectorAll("[data-goto-swap]").forEach(btn => {
        btn.onclick = () => {
          state.view = "orderSwap";
          state.orderTab = "swap";
          state.detailSwapId = btn.dataset.gotoSwap;
          state.detailSubId = null;
          render();
        };
      });
      root.querySelectorAll("[data-ftab]").forEach(btn => {
        btn.onclick = () => { state.financeTab = btn.dataset.ftab; render(); };
      });
      root.querySelectorAll("[data-fin-select-app]").forEach(btn => {
        btn.onclick = () => {
          state.financeSelectedAppId = btn.dataset.finSelectApp;
          if (state.view === "financeManage") state.financeTab = "ledger";
          render();
        };
      });
      root.querySelectorAll("[data-fin-reject]").forEach(btn => {
        btn.onclick = () => {
          openProtoForm({
            title: "驳回放款申请",
            fields: [{ name: "reason", label: "驳回原因", value: "资产运营数据未达准入标准" }],
            submitLabel: "驳回",
            onSubmit: (data) => {
              rejectFinanceApplication(btn.dataset.finReject, (data.reason || "").trim());
              return { successMessage: "已驳回，批次退回运营商", afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-new-finance-package]").forEach(btn => {
        btn.onclick = () => openFinancePackageEditor(null);
      });
      root.querySelectorAll("[data-edit-finance-package]").forEach(btn => {
        btn.onclick = () => openFinancePackageEditor(btn.dataset.editFinancePackage);
      });
      root.querySelectorAll("[data-select-finance-package]").forEach(btn => {
        btn.onclick = () => { state.financeSelectedPackageId = btn.dataset.selectFinancePackage; state.financeTab = "packages"; render(); };
      });
      root.querySelectorAll("[data-open-finance-package]").forEach(btn => {
        btn.onclick = () => { state.financeSelectedPackageId = btn.dataset.openFinancePackage; state.view = "financeManage"; state.financeTab = "packages"; render(); };
      });
      root.querySelectorAll("[data-create-app-from-package]").forEach(btn => {
        btn.onclick = () => {
          const err = createFinanceAppFromPackage(btn.dataset.createAppFromPackage);
          if (err) { showProtoToast(err); return; }
          showProtoToast("已生成放款批次，请至融资台账提交资方");
          render();
        };
      });
      root.querySelectorAll("[data-fin-submit]").forEach(btn => {
        btn.onclick = () => { submitFinanceApplication(btn.dataset.finSubmit); window.alert("已提交资方，资产已锁定"); render(); };
      });
      root.querySelectorAll("[data-fin-confirm]").forEach(btn => {
        btn.onclick = () => {
          const app = financeAppById(btn.dataset.finConfirm);
          if (!app) return;
          openProtoForm({
            title: "尽调审查 · " + app.id,
            fields: [
              { name: "amount", label: "尽调确认金额（元）", type: "number", value: String(app.requestedAmount) },
              { name: "note", label: "尽调说明（可选）", value: "运营数据与标的物符合准入", required: false }
            ],
            submitLabel: "尽调通过",
            onSubmit: (data) => {
              const amt = Number(data.amount);
              if (isNaN(amt)) return "请输入有效金额";
              confirmFinanceApplication(app.id, amt, (data.note || "").trim() || "尽调通过");
              return {
                successMessage: "尽调通过，待登记放款",
                afterClose: () => render()
              };
            }
          });
        };
      });
      root.querySelectorAll("[data-fin-fund]").forEach(btn => {
        btn.onclick = () => {
          if (!isLeasingRole()) { showProtoToast("登记放款仅资方可操作"); return; }
          openProtoConfirm({
            title: "登记放款",
            message: "将绑定资产包、协议、借据与正式还款计划，确认执行？",
            confirmLabel: "登记放款",
            onConfirm: () => {
              fundFinanceApplication(btn.dataset.finFund);
              showProtoToast("已登记放款，协议与还款计划已生成");
              render();
            }
          });
        };
      });
      root.querySelectorAll("[data-fin-repay]").forEach(btn => {
        btn.onclick = () => {
          const row = financeRepaymentSchedules.find(s => s.id === btn.dataset.finRepay);
          if (!row) return;
          openProtoForm({
            title: "提交还款工单",
            fields: [
              { name: "amount", label: "还款金额（元）", type: "number", value: String(row.dueAmount - row.paidAmount) },
              { name: "payMethod", label: "付款方式", type: "select", options: ["对公转账", "网银", "其他"], value: "对公转账" },
              { name: "voucherNote", label: "凭证备注", required: false, value: "" }
            ],
            submitLabel: "提交工单",
            onSubmit: (data) => {
              const amt = Number(data.amount);
              if (isNaN(amt) || amt <= 0) return "请输入有效还款金额";
              const err = submitFinanceRepaymentTicket(row.id, amt, data.payMethod, data.voucherNote);
              if (err) return err;
              return { successMessage: "还款工单已提交，待资方确认", afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-fin-repay-confirm]").forEach(btn => {
        btn.onclick = () => {
          confirmFinanceRepaymentTicket(btn.dataset.finRepayConfirm);
          showProtoToast("还款已确认入账");
          render();
        };
      });
      root.querySelectorAll("[data-fin-asset-replace]").forEach(btn => {
        btn.onclick = () => {
          const sn = btn.dataset.finAssetReplace;
          openProtoForm({
            title: "资产替换 · " + sn,
            fields: [
              { name: "newSn", label: "新 SN", placeholder: "如 BAT-SH-1100" },
              { name: "reason", label: "原因", value: "坏件更换", required: false }
            ],
            submitLabel: "确认替换",
            onSubmit: (data) => {
              const err = replaceFinanceAsset(sn, (data.newSn || "").trim(), data.reason);
              if (err) return err;
              return { successMessage: "资产已替换", afterClose: () => render() };
            }
          });
        };
      });
      root.querySelectorAll("[data-fin-asset-filter]").forEach(sel => {
        sel.onchange = () => { state.financeAssetFilter = sel.value; render(); };
      });
      root.querySelectorAll("[data-fin-goto-tab]").forEach(btn => {
        btn.onclick = () => { state.financeTab = btn.dataset.finGotoTab; render(); };
      });
    }

    function renderFinanceDashboard() {
      const apps = myFinanceApplications();
      const schedules = financeRepaymentSchedules.filter(s => apps.some(a => a.id === s.applicationId));
      const monthDue = schedules.filter(s => s.dueDate.startsWith("2026-06") && s.status !== "已还清").reduce((x, s) => x + s.dueAmount - s.paidAmount, 0);
      const overdue = schedules.filter(s => s.status === "逾期").reduce((x, s) => x + s.dueAmount - s.paidAmount, 0);
      const draftCnt = apps.filter(a => a.status === "草稿").length;
      const submittedCnt = apps.filter(a => a.status === "已提交资方").length;
      const confirmedCnt = apps.filter(a => a.status === "尽调通过").length;
      const projects = myFinanceProjects();
      const oc = isOperatorRole() ? operatorCreditSummary(currentEntity().id, projects[0]?.financierId || "LEASE-HD") : null;
      const creditUsed = oc ? oc.used : projects.reduce((s, p) => s + (p.usedAmount || 0), 0);
      const creditLimit = oc ? oc.limit : projects.reduce((s, p) => s + p.creditLimit, 0);
      const creditPending = oc ? oc.pending : 0;
      return `<section class="panel"><div class="panel-body">
        <div class="kpi-grid in-panel">
          <div class="kpi-card"><div class="kpi-label">本月待还</div><div class="kpi-value">${finYuan(monthDue)}</div></div>
          <div class="kpi-card"><div class="kpi-label">逾期</div><div class="kpi-value" style="color:var(--red)">${finYuan(overdue)}</div></div>
          <div class="kpi-card"><div class="kpi-label">待提交申请</div><div class="kpi-value">${draftCnt}</div></div>
          <div class="kpi-card"><div class="kpi-label">待尽调 ${noteBtn("finance_due_diligence")}</div><div class="kpi-value">${submittedCnt}</div></div>
        </div>
        <div class="kpi-grid in-panel" style="margin-top:12px">
          <div class="kpi-card"><div class="kpi-label">待登记放款 ${noteBtn("finance_disburse")}</div><div class="kpi-value">${confirmedCnt}</div></div>
          <div class="kpi-card"><div class="kpi-label">已占用</div><div class="kpi-value">${finYuan(creditUsed)}</div></div>
          <div class="kpi-card"><div class="kpi-label">拟占用/已申请</div><div class="kpi-value">${finYuan(creditPending)}</div></div>
          <div class="kpi-card"><div class="kpi-label">主体授信总额 ${noteBtn("finance_operator_credit")}</div><div class="kpi-value">${finYuan(creditLimit)}</div></div>
        </div>
        <h4 style="margin:18px 0 10px">待办</h4>
        <table><thead><tr><th>类型</th><th>对象</th><th>状态</th><th>操作</th></tr></thead><tbody>
          ${draftCnt ? `<tr><td>放款申请</td><td>${apps.filter(a => a.status === "草稿").map(a => a.id).join("、")}</td><td>${tag("草稿")}</td><td><button type="button" class="linkish" data-fin-goto-tab="ledger">去台账</button></td></tr>` : ""}
          ${submittedCnt ? `<tr><td>尽调审查</td><td>${apps.filter(a => a.status === "已提交资方").map(a => a.id).join("、")}</td><td>${tag("已提交资方")}</td><td><button type="button" class="linkish" data-fin-goto-tab="ledger">查看</button></td></tr>` : ""}
          ${confirmedCnt ? `<tr><td>登记放款</td><td>${apps.filter(a => a.status === "尽调通过").map(a => a.id).join("、")}</td><td>${tag("尽调通过")}</td><td><small style="color:var(--muted)">资方操作</small></td></tr>` : ""}
          ${overdue ? `<tr><td>逾期还款</td><td>${schedules.filter(s => s.status === "逾期").map(s => s.dueDate).join("、")}</td><td>${tag("逾期")}</td><td><button type="button" class="linkish" data-fin-goto-tab="repayments">还款日历</button></td></tr>` : ""}
          ${!draftCnt && !submittedCnt && !confirmedCnt && !overdue ? "<tr><td colspan='4'>暂无待办</td></tr>" : ""}
        </tbody></table>
        <p style="margin-top:14px;color:var(--muted);font-size:13px">ERP / 运营系统对接后续迭代。</p>
      </div></section>`;
    }

    function renderFinanceLedgerDetail(app) {
      if (!app) return "";
      const proj = financeProjectById(app.projectId);
      const fin = financeFinanciers.find(f => f.id === app.financierId);
      const plan = financePrePlanById(app.prePlanId);
      const note = financeLoanNoteByApp(app.id);
      const agr = agreementByApp(app.id);
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      const cr = projectCreditSummary(app.projectId);
      const assetRows = financePackageAssetTable(app.assetSns);
      const planRows = (plan?.lines || []).map(ln => `<tr><td>${ln.term}</td><td>${ln.dueDate}</td><td>${finYuan(ln.principal)}</td><td>${finYuan(ln.rent)}</td><td>${finYuan(ln.principal + ln.rent + (ln.serviceFee || 0))}</td></tr>`).join("");
      const schedRows = financeRepaymentSchedules.filter(s => s.applicationId === app.id).map(s =>
        `<tr><td>${s.term}</td><td>${s.dueDate}</td><td>${finYuan(s.dueAmount)}</td><td>${finYuan(s.paidAmount)}</td><td>${tag(s.status)}</td></tr>`
      ).join("");
      const actions = [];
      if (isOperatorRole() && app.status === "草稿") actions.push(`<button type="button" class="btn primary" data-fin-submit="${app.id}">提交资方</button>`);
      return `<div class="panel" style="margin-top:14px;border:1px solid var(--line)">
        ${panelHead("批次详情 · " + app.id, `${app.month} 第 ${app.batchNo} 批 · ${tag(app.status)}`, null, actions.join(" "))}
        <div class="panel-body">
          ${financeApprovalTimeline(app)}
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px;font-size:13px">
            <div><strong>资方</strong><br>${fin?.name || app.financierId}</div>
            <div><strong>授信项目</strong><br>${proj?.name || app.projectId}</div>
            <div><strong>区域</strong><br>${app.regionSummary || "—"}</div>
            <div><strong>申请金额</strong><br>${finYuan(app.requestedAmount)} <small style="color:var(--muted)">参考 ${finYuan(app.refAmount)}</small></div>
            <div><strong>尽调确认</strong><br>${app.confirmedAmount != null ? finYuan(app.confirmedAmount) : "—"}</div>
            <div><strong>协议 ${noteBtn("finance_agreement")}</strong><br>${agr ? agr.agreementNo : "—"}</div>
            <div><strong>借据</strong><br>${note ? note.noteNo + " · " + finYuan(note.amount) : "—"}</div>
            <div><strong>资产包</strong><br>${pkg ? `<button type="button" class="link-btn" data-open-finance-package="${pkg.id}">${pkg.name}</button>` : "—"}</div>
            <div><strong>额度</strong><br>可用 ${finYuan(cr.available)} / 拟占用 ${finYuan(cr.pending)}</div>
          </div>
          <h4>资产包明细（${app.assetSns.length} 台） ${noteBtn("finance_asset_package")}</h4>
          <table><thead><tr><th>SN</th><th>类型</th><th>站点</th><th>用户数</th><th>柜效</th><th>近30日收入</th><th>状态</th></tr></thead><tbody>${assetRows}</tbody></table>
          <h4 style="margin-top:14px">预还款计划 ${plan ? tag(plan.status) : ""}</h4>
          <table><thead><tr><th>期次</th><th>应还日</th><th>本金</th><th>租金/利息</th><th>合计</th></tr></thead><tbody>${planRows || "<tr><td colspan='5'>未维护</td></tr>"}</tbody></table>
          ${schedRows ? `<h4 style="margin-top:14px">正式还款计划</h4><table><thead><tr><th>期次</th><th>应还日</th><th>应还</th><th>实还</th><th>状态</th></tr></thead><tbody>${schedRows}</tbody></table>` : ""}
          ${app.confirmNote ? `<p style="margin-top:10px;font-size:13px;color:var(--muted)">尽调说明：${app.confirmNote}</p>` : ""}
          ${app.rejectReason ? `<p style="margin-top:10px;font-size:13px;color:var(--red)">驳回原因：${app.rejectReason}</p>` : ""}
        </div>
      </div>`;
    }

    function renderFinancePackages() {
      const pkgs = myFinancePackages();
      const sel = state.financeSelectedPackageId;
      const rows = pkgs.map(p => {
        const proj = financeProjectById(p.projectId);
        const active = sel === p.id ? " style=\"background:var(--brand-soft)\"" : "";
        const appLink = p.applicationId ? `<button type="button" class="link-btn" data-fin-select-app="${p.applicationId}">${p.applicationId}</button>` : "—";
        const actions = [];
        if (p.status === "草稿") {
          actions.push(`<button type="button" class="link-btn" data-edit-finance-package="${p.id}">编辑</button>`);
          if (p.assetSns.length) actions.push(`<button type="button" class="link-btn" data-create-app-from-package="${p.id}">生成放款批次</button>`);
        } else if (p.status === "已生成批次" && p.applicationId) {
          actions.push(`<button type="button" class="link-btn" data-fin-select-app="${p.applicationId}">查看批次</button>`);
        }
        return `<tr${active}><td><button type="button" class="linkish" data-select-finance-package="${p.id}">${p.id}</button></td>
          <td>${p.name}</td><td>${proj?.name || p.projectId}</td><td>${p.assetSns.length} 台</td>
          <td>${finYuan(p.refAmount)}</td><td>${tag(p.status)}</td><td>${appLink}</td>
          <td>${actions.join(" · ") || "—"}</td></tr>`;
      }).join("");
      const detailPkg = financePackageById(sel);
      const detail = detailPkg ? `<div class="panel" style="margin-top:14px;border:1px solid var(--line)">
        ${panelHead("资产包详情 · " + detailPkg.name, tag(detailPkg.status), "finance_asset_package")}
        <div class="panel-body">
          <p style="font-size:13px;color:var(--muted)">${detailPkg.regionSummary} · 参考融资额 ${finYuan(detailPkg.refAmount)}</p>
          <table><thead><tr><th>SN</th><th>类型</th><th>站点</th><th>用户数</th><th>柜效</th><th>近30日收入</th><th>状态</th></tr></thead>
          <tbody>${financePackageAssetTable(detailPkg.assetSns)}</tbody></table>
          ${detailPkg.remark ? `<p style="margin-top:10px;font-size:13px">备注：${detailPkg.remark}</p>` : ""}
        </div>
      </div>` : "";
      return `<section class="panel">${panelHead("资产包", "先组包再生成放款批次；已被占用的设备不可重复选择", "finance_asset_package", `<button type="button" class="btn primary" data-new-finance-package>+ 新建资产包</button>`)}
        <div class="panel-body"><table><thead><tr>
          <th>包编号</th><th>名称</th><th>授信项目</th><th>设备数</th><th>参考额</th><th>状态</th><th>关联批次</th><th>操作</th>
        </tr></thead><tbody>${rows || "<tr><td colspan='8'>暂无资产包</td></tr>"}</tbody></table>${detail}</div></section>`;
    }

    function renderFinanceLedger() {
      const apps = myFinanceApplications().slice().sort((a, b) => (b.month + b.batchNo).localeCompare(a.month + a.batchNo));
      const sel = state.financeSelectedAppId;
      const rows = apps.map(a => {
        const proj = financeProjectById(a.projectId);
        const active = sel === a.id ? " style=\"background:var(--brand-soft)\"" : "";
        return `<tr${active}><td><button type="button" class="linkish" data-fin-select-app="${a.id}">${a.id}</button></td>
          <td>${a.month} · 第 ${a.batchNo} 批</td><td>${proj?.name || a.projectId}</td>
          <td>${a.assetSns.length} 台</td><td>${finYuan(a.requestedAmount)}</td><td>${tag(a.status)}</td>
          <td>${a.submittedAt || "—"}</td></tr>`;
      }).join("");
      const detail = renderFinanceLedgerDetail(financeAppById(sel));
      return `<section class="panel">${panelHead("融资台账", `共 ${apps.length} 个批次 · 点击行查看详情`)}
        <div class="panel-body"><table><thead><tr>
          <th>批次号</th><th>申请月</th><th>项目</th><th>设备数</th><th>申请金额</th><th>状态</th><th>提交时间</th>
        </tr></thead><tbody>${rows || "<tr><td colspan='7'>暂无批次</td></tr>"}</tbody></table>${detail}</div></section>`;
    }

    function renderFinanceProjects() {
      const oid = isOperatorRole() ? currentEntity().id : null;
      const finId = myFinanceProjects()[0]?.financierId || "LEASE-HD";
      const oc = oid ? operatorCreditSummary(oid, finId) : null;
      const ocBanner = oc ? `<div class="perm-banner" style="margin-bottom:12px">${noteBtn("finance_operator_credit")} <strong>主体级总授信</strong>（资方录入）：总额 ${finYuan(oc.limit)} · 已占用 ${finYuan(oc.used)} · 拟占用/已申请 ${finYuan(oc.pending)} · 可用 ${finYuan(oc.available)} · ${oc.revolving ? "循环" : "非循环"}</div>` : "";
      const rows = myFinanceProjects().map(p => {
        const fin = financeFinanciers.find(f => f.id === p.financierId);
        const cr = projectCreditSummary(p.id);
        return `<tr><td>${fin?.name || p.financierId}</td><td>${p.name}</td><td>${finYuan(cr.limit)}</td>
          <td>${finYuan(cr.used)}</td><td>${finYuan(cr.pending)}</td><td>${finYuan(cr.available)}</td>
          <td>${p.revolving ? "循环" : "非循环"}</td><td>${finYuan(p.unitRef)}/台</td><td>${tag(p.status)}</td></tr>`;
      }).join("");
      return `<section class="panel">${panelHead("授信项目", "主体级总授信 + 项目子视图；拟占用含已提交待审与尽调通过待放款", "finance_projects")}
        <div class="panel-body">${ocBanner}<table><thead><tr>
          <th>资方</th><th>项目</th><th>授信总额</th><th>已占用</th><th>拟占用/已申请</th><th>可用</th><th>额度类型</th><th>单台参考</th><th>状态</th>
        </tr></thead><tbody>${rows || "<tr><td colspan='9'>暂无项目</td></tr>"}</tbody></table></div></section>`;
    }

    function renderFinanceAssets() {
      const filter = state.financeAssetFilter || "全部";
      let assets = myFinanceAssets();
      if (filter !== "全部") assets = assets.filter(a => a.status === filter);
      const rows = assets.map(a => {
        const repBtn = isOperatorRole() && ["已融资", "包内占选", "申请锁定"].includes(a.status)
          ? ` <button type="button" class="link-btn" data-fin-asset-replace="${a.sn}">替换</button>` : "";
        return `<tr><td>${a.sn}${repBtn}</td><td>${a.type}</td><td>${a.region}</td><td>${a.city}</td><td>${a.site}</td>
        <td>${a.users ?? "—"}</td><td>${a.cabinetEff != null ? Math.round(a.cabinetEff * 100) + "%" : "—"}</td>
        <td>${tag(a.status)}</td><td>${a.packageId || "—"}<br><small style="color:var(--muted)">${a.appId || ""}</small></td></tr>`;
      }).join("");
      const opts = ["全部", ...FIN_ASSET_STATUS].map(s => `<option ${filter === s ? "selected" : ""}>${s}</option>`).join("");
      return `<section class="panel">${panelHead("可融资资产池", "人工确认入池；包内/已融资设备可替换", "finance_assets", noteBtn("finance_asset_replace"))}
        <div class="panel-body">
          <div style="margin-bottom:12px">状态筛选：<select data-fin-asset-filter>${opts}</select></div>
          <table><thead><tr><th>SN</th><th>类型</th><th>区域</th><th>城市</th><th>站点</th><th>用户数</th><th>柜效</th><th>融资状态</th><th>关联资产包/批次</th></tr></thead>
          <tbody>${rows || "<tr><td colspan='9'>无匹配资产</td></tr>"}</tbody></table>
        </div></section>`;
    }

    function renderFinanceRepayments() {
      const appIds = new Set(myFinanceApplications().map(a => a.id));
      const rows = financeRepaymentSchedules.filter(s => appIds.has(s.applicationId))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
      const body = rows.map(s => {
        const unpaid = s.dueAmount - s.paidAmount;
        const act = isOperatorRole() && unpaid > 0 ? `<button type="button" class="linkish" data-fin-repay="${s.id}">提交还款工单</button>` : "—";
        return `<tr><td>${s.dueDate}</td><td>${s.applicationId}</td><td>第 ${s.term} 期</td>
          <td>${finYuan(s.dueAmount)}</td><td>${finYuan(s.paidAmount)}</td><td>${finYuan(unpaid)}</td>
          <td>${tag(s.status)}</td><td>${act}</td></tr>`;
      }).join("");
      const dueSum = rows.filter(s => s.dueDate.startsWith("2026-06")).reduce((x, s) => x + s.dueAmount - s.paidAmount, 0);
      return `<section class="panel">${panelHead("还款日历", `2026 年 6 月待还合计 ${finYuan(dueSum)} · 运营商提交工单、资方确认 ${noteBtn("finance_repay_ticket")}`)}
        <div class="panel-body"><table><thead><tr>
          <th>应还日</th><th>批次</th><th>期次</th><th>应还</th><th>实还</th><th>未还</th><th>状态</th><th>操作</th>
        </tr></thead><tbody>${body || "<tr><td colspan='8'>暂无还款计划</td></tr>"}</tbody></table></div></section>`;
    }

    function renderFinanceManage() {
      const tabs = [["dashboard", "工作台"], ["packages", "资产包"], ["ledger", "融资台账"], ["projects", "授信项目"], ["assets", "资产池"], ["repayments", "还款日历"]];
      const tab = state.financeTab || "dashboard";
      const map = { dashboard: renderFinanceDashboard, packages: renderFinancePackages, ledger: renderFinanceLedger, projects: renderFinanceProjects, assets: renderFinanceAssets, repayments: renderFinanceRepayments };
      return `${ownScopeBanner()}${pageWithTabs(tabSidebar(tabs, tab, "ftab"), map[tab] ? map[tab]() : "")}`;
    }

    function renderFinanceDrawdownDetail(app) {
      if (!app) return "";
      const pkg = app.packageId ? financePackageById(app.packageId) : null;
      const proj = financeProjectById(app.projectId);
      const plan = financePrePlanById(app.prePlanId);
      const cr = projectCreditSummary(app.projectId);
      const planRows = (plan?.lines || []).map(ln => `<tr><td>${ln.term}</td><td>${ln.dueDate}</td><td>${finYuan(ln.principal)}</td><td>${finYuan(ln.rent)}</td><td>${finYuan(ln.principal + ln.rent + (ln.serviceFee || 0))}</td></tr>`).join("");
      const usagePct = cr.limit ? Math.min(100, Math.round((cr.used + cr.pending) / cr.limit * 100)) : 0;
      const confirmBtn = app.status === "已提交资方" ? `<button type="button" class="btn primary" data-fin-confirm="${app.id}">尽调通过</button>` : "";
      const rejectBtn = app.status === "已提交资方" ? `<button type="button" class="btn" data-fin-reject="${app.id}">驳回</button>` : "";
      const fundBtn = app.status === "尽调通过" ? `<button type="button" class="btn primary" data-fin-fund="${app.id}">登记放款</button>` : "";
      return `<div class="panel finance-approval-panel" style="margin-top:14px;border:1px solid var(--line)">
        ${panelHead("尽调 / 放款 · " + app.id, tag(app.status), "finance_due_diligence")}
        <div class="panel-body">
          ${financeApprovalTimeline(app)}
          <div class="kpi-grid in-panel" style="margin:16px 0">
            <div class="kpi-card"><div class="kpi-label">承租运营商</div><div class="kpi-value" style="font-size:15px">${entityNameById(app.operatorId)}</div></div>
            <div class="kpi-card"><div class="kpi-label">申请金额</div><div class="kpi-value">${finYuan(app.requestedAmount)}</div></div>
            <div class="kpi-card"><div class="kpi-label">设备数</div><div class="kpi-value">${app.assetSns.length} 台</div></div>
            <div class="kpi-card"><div class="kpi-label">资产包</div><div class="kpi-value" style="font-size:14px">${pkg?.name || "—"}</div></div>
          </div>
          <p style="font-size:13px;color:var(--muted);margin:0 0 8px">授信项目：${proj?.name || app.projectId} · 可用 ${finYuan(cr.available)} / 总额 ${finYuan(cr.limit)}</p>
          <div class="finance-credit-bar"><i style="width:${usagePct}%"></i></div>
          <small style="color:var(--muted)">已占用 ${finYuan(cr.used)} + 拟占用 ${finYuan(cr.pending)}</small>
          <h4 style="margin-top:16px">资产包明细 ${noteBtn("finance_asset_package")}</h4>
          <table><thead><tr><th>SN</th><th>类型</th><th>站点</th><th>用户数</th><th>柜效</th><th>近30日收入</th><th>状态</th></tr></thead>
          <tbody>${financePackageAssetTable(app.assetSns)}</tbody></table>
          <h4 style="margin-top:16px">预还款计划 ${noteBtn("finance_pre_plan")}</h4>
          <table><thead><tr><th>期次</th><th>应还日</th><th>本金</th><th>租金/利息</th><th>合计</th></tr></thead><tbody>${planRows || "<tr><td colspan='5'>—</td></tr>"}</tbody></table>
          ${app.confirmNote ? `<p style="margin-top:10px;font-size:13px;color:var(--muted)">审批说明：${app.confirmNote}</p>` : ""}
          ${app.rejectReason ? `<p style="margin-top:10px;font-size:13px;color:var(--red)">驳回原因：${app.rejectReason}</p>` : ""}
          <div style="margin-top:16px;display:flex;gap:8px">${confirmBtn}${rejectBtn}${fundBtn}</div>
        </div>
      </div>`;
    }

    function renderFinanceDrawdown() {
      const eid = currentEntity().id;
      const apps = financeApplications.filter(a => a.financierId === eid).sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));
      const sel = state.financeSelectedAppId || apps.find(a => a.status === "已提交资方")?.id || apps.find(a => a.status === "尽调通过")?.id;
      const rows = apps.map(a => {
        const op = entityNameById(a.operatorId);
        const active = sel === a.id ? " style=\"background:var(--brand-soft)\"" : "";
        return `<tr${active}><td><button type="button" class="linkish" data-fin-select-app="${a.id}">${a.id}</button></td>
          <td>${op}</td><td>${a.month} · 第 ${a.batchNo} 批</td><td>${a.assetSns.length}</td>
          <td>${finYuan(a.requestedAmount)}</td><td>${tag(a.status)}</td><td>${a.submittedAt || "—"}</td></tr>`;
      }).join("");
      const detail = renderFinanceDrawdownDetail(financeAppById(sel));
      const credits = financeOperatorCredits.filter(c => c.financierId === eid);
      const creditRows = credits.map(c => `<tr><td>${entityNameById(c.operatorId)}</td><td>${finYuan(c.totalLimit)}</td><td>${finYuan(c.usedAmount)}</td><td>${finYuan(c.pendingAmount)}</td><td>${finYuan(Math.max(0, c.totalLimit - c.usedAmount - c.pendingAmount))}</td><td>${c.revolving ? "循环" : "非循环"}</td><td>${c.approvedAt}</td></tr>`).join("");
      const tickets = financeRepaymentTickets.filter(t => t.financierId === eid && t.status === "待确认");
      const ticketRows = tickets.map(t => {
        const sched = financeRepaymentSchedules.find(s => s.id === t.scheduleId);
        return `<tr><td>${t.id}</td><td>${entityNameById(t.operatorId)}</td><td>${t.applicationId}</td><td>${sched ? "第 " + sched.term + " 期" : "—"}</td><td>${finYuan(t.amount)}</td><td>${t.payMethod}</td><td>${t.submittedAt}</td><td><button type="button" class="link-btn" data-fin-repay-confirm="${t.id}">确认入账</button></td></tr>`;
      }).join("");
      return `${ownScopeBanner()}
        <section class="panel">${panelHead("主体授信（录入）", "批授信线下完成后由资方录入", "finance_operator_credit")}
          <div class="panel-body"><table><thead><tr><th>运营商</th><th>总额</th><th>已占用</th><th>拟占用</th><th>可用</th><th>类型</th><th>批授信日</th></tr></thead>
          <tbody>${creditRows || "<tr><td colspan='7'>暂无</td></tr>"}</tbody></table></div></section>
        <section class="panel" style="margin-top:16px">${panelHead("放款申请 / 尽调", `待尽调 ${pendingFinanceDrawdownCount()} 笔`, "finance_due_diligence")}
        <div class="panel-body"><table><thead><tr>
          <th>批次号</th><th>运营商</th><th>申请月</th><th>设备数</th><th>申请金额</th><th>状态</th><th>提交时间</th>
        </tr></thead><tbody>${rows || "<tr><td colspan='7'>暂无申请</td></tr>"}</tbody></table>${detail}</div></section>
        <section class="panel" style="margin-top:16px">${panelHead("还款工单确认", `${tickets.length} 笔待确认 ${noteBtn("finance_repay_ticket")}`, "finance_repay_ticket")}
          <div class="panel-body"><table><thead><tr><th>工单号</th><th>运营商</th><th>批次</th><th>期次</th><th>金额</th><th>方式</th><th>提交时间</th><th>操作</th></tr></thead>
          <tbody>${ticketRows || "<tr><td colspan='8'>暂无待确认工单</td></tr>"}</tbody></table>
          <p style="margin-top:10px;font-size:12px;color:var(--muted)">违约金可配参数见下方 ${noteBtn("finance_penalty")}</p>
        </div></section>
        <section class="panel" style="margin-top:16px">${panelHead("违约金规则（可配）", "一期落地常规类型+参数；租金逾期只标记不停服", "finance_penalty")}
          <div class="panel-body">
            <p style="font-size:13px;margin:0 0 8px">类型：${(typeof leasePenaltyConfig !== "undefined" ? leasePenaltyConfig.types : []).join(" / ") || "逾期未缴 / 擅自转租 / 设备损毁 / 提前退租"}</p>
            <p style="font-size:13px;margin:0 0 8px">宽限期 <strong>${typeof leasePenaltyConfig !== "undefined" ? leasePenaltyConfig.graceDays : 3}</strong> 天 · 日率 <strong>${typeof leasePenaltyConfig !== "undefined" ? leasePenaltyConfig.dailyRatePct : 0.05}%</strong> · 上限当期应还 <strong>${typeof leasePenaltyConfig !== "undefined" ? leasePenaltyConfig.capPctOfDue : 24}%</strong></p>
            <button type="button" class="btn" id="editLeasePenalty">编辑参数（演示）</button>
            <p style="font-size:12px;color:var(--muted);margin:8px 0 0">更新：${typeof leasePenaltyConfig !== "undefined" ? leasePenaltyConfig.updatedAt + " · " + leasePenaltyConfig.updatedBy : "—"}</p>
          </div>
        </section>`;
    }

    function bindPageDynamicControls() {
      const ep = document.querySelector("#editLeasePenalty");
      if (ep) ep.onclick = () => window.alert("演示：已打开违约金参数编辑（宽限期/日率/上限/类型多选）");
      const term = document.querySelector("#demoLeaseTerminate");
      if (term) term.onclick = () => window.alert("演示终止结算单 TS-260713\n· 提前通知日已满足\n· 应付租金/违约金/设备回收清单\n· 待资方+运营商确认（平台只读）");
      const addCity = document.querySelector("#addL1CityOverride");
      if (addCity) addCity.onclick = () => window.alert("演示：新增城市覆盖价（保存后仅影响新产生跨网费）");
      document.querySelectorAll("[data-l1-city-edit]").forEach(btn => {
        btn.onclick = () => window.alert("演示：编辑城市覆盖 " + btn.dataset.l1CityEdit);
      });
      const addStdCity = document.querySelector("#addStdDayCityOverride");
      if (addStdCity) addStdCity.onclick = () => window.alert("演示：新增人天标准日值城市覆盖（保存后仅影响新消耗计提）");
      document.querySelectorAll("[data-std-city-edit]").forEach(btn => {
        btn.onclick = () => window.alert("演示：编辑日值城市覆盖 " + btn.dataset.stdCityEdit);
      });
      renderPageFilters();
      document.querySelectorAll("[data-swap-policy]").forEach(inp => {
        inp.onchange = () => {
          const opId = currentEntity().id;
          if (!operatorSwapPolicy[opId]) operatorSwapPolicy[opId] = { crossNetworkEnabled: false };
          operatorSwapPolicy[opId][inp.dataset.swapPolicy] = inp.checked;
          render();
        };
      });
    }

    function bindDrawerActions() {
      bindInteractiveActions(document.querySelector("#drawerBody"));
    }

    function bindNotes() {
      /* 说明按钮使用 document 级事件委托，见文末 init */
    }

    const VIEW_RENDERERS = {
      overview: renderOverview,
      pricing: renderPricing,
      channelSales: renderChannelSales,
      sites: renderSites,
      sitePartners: renderSitePartners,
      siteExpenses: renderSiteExpenses,
      partnerOverview: renderPartnerOverview,
      partnerBindings: renderPartnerBindings,
      partnerLedger: renderPartnerLedger,
      partnerWithdraw: renderPartnerWithdraw,
      partnerAccount: renderPartnerAccount,
      devices: renderDevices,
      leaseAgreements: renderLeaseAgreements,
      leaseCollect: renderLeaseCollect,
      leaseRent: renderLeaseRent,
      financeManage: renderFinanceManage,
      financeDrawdown: renderFinanceDrawdown,
      orderPackage: renderOrders,
      orderSwap: renderOrders,
      orderFreeze: renderOrders,
      orderAudit: renderOrderAudit,
      refundManage: renderRefundManage,
      flows: renderFlows,
      interOp: renderInterOp,
      depositAccount: renderDepositAccount,
      platformFee: renderPlatformFee,
      employees: renderEmployees,
      users: renderUsers,
      accounts: renderAccounts,
      dayPool: renderDayPool,
      channelSettlement: renderChannelSettlement,
      activationCodes: renderActivationCodes,
      activationRecords: renderActivationRecords,
      channelCredit: renderChannelCredit,
      channelLinks: renderChannelLinks,
      channelOrders: renderChannelOrders,
      commissionStatement: renderCommissionStatement,
      rentPool: renderRentPool,
      rentDevices: renderRentDevices,
      leaseBatteryHold: renderLeaseBatteryHold,
      leaseWhitelist: renderLeaseWhitelist,
      leasePkgPricing: renderLeasePkgPricing,
      channelInterOp: renderChannelInterOp,
      operators: renderOperators,
      platformLeasing: renderPlatformLeasing,
      operatorCreditEval: renderOperatorCreditEval,
      depositManage: renderDepositManage,
      deviceBinding: renderDeviceBinding,
      l1Pricing: renderL1Pricing,
      platformUsers: renderPlatformUsers,
      platformOrders: renderPlatformOrders,
      platformDevices: renderPlatformDevices,
      platformChannels: renderPlatformChannels,
      platformMarketing: renderPlatformMarketing,
      platformFlows: renderPlatformFlows,
      platformAccounts: renderPlatformAccounts
    };

    function renderCurrentViewHtml() {
      const fn = VIEW_RENDERERS[state.view];
      if (!fn) return `<section class="panel"><div class="panel-body"><p>页面未实现：${state.view}</p></div></section>`;
      return fn();
    }

    function render() {
      try {
        renderNav();
      } catch (e) {
        console.error(e);
        document.querySelector("#nav").innerHTML = `<button type="button" class="active" data-view="overview">总览</button>`;
      }
      syncTenantUi();
      renderGlobalHeader();
      updateScopeHint();
      let pageMeta = meta[state.view] || [NAV_LABEL[state.view] || "—", ""];
      const l2 = getNavL2(state.view);
      if (l2) {
        const cur = state[l2.stateKey];
        const hit = l2.tabs.find(([k]) => k === cur);
        if (hit) pageMeta = [hit[1].replace(/\s*[!(].*$/, "").trim() || hit[1], pageMeta[1]];
      }
      document.querySelector("#pageTitle").textContent = pageMeta[0];
      const hidePageChrome = (state.view === "overview" && (isOperatorRole() || isPlatformRole()))
        || (state.view === "platformUsers" && isPlatformRole());
      const pageDescEl = document.querySelector("#pageDesc");
      pageDescEl.textContent = hidePageChrome ? "" : pageMeta[1];
      pageDescEl.style.display = hidePageChrome || !pageMeta[1] ? "none" : "";
      const scopeHintEl = document.querySelector("#scopeHint");
      scopeHintEl.style.display = hidePageChrome ? "none" : "";
      const p2 = phase2Meta();
      const noteHtml = renderPageModuleNote();
      document.querySelector("#pageModuleNote").innerHTML = (p2 ? phase2BadgeHtml() : "") + noteHtml;
      let body = "";
      try {
        body = renderCurrentViewHtml();
      } catch (e) {
        console.error(e);
        body = `<section class="panel"><div class="panel-body"><p style="color:var(--red);margin:0 0 8px"><strong>页面渲染失败</strong>：${String(e.message || e)}</p><p style="font-size:13px;color:var(--muted);margin:0">请打开浏览器控制台查看详情；建议通过 <code>python3 main.py</code> 访问 <code>/prototype/index.html</code>。</p></div></section>`;
      }
      document.querySelector("#views").innerHTML = `<div class="view active">${phase2BannerHtml()}${body}</div>`;
      bindInteractiveActions(document);
      bindPageDynamicControls();
      if (state.detailSubId) openPackageDetail(state.detailSubId);
      else if (state.detailRefundId) openUserRefundDetail(state.detailRefundId);
      else if (state.detailSwapId) openSwapDetail(state.detailSwapId);
      else if (state.detailLeaseId) openLeaseDetail(state.detailLeaseId);
      else if (state.detailOperatorId) openOperatorDetail(state.detailOperatorId);
      bindNotes();
    }

    document.querySelector("#nav").addEventListener("click", e => {
      const btn = e.target.closest("button[data-view]");
      if (!btn) return;
      state.view = btn.dataset.view;
      if (btn.dataset.navSub) setNavL2Key(btn.dataset.view, btn.dataset.navSub);
      else if (btn.dataset.prtab) state.pricingTab = btn.dataset.prtab;
      if (btn.dataset.view !== "devices") state.cabinetDetailSn = null;
      closeDrawer();
      closeEmployeeForm();
      render();
    });

    document.querySelector("#loginSelect").addEventListener("change", e => {
      applyLoginKey(e.target.value);
      state.employeeTab = "staff";
      const nav = getAllowedNavItems();
      if (state.role === "sitePartner") state.view = "partnerOverview";
      else state.view = nav.includes("overview") ? "overview" : nav[0];
      closeDrawer();
      closeEmployeeForm();
      render();
    });

    applyLoginKey(state.loginKey);

    function closeNote() {
      document.querySelector("#noteModal").classList.remove("open");
      document.querySelector("#noteMask").classList.remove("open");
    }
    document.addEventListener("click", e => {
      if (!e.target.closest("#userMenu") && !e.target.closest("#btnUserAvatar")) closeUserMenu();
    });

    document.addEventListener("click", e => {
      const btn = e.target.closest("[data-view-note]");
      if (btn) {
        e.stopPropagation();
        e.preventDefault();
        openViewModuleNote(btn.dataset.viewNote);
        return;
      }
      const noteBtnEl = e.target.closest("[data-note]");
      if (!noteBtnEl) return;
      e.stopPropagation();
      e.preventDefault();
      openNoteModal(noteBtnEl.dataset.note);
    });
    document.querySelector("#closeNote").addEventListener("click", closeNote);
    document.querySelector("#noteMask").addEventListener("click", closeNote);
    document.querySelector("#closeDataPanel").addEventListener("click", closeDataPanelModal);
    document.querySelector("#dataPanelMask").addEventListener("click", closeDataPanelModal);
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && document.querySelector("#dataPanelModal").classList.contains("open")) closeDataPanelModal();
    });
    document.querySelector("#closeDrawer").addEventListener("click", closeDrawer);
    document.querySelector("#drawerMask").addEventListener("click", closeDrawer);
    document.querySelector("#closeEmployeeForm").addEventListener("click", closeEmployeeForm);
    document.querySelector("#cancelEmployeeForm").addEventListener("click", closeEmployeeForm);
    document.querySelector("#employeeMask").addEventListener("click", closeEmployeeForm);
    document.querySelector("#saveEmployeeForm").addEventListener("click", saveEmployeeForm);
    document.querySelector("#employeeForm").addEventListener("submit", e => { e.preventDefault(); saveEmployeeForm(); });
    document.querySelector("#closePoolForm").addEventListener("click", closePoolForm);
    document.querySelector("#cancelPoolForm").addEventListener("click", closePoolForm);
    document.querySelector("#poolMask").addEventListener("click", closePoolForm);
    document.querySelector("#savePoolForm").addEventListener("click", savePoolForm);
    document.querySelector("#poolForm").addEventListener("submit", e => { e.preventDefault(); savePoolForm(); });
    document.querySelector("#closePricingForm").addEventListener("click", closePricingForm);
    document.querySelector("#cancelPricingForm").addEventListener("click", closePricingForm);
    document.querySelector("#pricingMask").addEventListener("click", closePricingForm);
    document.querySelector("#savePricingForm").addEventListener("click", savePricingForm);
    document.querySelector("#pricingForm").addEventListener("submit", e => { e.preventDefault(); savePricingForm(); });
    document.querySelector("#closeCardPricingForm").addEventListener("click", closeCardPricingForm);
    document.querySelector("#cancelCardPricingForm").addEventListener("click", closeCardPricingForm);
    document.querySelector("#cardPricingMask").addEventListener("click", closeCardPricingForm);
    document.querySelector("#saveCardPricingForm").addEventListener("click", saveCardPricingForm);
    document.querySelector("#cardPricingForm").addEventListener("submit", e => { e.preventDefault(); saveCardPricingForm(); });
    document.querySelector("#closeQuotaPricingForm").addEventListener("click", closeQuotaPricingForm);
    document.querySelector("#cancelQuotaPricingForm").addEventListener("click", closeQuotaPricingForm);
    document.querySelector("#quotaPricingMask").addEventListener("click", closeQuotaPricingForm);
    document.querySelector("#saveQuotaPricingForm").addEventListener("click", saveQuotaPricingForm);
    document.querySelector("#quotaPricingForm").addEventListener("submit", e => { e.preventDefault(); saveQuotaPricingForm(); });
    document.querySelector("#closeOperatorForm").addEventListener("click", closeOperatorForm);
    document.querySelector("#cancelOperatorForm").addEventListener("click", closeOperatorForm);
    document.querySelector("#operatorMask").addEventListener("click", closeOperatorForm);
    document.querySelector("#saveOperatorForm").addEventListener("click", saveOperatorForm);
    document.querySelector("#operatorForm").addEventListener("submit", e => { e.preventDefault(); saveOperatorForm(); });
    document.querySelector("#closePlatformFeeRateForm").addEventListener("click", closePlatformFeeRateForm);
    document.querySelector("#cancelPlatformFeeRateForm").addEventListener("click", closePlatformFeeRateForm);
    document.querySelector("#platformFeeRateMask").addEventListener("click", closePlatformFeeRateForm);
    document.querySelector("#savePlatformFeeRateForm").addEventListener("click", savePlatformFeeRateForm);
    document.querySelector("#platformFeeRateForm").addEventListener("submit", e => { e.preventDefault(); savePlatformFeeRateForm(); });
    document.querySelector("#closeLeasingCompanyForm").addEventListener("click", closeLeasingCompanyForm);
    document.querySelector("#cancelLeasingCompanyForm").addEventListener("click", closeLeasingCompanyForm);
    document.querySelector("#leasingCompanyMask").addEventListener("click", closeLeasingCompanyForm);
    document.querySelector("#saveLeasingCompanyForm").addEventListener("click", saveLeasingCompanyForm);
    document.querySelector("#leasingCompanyForm").addEventListener("submit", e => { e.preventDefault(); saveLeasingCompanyForm(); });
    document.querySelector("#closeLeaseBindingForm").addEventListener("click", closeLeaseBindingForm);
    document.querySelector("#cancelLeaseBindingForm").addEventListener("click", closeLeaseBindingForm);
    document.querySelector("#leaseBindingMask").addEventListener("click", closeLeaseBindingForm);
    document.querySelector("#saveLeaseBindingForm").addEventListener("click", saveLeaseBindingForm);
    document.querySelector("#leaseBindingForm").addEventListener("submit", e => { e.preventDefault(); saveLeaseBindingForm(); });
    document.querySelector("#closeSiteForm").addEventListener("click", closeSiteForm);
    document.querySelector("#cancelSiteForm").addEventListener("click", closeSiteForm);
    document.querySelector("#siteMask").addEventListener("click", closeSiteForm);
    document.querySelector("#saveSiteForm").addEventListener("click", saveSiteForm);
    document.querySelector("#siteForm").addEventListener("submit", e => { e.preventDefault(); saveSiteForm(); });
    document.querySelector("#closeChannelPartnerForm").addEventListener("click", closeChannelPartnerForm);
    document.querySelector("#cancelChannelPartnerForm").addEventListener("click", closeChannelPartnerForm);
    document.querySelector("#channelPartnerMask").addEventListener("click", closeChannelPartnerForm);
    document.querySelector("#saveChannelPartnerForm").addEventListener("click", saveChannelPartnerForm);
    document.querySelector("#channelPartnerForm").addEventListener("submit", e => { e.preventDefault(); saveChannelPartnerForm(); });
    document.querySelector("#closeBindForm").addEventListener("click", closeBindForm);
    document.querySelector("#cancelBindForm").addEventListener("click", closeBindForm);
    document.querySelector("#bindMask").addEventListener("click", closeBindForm);
    document.querySelector("#saveBindForm").addEventListener("click", saveBindForm);
    document.querySelector("#bindForm").addEventListener("submit", e => { e.preventDefault(); saveBindForm(); });
    document.querySelector("#closeLeaseForm").addEventListener("click", closeLeaseForm);
    document.querySelector("#cancelLeaseForm").addEventListener("click", closeLeaseForm);
    document.querySelector("#leaseMask").addEventListener("click", closeLeaseForm);
    document.querySelector("#saveLeaseForm").addEventListener("click", saveLeaseForm);
    document.querySelector("#leaseForm").addEventListener("submit", e => { e.preventDefault(); saveLeaseForm(); });
    document.querySelector("#closeFollowForm").addEventListener("click", closeFollowForm);
    document.querySelector("#cancelFollowForm").addEventListener("click", closeFollowForm);
    document.querySelector("#followMask").addEventListener("click", closeFollowForm);
    document.querySelector("#saveFollowForm").addEventListener("click", saveFollowForm);
    document.querySelector("#followForm").addEventListener("submit", e => { e.preventDefault(); saveFollowForm(); });
    document.querySelector("#closeRentPayForm").addEventListener("click", closeRentPayForm);
    document.querySelector("#cancelRentPayForm").addEventListener("click", closeRentPayForm);
    document.querySelector("#rentPayMask").addEventListener("click", closeRentPayForm);
    document.querySelector("#saveRentPayForm").addEventListener("click", saveRentPayForm);
    document.querySelector("#rentPayForm").addEventListener("submit", e => { e.preventDefault(); saveRentPayForm(); });
    document.querySelector("#closeRentTopupForm").addEventListener("click", closeRentTopupForm);
    document.querySelector("#cancelRentTopupForm").addEventListener("click", closeRentTopupForm);
    document.querySelector("#rentTopupMask").addEventListener("click", closeRentTopupForm);
    document.querySelector("#saveRentTopupForm").addEventListener("click", saveRentTopupForm);
    document.querySelector("#rentTopupForm").addEventListener("submit", e => { e.preventDefault(); saveRentTopupForm(); });
    document.querySelector("#closeDeviceListForm").addEventListener("click", closeDeviceListForm);
    document.querySelector("#cancelDeviceListForm").addEventListener("click", closeDeviceListForm);
    document.querySelector("#deviceListMask").addEventListener("click", closeDeviceListForm);
    document.querySelector("#saveDeviceListForm").addEventListener("click", saveDeviceListForm);
    document.querySelector("#deviceListForm").addEventListener("submit", e => { e.preventDefault(); saveDeviceListForm(); });
    document.querySelector("#closeDeviceReplaceForm").addEventListener("click", closeDeviceReplaceForm);
    document.querySelector("#cancelDeviceReplaceForm").addEventListener("click", closeDeviceReplaceForm);
    document.querySelector("#deviceReplaceMask").addEventListener("click", closeDeviceReplaceForm);
    document.querySelector("#saveDeviceReplaceForm").addEventListener("click", saveDeviceReplaceForm);
    document.querySelector("#deviceReplaceForm").addEventListener("submit", e => { e.preventDefault(); saveDeviceReplaceForm(); });

    document.querySelector("#pageFilters").addEventListener("change", e => {
      const el = e.target.closest("[data-pf-field]");
      if (!el) return;
      if (PF_CONFIRM_KEYS.has(pfKey())) return;
      getPf()[el.dataset.pfField] = el.value;
      if (state.view === "platformUsers") state.platformUsersPage = 1;
      render();
    });
    document.querySelector("#pageFilters").addEventListener("click", e => {
      if (!e.target.closest("[data-pf-confirm]")) return;
      applyPageFiltersFromDom();
      if (state.view === "platformUsers") state.platformUsersPage = 1;
      render();
    });
    document.querySelector("#pageFilters").addEventListener("keydown", e => {
      if (e.key !== "Enter") return;
      const el = e.target.closest("[data-pf-field]");
      if (!el || !PF_CONFIRM_KEYS.has(pfKey())) return;
      e.preventDefault();
      applyPageFiltersFromDom();
      if (state.view === "platformUsers") state.platformUsersPage = 1;
      render();
    });

    document.addEventListener("change", e => {
      const drillEl = e.target.closest("[data-drill-swap]");
      if (drillEl) {
        const pf = getDrillSwapPf();
        const key = drillEl.dataset.drillSwap;
        pf[key] = drillEl.value;
        if (key === "operatorId") {
          pf.site = "全部";
        }
        if (key === "range") {
          if (pf.range === "custom") {
            const dates = drillSwapDateList({ ...pf, range: "7" });
            if (!pf.dateFrom) pf.dateFrom = ymdLocal(dates[0]);
            if (!pf.dateTo) pf.dateTo = ymdLocal(dates[dates.length - 1]);
          }
        }
        if (key === "dateFrom" || key === "dateTo") {
          pf.range = "custom";
          const from = parseYmdLocal(pf.dateFrom);
          const to = parseYmdLocal(pf.dateTo);
          if (from && to) {
            const span = Math.round((to - from) / 86400000) + 1;
            if (span > 31) {
              const clipped = new Date(to);
              clipped.setDate(clipped.getDate() - 30);
              pf.dateFrom = ymdLocal(clipped);
              window.alert("自定义跨度最多 31 天，已自动截取最近 31 天");
            }
            if (to < from) pf.dateTo = pf.dateFrom;
          }
        }
        render();
        return;
      }
      const ovRange = e.target.closest("[data-overview-range]");
      if (ovRange) {
        if (!state.pf.overview) state.pf.overview = { ...(PF_DEFAULTS.overview || {}) };
        state.pf.overview.range = ovRange.value;
        render();
        return;
      }
      const el = e.target.closest("[data-power-pf]");
      if (!el || state.view !== "overview") return;
      const pp = getPowerPf();
      pp[el.dataset.powerPf] = el.value;
      if (el.dataset.powerPf === "range") syncPowerRangeDates(pp);
      render();
    });
    document.addEventListener("click", e => {
      if (!e.target.closest("[data-power-query]")) return;
      applyPowerFiltersFromDom();
      render();
    });
    document.addEventListener("change", e => {
      const el = e.target.closest("[data-site-expense-pf]");
      if (!el || state.view !== "siteExpenses") return;
      const sp = getSiteExpensePf();
      sp[el.dataset.siteExpensePf] = el.value;
      if (el.dataset.siteExpensePf === "range") {
        syncSiteExpenseRangeDates(sp);
        render();
      }
    });
    document.addEventListener("click", e => {
      if (!e.target.closest("[data-site-expense-query]")) return;
      if (state.view !== "siteExpenses") return;
      applySiteExpenseFiltersFromDom();
      render();
    });

    (function () {
      const link = document.getElementById("navDocsLink");
      if (link && !/\/prototype(\/|$)/.test(location.pathname)) {
        link.href = "documentation/index.html";
      }
    })();

    initProtoDialogs();
    if (typeof NAV === "undefined" || typeof financeApplications === "undefined" || typeof platformMarketingCampaigns === "undefined") {
      document.querySelector("#views").innerHTML = `<section class="panel"><div class="panel-body"><p style="color:var(--red);margin:0 0 8px"><strong>Mock 数据未加载</strong></p><p style="font-size:13px;color:var(--muted);margin:0">请确认已打开 <code>prototype/index.html</code>，并通过 <code>cd 原型/外卖 && python3 main.py</code> 启动本地服务后访问 <a href="/prototype/index.html">/prototype/index.html</a>。</p></div></section>`;
    } else {
      render();
    }
  