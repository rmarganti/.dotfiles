import path from 'node:path';

import type { ResolvedConfiguredLaunchable } from './types.ts';

export function resolveConfiguredCwd(
    item: ResolvedConfiguredLaunchable,
    currentCwd: string,
    configured?: string
): string {
    return resolveComposedConfiguredCwd(
        sourceDefaultCwd(item, currentCwd),
        configured
    );
}

export function resolveInheritedConfiguredCwd(
    item: ResolvedConfiguredLaunchable,
    currentCwd: string,
    inheritedCwd: string | undefined,
    configured?: string
): string {
    return resolveComposedConfiguredCwd(
        inheritedCwd || sourceDefaultCwd(item, currentCwd),
        configured
    );
}

function sourceDefaultCwd(
    item: ResolvedConfiguredLaunchable,
    currentCwd: string
): string {
    return item.source === 'project' ? item.configDir : currentCwd;
}

function resolveComposedConfiguredCwd(baseCwd: string, configured?: string): string {
    if (!configured) return baseCwd;
    if (path.isAbsolute(configured)) return configured;
    return path.resolve(baseCwd, configured);
}

export function resolveLaunchableCwd(
    item: ResolvedConfiguredLaunchable,
    currentCwd: string
): string {
    const launchableCwd =
        'cwd' in item.launchable ? item.launchable.cwd : undefined;
    return resolveConfiguredCwd(item, currentCwd, launchableCwd);
}
