import { tool, type Plugin } from '@opencode-ai/plugin';

const TOOL_NAME = 'ish_prime';
const TOOL_INSTRUCTION = `If and only if the user explicitly asks to create, update, inspect, or otherwise work on Ishes, call the ${TOOL_NAME} tool first to load the current Ish context. Do not call ${TOOL_NAME} for unrelated tasks.`;

async function hasIshAvailable(
    $: Parameters<Plugin>[0]['$'],
    directory: string
): Promise<boolean> {
    try {
        const hasIsh = await $`which ish`.quiet();
        const hasConfig = await $`test -f ${directory}/.ish.yml`.quiet();
        return hasIsh.exitCode === 0 && hasConfig.exitCode === 0;
    } catch {
        return false;
    }
}

export const IshPrimePlugin: Plugin = async ({ $, directory }) => {
    const available = await hasIshAvailable($, directory);

    if (!available) {
        return {};
    }

    return {
        tool: {
            [TOOL_NAME]: tool({
                description:
                    'Run `ish prime` in the current project and return the current Ish context. Use this only for explicit Ish-related requests.',
                args: {},
                async execute(_args, context) {
                    context.metadata({
                        title: 'ish prime',
                        metadata: { cwd: context.directory },
                    });

                    try {
                        const result = await $`ish prime`
                            .cwd(context.directory)
                            .quiet();
                        const output = result.stdout.toString().trim();
                        return output || 'ish prime produced no output.';
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);
                        return `Failed to run \`ish prime\`: ${message}`;
                    }
                },
            }),
        },
        'experimental.chat.system.transform': async (_input, output) => {
            output.system.push(`## Ish Tool Usage\n\n${TOOL_INSTRUCTION}`);
        },
    };
};

export default IshPrimePlugin;
