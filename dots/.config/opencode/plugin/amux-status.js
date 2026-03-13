// amux-status v1.1
const fs = require('fs');
const path = require('path');
const os = require('os');

const DEBUG = process.env.AMUX_STATUS_DEBUG === '1';

function log(level, msg, data = {}) {
    if (DEBUG) {
        console.error(`[amux-status:${level}]`, msg, JSON.stringify(data));
    }
}

function getStatusDir() {
    const xdgState =
        process.env.XDG_STATE_HOME ||
        path.join(os.homedir(), '.local', 'state');
    return path.join(xdgState, 'amux', 'opencode');
}

function getStatusFilePath(paneId) {
    return path.join(getStatusDir(), `${paneId}.json`);
}

function writeStatus(paneId, status) {
    const dir = getStatusDir();
    fs.mkdirSync(dir, { recursive: true });
    const payload = JSON.stringify({
        status,
        pid: process.pid,
        ts: Math.floor(Date.now() / 1000),
    });
    fs.writeFileSync(getStatusFilePath(paneId), payload);
}

const Plugin = async ({ $, client }) => {
    const paneId = process.env.TMUX_PANE;
    if (!paneId) return {};

    log('info', 'plugin initialized', { paneId });

    return {
        event: async ({ event }) => {
            log('debug', 'event received', {
                type: event.type,
                properties: event.properties,
            });

            if (event.type === 'session.status') {
                const status =
                    event.properties.status?.type === 'busy' ? 'busy' : 'idle';
                writeStatus(paneId, status);
                log('info', 'status written', { paneId, status });
            }

            if (event.type === 'session.error') {
                writeStatus(paneId, 'errored');
                log('info', 'error status written', { paneId });
            }

            if (event.type === 'question.asked') {
                writeStatus(paneId, 'awaiting_input');
                log('info', 'awaiting_input status written (question asked)', {
                    paneId,
                });
            }

            if (event.type === 'question.replied') {
                writeStatus(paneId, 'busy');
                log('info', 'busy status written (question replied)', {
                    paneId,
                });
            }
        },

        'permission.ask': async (_permission, output) => {
            if (output.status === 'ask') {
                writeStatus(paneId, 'awaiting_input');
                log('info', 'awaiting_input status written', { paneId });
            }
        },
    };
};

module.exports = { Plugin };
