// Smart cmd-h/j/k/l navigation, bound in keys.json as navigator.left|down|up|right.
// If the focused pane runs Vim/Neovim, press ctrl-h/j/k/l in it: Navigator.nvim
// moves between editor windows and calls `herdr-app do pane.go` at its edges.
// Otherwise, focus the neighboring Herdr pane.
// Draws nothing; it only needs a block in the layout so key commands reach it.

import { View, div } from "gpui-kit";
import { panes, run, hc, exec, home, nextCommand } from "herdr";

const KEYS = { left: "ctrl+h", down: "ctrl+j", up: "ctrl+k", right: "ctrl+l" };
const NVIM_KEYS = { left: "<C-h>", down: "<C-j>", up: "<C-k>", right: "<C-l>" };

// Same family as vim-tmux-navigator: vi, vim, nvim, view, gvim, lvim, vimdiff, nvimdiff.
const VIM = /^g?(view|l?n?vim?x?)(diff)?$/;

function isVim(pane) {
  const p = pane.program;
  return Boolean(p) && (VIM.test(p.key.toLowerCase()) || VIM.test(p.name.toLowerCase()));
}

// The RPC socket Neovim opens per terminal (nvim/lua/rmarganti/integrations/herdr_app_socket.lua).
function nvimSocket(terminal) {
  return `${home()}/.local/state/herdr-app-nvim/${terminal}.sock`;
}

// Press the key over Neovim's socket when it has one: `hc keys` waits until nobody has
// typed for ~3 s, which stalls the first press after typing (a hydra split, say).
// Plain Vim, older Neovim sessions and other machines' terminals fall back to hc.
async function press(terminal, direction) {
  if (!terminal.includes("/")) {
    const r = await exec("nvim", ["--server", nvimSocket(terminal), "--remote-send", NVIM_KEYS[direction]])
      .catch(() => null);
    if (r?.code === 0) return;
  }
  await hc(["keys", terminal, KEYS[direction]]);
}

export default class Navigator extends View {
  init(_props, cx) {
    cx.spawn(async (cx) => {
      for (;;) {
        const direction = await nextCommand();
        if (!(direction in KEYS)) continue;
        const pane = panes().find((p) => p.focused);
        if (pane?.terminal && isVim(pane)) {
          await press(pane.terminal, direction);
        } else {
          run("pane.go", { direction });
        }
        // Using cx lets a hot reload end this loop; without it the old build keeps the keys.
        cx.notify();
      }
    });
  }

  render() {
    return div();
  }
}
