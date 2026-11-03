// Display-only: never rename a tab, so Herdr retains its manual/automatic distinction.
export function tabName(tab, panes, homeDirectory) {
  if (tab.named) return tab.name;

  const terminals = panes.filter(p => p.tab === tab.id && p.terminal && p.cwd);
  const cwd = (terminals.find(p => p.focused) ?? terminals[0])?.cwd;
  if (!cwd) return tab.name;

  const normalized = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
  const home = homeDirectory?.replace(/\\/g, "/").replace(/\/+$/, "");
  if (home && normalized === home) return "~";
  return normalized.split("/").pop() || "/";
}
