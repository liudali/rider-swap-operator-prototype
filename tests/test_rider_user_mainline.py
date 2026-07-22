from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
MOBILE = (ROOT / "prototype/mobile/index.html").read_text(encoding="utf-8")
PRD = (ROOT / "docs/骑手端PRD.md").read_text(encoding="utf-8")
AC = (ROOT / "docs/acceptance-criteria.md").read_text(encoding="utf-8")


class RiderUserMainlineTests(unittest.TestCase):
    def test_mainline_story_keys_exist(self):
        self.assertIn("MAINLINE", MOBILE)
        self.assertIn('story: "personal"', MOBILE)
        self.assertIn('story: "channel"', MOBILE)

    def test_personal_steps_p01_p09(self):
        for step in [f"P0{i}" for i in range(1, 10)]:
            self.assertIn(step, MOBILE)
            self.assertIn(step, PRD)

    def test_channel_steps_c01_c08(self):
        for step in [f"C0{i}" for i in range(1, 9)]:
            self.assertIn(step, MOBILE)
            self.assertIn(step, PRD)

    def test_demo_panel_has_mainline_guide(self):
        self.assertIn("主线导览", MOBILE)
        self.assertIn('id="mainlineSteps"', MOBILE)
        self.assertIn('id="btnMainlineNext"', MOBILE)
        self.assertIn("补充场景", MOBILE)

    def test_default_role_is_mainline_personal(self):
        self.assertRegex(MOBILE, r'role:\s*"personal"')
        self.assertIn('option value="personal" selected', MOBILE)

    def test_phase2_roles_marked_supplement(self):
        self.assertIn("二期", MOBILE)
        self.assertIn("lease_whitelist", MOBILE)

    def test_channel_swap_shows_day_confirm(self):
        self.assertIn("今日已确认", MOBILE)

    def test_acceptance_has_pxx_cxx(self):
        self.assertIn("P01", AC)
        self.assertIn("C06", AC)


if __name__ == "__main__":
    unittest.main()
