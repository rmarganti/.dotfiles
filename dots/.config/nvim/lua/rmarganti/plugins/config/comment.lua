-- Easily comment/uncomment code.
local M = {
    'numToStr/Comment.nvim',
    event = 'BufReadPost',
}

function M.config()
    require('Comment').setup({
        ignore = '^$',
    })
end

return M
