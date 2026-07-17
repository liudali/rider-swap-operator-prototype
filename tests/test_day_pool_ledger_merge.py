from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]
APP = (ROOT / "prototype/js/app.js").read_text(encoding="utf-8")


class DayPoolLedgerMergeTests(unittest.TestCase):
    def test_state_has_pool_subtab(self):
        self.assertIn('dayPoolPoolsSubTab: "list"', APP)

    def test_pf_key_switches_between_pool_list_and_ledger(self):
        self.assertIn('state.dayPoolPoolsSubTab === "ledger"', APP)
        self.assertIn('return "dayPool_ledger"', APP)

    def test_top_level_tabs_do_not_include_ledger(self):
        render_tabs = APP.split("const tabs = isOrgAdminLogin()", 1)[1].split(
            "const sidebar", 1
        )[0]
        nav_tabs = APP.split("dayPool: {", 1)[1].split("depositManage:", 1)[0]
        self.assertNotIn('["ledger", "额度明细"]', render_tabs)
        self.assertNotIn('["ledger", "额度明细"]', nav_tabs)

    def test_pool_page_has_list_and_ledger_inner_tabs(self):
        self.assertIn('["list", "额度池列表"]', APP)
        self.assertIn('["ledger", "额度明细"]', APP)
        self.assertIn('"dppools-sub"', APP)

    def test_legacy_ledger_state_redirects_to_pool_subtab(self):
        self.assertIn('state.dayPoolTab === "ledger"', APP)
        self.assertIn('state.dayPoolTab = "pools"', APP)
        self.assertIn('state.dayPoolPoolsSubTab = "ledger"', APP)

    def test_pool_subtab_click_updates_only_inner_state(self):
        self.assertIn("[data-dppools-sub]", APP)
        self.assertIn("btn.dataset.dppoolsSub", APP)

    def test_docs_describe_nested_pool_ledger_tabs(self):
        prd = (ROOT / "docs/PRD.md").read_text(encoding="utf-8")
        quota = (ROOT / "docs/天数池.md").read_text(encoding="utf-8")
        acceptance = (ROOT / "docs/acceptance-criteria.md").read_text(
            encoding="utf-8"
        )

        self.assertIn("8 个顶层 Tab", prd)
        self.assertIn("额度池列表 / 额度明细", quota)
        self.assertIn("额度池页内 Tab", acceptance)


if __name__ == "__main__":
    unittest.main()
