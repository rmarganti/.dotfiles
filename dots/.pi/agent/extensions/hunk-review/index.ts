import type {
    ExtensionAPI,
    ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';

const STATUS_KEY = 'hunk-review';
const POLL_INTERVAL_MS = 250;
const DISCOVERY_TIMEOUT_MS = 10_000;
const DEGRADED_AFTER_FAILURES = 3;

type JsonObject = Record<string, unknown>;

type ReviewSource = 'diff' | 'show';

interface ReviewInvocation {
    source: ReviewSource;
    args: string[];
}

interface ActiveReview {
    tabId: string;
    paneId: string;
    cwd: string;
    invocation: ReviewInvocation;
    sessionsBefore: Set<string>;
    controller: AbortController;
    context: ExtensionContext;
    sessionId?: string;
    sessionInfo?: unknown;
    comments: unknown[];
    consecutivePollFailures: number;
    degraded: boolean;
}

interface NormalizedComment {
    id?: string;
    side?: 'new' | 'old';
    startLine?: number;
    endLine?: number;
    hunkNumber?: number;
    body: string;
}

interface ReviewFile {
    path: string;
    comments: NormalizedComment[];
}

interface ReviewResultDetails {
    repository: string;
    source: ReviewSource;
    arguments: string[];
    hunkSessionId: string;
    session: unknown;
    files: ReviewFile[];
    comments: unknown[];
    completedAt: string;
}

function isObject(value: unknown): value is JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(text: string, label: string): unknown {
    try {
        return JSON.parse(text);
    } catch (error) {
        throw new Error(
            `${label} returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

function tokenize(input: string): string[] {
    const tokens: string[] = [];
    let token = '';
    let quote: 'single' | 'double' | undefined;
    let escaping = false;
    let started = false;

    for (const character of input) {
        if (escaping) {
            token += character;
            escaping = false;
            started = true;
            continue;
        }

        if (quote === 'single') {
            if (character === "'") quote = undefined;
            else token += character;
            started = true;
            continue;
        }

        if (quote === 'double') {
            if (character === '"') quote = undefined;
            else if (character === '\\') escaping = true;
            else token += character;
            started = true;
            continue;
        }

        if (character === '\\') {
            escaping = true;
            started = true;
        } else if (character === "'") {
            quote = 'single';
            started = true;
        } else if (character === '"') {
            quote = 'double';
            started = true;
        } else if (/\s/.test(character)) {
            if (started) {
                tokens.push(token);
                token = '';
                started = false;
            }
        } else {
            token += character;
            started = true;
        }
    }

    if (escaping) throw new Error('Trailing escape in arguments.');
    if (quote) throw new Error('Unterminated quote in arguments.');
    if (started) tokens.push(token);
    return tokens;
}

function parseInvocation(input: string): ReviewInvocation {
    const tokens = tokenize(input.trim());
    if (tokens.length === 0) return { source: 'diff', args: [] };

    const [source, ...args] = tokens;
    if (source !== 'diff' && source !== 'show') {
        throw new Error(
            `Unsupported review source "${source}". Use "diff" or "show".`
        );
    }
    return { source, args };
}

function shellQuote(value: string): string {
    if (value.length === 0) return "''";
    return `'${value.split("'").join(`'"'"'`)}'`;
}

function commandFor(invocation: ReviewInvocation): string {
    return ['exec', 'hunk', invocation.source, ...invocation.args]
        .map(shellQuote)
        .join(' ');
}

function nestedResult(payload: unknown): JsonObject | undefined {
    if (!isObject(payload)) return undefined;
    return isObject(payload.result) ? payload.result : payload;
}

function extractTabAndPane(payload: unknown): {
    tabId: string;
    paneId: string;
} {
    const result = nestedResult(payload);
    const tab = result && isObject(result.tab) ? result.tab : undefined;
    const pane =
        result && isObject(result.root_pane) ? result.root_pane : undefined;
    const tabId = tab?.tab_id;
    const paneId = pane?.pane_id;
    if (typeof tabId !== 'string' || typeof paneId !== 'string') {
        throw new Error(
            'Herdr did not return the created tab and root pane IDs.'
        );
    }
    return { tabId, paneId };
}

function extractSessions(payload: unknown): unknown[] {
    if (!isObject(payload)) return [];
    const sessions =
        payload.sessions ??
        (isObject(payload.result) ? payload.result.sessions : undefined);
    return Array.isArray(sessions) ? sessions : [];
}

function sessionId(session: unknown): string | undefined {
    if (!isObject(session)) return undefined;
    for (const key of ['id', 'sessionId', 'session_id']) {
        if (typeof session[key] === 'string') return session[key] as string;
    }
    return undefined;
}

function extractComments(payload: unknown): unknown[] {
    if (Array.isArray(payload)) return payload;
    if (!isObject(payload)) return [];
    if (Array.isArray(payload.comments)) return payload.comments;
    if (isObject(payload.result) && Array.isArray(payload.result.comments))
        return payload.result.comments;
    return [];
}

function commentField(
    comment: unknown,
    keys: string[]
): string | number | undefined {
    if (!isObject(comment)) return undefined;
    for (const key of keys) {
        const value = comment[key];
        if (typeof value === 'string' || typeof value === 'number')
            return value;
    }
    return undefined;
}

function commentRange(
    comment: unknown,
    keys: string[]
): [number, number] | undefined {
    if (!isObject(comment)) return undefined;
    for (const key of keys) {
        const value = comment[key];
        if (
            Array.isArray(value) &&
            value.length >= 2 &&
            typeof value[0] === 'number' &&
            typeof value[1] === 'number'
        ) {
            return [value[0], value[1]];
        }
    }
    return undefined;
}

function normalizeComments(comments: unknown[]): ReviewFile[] {
    const files = new Map<string, ReviewFile>();
    for (const raw of comments) {
        const path = String(
            commentField(raw, ['filePath', 'file', 'path']) ?? 'unknown file'
        );
        const newRange = commentRange(raw, ['newRange', 'new_range']);
        const oldRange = commentRange(raw, ['oldRange', 'old_range']);
        const newLine = commentField(raw, ['newLine', 'new_line']);
        const oldLine = commentField(raw, ['oldLine', 'old_line']);
        const genericLine = commentField(raw, ['line']);
        const range =
            newRange ??
            oldRange ??
            (typeof newLine === 'number'
                ? ([newLine, newLine] as [number, number])
                : undefined) ??
            (typeof oldLine === 'number'
                ? ([oldLine, oldLine] as [number, number])
                : undefined) ??
            (typeof genericLine === 'number'
                ? ([genericLine, genericLine] as [number, number])
                : undefined);
        const side =
            newRange || typeof newLine === 'number'
                ? 'new'
                : oldRange || typeof oldLine === 'number'
                  ? 'old'
                  : undefined;
        const hunkIndex = commentField(raw, ['hunkIndex', 'hunk_index']);
        const hunkNumber = commentField(raw, [
            'hunkNumber',
            'hunk_number',
            'hunk',
        ]);
        const normalized: NormalizedComment = {
            id:
                String(commentField(raw, ['noteId', 'note_id', 'id']) ?? '') ||
                undefined,
            side,
            startLine: range?.[0],
            endLine: range?.[1],
            hunkNumber:
                typeof hunkIndex === 'number'
                    ? hunkIndex + 1
                    : typeof hunkNumber === 'number'
                      ? hunkNumber
                      : undefined,
            body: String(
                commentField(raw, ['body', 'summary', 'text', 'message']) ??
                    'Review comment'
            ),
        };
        const file = files.get(path) ?? { path, comments: [] };
        file.comments.push(normalized);
        files.set(path, file);
    }
    return [...files.values()];
}

function commentLocation(comment: NormalizedComment): string {
    const parts: string[] = [];
    if (comment.startLine !== undefined) {
        const side = comment.side ? `${comment.side} ` : '';
        const end = comment.endLine ?? comment.startLine;
        parts.push(
            end === comment.startLine
                ? `${side}line ${comment.startLine}`
                : `${side}lines ${comment.startLine}–${end}`
        );
    }
    if (comment.hunkNumber !== undefined)
        parts.push(`hunk ${comment.hunkNumber}`);
    return parts.length > 0 ? parts.join(' · ') : 'location unavailable';
}

function blockquote(body: string): string[] {
    return body
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => (line.length > 0 ? `> ${line}` : '>'));
}

function resultContent(files: ReviewFile[], commentCount: number): string {
    const feedback = files.flatMap((file) => [
        `## \`${file.path.replace(/`/g, '\\`')}\``,
        '',
        ...file.comments.flatMap((comment, index) => [
            `### Comment ${index + 1} — ${commentLocation(comment)}`,
            '',
            ...blockquote(comment.body),
            '',
        ]),
    ]);
    return [
        '# Hunk Review Feedback',
        '',
        `Review completed with ${commentCount} human comment${commentCount === 1 ? '' : 's'} across ${files.length} file${files.length === 1 ? '' : 's'}.`,
        '',
        'Treat these as requested changes, but validate each against the current code before editing.',
        'Implement valid requests, run appropriate checks, and explain any request that cannot or should not be applied.',
        '',
        ...feedback,
    ]
        .join('\n')
        .trimEnd();
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
        if (signal.aborted) return resolve();
        const timer = setTimeout(resolve, ms);
        const abort = () => {
            clearTimeout(timer);
            resolve();
        };
        signal.addEventListener('abort', abort, { once: true });
    });
}

export default function (pi: ExtensionAPI) {
    let active: ActiveReview | undefined;

    const setStatus = (review: ActiveReview, degraded = false) => {
        if (!review.context.hasUI) return;
        const color = degraded ? 'warning' : 'accent';
        review.context.ui.setWidget(STATUS_KEY, [
            review.context.ui.theme.fg(color, 'ᕦ(ò_óˇ)ᕤ Hunkin'),
        ]);
    };

    const clearStatus = (review: ActiveReview) => {
        if (review.context.hasUI)
            review.context.ui.setWidget(STATUS_KEY, undefined);
    };

    async function execCommand(
        command: string,
        args: string[],
        signal?: AbortSignal
    ) {
        const result = await pi.exec(command, args, { signal, timeout: 5_000 });
        if (result.code !== 0) {
            throw new Error(
                result.stderr.trim() ||
                    result.stdout.trim() ||
                    `${command} exited with code ${result.code}`
            );
        }
        return result;
    }

    async function execJson(
        command: string,
        args: string[],
        signal?: AbortSignal
    ): Promise<unknown> {
        const result = await execCommand(command, args, signal);
        return parseJson(result.stdout, `${command} ${args.join(' ')}`);
    }

    async function tabExists(review: ActiveReview): Promise<boolean> {
        try {
            await execJson(
                'herdr',
                ['tab', 'get', review.tabId],
                review.controller.signal
            );
            return true;
        } catch {
            return false;
        }
    }

    async function listHunkSessionIds(
        signal?: AbortSignal
    ): Promise<Set<string>> {
        const payload = await execJson(
            'hunk',
            ['session', 'list', '--json'],
            signal
        );
        return new Set(
            extractSessions(payload)
                .map(sessionId)
                .filter((id): id is string => id !== undefined)
        );
    }

    async function discoverSession(
        review: ActiveReview
    ): Promise<{ sessionId?: string; tabClosed: boolean }> {
        const deadline = Date.now() + DISCOVERY_TIMEOUT_MS;
        while (!review.controller.signal.aborted && Date.now() < deadline) {
            if (!(await tabExists(review))) return { tabClosed: true };
            try {
                const current = await listHunkSessionIds(
                    review.controller.signal
                );
                const created = [...current].filter(
                    (id) => !review.sessionsBefore.has(id)
                );
                if (created.length > 1) {
                    throw new Error(
                        'Multiple new Hunk sessions appeared; refusing to attach to an ambiguous review.'
                    );
                }
                if (created.length === 1)
                    return { sessionId: created[0], tabClosed: false };
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.message.startsWith('Multiple new Hunk sessions')
                )
                    throw error;
            }
            await sleep(POLL_INTERVAL_MS, review.controller.signal);
        }
        return { tabClosed: false };
    }

    async function snapshotComments(review: ActiveReview): Promise<void> {
        if (!review.sessionId) return;
        const payload = await execJson(
            'hunk',
            [
                'session',
                'comment',
                'list',
                review.sessionId,
                '--type',
                'user',
                '--json',
            ],
            review.controller.signal
        );
        review.comments = extractComments(payload);
        review.consecutivePollFailures = 0;
        if (review.degraded) {
            review.degraded = false;
            setStatus(review);
        }
    }

    async function finalize(review: ActiveReview): Promise<void> {
        if (active !== review || review.controller.signal.aborted) return;
        active = undefined;
        clearStatus(review);

        if (review.degraded) {
            review.context.ui.notify(
                'Hunk review ended, but comment capture was degraded. No agent turn was started.',
                'warning'
            );
            return;
        }

        if (review.comments.length === 0) {
            review.context.ui.notify(
                'Hunk review completed with no human comments.',
                'info'
            );
            return;
        }

        const files = normalizeComments(review.comments);
        const details: ReviewResultDetails = {
            repository: review.cwd,
            source: review.invocation.source,
            arguments: [...review.invocation.args],
            hunkSessionId: review.sessionId!,
            session: review.sessionInfo,
            files,
            comments: [...review.comments],
            completedAt: new Date().toISOString(),
        };
        pi.sendMessage(
            {
                customType: 'hunk-review-result',
                content: resultContent(files, review.comments.length),
                display: true,
                details,
            },
            { deliverAs: 'followUp', triggerTurn: true }
        );
    }

    async function monitor(review: ActiveReview): Promise<void> {
        try {
            const discovery = await discoverSession(review);
            if (review.controller.signal.aborted || active !== review) return;
            if (!discovery.sessionId) {
                active = undefined;
                clearStatus(review);
                if (discovery.tabClosed) {
                    review.context.ui.notify(
                        'Hunk review completed with no human comments.',
                        'info'
                    );
                } else {
                    review.context.ui.notify(
                        'Could not discover the Hunk session within 10 seconds; monitoring stopped and the tab was left alone.',
                        'warning'
                    );
                }
                return;
            }

            review.sessionId = discovery.sessionId;
            try {
                review.sessionInfo = await execJson(
                    'hunk',
                    ['session', 'get', discovery.sessionId, '--json'],
                    review.controller.signal
                );
            } catch {
                review.sessionInfo = undefined;
            }

            while (!review.controller.signal.aborted && active === review) {
                const [exists, snapshot] = await Promise.allSettled([
                    tabExists(review),
                    snapshotComments(review),
                ]);
                const tabIsOpen = exists.status === 'fulfilled' && exists.value;
                if (!tabIsOpen) {
                    await finalize(review);
                    return;
                }

                if (snapshot.status === 'rejected') {
                    review.consecutivePollFailures += 1;
                    if (
                        review.consecutivePollFailures >=
                            DEGRADED_AFTER_FAILURES &&
                        !review.degraded
                    ) {
                        review.degraded = true;
                        setStatus(review, true);
                    }
                }
                await sleep(POLL_INTERVAL_MS, review.controller.signal);
            }
        } catch (error) {
            if (review.controller.signal.aborted || active !== review) return;
            active = undefined;
            clearStatus(review);
            review.context.ui.notify(
                error instanceof Error ? error.message : String(error),
                'error'
            );
        }
    }

    pi.registerMessageRenderer(
        'hunk-review-result',
        (message, options, theme) => {
            const details = message.details as ReviewResultDetails | undefined;
            if (!details) {
                const content =
                    typeof message.content === 'string'
                        ? message.content
                        : JSON.stringify(message.content);
                return new Text(content, 0, 0);
            }

            const files = details.files ?? normalizeComments(details.comments);
            const lines = [
                theme.fg(
                    'success',
                    theme.bold(
                        `Hunk review: ${details.comments.length} human comment${details.comments.length === 1 ? '' : 's'}`
                    )
                ),
            ];
            for (const file of files) {
                lines.push('', theme.fg('accent', theme.bold(file.path)));
                file.comments.forEach((comment, index) => {
                    lines.push(
                        `  ${theme.fg('muted', `Comment ${index + 1} — ${commentLocation(comment)}`)}`
                    );
                    for (const bodyLine of comment.body
                        .replace(/\r\n?/g, '\n')
                        .split('\n')) {
                        lines.push(`    ${theme.fg('dim', '│')} ${bodyLine}`);
                    }
                });
            }
            if (options.expanded) {
                lines.push(
                    '',
                    theme.fg('dim', JSON.stringify(details, null, 2))
                );
            }
            return new Text(lines.join('\n'), 0, 0);
        }
    );

    pi.registerCommand('hunk-review', {
        description: 'Open a Hunk diff or show review in a new Herdr tab',
        getArgumentCompletions: (prefix) => {
            const values = ['diff', 'show'];
            const matches = values
                .filter((value) => value.startsWith(prefix))
                .map((value) => ({ value, label: value }));
            return matches.length > 0 ? matches : null;
        },
        handler: async (args, ctx) => {
            if (
                process.env.HERDR_ENV !== '1' ||
                !process.env.HERDR_WORKSPACE_ID
            ) {
                ctx.ui.notify(
                    '/hunk-review requires Pi to be running inside Herdr.',
                    'error'
                );
                return;
            }

            if (active) {
                try {
                    await execJson('herdr', ['tab', 'focus', active.tabId]);
                } catch {
                    ctx.ui.notify(
                        'The active Hunk review tab could not be focused.',
                        'warning'
                    );
                }
                return;
            }

            let invocation: ReviewInvocation;
            try {
                invocation = parseInvocation(args);
            } catch (error) {
                ctx.ui.notify(
                    error instanceof Error ? error.message : String(error),
                    'error'
                );
                return;
            }

            let sessionsBefore: Set<string>;
            try {
                sessionsBefore = await listHunkSessionIds();
            } catch (error) {
                ctx.ui.notify(
                    `Could not inspect Hunk sessions: ${error instanceof Error ? error.message : String(error)}`,
                    'error'
                );
                return;
            }

            let created: { tabId: string; paneId: string };
            try {
                const payload = await execJson('herdr', [
                    'tab',
                    'create',
                    '--workspace',
                    process.env.HERDR_WORKSPACE_ID,
                    '--cwd',
                    ctx.cwd,
                    '--label',
                    'Hunk Review',
                    '--focus',
                ]);
                created = extractTabAndPane(payload);
            } catch (error) {
                ctx.ui.notify(
                    `Could not create the Herdr tab: ${error instanceof Error ? error.message : String(error)}`,
                    'error'
                );
                return;
            }

            const review: ActiveReview = {
                ...created,
                cwd: ctx.cwd,
                invocation,
                sessionsBefore,
                controller: new AbortController(),
                context: ctx,
                comments: [],
                consecutivePollFailures: 0,
                degraded: false,
            };
            active = review;
            setStatus(review);

            try {
                await execCommand('herdr', [
                    'pane',
                    'run',
                    review.paneId,
                    commandFor(invocation),
                ]);
            } catch (error) {
                active = undefined;
                clearStatus(review);
                await pi
                    .exec('herdr', ['tab', 'close', review.tabId], {
                        timeout: 5_000,
                    })
                    .catch(() => undefined);
                ctx.ui.notify(
                    `Could not launch Hunk: ${error instanceof Error ? error.message : String(error)}`,
                    'error'
                );
                return;
            }

            void monitor(review);
        },
    });

    pi.on('session_shutdown', async (_event, ctx) => {
        const review = active;
        if (!review) return;
        active = undefined;
        review.controller.abort();
        clearStatus(review);
        if (ctx.hasUI)
            ctx.ui.notify(
                'Stopped monitoring Hunk; the review tab was left open.',
                'info'
            );
    });
}
