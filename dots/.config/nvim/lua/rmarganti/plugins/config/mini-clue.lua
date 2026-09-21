-- Create repeatable keybinding submodes with mini.clue.
local M = {
    'nvim-mini/mini.clue',
    version = false,
    event = 'VeryLazy',
    dependencies = {
        { 'lewis6991/gitsigns.nvim' },
    },
}

function M.config()
    local clue = require('mini.clue')
    local core_fns = require('rmarganti.core.functions')
    local gitsigns = require('gitsigns')

    local prefixes = {
        windows = '<Plug>(RmWindowClue)',
        buffers = '<Plug>(RmBufferClue)',
        git = '<Leader>G',
    }

    local function feed(keys)
        vim.api.nvim_feedkeys(vim.keycode(keys), 'm', false)
    end

    local function open(prefix)
        return function()
            feed(prefix)
        end
    end

    ------------------------------------------------
    -- Windows
    ------------------------------------------------

    vim.keymap.set('n', '<Leader>w', open(prefixes.windows), { desc = 'Window mode' })

    local window_maps = {
        { 'h', '<C-w>h', 'Focus left' },
        { 'j', '<C-w>j', 'Focus down' },
        { 'k', '<C-w>k', 'Focus up' },
        { 'l', '<C-w>l', 'Focus right' },
        { 's', '<C-w>s', 'Split horizontally' },
        { 'v', '<C-w>v', 'Split vertically' },
        { 'q', '<C-w>q', 'Close window' },
        { 'o', '<Cmd>only<CR>', 'Keep only window' },
        { 'K', '<C-w>+', 'Increase height' },
        { 'J', '<C-w>-', 'Decrease height' },
        { 'L', '2<C-w>>', 'Increase width' },
        { 'H', '2<C-w><', 'Decrease width' },
        { '=', '<Cmd>FocusAutoresize<CR>', 'Equalize windows' },
    }

    ------------------------------------------------
    -- Buffers
    ------------------------------------------------

    vim.keymap.set('n', '<Leader>b', open(prefixes.buffers), { desc = 'Buffer mode' })

    local buffer_maps = {
        { 'n', '<Cmd>enew<CR>', 'New buffer', true },
        {
            'e',
            function()
                require('bufferline').pick_buffer()
            end,
            'Pick buffer',
            true,
        },
        { 'd', '<Cmd>BufferLinePickClose<CR>', 'Pick buffer to delete', true },
        {
            'h',
            function()
                require('bufferline').cycle(-1)
            end,
            'Focus left',
        },
        {
            'l',
            function()
                require('bufferline').cycle(1)
            end,
            'Focus right',
        },
        { 'H', '<Cmd>BufferLineMovePrev<CR>', 'Move left' },
        { 'L', '<Cmd>BufferLineMoveNext<CR>', 'Move right' },
        { 'q', '<Cmd>BufDel<CR>', 'Quit buffer' },
        { 'Q', '<Cmd>BufDel!<CR>', 'Force quit buffer' },
        { 'a', core_fns.buf_delete_all, 'Quit all buffers', true },
        { 'o', core_fns.buf_only, 'Keep only buffer', true },
    }

    ------------------------------------------------
    -- Git
    ------------------------------------------------

    local git_indicators_enabled = false

    local function toggle_git_indicators()
        git_indicators_enabled = not git_indicators_enabled
        gitsigns.toggle_signs(git_indicators_enabled)
        gitsigns.toggle_linehl(git_indicators_enabled)

        if not git_indicators_enabled then
            gitsigns.toggle_deleted(false)
        end
    end

    local git_maps = {
        {
            'J',
            function()
                if vim.wo.diff then
                    return ']c'
                end
                vim.schedule(gitsigns.next_hunk)
                return '<Ignore>'
            end,
            'Next hunk',
            false,
            { expr = true },
        },
        {
            'K',
            function()
                if vim.wo.diff then
                    return '[c'
                end
                vim.schedule(gitsigns.prev_hunk)
                return '<Ignore>'
            end,
            'Previous hunk',
            false,
            { expr = true },
        },
        { 'r', '<Cmd>Gitsigns reset_hunk<CR>', 'Reset hunk' },
        { 's', '<Cmd>Gitsigns stage_hunk<CR>', 'Stage hunk' },
        { 'u', gitsigns.undo_stage_hunk, 'Undo stage hunk' },
        { 'S', gitsigns.stage_buffer, 'Stage buffer' },
        { 'p', gitsigns.preview_hunk, 'Preview hunk' },
        { 'd', gitsigns.toggle_deleted, 'Toggle deleted' },
        { 't', toggle_git_indicators, 'Toggle Git indicators' },
        { 'b', gitsigns.blame_line, 'Blame line' },
        {
            'B',
            function()
                gitsigns.blame_line({ full = true })
            end,
            'Full blame',
        },
        {
            '/',
            gitsigns.show,
            'Show base file',
            true,
        },
    }

    ------------------------------------------------
    -- Register mappings and their repeat behavior
    ------------------------------------------------

    local clues = {}

    local function register(mode, prefix, maps)
        for _, map in ipairs(maps) do
            local key, rhs, desc, exits, opts = unpack(map)
            opts = vim.tbl_extend('force', opts or {}, { desc = desc })
            vim.keymap.set(mode, prefix .. key, rhs, opts)

            table.insert(clues, {
                mode = mode,
                keys = prefix .. key,
                postkeys = exits and nil or prefix,
            })
        end
    end

    register('n', prefixes.windows, window_maps)
    register('n', prefixes.buffers, buffer_maps)
    register({ 'n', 'x' }, prefixes.git, git_maps)

    clue.setup({
        triggers = {
            { mode = 'n', keys = prefixes.windows },
            { mode = 'n', keys = prefixes.buffers },
            { mode = { 'n', 'x' }, keys = prefixes.git },
        },
        clues = clues,
        window = {
            delay = 0,
            config = { border = 'rounded' },
        },
    })
end

return M
