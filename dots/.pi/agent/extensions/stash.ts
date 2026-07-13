import type { ExtensionAPI, ExtensionContext } from '@earendil-works/pi-coding-agent';

/**
 * Prompt stash extension.
 *
 * Press Alt+S to stash the current editor text and clear the editor.
 * Press Alt+S again to restore the stashed text.
 *
 * If the editor has text while a stash already exists, Alt+S swaps the editor
 * text with the stashed text so nothing is lost.
 */
export default function (pi: ExtensionAPI) {
    let stash: string | undefined;

    function stashStatusText(ctx: ExtensionContext) {
        const text = 'restore stashed prompt: alt-s';
        return ctx.ui.theme.fg('accent', text);
    }

    async function toggleStash(ctx: ExtensionContext) {
        if (!ctx.hasUI) return;

        const current = ctx.ui.getEditorText();

        if (stash === undefined) {
            if (current.length === 0) {
                ctx.ui.notify('Prompt stash is empty.', 'info');
                return;
            }

            stash = current;
            ctx.ui.setEditorText('');
            ctx.ui.setStatus('stash', stashStatusText(ctx));
            ctx.ui.notify('Prompt stashed. Press Alt+S to restore it.', 'info');
            return;
        }

        const restored = stash;

        if (current.length > 0) {
            stash = current;
            ctx.ui.setEditorText(restored);
            ctx.ui.setStatus('stash', stashStatusText(ctx));
            ctx.ui.notify('Swapped current prompt with stashed prompt.', 'info');
            return;
        }

        stash = undefined;
        ctx.ui.setEditorText(restored);
        ctx.ui.setStatus('stash', undefined);
        ctx.ui.notify('Prompt restored from stash.', 'info');
    }

    pi.registerShortcut('alt+s', {
        description: 'Stash or restore the current prompt',
        handler: toggleStash,
    });

    pi.registerCommand('stash', {
        description: 'Stash or restore the current prompt',
        handler: async (_args, ctx) => toggleStash(ctx),
    });

    pi.on('session_start', async (_event, ctx) => {
        if (!ctx.hasUI) return;
        ctx.ui.setStatus('stash', stash === undefined ? undefined : stashStatusText(ctx));
    });

    pi.on('session_shutdown', async (_event, ctx) => {
        if (!ctx.hasUI) return;
        ctx.ui.setStatus('stash', undefined);
    });
}
