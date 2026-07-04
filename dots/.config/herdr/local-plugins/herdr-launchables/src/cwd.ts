import path from 'node:path';

import type { ResolvedLaunchable } from './types.ts';

export function resolveConfiguredCwd(
    item: ResolvedLaunchable,
    currentCwd: string,
    configured?: string
): string {
    if (!configured) {
        return item.source === 'project' ? item.configDir : currentCwd;
    }

    if (path.isAbsolute(configured)) return configured;
    return path.resolve(item.configDir, configured);
}

export function resolveLaunchableCwd(
    item: ResolvedLaunchable,
    currentCwd: string
): string {
    const launchableCwd =
        'cwd' in item.launchable ? item.launchable.cwd : undefined;
    return resolveConfiguredCwd(item, currentCwd, launchableCwd);
}
