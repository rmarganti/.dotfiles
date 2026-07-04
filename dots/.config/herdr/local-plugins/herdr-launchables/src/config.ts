import fs from 'node:fs';
import path from 'node:path';

import { GLOBAL_CONFIG_PATH, PROJECT_CONFIG_NAME } from './constants.ts';
import { appendLog } from './log.ts';
import type {
    Launchable,
    LaunchableSource,
    NormalizedTabCommand,
    ResolvedLaunchable,
} from './types.ts';

/**
 * Finds the nearest project configuration file by traversing up the directory
 * tree from the given starting directory.
 */
export function findNearestProjectConfig(startCwd: string): string {
    if (!startCwd) return '';

    let current = path.resolve(startCwd);
    while (true) {
        const candidate = path.join(current, PROJECT_CONFIG_NAME);
        if (fs.existsSync(candidate)) return candidate;
        const parent = path.dirname(current);
        if (parent === current) return '';
        current = parent;
    }
}

/**
 * Discovers launchable configurations from both global
 * and project-specific configuration files.
 */
export function discoverLaunchables(cwd: string): ResolvedLaunchable[] {
    const merged = new Map<string, ResolvedLaunchable>();

    for (const item of loadLaunchablesFile(GLOBAL_CONFIG_PATH, 'global')) {
        merged.set(item.name, item);
    }

    const projectConfigPath = findNearestProjectConfig(cwd);
    if (projectConfigPath) {
        for (const item of loadLaunchablesFile(projectConfigPath, 'project')) {
            merged.set(item.name, item);
        }
    }

    return [...merged.values()].sort((left, right) =>
        left.name.localeCompare(right.name)
    );
}

function readJsonFile<T>(filePath: string): T {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateTabCommand(value: unknown): NormalizedTabCommand | null {
    if (isNonEmptyString(value)) return { command: value };

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return null;
    }

    const candidate = value as Record<string, unknown>;
    if (!isNonEmptyString(candidate.command)) return null;
    if (candidate.cwd !== undefined && !isNonEmptyString(candidate.cwd)) {
        return null;
    }

    return {
        command: candidate.command,
        ...(isNonEmptyString(candidate.cwd) ? { cwd: candidate.cwd } : {}),
    };
}

interface ValidationResult {
    launchable: Launchable | null;
    errors: string[];
}

function validateLaunchable(name: string, value: unknown): ValidationResult {
    const errors: string[] = [];

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { launchable: null, errors: [`${name}: expected object`] };
    }

    const candidate = value as Record<string, unknown>;
    const type = candidate.type;
    const cwd = candidate.cwd;
    const normalizedCwd = isNonEmptyString(cwd) ? cwd : undefined;

    if (!isNonEmptyString(type)) errors.push(`${name}: missing string type`);
    if (cwd !== undefined && !normalizedCwd)
        errors.push(`${name}: cwd must be a non-empty string when provided`);

    if (type === 'background') {
        const command = candidate.command;
        if (!isNonEmptyString(command))
            errors.push(
                `${name}: background.command must be a non-empty string`
            );
        if (candidate.commands !== undefined)
            errors.push(`${name}: background must not define commands`);
        if (candidate.direction !== undefined)
            errors.push(`${name}: background must not define direction`);
        return errors.length === 0 && isNonEmptyString(command)
            ? {
                  launchable: {
                      type: 'background',
                      command,
                      ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                  },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (type === 'split') {
        const command = candidate.command;
        const direction = candidate.direction;
        if (!isNonEmptyString(command))
            errors.push(`${name}: split.command must be a non-empty string`);
        if (candidate.commands !== undefined)
            errors.push(`${name}: split must not define commands`);
        if (
            direction !== undefined &&
            direction !== 'right' &&
            direction !== 'down'
        ) {
            errors.push(`${name}: split.direction must be right or down`);
        }
        return errors.length === 0 && isNonEmptyString(command)
            ? {
                  launchable: {
                      type: 'split',
                      command,
                      ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                      ...(direction === 'right' || direction === 'down'
                          ? { direction }
                          : {}),
                  },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (type === 'idle-panes') {
        const command = candidate.command;
        if (!isNonEmptyString(command))
            errors.push(
                `${name}: idle-panes.command must be a non-empty string`
            );
        if (candidate.cwd !== undefined)
            errors.push(`${name}: idle-panes must not define cwd`);
        if (candidate.commands !== undefined)
            errors.push(`${name}: idle-panes must not define commands`);
        if (candidate.direction !== undefined)
            errors.push(`${name}: idle-panes must not define direction`);
        return errors.length === 0 && isNonEmptyString(command)
            ? {
                  launchable: {
                      type: 'idle-panes',
                      command,
                  },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (type === 'tab') {
        const command = candidate.command;
        const commands = candidate.commands;
        const validCommand = isNonEmptyString(command) ? command : null;
        const validCommands =
            Array.isArray(commands) && commands.length > 0
                ? commands.map((item) => validateTabCommand(item))
                : null;
        const allCommandsValid =
            validCommands !== null && validCommands.every(Boolean);

        if (command !== undefined && commands !== undefined) {
            errors.push(
                `${name}: tab must define exactly one of command or commands`
            );
        } else if (command !== undefined) {
            if (!validCommand)
                errors.push(`${name}: tab.command must be a non-empty string`);
        } else if (commands !== undefined) {
            if (!allCommandsValid)
                errors.push(
                    `${name}: tab.commands must be a non-empty array of non-empty strings or { command, cwd? } objects`
                );
        } else {
            errors.push(`${name}: tab must define command or commands`);
        }

        if (candidate.direction !== undefined)
            errors.push(`${name}: tab must not define direction`);
        return errors.length === 0 && (validCommand || allCommandsValid)
            ? {
                  launchable: validCommand
                      ? {
                            type: 'tab',
                            command: validCommand,
                            ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                        }
                      : {
                            type: 'tab',
                            commands: validCommands as NormalizedTabCommand[],
                            ...(normalizedCwd ? { cwd: normalizedCwd } : {}),
                        },
                  errors,
              }
            : { launchable: null, errors };
    }

    if (isNonEmptyString(type))
        errors.push(`${name}: unsupported type ${JSON.stringify(type)}`);
    return { launchable: null, errors };
}

function loadLaunchablesFile(
    filePath: string,
    source: LaunchableSource
): ResolvedLaunchable[] {
    if (!fs.existsSync(filePath)) return [];

    let parsed: unknown;
    try {
        parsed = readJsonFile<unknown>(filePath);
    } catch (error) {
        appendLog(`failed to parse ${filePath}: ${String(error)}`);
        return [];
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        appendLog(`ignored ${filePath}: expected top-level object`);
        return [];
    }

    const configDir = path.dirname(filePath);
    const entries: ResolvedLaunchable[] = [];

    for (const [name, value] of Object.entries(
        parsed as Record<string, unknown>
    )) {
        const result = validateLaunchable(name, value);
        if (!result.launchable) {
            for (const error of result.errors)
                appendLog(`invalid launchable in ${filePath}: ${error}`);
            continue;
        }

        entries.push({
            name,
            source,
            configPath: filePath,
            configDir,
            launchable: result.launchable,
        });
    }

    return entries;
}
