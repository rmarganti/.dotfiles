# rmarganti's dot files

![Screen Shot](https://user-images.githubusercontent.com/1193396/196507311-b95e41e3-7dbd-41ca-bccb-cafe5d07b3f5.png)

## Bootstrap with mise

This repo is bootstrapped with the repo-local `mise.toml`.

It declares:

- Homebrew packages in `[bootstrap.packages]`
- dotfile symlinks in `[dotfiles]`
- a small idempotent `[tasks.bootstrap]` for `~/.git-completion.bash`

Expected clone location:

```sh
git clone git@github.com:rmarganti/.dotfiles.git ~/.dotfiles
cd ~/.dotfiles
```

Inspect without changing anything:

```sh
mise bootstrap status
mise bootstrap dotfiles apply --dry-run
```

Apply the declared machine state:

```sh
mise trust
mise bootstrap --yes
```

Notes:

- `mise bootstrap` is the supported setup path for this repo.
- `mise bootstrap` is currently experimental; this repo enables it via `[settings].experimental = true`.
- Dotfile sources are rooted at `~/.dotfiles/dots`, so this repo should be cloned to `~/.dotfiles`.

## Shared IDE Configuration

### `~/.config/ide-common.json`

This file provides a unified configuration for all IDE/editor workflows (Neovim, Zed, etc). It is designed to be extensible for future features and tools.

#### Example

```json
{
    "obsidian": {
        "workspaces": [
            { "name": "Personal", "path": "~/vaults/personal" },
            { "name": "Work", "path": "~/vaults/work" }
        ],
        "diary_folder": "diary",
        "date_format": "%Y-%m-%d",
        "alias_format": "%B %d, %Y"
    }
}
```

#### Options

- **obsidian.workspaces**: Array of workspace objects, each with a `name` and `path`.
- **obsidian.diary_folder**: Subfolder within the workspace for daily notes.
- **obsidian.date_format**: Format for diary file names (strftime-compatible).
- **obsidian.alias_format**: Human-readable date format for diary aliases/headings.
