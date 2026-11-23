// Positional arguments keep the terminal address and Vim expression out of shell source.
const invoke = 'runtime=${XDG_RUNTIME_DIR:-${TMPDIR:-}}; [ -n "$runtime" ] || exit 1; PATH="$PATH:$HOME/.local/share/bob/nvim-bin"; exec nvim --server "${runtime%/}/herdr-nvim/$1.sock" --remote-expr "$2"';

export async function jumpToLink({ link, source }, api) {
  if (source.machine || !source.tab || link.kind !== "file" || !link.path?.startsWith("/")) return "pass";
  // Herdr matches mod.json against the resolved spelling, where it already
  // stripped the diagnostic suffix. Only the raw click still has line/column.
  // If the suffix resolved as part of an actual filename, leave it alone.
  const suffix = /:(\d+)(?::(\d+))?$/.exec(link.raw);
  if (!suffix || link.path.endsWith(suffix[0]) || /[\u0000-\u001f\u007f]/.test(link.path)) return "pass";
  const line = Number(suffix[1]);
  const column = Number(suffix[2] ?? 1);
  if (![line, column].every((n) => Number.isSafeInteger(n) && n > 0)) return "pass";

  const editors = new Set(api.terminals()
    .filter((t) => t.foreground?.name === "nvim" && /^t[0-9a-z]+$/.test(t.address))
    .map((t) => t.address));
  const candidates = api.panes().filter((p) => p.tab === source.tab && editors.has(p.terminal));
  const target = candidates.find((p) => p.pane === source.pane)
    ?? (candidates.length === 1 ? candidates[0] : null);
  if (!target) return "pass";

  const path = "'" + link.path.replaceAll("'", "''") + "'";
  const expr = `luaeval('require("rmarganti.integrations.pi_follow_agent").follow_link(_A[1], _A[2], _A[3]) and 1 or 0', [${path}, ${line}, ${column}])`;
  try {
    const result = await api.exec("sh", ["-c", invoke, "herdr-nvim", target.terminal, expr], { timeout: 1000 });
    if (result.code !== 0 || result.stdout.trim() !== "1") return "pass";
  } catch {
    return "pass";
  }
  api.run("pane.focus", { pane: target.pane });
  return "handled";
}
