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
    "type": "background | tab | split",
    "cwd": "optional/path",
    "command": "shell command",
    "commands": ["shell command", "..."],
    "direction": "right | down"
  }
}
```

Rules:
- `background` uses `command`
- `split` uses `command`
- `tab` uses exactly one of `commands` or `command`
- `cwd` is optional
- relative `cwd` resolves relative to the config file
- default `cwd`:
  - global launchable: current pane cwd
  - project launchable: directory containing `.launchables.json`

## Example: global config

`~/.config/.launchables.json`

```json
{
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
    "commands": [
      "yarn dev:api",
      "yarn dev:web"
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
