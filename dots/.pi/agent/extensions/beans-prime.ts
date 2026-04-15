import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export default function beansPrimeExtension(pi: ExtensionAPI) {
    let beansPrime: string | undefined;
    let loadedCwd: string | undefined;
    let refreshPromise: Promise<void> | undefined;

    async function refresh(cwd: string) {
        loadedCwd = cwd;
        beansPrime = undefined;

        if (!existsSync(path.join(cwd, '.beans.yml'))) {
            return;
        }

        try {
            await execFileAsync('which', ['beans'], { cwd });
        } catch {
            return;
        }

        try {
            const { stdout } = await execFileAsync('beans', ['prime'], {
                cwd,
                maxBuffer: 1024 * 1024,
            });
            const output = stdout.trim();
            beansPrime = output || undefined;
        } catch {
            // beans not available or not configured correctly; silently skip
        }
    }

    async function ensurePrime(cwd: string) {
        if (loadedCwd !== cwd || !refreshPromise) {
            refreshPromise = refresh(cwd);
        }
        await refreshPromise;
    }

    pi.on('session_start', async (_event, ctx) => {
        await ensurePrime(ctx.cwd);
    });

    pi.on('before_agent_start', async (event, ctx) => {
        await ensurePrime(ctx.cwd);

        if (!beansPrime) {
            return;
        }

        return {
            systemPrompt:
                event.systemPrompt +
                `

## Beans Context

${beansPrime}
`,
        };
    });
}
