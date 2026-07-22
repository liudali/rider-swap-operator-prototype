from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP_JS = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")
PRD = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
ACCEPTANCE = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")
ROLE_LIST = (ROOT / "docs/角色与功能清单.md").read_text(encoding="utf-8")


class EmployeePhase2Tests(unittest.TestCase):
    def test_employee_view_uses_phase2_navigation_and_banner(self):
        phase2_views = APP_JS.split("const PHASE2_VIEWS", 1)[1].split("]);", 1)[0]

        self.assertIn('"employees",', phase2_views)
        self.assertIn('if (state.view === "employees")', APP_JS)
        self.assertIn('"员工模块"', APP_JS)
        self.assertIn('"平台 · 管理员管理"', APP_JS)
        self.assertIn("一期不交付，原型仅演示", APP_JS)

    def test_all_employee_login_options_are_marked_phase2(self):
        login_block = APP_JS.split("let staffOpts", 1)[1].split(
            "const partnerOpts", 1
        )[0]
        employee_option_lines = [
            line
            for line in login_block.splitlines()
            if '<option value="emp:' in line
        ]

        self.assertGreaterEqual(len(employee_option_lines), 2)
        self.assertIn('const prefix = "【二期】";', APP_JS)
        self.assertTrue(
            all("${prefix}" in line for line in employee_option_lines),
            employee_option_lines,
        )

    def test_core_docs_mark_employee_and_admin_scope_phase2(self):
        self.assertIn("decision-041", PRD)
        self.assertIn("员工（二期）", ACCEPTANCE)
        self.assertIn("管理员（二期）", ACCEPTANCE)
        self.assertIn("decision-041", ROLE_LIST)
        self.assertIn("清单未写的一律二期", ROLE_LIST)
        self.assertIn("**二期** · 已实现（原型）", ROLE_LIST)


if __name__ == "__main__":
    unittest.main()
