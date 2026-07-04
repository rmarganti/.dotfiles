# herdr-launchables

A Herdr plugin for launching reusable commands from one picker.

It merges:
- global launchables from `~/.config/.launchables.json`
- nearest project launchables from `.launchables.json` in the current cwd or an ancestor

Project launchables override global ones by name.

## Schema

```json
{
  "Name": {
    "type": "background | tab | split | idle-panes",
    "cwd": "optional/path",
    "command": "shell command",
    "commands": ["shell command", { "command": "shell command", "cwd": "optional/path" }],
    "direction": "right | down"
  }
}
```

Rules:
- `background` uses `command`
- `split` uses `command`
- `tab` uses exactly one of `commands` or `command`
- `idle-panes` uses `command` and runs it in every Herdr pane whose foreground process is an idle shell (`bash`, `sh`, `zsh`, or `fish`)
- `tab.commands` entries may be strings or `{ "command": "...", "cwd": "..." }` objects
- `cwd` is optional
- for tab command objects, per-command `cwd` overrides the launchable-level `cwd`
- relative `cwd` resolves relative to the config file
- default `cwd`:
  - global launchable: current pane cwd
  - project launchable: directory containing `.launchables.json`

## Example: global config

`~/.config/.launchables.json`

```json
{
  "Clear all terminals": {
    "type": "idle-panes",
    "command": "clear"
  },
  "Refresh bash env": {
    "type": "idle-panes",
    "command": "source ~/.bash_profile"
  },
  "Kill node": {
    "type": "background",
    "command": "killall node 2>/dev/null || true"
  },
  "Pi Coding Agent": {
    "type": "split",
    "command": "pi",
    "direction": "right"
  }
}
```

## Example: project config

`.launchables.json`

```json
{
  "web": {
    "type": "tab",
    "cwd": ".",
    "commands": [
      {
        "command": "yarn dev:api",
        "cwd": "packages/api"
      },
      {
        "command": "yarn dev:web",
        "cwd": "packages/web"
      },
      "yarn dev:worker"
    ]
  },
  "storybook": {
    "type": "tab",
    "command": "yarn storybook"
  },
  "tests": {
    "type": "split",
    "command": "yarn test --watch",
    "cwd": "packages/app"
  }
}
```
