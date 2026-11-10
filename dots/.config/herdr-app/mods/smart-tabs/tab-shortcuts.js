// Indexed tab selection skips settled tabs; only 1–9 have digit bindings.
export function tabShortcuts(tabs) {
  return new Map(tabs.filter(tab => !tab.settled).slice(0, 9)
    .map((tab, index) => [tab.id, String(index + 1)]));
}
