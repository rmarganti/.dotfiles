# rmarganti's dot files

![Screen Shot](https://user-images.githubusercontent.com/1193396/196507311-b95e41e3-7dbd-41ca-bccb-cafe5d07b3f5.png)

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

## Recommended utilities

### Apps

- [bat](https://github.com/sharkdp/bat) - cat replacement with syntax highlighting
- [difftastic](https://github.com/Wilfred/difftastic) - language-aware diff tool for Git
- [fzf](https://github.com/junegunn/fzf) - quick file search / picker
- [kubectx](https://github.com/ahmetb/kubectx) - use fzf to switch between Kubernetes contexts
- [lsd](https://github.com/Peltoche/lsd) - ls replacement
- [neovim](https://github.com/neovim/neovim) - modal text editor
- [ripgrep](https://github.com/BurntSushi/ripgrep) - quick text search
- [zoxide](https://github.com/ajeetdsouza/zoxide) - quickly switch between recent directories

### Homebrew Casks

- [wezterm](https://github.com/wez/wezterm) - terminal emulator
- [sequel-ace](https://github.com/Sequel-Ace/Sequel-Ace) - database manager
