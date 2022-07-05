local M = {}

M.config = function()
    local Hydra = require('hydra')
    local core_fns = require('rmarganti.core.functions')

    -- Windows

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
            invoke_on_body = true,
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

    -- Buffers

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
end

return M
