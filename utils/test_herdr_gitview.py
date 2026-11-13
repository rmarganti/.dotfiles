"""Safety checks for the local installer boundary, not Gitview's Git engine."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("gitview", Path(__file__).with_name("herdr-gitview.py"))
gitview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gitview)


class InstallSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.home = self.root / "home"
        self.state = self.root / "state"
        self.state.mkdir()
        (self.home / "layouts").mkdir(parents=True)
        self.layout_target = self.root / "neverforest.json"
        self.layout = self.home / "layouts/neverforest.json"
        self.layout.symlink_to(self.layout_target)
        self.manifest = self.state / "installed.json"
        for name, value in [("HOME", self.home), ("STATE", self.state),
                            ("LAYOUT", self.layout), ("MANIFEST", self.manifest)]:
            mock = patch.object(gitview, name, value)
            mock.start()
            self.addCleanup(mock.stop)
        self.mod = self.home / "mods/gitview"
        self.mod.mkdir(parents=True)
        (self.mod / "main.js").write_text("upstream code")
        self.content = {"mod": "gitview", "props": {"replaces": {"mod": "changes"}}}
        gitview.save(self.layout, {"id": "root", "background": "user-color", "children": [
            {"id": "changes", "content": self.content},
            {"id": "other", "content": {"mod": "user-panel"}}]})
        gitview.save(self.manifest, {"mods": {"gitview": gitview.files(self.mod)}})
        (self.home / "keys.json").write_text('{"global":{"cmd-g":"gh-prs.toggle"}}')

    def test_uninstall_preserves_links_keys_and_other_layout_edits(self):
        before_keys = (self.home / "keys.json").read_bytes()
        gitview.uninstall()
        self.assertTrue(self.layout.is_symlink())
        layout = gitview.load(self.layout)
        self.assertEqual(gitview.changes(layout)["content"], {"mod": "changes"})
        self.assertEqual(layout["background"], "user-color")
        self.assertEqual(layout["children"][1]["content"], {"mod": "user-panel"})
        self.assertEqual((self.home / "keys.json").read_bytes(), before_keys)
        self.assertFalse(self.mod.exists())

    def test_modified_mod_blocks_all_removal_and_layout_writes(self):
        before = self.layout.read_bytes()
        (self.mod / "main.js").write_text("user modification")
        with self.assertRaisesRegex(RuntimeError, "changed since installation"):
            gitview.uninstall()
        self.assertTrue(self.manifest.exists())
        self.assertEqual(self.layout.read_bytes(), before)
        self.assertTrue(self.mod.exists())

    def test_generated_types_and_hidden_cache_do_not_block_uninstall(self):
        (self.mod / "gpui-kit.d.ts").write_text("generated")
        (self.mod / ".cache").mkdir()
        (self.mod / ".cache/image.png").write_bytes(b"cache")
        gitview.uninstall()
        self.assertFalse(self.mod.exists())

    def test_user_replacement_of_changes_is_not_overwritten(self):
        layout = gitview.load(self.layout)
        gitview.changes(layout)["content"] = {"mod": "different-reviewer"}
        gitview.save(self.layout, layout)
        gitview.uninstall()
        self.assertEqual(gitview.changes(gitview.load(self.layout))["content"],
                         {"mod": "different-reviewer"})


if __name__ == "__main__":
    unittest.main()
