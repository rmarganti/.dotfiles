import type { AssistantMessage } from "@earendil-works/pi-ai";
import type { ExtensionAPI, ReadonlyFooterDataProvider, Theme, ThemeColor } from "@earendil-works/pi-coding-agent";
import type { Component, TUI } from "@earendil-works/pi-tui";
import { truncateToWidth, visibleWidth } from "@earendil-works/pi-tui";
import { isAbsolute, relative, resolve, sep } from "node:path";

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

function dimPreservingColor(theme: Theme, text: string): string {
	return theme.fg("dim", text);
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

function getMessageUsage(message: AssistantMessage): {
	input: number;
	output: number;
	cacheRead: number;
	cacheWrite: number;
	cost: number;
} {
	return {
		input: message.usage?.input ?? 0,
		output: message.usage?.output ?? 0,
		cacheRead: message.usage?.cacheRead ?? 0,
		cacheWrite: message.usage?.cacheWrite ?? 0,
		cost: message.usage?.cost?.total ?? 0,
	};
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setFooter((tui: TUI, theme: Theme, footerData: ReadonlyFooterDataProvider) => {
			const unsubscribe = footerData.onBranchChange(() => tui.requestRender());

			return {
				dispose: unsubscribe,
				invalidate() {},
				render(width: number): string[] {
					let totalInput = 0;
					let totalOutput = 0;
					let totalCacheRead = 0;
					let totalCacheWrite = 0;
					let totalCost = 0;

					for (const entry of ctx.sessionManager.getEntries()) {
						if (entry.type === "message" && entry.message.role === "assistant") {
							const usage = getMessageUsage(entry.message as AssistantMessage);
							totalInput += usage.input;
							totalOutput += usage.output;
							totalCacheRead += usage.cacheRead;
							totalCacheWrite += usage.cacheWrite;
							totalCost += usage.cost;
						}
					}

					const contextUsage = ctx.getContextUsage();
					const contextWindow = contextUsage?.contextWindow ?? ctx.model?.contextWindow ?? 0;
					const contextPercentValue = contextUsage?.percent ?? 0;
					const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";
					const contextPercentDisplay =
						contextPercent === "?"
							? `?/${formatTokens(contextWindow)}`
							: `${contextPercent}%/${formatTokens(contextWindow)}`;
					const contextPart =
						contextPercentValue > 90
							? theme.fg("error", contextPercentDisplay)
							: contextPercentValue > 70
								? theme.fg("warning", contextPercentDisplay)
								: contextPercentDisplay;

					const statsParts: string[] = [];
					if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
					if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
					if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
					if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);
					const usingSubscription = ctx.model ? ctx.modelRegistry.isUsingOAuth(ctx.model) : false;
					if (totalCost || usingSubscription) statsParts.push(`$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`);
					statsParts.push(contextPart);

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
					const statsLine = truncateToWidth(dimPreservingColor(theme, statsParts.join(" ")), width, theme.fg("dim", "..."));

					const lines = [modelFolderLine, statsLine];

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
}
