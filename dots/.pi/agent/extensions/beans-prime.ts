import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from '@sinclair/typebox';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TOOL_NAME = 'beans_prime';
const TOOL_INSTRUCTION = `Use ${TOOL_NAME} only when the user explicitly asks to create, update, inspect, or otherwise work on Beans. When that is the task, call ${TOOL_NAME} first to load the current Beans context. Do not call ${TOOL_NAME} for unrelated tasks.`;

export default function beansPrimeExtension(pi: ExtensionAPI) {
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
        syncToolAvailability(await hasBeansAvailable(cwd));
    }

    pi.registerTool({
        name: TOOL_NAME,
        label: 'Beans Prime',
        description:
            'Run `beans prime` in the current project and return the current Beans context. Use this only for explicit Beans-related requests.',
        promptSnippet:
            'Load the current Beans project context by running `beans prime`.',
        parameters: Type.Object({}),
        async execute(_toolCallId, _params, signal, _onUpdate, ctx) {
            if (!(await hasBeansAvailable(ctx.cwd))) {
                syncToolAvailability(false);
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Beans is not available in this project. Make sure `.beans.yml` exists and the `beans` CLI is installed.',
                        },
                    ],
                    details: { cwd: ctx.cwd, available: false },
                };
            }

            syncToolAvailability(true);

            try {
                const output = await runBeansPrime(ctx.cwd, signal);
                return {
                    content: [
                        {
                            type: 'text',
                            text: output || 'beans prime produced no output.',
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
                            text: `Failed to run \`beans prime\`: ${message}`,
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
                `\n\n## Beans Tool Usage\n\n${TOOL_INSTRUCTION}`,
        };
    });
}

async function hasBeansAvailable(cwd: string): Promise<boolean> {
    if (!existsSync(path.join(cwd, '.beans.yml'))) {
        return false;
    }

    try {
        await execFileAsync('which', ['beans'], { cwd });
        return true;
    } catch {
        return false;
    }
}

async function runBeansPrime(
    cwd: string,
    signal?: AbortSignal
): Promise<string | undefined> {
    const { stdout } = await execFileAsync('beans', ['prime'], {
        cwd,
        maxBuffer: 1024 * 1024,
        signal,
    });

    const output = stdout.trim();
    return output || undefined;
}
