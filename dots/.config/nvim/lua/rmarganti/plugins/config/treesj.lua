-- Context aware node splitting/joining.
local M = {
    'Wansmer/treesj',
    event = 'BufReadPost',
}

function M.config()
    require('treesj').setup({
        max_join_length = 1000,
        use_default_keymaps = true,
        notify = false,
    })
end

return M
