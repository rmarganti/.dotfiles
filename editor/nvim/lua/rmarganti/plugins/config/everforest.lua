local M = {}
local theme = require('rmarganti.config.theme')

M.config = function()
    vim.g.everforest_transparent_background = 1
    vim.cmd('colorscheme everforest')
    vim.cmd('highlight IndentBlanklineChar guifg='..theme.bg1..' gui=nocombine')
end

return M
