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

## Nono

Bootstrap installs Nono and links the profiles in `dots/.config/nono/profiles`. Install the registry-managed Pi pack separately:

```sh
nono pull nolabs-ai/pi
```

Use the local profiles when starting agents or tools:

```sh
nono run --profile pi-base -- pi
nono run --profile neovim-tool -- nvim
```

Profiles compose shared capabilities:

- `agent-common` contains capabilities shared by coding agents.
- `obsidian-common` grants access to the machine's Obsidian parent directory.
- `neovim-tool` adds Neovim, plugin, config, state, and working-directory access.
- `pi-base` combines the shared agent profile with the registry-managed Pi profile.

Profile changes only affect new sandboxes. Restart the command after editing a profile. Diagnose denials from inside a sandbox with:

```sh
nono why --self --path /blocked/path --op readwrite
```

Do not edit registry-managed files under `~/.config/nono/packages`; extend them with a user profile instead.

### Obsidian bootstrap

Each machine must expose its Obsidian vault parent at `~/obsidian-vaults` before starting a Nono profile:

```sh
ln -s "/machine-specific/obsidian-parent" ~/obsidian-vaults
```

Nono resolves this symlink when building the sandbox, so `obsidian-common` remains portable while granting the machine-specific target. On macOS, applications should use the canonical target path rather than traverse `~/obsidian-vaults` at runtime. Put that canonical workspace path in `~/.config/dev-common.json`:

```sh
cp ~/.dotfiles/dots/.config/ide-common.example.json ~/.config/dev-common.json
realpath ~/obsidian-vaults
```

## Shared Dev Configuration

### `~/.config/dev-common.json`

This file provides a unified configuration for all IDE/editor/dev workflows (Neovim, Zed, etc). It is designed to be extensible for future features and tools.

#### Example

```json
{
    "obsidian": {
        "workspaces": [
            { "name": "Personal", "path": "/canonical/obsidian-parent/personal" },
            { "name": "Work", "path": "/canonical/obsidian-parent/work" }
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
