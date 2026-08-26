import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

import type { FollowLocation } from "./locations.ts";

const execFileAsync = promisify(execFile);
const timeout = 500;

export interface FollowTarget {
  paneId: string;
  socket: string;
}

interface Pane {
  pane_id: string;
  tab_id: string;
}

interface PaneListResponse {
  result?: {
    panes?: Pane[];
  };
}

interface ProcessInfoResponse {
  result?: {
    process_info?: {
      foreground_processes?: Array<{
        argv0?: string;
        name?: string;
      }>;
    };
  };
}

/**
 * Opens a location in the sole sibling Neovim pane in Pi's inherited tab.
 */
export async function revealBeforeEdit(location: FollowLocation): Promise<FollowTarget | undefined> {
  const workspaceId = process.env.HERDR_WORKSPACE_ID;
  const tabId = process.env.HERDR_TAB_ID;
  const piPaneId = process.env.HERDR_PANE_ID;
  if (process.env.HERDR_ENV !== "1" || !workspaceId || !tabId || !piPaneId) return undefined;

  const panes = await listPanes(workspaceId);
  const siblings = panes.filter((pane) => pane.tab_id === tabId && pane.pane_id !== piPaneId);
  const candidates = (
    await Promise.all(siblings.map(async (pane) => ((await isNeovimPane(pane.pane_id)) ? pane : undefined)))
  ).filter((pane): pane is Pane => pane !== undefined);

  if (candidates.length !== 1) return undefined;

  const paneId = candidates[0].pane_id;
  const socket = socketPath(paneId);
  const expression = `luaeval('require("rmarganti.integrations.pi_follow_agent").follow(_A[1], _A[2])', [${vimString(location.path)}, ${location.line}])`;
  await run("nvim", ["--server", socket, "--remote-expr", expression]);
  return { paneId, socket };
}

/**
 * Refreshes the previously selected Neovim pane and flashes the changed range.
 */
export async function revealAfterEdit(target: FollowTarget, location: FollowLocation): Promise<void> {
  const expression = `luaeval('require("rmarganti.integrations.pi_follow_agent").refresh(_A[1], _A[2], _A[3])', [${vimString(location.path)}, ${location.line}, ${location.endLine}])`;
  await run("nvim", ["--server", target.socket, "--remote-expr", expression]);
}

async function listPanes(workspaceId: string): Promise<Pane[]> {
  const output = await run("herdr", ["pane", "list", "--workspace", workspaceId]);
  const response = JSON.parse(output) as PaneListResponse;
  return response.result?.panes ?? [];
}

async function isNeovimPane(paneId: string): Promise<boolean> {
  try {
    const output = await run("herdr", ["pane", "process-info", "--pane", paneId]);
    const response = JSON.parse(output) as ProcessInfoResponse;
    return (response.result?.process_info?.foreground_processes ?? []).some((foreground) => {
      const processName = `${foreground.argv0 ?? ""} ${foreground.name ?? ""}`;
      return /(^|[\s/])nvim(\s|$)/i.test(processName);
    });
  } catch {
    return false;
  }
}

function socketPath(paneId: string): string {
  const runtimeDirectory = process.env.XDG_RUNTIME_DIR || tmpdir();
  return join(runtimeDirectory, "pi-follow-agent", `${paneId.replaceAll(":", "-")}.sock`);
}

function vimString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function run(command: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    encoding: "utf8",
    timeout,
    maxBuffer: 1024 * 1024,
  });
  return stdout;
}
