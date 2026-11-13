# Gitview upstream trial

Gitview v0.5.0 replaces the stock Changes content in `neverforest`. The upstream mods and Rust helper are unmodified. Hunk and Plannotator are unchanged.

## Use it

- Click **Changes** in the tab bar. Click a file to open its diff beside the list.
- `j` / `k`: move through files. `l`: history. `t`: tree/list. `?`: all keys.
- In the diff, select lines with `v` or a drag, then `a` to add a note.
- `p` opens the agent picker. **Enter places notes in the prompt without submitting. Shift-Enter submits.**
- **Commit commits staged files if present. With nothing staged, it stages and commits all changes.** Enter in the message box commits; Shift-Enter adds a newline. This is upstream behavior, intentionally retained for the trial.

`cmd-g` and `cmd-shift-g` still belong to the GitHub PR integration. No new shortcuts were added. The command palette offers `gitview: toggle the Changes panel` and `gitview: toggle in own tab`.

### Delivery limitation found during the trial

Placing a range note into a dummy agent's prompt worked without submitting. Immediately sending a second note with Shift-Enter failed with `hc took more than 10 s and was stopped`. The dialog remained open and the unsent note stayed in Gitview.

The core's draft/queue behavior may be involved, but the cause is not confirmed. Treat immediate submit after placement as unreliable. Check the destination before retrying; do not assume a timeout proves that no delivery can occur later. This is terminal delivery, not Pi session-aware feedback. Keep using Hunk or Plannotator for session-connected review.

## Install and rollback

From the dotfiles root:

```sh
mise run herdr-gitview-install
mise run herdr-gitview-uninstall
```

Install is deliberately pinned, not an automatic updater. It requires macOS Apple Silicon, Python 3, `gh`, Git, `hc`, and a running Herdr app showing `neverforest`. An existing trial must be uninstalled before reinstalling. A different release needs a payload review and digest update in `utils/herdr-gitview.py`.

The wrapper:

1. Downloads the v0.5.0 app bundle and verifies its pinned SHA-256.
2. Runs the upstream installer against an isolated app-home copy, retaining its configuration and initial-render checks.
3. Refuses mod-name collisions and any proposed keybinding changes.
4. Backs up layout, keys, and installer state under `.local/state/herdr-gitview/backup-*`.
5. Installs the unchanged mods and helper, regenerates machine-specific paths, and applies only the Changes-slot content to the real layout's symlink target.

The layout and keys symlinks remain intact. Neither the executable nor generated config is committed. `.local/state/herdr-gitview/installed.json` records installed file hashes, link targets, and the backup location. Uninstall refuses to remove modified code; otherwise it restores `props.replaces` without overwriting later unrelated layout edits or keys. Close Gitview-owned editors/diff panes before uninstalling. Shared notes and traces are retained, not deleted by rollback.

Gitview can execute programs, read repositories, and mutate Git state when asked. Its local diagnostic tracing remains on by default; toggle it with `gitview: tracing on/off` in the palette. Trace files live under `~/.config/herdr-app/data/gitview/trace/`.

## Version and verification

- Release: `v0.5.0`, source commit `00f0f64b32447a0b6a8073b8b551f45d983f2b3b`.
- Its `herdr-app/` and Rust source match the plan's `d2f3194` baseline.
- Bundle: `herdr-gitview-app-aarch64-apple-darwin.tar.gz`.
- SHA-256: `7d605022028eb70c253becb16b0900247f341d41ae61e67dc01c12dea25776ee`.
- Installed against Herdr app `0.1.15`.

Passed:

- All 44 upstream JavaScript tests, including the previously failing tracing test.
- Upstream `cargo test`.
- `herdr-app check` for all nine installed mods.
- Live populated diff with syntax and word highlighting; persisted range notes; prompt placement without submission.
- Markdown preview; browsing staged, unstaged, partly staged, new, deleted, renamed, binary, space-containing, Unicode, and leading-hyphen paths.
- UI stage/unstage; history/root-commit browsing; hide/show; staged-only commit retaining unstaged content; commit-all leaving the fixture clean.
- Uninstall restored the tracked layout exactly; reinstall preserved layout/key symlinks and existing keys.
- `python3 -m unittest discover -s utils -p 'test_herdr_gitview.py'` covers local rollback safeguards.

Screenshots, fixture repositories, and upstream test logs are under `.local/state/herdr-gitview/` (not committed). All Git mutations used disposable repositories.

Not verified: app restart, remote spaces, conflict/hook failures in the live UI, image previews, large-diff behavior, and unsaved-editor handling. Immediate submit after prompt placement failed as described above. These are trial follow-ups, not completed acceptance claims.
