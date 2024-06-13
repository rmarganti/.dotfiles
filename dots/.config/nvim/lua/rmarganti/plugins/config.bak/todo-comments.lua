local M = {
    'folke/todo-comments.nvim',
    requires = 'nvim-lua/plenary.nvim',
    event = 'VeryLazy',
}

function M.config()
    local p = require('rmarganti.colors.palette')

    require('todo-comments').setup({
        colors = {
            error = { 'TodoErrorKeyword', p.red_dark.gui },
            warning = { 'TodoWarningKeyword', p.yellow_dark.gui },
            info = { 'TodoInfoKeyword', p.blue_dark.gui },
            hint = { 'TodoInfoKeyword', p.blue_dark.gui },
            default = { 'TodoInfoKeyword', p.blue_dark.gui },
            test = { 'TodoInfoKeyword', p.blue_dark.gui },
        },
        highlight = {
            comments_only = true,
            multiline = false,
            keyword = 'wide_bg',
            after = nil,
        },
    })
end

return M
