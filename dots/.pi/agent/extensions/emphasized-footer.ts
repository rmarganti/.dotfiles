import type { ExtensionAPI, ReadonlyFooterDataProvider, Theme, ThemeColor } from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve, sep } from "node:path";

type UsageProviderKey = "claude" | "codex" | "copilot" | "gemini" | "minimax" | "minimax-cn" | "kimi-coding";

interface RateWindow {
	label: string;
	usedPercent: number;
	resetsIn?: string;
}

interface UsageSnapshot {
	provider: string;
	windows: RateWindow[];
	error?: string;
	fetchedAt: number;
}

const USAGE_REFRESH_INTERVAL_MS = 5 * 60_000;
const CONTEXT_GAUGE_WIDTH = 12;
const USAGE_GAUGE_WIDTH = 10;
const BAR_FILLED = "━";
const BAR_EMPTY = "─";
const usageCache = new Map<UsageProviderKey, UsageSnapshot>();

function sanitizeStatusText(text: string): string {
	return text
		.replace(/[\r\n\t]/g, " ")
		.replace(/ +/g, " ")
		.trim();
}

function formatTokens(count: number): string {
	if (count < 1000) return count.toString();
	if (count < 10000) return `${(count / 1000).toFixed(1)}k`;
	if (count < 1000000) return `${Math.round(count / 1000)}k`;
	if (count < 10000000) return `${(count / 1000000).toFixed(1)}M`;
	return `${Math.round(count / 1000000)}M`;
}

function formatCwdForFooter(cwd: string, home?: string): string {
	if (!home) return cwd;

	const resolvedCwd = resolve(cwd);
	const resolvedHome = resolve(home);
	const relativeToHome = relative(resolvedHome, resolvedCwd);
	const isInsideHome =
		relativeToHome === "" ||
		(relativeToHome !== ".." && !relativeToHome.startsWith(`..${sep}`) && !isAbsolute(relativeToHome));

	if (!isInsideHome) return cwd;
	return relativeToHome === "" ? "~" : `~${sep}${relativeToHome}`;
}

function thinkingColorToken(level: string): ThemeColor {
	switch (level) {
		case "minimal":
			return "thinkingMinimal";
		case "low":
			return "thinkingLow";
		case "medium":
			return "thinkingMedium";
		case "high":
			return "thinkingHigh";
		case "xhigh":
			return "thinkingXhigh";
		case "off":
		default:
			return "thinkingOff";
	}
}

function clampPercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return Math.max(0, Math.min(100, value));
}

function normalizePercent(value: number): number {
	if (!Number.isFinite(value)) return 0;
	return clampPercent(value <= 1 && value >= 0 ? value * 100 : value);
}

function formatResetTime(date: Date): string {
	const diffMs = date.getTime() - Date.now();
	if (diffMs < 0) return "now";

	const diffMins = Math.floor(diffMs / 60000);
	if (diffMins < 60) return `${diffMins}m`;

	const hours = Math.floor(diffMins / 60);
	const mins = diffMins % 60;
	if (hours < 24) return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;

	const days = Math.floor(hours / 24);
	const remainingHours = hours % 24;
	return remainingHours > 0 ? `${days}d${remainingHours}h` : `${days}d`;
}

function getWindowLabel(durationMs: number | undefined, fallback: string): string {
	if (!durationMs || !Number.isFinite(durationMs) || durationMs <= 0) return fallback;

	const hourMs = 60 * 60 * 1000;
	const dayMs = 24 * hourMs;
	const weekMs = 7 * dayMs;

	if (Math.abs(durationMs - weekMs) <= hourMs * 2 || fallback === "Week") return "Week";
	if (Math.abs(durationMs - dayMs) <= hourMs * 2 || fallback === "Day") return "Day";
	if (Math.abs(durationMs - 5 * hourMs) <= hourMs * 2 || fallback === "5h") return fallback;

	const hours = Math.round(durationMs / hourMs);
	if (hours >= 1 && hours < 48) return `${hours}h`;

	const days = Math.round(durationMs / dayMs);
	if (days >= 1) return `${days}d`;

	return `${Math.max(1, Math.round(durationMs / 60000))}m`;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 5000): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

function loadAuthJson(): Record<string, any> {
	const authPath = join(homedir(), ".pi", "agent", "auth.json");
	try {
		if (existsSync(authPath)) return JSON.parse(readFileSync(authPath, "utf-8"));
	} catch {}
	return {};
}

function resolveAuthValue(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	if (!trimmed) return undefined;

	if (trimmed.startsWith("!")) {
		try {
			return execSync(trimmed.slice(1), { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"], timeout: 2000 }).trim() || undefined;
		} catch {
			return undefined;
		}
	}

	if (/^[A-Z][A-Z0-9_]*$/.test(trimmed) && process.env[trimmed]) return process.env[trimmed];
	return trimmed;
}

function getApiKey(providerKey: string, envVar: string): string | undefined {
	if (process.env[envVar]) return process.env[envVar];
	const entry = loadAuthJson()[providerKey];
	if (!entry) return undefined;
	if (typeof entry === "string") return resolveAuthValue(entry);
	return resolveAuthValue(entry.key ?? entry.access ?? entry.refresh);
}

function getClaudeToken(): string | undefined {
	const auth = loadAuthJson();
	if (auth.anthropic?.access) return auth.anthropic.access;
	try {
		const keychainData = execSync('security find-generic-password -s "Claude Code-credentials" -w 2>/dev/null', {
			encoding: "utf-8",
			stdio: ["pipe", "pipe", "pipe"],
			timeout: 2000,
		}).trim();
		if (keychainData) return JSON.parse(keychainData).claudeAiOauth?.accessToken;
	} catch {}
	return undefined;
}

function getCodexToken(): { token: string; accountId?: string } | undefined {
	const auth = loadAuthJson();
	if (auth["openai-codex"]?.access) {
		return { token: auth["openai-codex"].access, accountId: auth["openai-codex"]?.accountId };
	}

	const codexPath = join(process.env.CODEX_HOME || join(homedir(), ".codex"), "auth.json");
	try {
		if (!existsSync(codexPath)) return undefined;
		const data = JSON.parse(readFileSync(codexPath, "utf-8"));
		if (data.OPENAI_API_KEY) return { token: data.OPENAI_API_KEY };
		if (data.tokens?.access_token) return { token: data.tokens.access_token, accountId: data.tokens.account_id };
	} catch {}
	return undefined;
}

function getCopilotToken(): string | undefined {
	return loadAuthJson()["github-copilot"]?.refresh;
}

function getGeminiToken(): string | undefined {
	const auth = loadAuthJson();
	if (auth["google-gemini-cli"]?.access) return auth["google-gemini-cli"].access;
	try {
		const geminiPath = join(homedir(), ".gemini", "oauth_creds.json");
		if (existsSync(geminiPath)) return JSON.parse(readFileSync(geminiPath, "utf-8")).access_token;
	} catch {}
	return undefined;
}

function getMinimaxToken(provider: "minimax" | "minimax-cn"): string | undefined {
	return provider === "minimax" ? getApiKey("minimax", "MINIMAX_API_KEY") : getApiKey("minimax-cn", "MINIMAX_CN_API_KEY");
}

function getKimiToken(): string | undefined {
	return getApiKey("kimi-coding", "KIMI_API_KEY");
}

async function fetchClaudeUsage(): Promise<UsageSnapshot> {
	const token = getClaudeToken();
	if (!token) return { provider: "Claude", windows: [], error: "no-auth", fetchedAt: Date.now() };

	try {
		const res = await fetchWithTimeout("https://api.anthropic.com/api/oauth/usage", {
			headers: { Authorization: `Bearer ${token}`, "anthropic-beta": "oauth-2025-04-20" },
		});
		if (!res.ok) return { provider: "Claude", windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		const windows: RateWindow[] = [];
		if (data.five_hour?.utilization !== undefined) {
			windows.push({
				label: "5h",
				usedPercent: normalizePercent(data.five_hour.utilization),
				resetsIn: data.five_hour.resets_at ? formatResetTime(new Date(data.five_hour.resets_at)) : undefined,
			});
		}
		if (data.seven_day?.utilization !== undefined) {
			windows.push({
				label: "Week",
				usedPercent: normalizePercent(data.seven_day.utilization),
				resetsIn: data.seven_day.resets_at ? formatResetTime(new Date(data.seven_day.resets_at)) : undefined,
			});
		}
		return { provider: "Claude", windows, fetchedAt: Date.now() };
	} catch (error) {
		return { provider: "Claude", windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

async function fetchCodexUsage(): Promise<UsageSnapshot> {
	const creds = getCodexToken();
	if (!creds) return { provider: "Codex", windows: [], error: "no-auth", fetchedAt: Date.now() };

	try {
		const headers: Record<string, string> = { Authorization: `Bearer ${creds.token}`, "User-Agent": "pi-agent", Accept: "application/json" };
		if (creds.accountId) headers["ChatGPT-Account-Id"] = creds.accountId;
		const res = await fetchWithTimeout("https://chatgpt.com/backend-api/wham/usage", { method: "GET", headers });
		if (!res.ok) return { provider: "Codex", windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		const windows: RateWindow[] = [];
		for (const [limitKey, fallback] of [["primary_window", "5h"], ["secondary_window", "Week"]] as const) {
			const usageWindow = data.rate_limit?.[limitKey];
			if (!usageWindow) continue;
			const durationMs = typeof usageWindow.limit_window_seconds === "number" ? usageWindow.limit_window_seconds * 1000 : undefined;
			windows.push({
				label: getWindowLabel(durationMs, fallback),
				usedPercent: clampPercent(usageWindow.used_percent || 0),
				resetsIn: usageWindow.reset_at ? formatResetTime(new Date(usageWindow.reset_at * 1000)) : undefined,
			});
		}
		return { provider: "Codex", windows, fetchedAt: Date.now() };
	} catch (error) {
		return { provider: "Codex", windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

async function fetchCopilotUsage(): Promise<UsageSnapshot> {
	const token = getCopilotToken();
	if (!token) return { provider: "Copilot", windows: [], error: "no-auth", fetchedAt: Date.now() };

	try {
		const res = await fetchWithTimeout("https://api.github.com/copilot_internal/user", {
			headers: {
				"Editor-Version": "vscode/1.96.2",
				"User-Agent": "GitHubCopilotChat/0.26.7",
				"X-Github-Api-Version": "2025-04-01",
				Accept: "application/json",
				Authorization: `token ${token}`,
			},
		});
		if (!res.ok) return { provider: "Copilot", windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		const resetsIn = data.quota_reset_date_utc ? formatResetTime(new Date(data.quota_reset_date_utc)) : undefined;
		const windows: RateWindow[] = [];
		if (data.quota_snapshots?.premium_interactions) {
			windows.push({ label: "Premium", usedPercent: clampPercent(100 - (data.quota_snapshots.premium_interactions.percent_remaining || 0)), resetsIn });
		}
		if (data.quota_snapshots?.chat && !data.quota_snapshots.chat.unlimited) {
			windows.push({ label: "Chat", usedPercent: clampPercent(100 - (data.quota_snapshots.chat.percent_remaining || 0)), resetsIn });
		}
		return { provider: "Copilot", windows, fetchedAt: Date.now() };
	} catch (error) {
		return { provider: "Copilot", windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

async function fetchGeminiUsage(): Promise<UsageSnapshot> {
	const token = getGeminiToken();
	if (!token) return { provider: "Gemini", windows: [], error: "no-auth", fetchedAt: Date.now() };

	try {
		const res = await fetchWithTimeout("https://cloudcode-pa.googleapis.com/v1internal:retrieveUserQuota", {
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: "{}",
		});
		if (!res.ok) return { provider: "Gemini", windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		let proMin = 1;
		let flashMin = 1;
		let hasPro = false;
		let hasFlash = false;
		for (const bucket of data.buckets || []) {
			const model = String(bucket.modelId || "").toLowerCase();
			const frac = bucket.remainingFraction ?? 1;
			if (model.includes("pro")) {
				hasPro = true;
				proMin = Math.min(proMin, frac);
			}
			if (model.includes("flash")) {
				hasFlash = true;
				flashMin = Math.min(flashMin, frac);
			}
		}
		const windows: RateWindow[] = [];
		if (hasPro) windows.push({ label: "Pro", usedPercent: clampPercent((1 - proMin) * 100) });
		if (hasFlash) windows.push({ label: "Flash", usedPercent: clampPercent((1 - flashMin) * 100) });
		return { provider: "Gemini", windows, fetchedAt: Date.now() };
	} catch (error) {
		return { provider: "Gemini", windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

async function fetchMinimaxUsage(provider: "minimax" | "minimax-cn"): Promise<UsageSnapshot> {
	const token = getMinimaxToken(provider);
	const providerLabel = provider === "minimax-cn" ? "MiniMax CN" : "MiniMax";
	if (!token) return { provider: providerLabel, windows: [], error: "no-auth", fetchedAt: Date.now() };

	const endpoint = provider === "minimax-cn" ? "https://api.minimaxi.com/v1/token_plan/remains" : "https://api.minimax.io/v1/token_plan/remains";
	try {
		const res = await fetchWithTimeout(endpoint, { method: "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
		if (!res.ok) return { provider: providerLabel, windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		if (data?.base_resp?.status_code && data.base_resp.status_code !== 0) {
			return { provider: providerLabel, windows: [], error: data.base_resp.status_msg || `API ${data.base_resp.status_code}`, fetchedAt: Date.now() };
		}

		const remains = Array.isArray(data?.model_remains) ? data.model_remains : [];
		const bucket =
			remains.find((entry: any) => entry?.model_name === "general" && Number(entry?.current_interval_status) === 1) ||
			remains.find((entry: any) => entry?.model_name === "general") ||
			remains.find((entry: any) => Number(entry?.current_interval_status) === 1) ||
			remains[0];
		if (!bucket) return { provider: providerLabel, windows: [], error: "no-usage-data", fetchedAt: Date.now() };

		const windows: RateWindow[] = [];
		const intervalRemaining = Number(bucket.current_interval_remaining_percent);
		if (Number.isFinite(intervalRemaining)) {
			const durationMs = bucket.start_time && bucket.end_time ? Number(bucket.end_time) - Number(bucket.start_time) : undefined;
			windows.push({
				label: getWindowLabel(durationMs, "5h"),
				usedPercent: clampPercent(100 - intervalRemaining),
				resetsIn: bucket.end_time ? formatResetTime(new Date(Number(bucket.end_time))) : undefined,
			});
		}
		const weeklyRemaining = Number(bucket.current_weekly_remaining_percent);
		if (Number.isFinite(weeklyRemaining)) {
			const durationMs = bucket.weekly_start_time && bucket.weekly_end_time ? Number(bucket.weekly_end_time) - Number(bucket.weekly_start_time) : undefined;
			windows.push({
				label: getWindowLabel(durationMs, "Week"),
				usedPercent: clampPercent(100 - weeklyRemaining),
				resetsIn: bucket.weekly_end_time ? formatResetTime(new Date(Number(bucket.weekly_end_time))) : undefined,
			});
		}
		return { provider: providerLabel, windows, error: windows.length ? undefined : "no-usage-data", fetchedAt: Date.now() };
	} catch (error) {
		return { provider: providerLabel, windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

async function fetchKimiUsage(): Promise<UsageSnapshot> {
	const token = getKimiToken();
	if (!token) return { provider: "Kimi Coding", windows: [], error: "no-auth", fetchedAt: Date.now() };

	try {
		const res = await fetchWithTimeout("https://api.kimi.com/coding/v1/usages", {
			method: "GET",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		});
		if (!res.ok) return { provider: "Kimi Coding", windows: [], error: `HTTP ${res.status}`, fetchedAt: Date.now() };
		const data = (await res.json()) as any;
		const windows: RateWindow[] = [];
		for (const limit of data.limits || []) {
			const limitCount = Number(limit.detail?.limit) || 0;
			const remaining = Number(limit.detail?.remaining) || 0;
			if (limitCount <= 0) continue;
			const durationMs = limit.window?.duration && limit.window?.timeUnit === "TIME_UNIT_MINUTE" ? limit.window.duration * 60 * 1000 : undefined;
			windows.push({
				label: getWindowLabel(durationMs, "5h"),
				usedPercent: clampPercent(((limitCount - remaining) / limitCount) * 100),
				resetsIn: limit.detail?.resetTime ? formatResetTime(new Date(limit.detail.resetTime)) : undefined,
			});
		}
		const weeklyLimit = Number(data.usage?.limit) || 0;
		const weeklyRemaining = Number(data.usage?.remaining) || 0;
		if (weeklyLimit > 0) {
			windows.push({
				label: "Weekly",
				usedPercent: clampPercent(((weeklyLimit - weeklyRemaining) / weeklyLimit) * 100),
				resetsIn: data.usage?.resetTime ? formatResetTime(new Date(data.usage.resetTime)) : undefined,
			});
		}
		return { provider: "Kimi Coding", windows, fetchedAt: Date.now() };
	} catch (error) {
		return { provider: "Kimi Coding", windows: [], error: String(error), fetchedAt: Date.now() };
	}
}

const PROVIDER_MAP: Record<string, UsageProviderKey> = {
	anthropic: "claude",
	"openai-codex": "codex",
	"github-copilot": "copilot",
	"google-gemini-cli": "gemini",
	minimax: "minimax",
	"minimax-cn": "minimax-cn",
	"kimi-coding": "kimi-coding",
};

function detectUsageProvider(modelProvider: string | undefined): UsageProviderKey | null {
	return modelProvider ? (PROVIDER_MAP[modelProvider] ?? null) : null;
}

async function fetchUsageForProvider(provider: UsageProviderKey): Promise<UsageSnapshot> {
	switch (provider) {
		case "claude":
			return fetchClaudeUsage();
		case "codex":
			return fetchCodexUsage();
		case "copilot":
			return fetchCopilotUsage();
		case "gemini":
			return fetchGeminiUsage();
		case "minimax":
			return fetchMinimaxUsage("minimax");
		case "minimax-cn":
			return fetchMinimaxUsage("minimax-cn");
		case "kimi-coding":
			return fetchKimiUsage();
	}
}

function renderGauge(percent: number, width: number, theme: Theme, warning = 70, error = 90): string {
	const clamped = clampPercent(percent);
	const filled = Math.round((clamped / 100) * width);
	const color: ThemeColor = clamped >= error ? "error" : clamped >= warning ? "warning" : clamped >= 50 ? "accent" : "success";
	return theme.fg(color, BAR_FILLED.repeat(filled)) + theme.fg("dim", BAR_EMPTY.repeat(width - filled));
}

function renderContextGauge(theme: Theme, percent: number, used: number, total: number): string {
	const label = total > 0 ? `${Math.round(percent)}% ${formatTokens(used)}/${formatTokens(total)}` : "?";
	return `${theme.fg("dim", "ctx ")}${renderGauge(percent, CONTEXT_GAUGE_WIDTH, theme)} ${theme.fg("dim", label)}`;
}

function renderUsageWindow(theme: Theme, window: RateWindow): string {
	const reset = window.resetsIn ? ` ${window.resetsIn}` : "";
	return `${theme.fg("dim", `${window.label} `)}${renderGauge(window.usedPercent, USAGE_GAUGE_WIDTH, theme, 85, 92)} ${theme.fg("dim", `${Math.round(window.usedPercent)}%${reset}`)}`;
}

function wrapFooterSegments(segments: string[], width: number, separator: string): string[] {
	const safeWidth = Math.max(1, width);
	const lines: string[] = [];
	let current = "";

	for (const segment of segments.filter(Boolean)) {
		const fitted = truncateToWidth(segment, safeWidth);
		if (!current) {
			current = fitted;
			continue;
		}

		const candidate = current + separator + fitted;
		if (visibleWidth(candidate) <= safeWidth) {
			current = candidate;
			continue;
		}

		lines.push(truncateToWidth(current, safeWidth));
		current = fitted;
	}

	if (current) lines.push(truncateToWidth(current, safeWidth));
	return lines;
}

function renderUsageSegments(theme: Theme, usage: UsageSnapshot): string[] {
	if (!usage.windows.length) return [];
	return [theme.fg("dim", usage.provider), ...usage.windows.map((window) => renderUsageWindow(theme, window))];
}

export default function (pi: ExtensionAPI) {
	let latestUsage: UsageSnapshot | null = null;
	let activeUsageProvider: UsageProviderKey | null = null;
	let refreshTimer: ReturnType<typeof setInterval> | null = null;
	let tuiRef: Pick<TUI, "requestRender"> | null = null;

	function stopRefreshTimer(): void {
		if (refreshTimer) clearInterval(refreshTimer);
		refreshTimer = null;
	}

	function fetchUsage(modelProvider: string | undefined): void {
		const provider = detectUsageProvider(modelProvider);
		if (!provider) {
			activeUsageProvider = null;
			latestUsage = null;
			stopRefreshTimer();
			tuiRef?.requestRender();
			return;
		}

		activeUsageProvider = provider;
		const cached = usageCache.get(provider);
		if (cached?.windows.length) {
			latestUsage = cached;
			tuiRef?.requestRender();
		}

		fetchUsageForProvider(provider)
			.then((usage) => {
				if (activeUsageProvider !== provider) return;
				if (usage.windows.length === 0 && usage.error && cached?.windows.length) return;
				usageCache.set(provider, usage);
				latestUsage = usage;
				tuiRef?.requestRender();
			})
			.catch(() => {});
	}

	function startRefreshTimer(): void {
		stopRefreshTimer();
		refreshTimer = setInterval(() => {
			const provider = activeUsageProvider;
			if (!provider) return;

			const cached = usageCache.get(provider);
			fetchUsageForProvider(provider)
				.then((usage) => {
					if (activeUsageProvider !== provider) return;
					if (usage.windows.length === 0 && usage.error && cached?.windows.length) return;
					usageCache.set(provider, usage);
					latestUsage = usage;
					tuiRef?.requestRender();
				})
				.catch(() => {});
		}, USAGE_REFRESH_INTERVAL_MS);
	}

	function refreshUsageForModel(modelProvider: string | undefined): void {
		fetchUsage(modelProvider);
		if (detectUsageProvider(modelProvider)) startRefreshTimer();
	}

	pi.on("session_start", (_event, ctx) => {
		if (!ctx.hasUI) return;

		ctx.ui.setFooter((tui: TUI, theme: Theme, footerData: ReadonlyFooterDataProvider) => {
			tuiRef = tui;
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());
			refreshUsageForModel(ctx.model?.provider);

			return {
				dispose: () => {
					unsubscribe();
					tuiRef = null;
					stopRefreshTimer();
				},
				invalidate() {},
				render(width: number): string[] {
					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextTokens = contextUsage?.tokens ?? 0;
					const contextPercent = contextUsage?.percent ?? (contextWindow ? (contextTokens / contextWindow) * 100 : 0);
					const contextPart = renderContextGauge(theme, contextPercent, contextTokens, contextWindow);

					let folderLine = formatCwdForFooter(ctx.cwd, process.env.HOME || process.env.USERPROFILE);
					const branch = footerData.getGitBranch();
					if (branch) folderLine = `${folderLine} (${branch})`;
					const sessionName = ctx.sessionManager.getSessionName();
					if (sessionName) folderLine = `${folderLine} • ${sessionName}`;

					const modelName = ctx.model?.id ?? "no-model";
					const providerPrefix = footerData.getAvailableProviderCount() > 1 && ctx.model ? `(${ctx.model.provider}) ` : "";
					const thinkingLevel = pi.getThinkingLevel();
					const thinkingText = ctx.model?.reasoning
						? thinkingLevel === "off"
							? "thinking off"
							: thinkingLevel
						: "thinking off";
					const modelPart = theme.fg("accent", theme.bold(`${providerPrefix}${modelName}`));
					const thinkingPart = theme.fg(thinkingColorToken(thinkingLevel), theme.bold(thinkingText));
					let left = `${modelPart}${theme.fg("dim", " · ")}${thinkingPart}`;
					let right = theme.fg("dim", folderLine);

					const minPadding = 2;
					if (visibleWidth(left) + minPadding + visibleWidth(right) > width) {
						const availableRight = Math.max(0, width - visibleWidth(left) - minPadding);
						right = truncateToWidth(right, availableRight, theme.fg("dim", "..."));
					}
					if (visibleWidth(left) + minPadding + visibleWidth(right) > width) {
						const availableLeft = Math.max(0, width - visibleWidth(right) - minPadding);
						left = truncateToWidth(left, availableLeft, "");
					}
					const pad = " ".repeat(Math.max(minPadding, width - visibleWidth(left) - visibleWidth(right)));
					const modelFolderLine = truncateToWidth(left + pad + right, width, theme.fg("dim", "..."));

					const gaugeSegments = [contextPart];
					if (latestUsage?.windows.length) gaugeSegments.push(...renderUsageSegments(theme, latestUsage));
					const lines = [modelFolderLine, ...wrapFooterSegments(gaugeSegments, width, ` ${theme.fg("dim", "·")} `)];

					const extensionStatuses = footerData.getExtensionStatuses();
					if (extensionStatuses.size > 0) {
						const statusLine = Array.from(extensionStatuses.entries())
							.sort(([a], [b]) => a.localeCompare(b))
							.map(([, text]) => sanitizeStatusText(text))
							.join(" ");
						lines.push(truncateToWidth(statusLine, width, theme.fg("dim", "...")));
					}

					return lines;
				},
			} satisfies Component & { dispose?: () => void };
		});
	});

	pi.on("model_select", (event) => {
		refreshUsageForModel(event.model?.provider);
	});
}
