// Positional arguments keep the terminal address and Vim expression out of shell source.
const invoke = `
  runtime=\${XDG_RUNTIME_DIR:-\${TMPDIR:-}}
  socket="\${runtime%/}/herdr-nvim/$1.sock"
  PATH="$PATH:$HOME/.local/share/bob/nvim-bin"
  if [ -z "$runtime" ] || [ ! -S "$socket" ] || ! command -v nvim >/dev/null; then
    printf 0
    exit 0
  fi
  exec nvim --server "$socket" --remote-expr "$2"
`;

export async function jumpToLink({ link, source }, api) {
  if (source.machine || !source.tab || link.kind !== "file" || !link.path?.startsWith("/")) return "pass";
  if (/[\u0000-\u001f\u007f]/.test(link.path)) return "pass";

  // Herdr 0.1.17 only exposes diagnostic coordinates in the raw click.
  // File URIs and verified filenames ending in :digits have no coordinates.
  const suffix = /^file:/i.test(link.raw) ? null : /:(\d+)(?::(\d+))?$/.exec(link.raw);
  const place = suffix && !link.path.endsWith(suffix[0]) ? suffix : null;
  const line = Number(place?.[1] ?? 1);
  const column = Number(place?.[2] ?? 1);
  if (![line, column].every((n) => Number.isSafeInteger(n) && n > 0)) return "pass";

  const editors = new Set(api.terminals()
    .filter((t) => t.foreground?.name === "nvim" && /^t[0-9a-z]+$/.test(t.address))
    .map((t) => t.address));
  const candidates = api.panes().filter((p) => p.tab === source.tab && editors.has(p.terminal));
  const target = candidates.find((p) => p.pane === source.pane)
    ?? (candidates.length === 1 ? candidates[0] : null);
  if (!target) return "pass";

  const path = "'" + link.path.replaceAll("'", "''") + "'";
  // Acknowledge the queued jump before loading the file or running its autocmds.
  const queueJump = [
    '(function(a)',
    'if vim.fn.filereadable(a[1]) ~= 1 then return 0 end;',
    'local follow = require("rmarganti.integrations.pi_follow_agent").follow_link;',
    'vim.schedule(function() follow(a[1], a[2], a[3]) end);',
    'return 1 end)(_A)',
  ].join(" ");
  const expr = `luaeval('${queueJump}', [${path}, ${line}, ${column}])`;
  const result = await api.exec("sh", ["-c", invoke, "herdr-nvim", target.terminal, expr], { timeout: 5000 });
  const reply = result.stdout.trim();
  // E247 means the RPC connection was never made (e.g. a stale socket).
  if (result.code === 2 && result.stderr.startsWith("E247: Failed to connect")) return "pass";
  if (result.code === 0 && reply === "0") return "pass";
  // A lost or unexpected reply doesn't prove Neovim didn't receive the jump.
  // Let Herdr report the error rather than opening the same file externally.
  if (result.code !== 0 || reply !== "1") {
    throw new Error(`Neovim did not acknowledge the jump: ${result.stderr.trim() || reply || `exit ${result.code}`}`);
  }
  api.run("pane.focus", { pane: target.pane });
  return "handled";
}
