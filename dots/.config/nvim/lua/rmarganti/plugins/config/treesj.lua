-- Context aware node splitting/joining.
local M = {
    'Wansmer/treesj',
    event = 'BufReadPost',
}

function M.config()
    require('treesj').setup({
        use_default_keymaps = true,
    })
end

return M
