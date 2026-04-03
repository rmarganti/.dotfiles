// amux-status v1.0
// Pi Coding Agent extension for amux status reporting.
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

type Status = "idle" | "busy" | "awaiting_input" | "errored";

function getStatusDir(): string {
    const xdgState =
        process.env.XDG_STATE_HOME ||
        path.join(os.homedir(), ".local", "state");
    return path.join(xdgState, "amux", "pi");
}

function getStatusFilePath(paneId: string): string {
    return path.join(getStatusDir(), `${paneId}.json`);
}

function writeStatus(paneId: string, status: Status) {
    const dir = getStatusDir();
    fs.mkdirSync(dir, { recursive: true });
    const payload = JSON.stringify({
        status,
        pid: process.pid,
        ts: Math.floor(Date.now() / 1000),
    });
    fs.writeFileSync(getStatusFilePath(paneId), payload);
}

function removeStatus(paneId: string) {
    const filePath = getStatusFilePath(paneId);
    try {
        fs.unlinkSync(filePath);
    } catch (_) {}
}

export default function (pi: ExtensionAPI) {
    const paneId = process.env.TMUX_PANE;
    if (!paneId) return;

    const cleanup = () => removeStatus(paneId);
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
        cleanup();
        process.exit(130);
    });
    process.on("SIGTERM", () => {
        cleanup();
        process.exit(143);
    });

    pi.on("agent_start", async () => {
        writeStatus(paneId, "busy");
    });

    pi.on("agent_end", async () => {
        writeStatus(paneId, "idle");
    });

    pi.on("session_shutdown", async () => {
        cleanup();
    });
}
