import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";

import { revealAfterEdit, revealBeforeEdit, type FollowTarget } from "./herdr.ts";
import { resolveLocation, type FollowLocation } from "./locations.ts";

const statusId = "follow-agent";

// Keep navigation best-effort so file mutations remain the source of truth.
/**
 * Follows Pi file mutations in a sibling Neovim pane inside the same Herdr tab.
 */
export default function followAgent(pi: ExtensionAPI): void {
  let enabled = false;
  const pending = new Map<string, { location: FollowLocation; target: FollowTarget }>();

  pi.on("session_start", (_event, ctx) => {
    enabled = false;
    pending.clear();
    updateStatus(ctx, enabled);
  });

  pi.on("tool_execution_start", async (event, ctx) => {
    if (!enabled || process.env.HERDR_ENV !== "1") return;
    if (event.toolName !== "edit" && event.toolName !== "write") return;

    try {
      const location = await resolveLocation(event.toolName, event.args, ctx.cwd);
      if (!location) return;

      // Await the reveal so Neovim displays the old text before mutation begins.
      const target = await revealBeforeEdit(location);
      if (target) pending.set(event.toolCallId, { location, target });
    } catch {
      // Following is optional and must never affect the mutation tool.
    }
  });

  pi.on("tool_execution_end", async (event) => {
    const follow = pending.get(event.toolCallId);
    if (!follow) return;
    pending.delete(event.toolCallId);
    if (event.isError) return;

    try {
      await revealAfterEdit(follow.target, follow.location);
    } catch {
      // Refreshing and highlighting are also best-effort.
    }
  });

  pi.registerCommand("follow-agent", {
    description: "Enable, disable, or show Neovim follow mode",
    handler: async (args, ctx) => {
      const action = args.trim().toLowerCase();
      if (action === "status" || action === "") {
        ctx.ui.notify(`Follow agent is ${enabled ? "on" : "off"}.`, "info");
        return;
      }

      if (action !== "on" && action !== "off") {
        ctx.ui.notify("Usage: /follow-agent on|off|status", "warning");
        return;
      }

      enabled = action === "on";
      pending.clear();
      updateStatus(ctx, enabled);
      ctx.ui.notify(`Follow agent turned ${action}.`, "info");
    },
  });
}

function updateStatus(ctx: ExtensionContext, enabled: boolean): void {
  ctx.ui.setStatus(statusId, enabled ? "follow: nvim" : undefined);
}
