import { tool, type Plugin } from '@opencode-ai/plugin';

const TOOL_NAME = 'beans_prime';
const TOOL_INSTRUCTION = `If and only if the user explicitly asks to create, update, inspect, or otherwise work on Beans, call the ${TOOL_NAME} tool first to load the current Beans context. Do not call ${TOOL_NAME} for unrelated tasks.`;

async function hasBeansAvailable(
    $: Parameters<Plugin>[0]['$'],
    directory: string
): Promise<boolean> {
    try {
        const hasBeans = await $`which beans`.quiet();
        const hasConfig = await $`test -f ${directory}/.beans.yml`.quiet();
        return hasBeans.exitCode === 0 && hasConfig.exitCode === 0;
    } catch {
        return false;
    }
}

export const BeansPrimePlugin: Plugin = async ({ $, directory }) => {
    const available = await hasBeansAvailable($, directory);

    if (!available) {
        return {};
    }

    return {
        tool: {
            [TOOL_NAME]: tool({
                description:
                    'Run `beans prime` in the current project and return the current Beans context. Use this only for explicit Beans-related requests.',
                args: {},
                async execute(_args, context) {
                    context.metadata({
                        title: 'beans prime',
                        metadata: { cwd: context.directory },
                    });

                    try {
                        const result = await $`beans prime`
                            .cwd(context.directory)
                            .quiet();
                        const output = result.stdout.toString().trim();
                        return output || 'beans prime produced no output.';
                    } catch (error) {
                        const message =
                            error instanceof Error
                                ? error.message
                                : String(error);
                        return `Failed to run \`beans prime\`: ${message}`;
                    }
                },
            }),
        },
        'experimental.chat.system.transform': async (_input, output) => {
            output.system.push(`## Beans Tool Usage\n\n${TOOL_INSTRUCTION}`);
        },
    };
};

export default BeansPrimePlugin;
