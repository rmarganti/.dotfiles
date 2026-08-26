import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

interface FollowAgentSettings {
  enabled: boolean;
}

const settingsPath = join(homedir(), ".pi", "agent", "follow-agent.json");

/**
 * Reads extension settings, defaulting follow mode to off.
 */
export async function readEnabled(): Promise<boolean> {
  try {
    const settings = JSON.parse(await readFile(settingsPath, "utf8")) as Partial<FollowAgentSettings>;
    return settings.enabled === true;
  } catch {
    return false;
  }
}

/**
 * Persists whether follow mode is enabled.
 */
export async function writeEnabled(enabled: boolean): Promise<void> {
  await mkdir(dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify({ enabled }, null, 2)}\n`, "utf8");
}
