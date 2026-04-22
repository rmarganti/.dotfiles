import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { Type } from '@sinclair/typebox';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const TOOL_NAME = 'ish_prime';
const TOOL_INSTRUCTION = `Use ${TOOL_NAME} only when the user explicitly asks to create, update, inspect, or otherwise work on Ishes. When that is the task, call ${TOOL_NAME} first to load the current Ish context. For requests to break work down into ishes or create linked ishes, load the Ish context first, then create atomic, testable, well-linked ishes. Do not call ${TOOL_NAME} for unrelated tasks.`;
const ISH_BREAKDOWN_PROMPT =
    'Deeply understand the work necessary to complete this request. First load the current Ish project context via `ish prime` and use Ish as the source of truth. Then create the necessary ishes for the individual pieces using the `ish` CLI, preferring structured/JSON workflows where helpful. Each ish should be the smallest independently completable and verifiable unit of work, with enough context in the body for a future agent to succeed without rereading all prior conversation. Prefer clear markdown sections such as `## Context`, `## Dependencies`, `## Work`, and `## Verification`. Choose appropriate Ish metadata (`type`, `status`, `priority`, tags) using the project\'s configured values. Use relationships correctly: `parent` for hierarchy/grouping, `blocked_by` for prerequisites, and `blocking` for work that this ish prevents from moving forward. Do not rely on parent/child links alone to represent execution order. Create a sensible hierarchy and dependency graph, avoid unnecessary fragmentation, prefer fewer high-quality ishes over many speculative ones, and validate the result with `ish check` so the created set is coherent, atomic, and ready for future workers.';
const ISH_BREAKDOWN_SHORTHANDS = [
    /^\/ishes\b[:\-\s]*(.*)$/i,
    /^break (?:it|this|the work|things) down into ishes\b[:\-\s]*(.*)$/i,
    /^create ishes\b[:\-\s]*(.*)$/i,
    /^make ishes\b[:\-\s]*(.*)$/i,
    /^turn (?:it|this) into ishes\b[:\-\s]*(.*)$/i,
];

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

    pi.registerCommand('make-ishes', {
        description:
            'Send the standard prompt for breaking work down into validated, linked ishes',
        handler: async (args, ctx) => {
            if (!(await hasIshesAvailable(ctx.cwd))) {
                ctx.ui.notify(
                    'Ish is not available in this project. Make sure `.ish.yml` exists and the `ish` CLI is installed.',
                    'warning'
                );
                return;
            }

            const prompt = buildIshBreakdownPrompt(args);
            if (ctx.isIdle()) {
                pi.sendUserMessage(prompt);
                return;
            }

            pi.sendUserMessage(prompt, { deliverAs: 'followUp' });
            ctx.ui.notify('Queued ish breakdown prompt', 'info');
        },
    });

    pi.on('session_start', async (_event, ctx) => {
        await refreshAvailability(ctx.cwd);
    });

    pi.on('input', async (event, ctx) => {
        if (event.source === 'extension') {
            return { action: 'continue' } as const;
        }

        if (!(await hasIshesAvailable(ctx.cwd))) {
            return { action: 'continue' } as const;
        }

        const transformed = expandIshShorthand(event.text);
        if (!transformed) {
            return { action: 'continue' } as const;
        }

        return { action: 'transform', text: transformed } as const;
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

function buildIshBreakdownPrompt(extraInstructions?: string): string {
    const extra = extraInstructions?.trim() ?? '';
    if (!extra) {
        return ISH_BREAKDOWN_PROMPT;
    }

    return `${ISH_BREAKDOWN_PROMPT}\n\nAdditional instructions:\n${extra}`;
}

function expandIshShorthand(text: string): string | null {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 200) {
        return null;
    }

    for (const pattern of ISH_BREAKDOWN_SHORTHANDS) {
        const match = trimmed.match(pattern);
        if (!match) {
            continue;
        }

        return buildIshBreakdownPrompt(match[1] ?? '');
    }

    return null;
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
