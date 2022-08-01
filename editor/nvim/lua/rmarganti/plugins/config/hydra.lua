local M = {}

M.config = function()
    local Hydra = require('hydra')
    local gitsigns = require('gitsigns')
    local core_fns = require('rmarganti.core.functions')

    ------------------------------------------------
    --
    -- Windows
    --
    ------------------------------------------------

    Hydra({
        hint = table.concat({
            '^^ Focus ^^  ^^ Resize ^^  ^         Split',
            '^^-------^^  ^^--------^^  ^------------------------',
            '^   _k_   ^  ^    _K_   ^   _s_ horizontally  _q_ close',
            ' _h_   _l_     _H_   _L_    _v_ vertically    _o_ only',
            '^   _j_   ^  ^    _J_   ^   _=_ equalize',
        }, '\n'),
        config = {
            hint = { border = 'rounded' },
            invoke_on_body = false,
        },
        mode = 'n',
        body = '<Leader>w',
        heads = {
            -- Move focus
            { 'h', '<C-w>h' },
            { 'j', '<C-w>j' },
            { 'k', '<C-w>k' },
            { 'l', '<C-w>l' },

            -- Split
            { 's', '<C-w>s' },
            { 'v', '<C-w>v' },
            { 'q', '<C-W>q' },
            { 'o', '<Cmd>only<CR>' },

            -- Size
            { 'K', '<C-w>+' },
            { 'J', '<C-w>-' },
            { 'L', '2<C-w>>' },
            { 'H', '2<C-w><' },
            { '=', '<C-w>=' },

            --
            { '<Esc>', nil, { exit = true, desc = false } }
        }
    })

    ------------------------------------------------
    --
    -- Buffers
    --
    ------------------------------------------------

    Hydra({
        hint = table.concat({
            '^^      Edit       ^^  ^^          Close           ^^  ^      Move',
            '^^-----------------^^  ^^--------------------------^^  ^-----------------',
            ' _h_ Left  _l_ Right    _q_ Quit  _Q_ Force Quit        _H_ Left  _L_ Right',
            ' _n_ New   _e_ Pick     _a_ All   _o_ Others  _d_ Pick',
        }, '\n'),
        config = {
            hint = { border = 'rounded' },
            invoke_on_body = true,
        },
        mode = 'n',
        body = '<Leader>b',
        heads = {
            { 'n', '<cmd>enew<CR>', { desc = 'New', exit = true } },
            { 'e', '<cmd>lua require("bufferline").pick_buffer()<CR>', { desc = 'Edit', exit = true } },
            { 'd', '<cmd>BufferLinePickClose<CR>', { desc = 'Delete', exit = true } },
            { 'h', '<cmd>lua require("bufferline").cycle(-1)<CR>', { desc = 'Focus left' } },
            { 'l', '<cmd>lua require("bufferline").cycle(1)<CR>', desc = 'Focus Right' },
            { 'H', '<cmd>BufferLineMovePrev<CR>', { desc = 'Move Left' } },
            { 'L', '<cmd>BufferLineMoveNext<CR>', { desc = 'Move Right' } },
            { 'q', '<cmd>BufDel<CR>', { desc = 'Quit' } },
            { 'Q', '<cmd>BufDel!<CR>', { desc = 'Force Quit' } },
            { 'a', core_fns.buf_delete_all, { desc = 'Quit All', exit = true } },
            { 'o', core_fns.buf_only, { desc = 'Keep Only', exit = true } },
            { '<Esc>', nil, { exit = true, desc = false } }
        }
    })

    ------------------------------------------------
    --
    -- Git
    --
    ------------------------------------------------


    Hydra({
        hint = table.concat({
            ' _J_: next hunk    _s_: stage hunk        _d_: show deleted   _b_: blame line',
            ' _K_: prev hunk    _u_: undo stage hunk   _p_: preview hunk   _B_: blame show full',
            ' _r_: reset hunk   _S_: stage buffer      ^ ^                 _/_: show base file',
        }, '\n'),
        config = {
            color = 'pink',
            invoke_on_body = true,
            hint = {
                position = 'bottom',
                border = 'rounded'
            },
            on_enter = function()
                gitsigns.toggle_signs(true)
                gitsigns.toggle_linehl(true)
            end,
            on_exit = function()
                gitsigns.toggle_signs(false)
                gitsigns.toggle_linehl(false)
                gitsigns.toggle_deleted(false)
            end
        },
        mode = { 'n', 'x' },
        body = '<leader>G',
        heads = {
            {
                'J',
                function()
                    if vim.wo.diff then return ']c' end
                    vim.schedule(function() gitsigns.next_hunk() end)
                    return '<Ignore>'
                end,
                { expr = true }
            },
            {
                'K',
                function()
                    if vim.wo.diff then return '[c' end
                    vim.schedule(function() gitsigns.prev_hunk() end)
                    return '<Ignore>'
                end,
                { expr = true }
            },
            { 'r', ':Gitsigns reset_hunk<CR>' },
            { 's', ':Gitsigns stage_hunk<CR>', { silent = true } },
            { 'u', gitsigns.undo_stage_hunk },
            { 'S', gitsigns.stage_buffer },
            { 'p', gitsigns.preview_hunk },
            { 'd', gitsigns.toggle_deleted, { nowait = true } },
            { 'b', gitsigns.blame_line },
            { 'B', function() gitsigns.blame_line { full = true } end },
            { '/', gitsigns.show, { exit = true } }, -- show the base of the file
            { '<Esc>', nil, { exit = true, nowait = true } },
        }
    })


end

return M
