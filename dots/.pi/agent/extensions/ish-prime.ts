import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from '@sinclair/typebox';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TOOL_NAME = 'ish_prime';
const TOOL_INSTRUCTION = `Use ${TOOL_NAME} only when the user explicitly asks to create, update, inspect, or otherwise work on Ishes. When that is the task, call ${TOOL_NAME} first to load the current Ish context. Do not call ${TOOL_NAME} for unrelated tasks.`;

export default function ishPrimeExtension(pi: ExtensionAPI) {
    function syncToolAvailability(available: boolean) {
        const activeTools = pi.getActiveTools();
        const hasTool = activeTools.includes(TOOL_NAME);

        if (available && !hasTool) {
            pi.setActiveTools([...activeTools, TOOL_NAME]);
            return;
        }

        if (!available && hasTool) {
            pi.setActiveTools(activeTools.filter((name) => name !== TOOL_NAME));
        }
    }

    async function refreshAvailability(cwd: string) {
        syncToolAvailability(await hasIshesAvailable(cwd));
    }

    pi.registerTool({
        name: TOOL_NAME,
        label: 'Ish Prime',
        description:
            'Run `ish prime` in the current project and return the current Ish context. Use this only for explicit Ish-related requests.',
        promptSnippet:
            'Load the current Ish project context by running `ish prime`.',
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, signal, _onUpdate, ctx) {
            if (!(await hasIshesAvailable(ctx.cwd))) {
                syncToolAvailability(false);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Ish is not available in this project. Make sure `.ish.yml` exists and the `ish` CLI is installed.',
                        },
                    ],
                    details: { cwd: ctx.cwd, available: false },
                };
            }

            syncToolAvailability(true);

            try {
                const output = await runIshPrime(ctx.cwd, signal);
                return {
                    content: [
                        {
                            type: 'text',
                            text: output || 'ish prime produced no output.',
                        },
                    ],
                    details: { cwd: ctx.cwd, available: true },
                };
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to run \`ish prime\`: ${message}`,
                        },
                    ],
                    details: { cwd: ctx.cwd, available: true, error: message },
                    isError: true,
                };
            }
        },
    });

    pi.on('session_start', async (_event, ctx) => {
        await refreshAvailability(ctx.cwd);
    });

    pi.on('before_agent_start', async (event) => {
        if (!pi.getActiveTools().includes(TOOL_NAME)) {
            return;
        }

        return {
            systemPrompt:
                event.systemPrompt +
                `\n\n## Ish Tool Usage\n\n${TOOL_INSTRUCTION}`,
        };
    });
}

async function hasIshesAvailable(cwd: string): Promise<boolean> {
    if (!existsSync(path.join(cwd, '.ish.yml'))) {
        return false;
    }

    try {
        await execFileAsync('which', ['ish'], { cwd });
        return true;
    } catch {
        return false;
    }
}

async function runIshPrime(
    cwd: string,
    signal?: AbortSignal
): Promise<string | undefined> {
    const { stdout } = await execFileAsync('ish', ['prime'], {
        cwd,
        maxBuffer: 1024 * 1024,
        signal,
    });

    const output = stdout.trim();
    return output || undefined;
}
