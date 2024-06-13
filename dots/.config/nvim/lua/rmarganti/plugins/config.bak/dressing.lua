-- Replaces `vim.ui.{input,select}`.
local M = {
    'stevearc/dressing.nvim',
    event = 'VeryLazy',
}

M.config = function()
    require('dressing').setup({
        input = {
            insert_only = false,
            get_config = function(opts)
                if opts.kind == 'read_url' then
                    return {
                        relative = 'win',
                        prefer_width = 80
                    }
                elseif opts.kind == 'filename' then
                    return {
                        relative = 'win',
                        prefer_width = 50
                    }
                end
            end,
            win_options = {
                winblend = 0,
            },
        },
    })
end

return M
