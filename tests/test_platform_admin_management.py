from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
CONFIG = (ROOT / "prototype/js/config-mock.js").read_text(encoding="utf-8")
APP = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")


class PlatformAdminManagementTests(unittest.TestCase):
    def test_platform_navigation_reuses_employee_view(self):
        platform_nav = CONFIG.split("platform: [", 1)[1].split("]", 1)[0]
        self.assertIn('"employees"', platform_nav)

    def test_platform_admin_store_has_protected_super_admin(self):
        self.assertIn('"ADM-PLAT-001"', CONFIG)
        self.assertIn('adminTemplate: "super"', CONFIG)
        self.assertIn("protected: true", CONFIG)

    def test_platform_permissions_map_to_platform_views(self):
        for permission in (
            "platform.overview",
            "platform.users",
            "platform.orders",
            "platform.devices",
            "platform.channels",
            "platform.flows",
            "platform.accounts",
            "platform.operators",
            "platform.audit",
            "platform.deposit",
            "platform.pricing",
            "platform.admins",
        ):
            self.assertIn(permission, CONFIG)

    def test_platform_admin_login_is_phase2(self):
        self.assertIn('label="管理员登录（二期）"', APP)
        self.assertIn('label="员工登录（二期）"', APP)
        self.assertIn('const prefix = "【二期】"', APP)

    def test_platform_admin_view_is_phase2(self):
        phase2_views = APP.split("const PHASE2_VIEWS", 1)[1].split("]);", 1)[0]
        self.assertIn('"employees"', phase2_views)
        self.assertIn('"overview"', phase2_views)
        self.assertNotIn(
            'v === "employees" && isPlatformRole()',
            APP.split("function isPhase2View", 1)[1].split("function phase2Meta", 1)[0],
        )

    def test_platform_uses_admin_label_for_reused_view(self):
        self.assertIn('return isPlatformRole() ? "管理员" : "员工"', APP)
        self.assertIn("navLabel(", APP)

    def test_platform_admin_form_has_templates_and_protection(self):
        for marker in (
            "PLATFORM_ADMIN_TEMPLATES",
            "adminTemplate",
            "至少选择一个菜单权限",
            "该手机号已存在",
            "不可停用当前登录账号",
            "protected",
        ):
            self.assertIn(marker, APP)

    def test_platform_admin_page_uses_admin_copy_and_fields(self):
        for marker in ("管理员列表", "新增管理员", "角色模板", "最后登录"):
            self.assertIn(marker, APP)

    def test_docs_define_platform_admin_as_phase2(self):
        prd = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
        acceptance = (ROOT / "docs/acceptance-criteria.md").read_text(
            encoding="utf-8"
        )
        roles = (ROOT / "docs/角色与功能清单.md").read_text(encoding="utf-8")

        self.assertIn("管理员（二期）", prd)
        self.assertIn("平台管理员管理（二期）", acceptance)
        self.assertIn("超级管理员不可", acceptance)
        self.assertIn("管理员管理", roles)
        self.assertIn("decision-041", roles)

    def test_platform_permissions_do_not_bundle_unrelated_pages(self):
        self.assertIn('"platform.channels": ["platformChannels"]', CONFIG)
        self.assertIn('"platform.marketing": ["platformMarketing"]', CONFIG)
        self.assertIn('"platform.operators": ["operators"]', CONFIG)
        self.assertIn('"platform.operator_withdraw": ["operators"]', CONFIG)
        self.assertIn('"platform.operator_fee": ["operators"]', CONFIG)
        self.assertIn('"platform.leasing": ["platformLeasing"]', CONFIG)
        self.assertIn('"platform.operator_credit": ["operatorCreditEval"]', CONFIG)
        finance_block = CONFIG.split("finance: {", 1)[1].split("}", 1)[0]
        self.assertNotIn('"platform.operators"', finance_block)
        self.assertIn('"platform.operator_withdraw"', finance_block)
        self.assertIn('"platform.operator_fee"', finance_block)
        self.assertIn('employeeHasPerm("platform.operator_withdraw")', APP)
        self.assertIn('employeeHasPerm("platform.operator_fee")', APP)

    def test_super_template_cannot_be_created_from_normal_form(self):
        self.assertIn('key !== "super"', APP)
        self.assertIn('data.adminTemplate === "super"', APP)
        self.assertIn("不可新增超级管理员", APP)

    def test_admin_save_validates_required_fields_and_normalizes_phone(self):
        self.assertIn("employeeForm.checkValidity()", APP)
        self.assertIn("employeeForm.reportValidity()", APP)
        self.assertIn('data.name = (data.name || "").trim()', APP)
        self.assertIn('data.phone = (data.phone || "").trim()', APP)
        self.assertIn("姓名和手机号不能为空", APP)

    def test_platform_login_banner_uses_admin_copy_and_permission_labels(self):
        self.assertIn("employeePermissionOptions()", APP)
        self.assertIn('"平台管理员"', APP)
        self.assertIn("平台管理员维护与菜单权限配置", APP)


if __name__ == "__main__":
    unittest.main()
