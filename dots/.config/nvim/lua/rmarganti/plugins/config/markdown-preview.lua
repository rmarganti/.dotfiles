-- Markdown preview.
-- Does not work correctly when lazy-loaded.
local M = {
    'iamcco/markdown-preview.nvim',
}

function M.build()
    vim.fn['mkdp#util#install']()
end

function M.init()
    vim.g.mkdp_theme = 'light'
end

return M
