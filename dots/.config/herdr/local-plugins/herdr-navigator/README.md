# Herdr Navigator

Local Herdr plugin for smart `ctrl-h/j/k/l` navigation.

- `ctrl-h/j/k/l`: if the focused pane is running Vim/Neovim, forward the key into the pane; otherwise focus the neighboring Herdr pane.
- `prefix+ctrl-h/j/k/l`: always send the literal control key into the focused pane.

Neovim uses `numToStr/Navigator.nvim` with a local Herdr mux adapter, so editor-window navigation continues to work with both Herdr and tmux.

Install/link:

```sh
herdr plugin link ~/.config/herdr/local-plugins/herdr-navigator
herdr server reload-config
```
