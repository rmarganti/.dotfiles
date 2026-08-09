import type {
    ExtensionAPI,
    ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Text } from '@earendil-works/pi-tui';

const STATUS_KEY = 'hunk-review';
const POLL_INTERVAL_MS = 250;
const DISCOVERY_TIMEOUT_MS = 10_000;
const DEGRADED_AFTER_FAILURES = 3;

type ReviewSource = 'diff' | 'show';

interface ReviewInvocation {
    source: ReviewSource;
    args: string[];
}

interface HerdrTabCreateResponse {
    result: {
        tab: { tab_id: string };
        root_pane: { pane_id: string };
    };
}

interface HunkSessionSummary {
    sessionId: string;
}

interface HunkSessionListResponse {
    sessions: HunkSessionSummary[];
}

interface HunkSessionGetResponse {
    session: unknown;
}

interface HunkReviewNote {
    noteId: string;
    filePath: string;
    hunkIndex?: number;
    oldRange?: [number, number];
    newRange?: [number, number];
    body: string;
}

interface HunkCommentListResponse {
    comments: HunkReviewNote[];
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
    comments: HunkReviewNote[];
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
    comments: HunkReviewNote[];
    completedAt: string;
}

/**
 * Splits command arguments while preserving quoted values.
 */
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

/**
 * Resolves command input into a supported Hunk review invocation.
 */
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

/**
 * Quotes one shell argument so user input remains a literal value.
 */
function shellQuote(value: string): string {
    if (value.length === 0) return "''";
    return `'${value.split("'").join(`'"'"'`)}'`;
}

/** Groups Hunk notes by file and adapts them for review rendering. */
function normalizeComments(comments: HunkReviewNote[]): ReviewFile[] {
    const files = new Map<string, ReviewFile>();
    for (const comment of comments) {
        const range = comment.newRange ?? comment.oldRange;
        const normalized: NormalizedComment = {
            id: comment.noteId,
            side: comment.newRange
                ? 'new'
                : comment.oldRange
                  ? 'old'
                  : undefined,
            startLine: range?.[0],
            endLine: range?.[1],
            hunkNumber:
                comment.hunkIndex === undefined
                    ? undefined
                    : comment.hunkIndex + 1,
            body: comment.body,
        };
        const file = files.get(comment.filePath) ?? {
            path: comment.filePath,
            comments: [],
        };
        file.comments.push(normalized);
        files.set(comment.filePath, file);
    }
    return [...files.values()];
}

/** Describes a comment target in human-readable diff coordinates. */
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

/** Formats human feedback as quoted Markdown to distinguish it from instructions. */
function blockquote(body: string): string[] {
    return body
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => (line.length > 0 ? `> ${line}` : '>'));
}

/** Builds the follow-up prompt that presents human feedback to the agent. */
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

/** Waits between polls while allowing shutdown to interrupt promptly. */
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

/** Registers the Hunk review command, renderer, and session lifecycle. */
export default function (pi: ExtensionAPI) {
    let active: ActiveReview | undefined;

    /** Shows whether review monitoring is healthy or degraded. */
    const setStatus = (review: ActiveReview, degraded = false) => {
        if (!review.context.hasUI) return;
        const color = degraded ? 'warning' : 'accent';
        review.context.ui.setWidget(STATUS_KEY, [
            review.context.ui.theme.fg(color, 'ᕦ(ò_óˇ)ᕤ Hunkin'),
        ]);
    };

    /** Removes the review status when monitoring ends. */
    const clearStatus = (review: ActiveReview) => {
        if (review.context.hasUI)
            review.context.ui.setWidget(STATUS_KEY, undefined);
    };

    /** Runs a CLI command and turns process failures into actionable errors. */
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

    /** Runs a CLI command whose documented response is JSON. */
    async function execJson<T>(
        command: string,
        args: string[],
        signal?: AbortSignal
    ): Promise<T> {
        const result = await execCommand(command, args, signal);
        return JSON.parse(result.stdout) as T;
    }

    /** Uses the review tab's existence as the review-lifetime signal. */
    async function tabExists(review: ActiveReview): Promise<boolean> {
        try {
            await execCommand(
                'herdr',
                ['tab', 'get', review.tabId],
                review.controller.signal
            );
            return true;
        } catch {
            return false;
        }
    }

    /** Captures active session IDs so the newly launched review can be identified. */
    async function listHunkSessionIds(
        signal?: AbortSignal
    ): Promise<Set<string>> {
        const { sessions } = await execJson<HunkSessionListResponse>(
            'hunk',
            ['session', 'list', '--json'],
            signal
        );
        return new Set(sessions.map((session) => session.sessionId));
    }

    /** Finds the single Hunk session created by the active review. */
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

    /** Refreshes captured human notes and restores healthy status after recovery. */
    async function snapshotComments(review: ActiveReview): Promise<void> {
        if (!review.sessionId) return;
        const { comments } = await execJson<HunkCommentListResponse>(
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
        review.comments = comments;
        review.consecutivePollFailures = 0;
        if (review.degraded) {
            review.degraded = false;
            setStatus(review);
        }
    }

    /** Ends monitoring and forwards captured feedback into a new agent turn. */
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

    /** Tracks the review session until its Herdr tab closes or monitoring stops. */
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
                const { session } = await execJson<HunkSessionGetResponse>(
                    'hunk',
                    ['session', 'get', discovery.sessionId, '--json'],
                    review.controller.signal
                );
                review.sessionInfo = session;
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
                    await execCommand('herdr', ['tab', 'focus', active.tabId]);
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
                const { result } = await execJson<HerdrTabCreateResponse>(
                    'herdr',
                    [
                        'tab',
                        'create',
                        '--workspace',
                        process.env.HERDR_WORKSPACE_ID,
                        '--cwd',
                        ctx.cwd,
                        '--label',
                        'Hunk Review',
                        '--focus',
                    ]
                );
                created = {
                    tabId: result.tab.tab_id,
                    paneId: result.root_pane.pane_id,
                };
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
                const command = [
                    'exec',
                    'hunk',
                    invocation.source,
                    ...invocation.args,
                ]
                    .map(shellQuote)
                    .join(' ');

                await execCommand('herdr', [
                    'pane',
                    'run',
                    review.paneId,
                    command,
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
