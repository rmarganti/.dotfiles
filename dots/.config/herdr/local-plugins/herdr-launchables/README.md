# herdr-launchables

A Herdr plugin for launching reusable commands, panes, tabs, and workspaces from one picker.

It merges:
- global launchables from `~/.config/.launchables.json`
- nearest project launchables from `.launchables.json` in the current cwd or an ancestor

Project launchables override global ones by JSON key. The picker always displays the JSON key. Optional `name` labels Herdr UI objects only.

## Schema

Top-level entries may be `background`, `pane`, `tab`, `workspace`, or `idle-panes`.

```json
{
  "Dev Workspace": {
    "type": "workspace",
    "name": "my-project",
    "cwd": ".",
    "tabs": [
      {
        "type": "tab",
        "name": "server",
        "panes": [
          {
            "type": "pane",
            "name": "api",
            "command": "yarn dev:api",
            "cwd": "packages/api"
          },
          {
            "type": "pane",
            "name": "web",
            "command": "yarn dev:web",
            "cwd": "packages/web",
            "direction": "right"
          }
        ]
      },
      {
        "type": "tab",
        "name": "shell"
      }
    ]
  },
  "Pi Coding Agent": {
    "type": "pane",
    "command": "pi"
  },
  "Diff": {
    "type": "tab",
    "panes": [
      {
        "type": "pane",
        "command": "diffnav --watch"
      }
    ]
  }
}
```

## Rules

- `background` runs `command` detached and logs output by picker key.
- `pane` replaces the old `split` type. Top-level panes split from the source pane.
- `tab.panes` is optional. Omitted `panes` creates a single interactive shell pane.
- `tab.panes`, when provided, must be non-empty. Every pane object must include `"type": "pane"`.
- `workspace.tabs` is required and non-empty. Every tab object must include `"type": "tab"`.
- Pane `command` is optional. Missing `command` leaves an interactive shell open.
- Pane commands run as `<command> && exit`, preserving prior command-pane behavior.
- Pane `direction` may be `right` or `down`; it defaults to `right` for top-level panes and non-root tab panes.
- The first/root pane inside a tab must not define `direction`.
- `idle-panes` runs `command` in every Herdr pane whose foreground process is an idle shell (`bash`, `sh`, `zsh`, or `fish`).
- `background` and `idle-panes` must not define `name`.
- No backward compatibility is provided for old `type: "split"`, `tab.command`, or `tab.commands`; those entries are rejected and logged.

## Naming

- JSON key: picker identity and project-over-global override key.
- Top-level workspace label: `workspace.name ?? jsonKey`.
- Top-level tab label: `tab.name ?? jsonKey`.
- Nested workspace tab label: `tab.name` when provided; otherwise Herdr chooses its default.
- Pane label: `pane.name` when provided.

## CWD precedence

```text
pane.cwd > tab.cwd > workspace.cwd > source default
```

Source default:
- global launchable: current pane cwd
- project launchable: directory containing `.launchables.json`

Relative `cwd` values always resolve relative to the config file directory.

## Workspace idempotency

Workspace launchables are idempotent by Herdr workspace label. If `herdr workspace list` already contains a workspace whose label matches `workspace.name ?? jsonKey`, the plugin focuses that workspace and does not replay tab/pane creation or commands.
