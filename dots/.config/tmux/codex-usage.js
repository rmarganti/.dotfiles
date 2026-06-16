#!/usr/bin/env node
// @ts-check

/**
 * Render Codex usage for tmux by querying the ChatGPT usage endpoint.
 *
 * Default output is a tmux status fragment like:
 * >_ 88%
 */

const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const https = require('node:https');

const DEFAULT_AUTH_FILE = path.join(os.homedir(), '.pi', 'agent', 'auth.json');
const DEFAULT_CACHE_FILE = path.join(os.homedir(), '.cache', 'tmux', 'codex-usage.json');
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_URL = 'https://chatgpt.com/backend-api/wham/usage';

/** @typedef {{ access?: string, accountId?: string }} PiCodexAuth */
/** @typedef {{ 'openai-codex'?: PiCodexAuth }} AuthPayload */
/** @typedef {{ used_percent?: number|string, reset_at?: number|string, reset_after_seconds?: number|string }} RateLimitWindow */
/** @typedef {{ rate_limit?: { primary_window?: RateLimitWindow, secondary_window?: RateLimitWindow } }} UsagePayload */
/** @typedef {{ fetchedAt: number, payload: UsagePayload }} CachePayload */

/**
 * @typedef {Object} Options
 * @property {string} authFile
 * @property {string} url
 * @property {number} timeoutMs
 * @property {string} cacheFile
 * @property {number} cacheTtlMs
 * @property {'bar'|'percent'|'reset_at'|'reset_in'|'raw'} field
 * @property {'primary'|'secondary'} window
 * @property {boolean} showIcon
 */

/** @returns {Options} */
function parseArgs() {
  /** @type {Options} */
  const options = {
    authFile: process.env.CODEX_USAGE_AUTH_FILE || DEFAULT_AUTH_FILE,
    url: process.env.CODEX_USAGE_URL || DEFAULT_URL,
    timeoutMs: Number(process.env.CODEX_USAGE_TIMEOUT_MS || 15000),
    cacheFile: process.env.CODEX_USAGE_CACHE_FILE || DEFAULT_CACHE_FILE,
    cacheTtlMs: Number(process.env.CODEX_USAGE_CACHE_TTL_MS || DEFAULT_CACHE_TTL_MS),
    field: 'percent',
    window: 'primary',
    showIcon: process.env.CODEX_USAGE_SHOW_ICON !== '0',
  };

  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    const next = process.argv[index + 1];

    if (arg === '--auth-file' && next) {
      options.authFile = next;
      index += 1;
    } else if (arg === '--url' && next) {
      options.url = next;
      index += 1;
    } else if (arg === '--timeout' && next) {
      options.timeoutMs = Number(next) * 1000;
      index += 1;
    } else if (arg === '--cache-file' && next) {
      options.cacheFile = next;
      index += 1;
    } else if (arg === '--cache-ttl' && next) {
      options.cacheTtlMs = Number(next) * 1000;
      index += 1;
    } else if (arg === '--field' && next && ['bar', 'percent', 'reset_at', 'reset_in', 'raw'].includes(next)) {
      options.field = /** @type {Options['field']} */ (next);
      index += 1;
    } else if (arg === '--window' && next && ['primary', 'secondary'].includes(next)) {
      options.window = /** @type {Options['window']} */ (next);
      index += 1;
    } else if (arg === '--no-icon') {
      options.showIcon = false;
    } else if (arg === '--icon') {
      options.showIcon = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0) {
    options.timeoutMs = 15000;
  }

  if (!Number.isFinite(options.cacheTtlMs) || options.cacheTtlMs < 0) {
    options.cacheTtlMs = DEFAULT_CACHE_TTL_MS;
  }

  return options;
}

function printHelp() {
  process.stdout.write(`Usage: codex-usage.js [options]\n\nOptions:\n  --auth-file <path>   Path to ~/.pi/agent/auth.json\n  --url <url>          Override usage endpoint\n  --timeout <seconds>  HTTP timeout in seconds (default: 15)\n  --cache-file <path>  Cache file path (default: ~/.cache/tmux/codex-usage.json)\n  --cache-ttl <secs>   Cache TTL in seconds (default: 300)\n  --field <name>       bar | percent | reset_at | reset_in | raw (default: percent)\n  --window <name>      primary | secondary\n  --no-icon            Hide the >_ prefix\n`);
}

/**
 * @param {string} authFile
 * @returns {Promise<{ accessToken: string, accountId: string }>}
 */
async function loadAuth(authFile) {
  /** @type {AuthPayload} */
  const payload = JSON.parse(await fs.readFile(authFile, 'utf8'));
  const accessToken = payload['openai-codex']?.access;
  const accountId = payload['openai-codex']?.accountId;

  if (!accessToken) {
    throw new Error(`missing openai-codex.access in ${authFile}`);
  }

  if (!accountId) {
    throw new Error(`missing openai-codex.accountId in ${authFile}`);
  }

  return { accessToken, accountId };
}

/**
 * @param {string} url
 * @param {string} accessToken
 * @param {string} accountId
 * @param {number} timeoutMs
 * @returns {Promise<UsagePayload>}
 */
async function fetchUsage(url, accessToken, accountId, timeoutMs) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const transport = parsedUrl.protocol === 'http:' ? http : https;
    const request = transport.request(
      parsedUrl,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'ChatGPT-Account-Id': accountId,
          Accept: 'application/json',
          'User-Agent': 'codex-usage-tmux/1.0',
        },
      },
      (response) => {
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });
        response.on('end', () => {
          const statusCode = response.statusCode ?? 0;
          if (statusCode < 200 || statusCode >= 300) {
            reject(new Error(`HTTP ${statusCode}: ${body || 'empty response'}`));
            return;
          }

          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error instanceof Error ? error : new Error(String(error)));
          }
        });
      },
    );

    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`request timed out after ${timeoutMs}ms`));
    });
    request.on('error', reject);
    request.end();
  });
}

/**
 * @param {UsagePayload} payload
 * @param {'primary'|'secondary'} window
 */
function parseWindow(payload, window) {
  const data = payload.rate_limit?.[window === 'primary' ? 'primary_window' : 'secondary_window'];

  if (!data) {
    throw new Error(`missing rate_limit.${window}_window`);
  }

  const usedPercent = Number(data.used_percent);
  const resetAt = Number(data.reset_at);
  const resetAfterSeconds = Number(data.reset_after_seconds);

  if (!Number.isFinite(usedPercent)) {
    throw new Error(`invalid used_percent: ${String(data.used_percent)}`);
  }
  if (!Number.isFinite(resetAt)) {
    throw new Error(`invalid reset_at: ${String(data.reset_at)}`);
  }
  if (!Number.isFinite(resetAfterSeconds)) {
    throw new Error(`invalid reset_after_seconds: ${String(data.reset_after_seconds)}`);
  }

  const percent = clamp(100 - Math.round(usedPercent), 0, 100);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const resetIn = Math.max(0, Math.min(Math.trunc(resetAfterSeconds), Math.trunc(resetAt) - nowSeconds + 1));

  return {
    percent,
    resetAt: Math.trunc(resetAt),
    resetIn,
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/** @param {number} seconds */
function formatReset(seconds) {
  const total = Math.max(0, Math.trunc(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * @param {number} percent
 * @param {string} resetLabel
 * @param {boolean} showIcon
 */
function renderBar(percent, resetLabel, showIcon) {
  const iconPrefix = showIcon ? '>_ ' : '';
  return `${iconPrefix}${percent}% ${resetLabel}`;
}

/**
 * @param {string} label
 * @param {boolean} showIcon
 */
function renderUnavailable(label, showIcon) {
  const iconPrefix = showIcon ? '>_ ' : '';
  return `${iconPrefix}${label}`;
}

/**
 * @param {string} cacheFile
 * @returns {Promise<CachePayload | null>}
 */
async function readCache(cacheFile) {
  try {
    /** @type {CachePayload} */
    const payload = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
    if (!payload || typeof payload.fetchedAt !== 'number' || !payload.payload) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * @param {string} cacheFile
 * @param {UsagePayload} payload
 * @returns {Promise<void>}
 */
async function writeCache(cacheFile, payload) {
  await fs.mkdir(path.dirname(cacheFile), { recursive: true });
  await fs.writeFile(cacheFile, JSON.stringify({ fetchedAt: Date.now(), payload }));
}

/**
 * @param {Options} options
 * @returns {Promise<UsagePayload>}
 */
async function getUsagePayload(options) {
  const cached = await readCache(options.cacheFile);
  if (cached && Date.now() - cached.fetchedAt <= options.cacheTtlMs) {
    return cached.payload;
  }

  try {
    const { accessToken, accountId } = await loadAuth(options.authFile);
    const payload = await fetchUsage(options.url, accessToken, accountId, options.timeoutMs);
    await writeCache(options.cacheFile, payload);
    return payload;
  } catch (error) {
    if (cached) {
      return cached.payload;
    }
    throw error;
  }
}

async function main() {
  const options = parseArgs();

  try {
    const payload = await getUsagePayload(options);

    if (options.field === 'raw') {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      return;
    }

    const usage = parseWindow(payload, options.window);

    switch (options.field) {
      case 'percent': {
        const iconPrefix = options.showIcon ? '>_ ' : '';
        process.stdout.write(`${iconPrefix}${usage.percent}%\n`);
        return;
      }
      case 'reset_at':
        process.stdout.write(`${usage.resetAt}\n`);
        return;
      case 'reset_in':
        process.stdout.write(`${usage.resetIn}\n`);
        return;
      case 'bar':
      default:
        process.stdout.write(`${renderBar(usage.percent, formatReset(usage.resetIn), options.showIcon)}\n`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (options.field === 'bar' || options.field === 'percent') {
      const label = message.includes('auth.json') || message.includes('openai-codex.access') || message.includes('openai-codex.accountId') ? 'auth' : 'err';
      process.stdout.write(`${renderUnavailable(label, options.showIcon)}\n`);
      return;
    }

    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
}

void main();
