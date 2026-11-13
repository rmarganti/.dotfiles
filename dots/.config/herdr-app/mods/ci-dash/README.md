# CI runs

Our locally maintained GitHub Actions dashboard. Runs, job/step statuses, manual dispatch, rerun, and cancel. No artifact browsing or downloads.

## Use

Click **CI** beside **PRs** in the Neverforest tab bar to toggle the sidebar. It follows the focused terminal's repository. Hidden sidebar copies stop polling; the button makes no GitHub requests.

- **Runs:** latest 30 runs, search, status chips, jobs and steps. **Open** goes to GitHub for logs.
- **Dispatch:** choose a workflow, branch, and inputs, then review and explicitly dispatch.
- **Cancel / Rerun:** require inline confirmation showing the repository and account. These change real runs, including deployment/release workflows.
- **Account:** shown below the repository header and on action confirmations. The active `gh` login is tried first, then other saved logins if the repository is not visible. The global active login is never switched. After changing `gh` accounts externally, close/reopen the panel's layout or change repository to resolve the displayed account again.

The mod uses your existing `gh` permissions, including Actions write access for controls. It runs `gh` and, for alternate saved accounts, a quoted `sh` wrapper that obtains a token for that call only. It makes no direct network calls, stores no credentials, and writes no repository files. Notifications contain workflow names, branches, run numbers, and durations.

## Refresh behavior

- Run lists refresh every 5 seconds while a loaded run is active, otherwise every 30 seconds—including empty lists, so new runs are discovered after idle periods.
- Open live details refresh every 5 seconds for the first minute, then every 10 seconds through five minutes, then every 30 seconds. Scheduling advances even when requests fail.
- Finished details stop polling. The list still refreshes in the background, so new runs can be discovered.
- A completion notification fires once per observed run attempt, shared between the list and detail within one panel instance. Runs that start and finish entirely between list refreshes may not notify.
- Hidden sidebar copies pause polling. They refresh on return; timers are not a background monitoring service.

Dispatch workflow discovery reads active workflows from the default branch, up to six at a time, and only includes `workflow_dispatch` workflows. It lists branches, not tags. Inputs support string, boolean, number, choice, and environment (as text). Workflow defaults are applied; missing boolean/number defaults become false/0. Discovery is cached until refresh or a context change. Run lookup after dispatch is bounded and never automatically redispatches. If submission errors, check GitHub before retrying: a request may have been accepted before the connection failed.

Use a panel at least ~340px wide. Text fields accept keyboard input; the rest is mouse-driven.

## Files and setup

Source: `dots/.config/herdr-app/mods/ci-dash/` in this dotfiles repository. `mise.toml` links it to `~/.config/herdr-app/mods/ci-dash`. Neverforest owns the sidebar block; `smart-tabs/main.js` renders Files, Changes, CI, and PRs together. Their shared builder uses 14px icons, 26px height, 8px horizontal padding, a 5px icon/text gap, and 3px between buttons. CI uses `ci.svg`. No upstream installer is used.

Entry points:
- `main.js`: context, polling, list/detail UI, notifications, action confirmations, sidebar button.
- `dispatch.js`: workflow selection, input review, dispatch, and run lookup.
- `gh.js`: all CLI/API calls and alternate-account handling.
- `workflow-inputs.js`, `yaml.js`: workflow YAML parsing.
- `format.js`, `ui.js`: formatting and shared UI builders.

Props: `button` for the tab-bar toggle; `panel` for the sidebar; `tab` (`runs` or `dispatch`); `repo` to pin a repository; `workflow` and `ref` to preselect dispatch choices without submitting; `filter` and `status` (`live`, `attention`, `passed`, `other`) to initialize run filters. Props are read once per instance.

## Verify

```sh
node --test dots/.config/herdr-app/mods/ci-dash/main.test.js
herdr-app check ~/.config/herdr-app/mods/ci-dash
```

Tests mock Herdr and `gh`; they never submit real workflows. `herdr-app check` only checks the initial render, so also inspect the panel in the running app after UI changes.

## Provenance

Started from `cybertron288/herdr-mods` at commit `34e7c3348e954fd0a1147b846898db8c3e37e526`, itself adapted from Douglas Cunha's `ci-dash-app` in `dougcunha/herdr-plugins`. This copy is independently maintained; upstream is reference material, not an update source. MIT attribution is retained in `LICENSE`. The bundled `yaml` parser is 2.8.1 (per its source recipe), ISC-licensed in `yaml.LICENSE`.
