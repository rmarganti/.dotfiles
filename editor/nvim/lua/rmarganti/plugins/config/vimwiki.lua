-- Maintain a personal wiki.
local M = {
    'vimwiki/vimwiki',
    event = 'VeryLazy',
}

function M.init()
    vim.g.vimwiki_list = {
        {
            path = '~/vimwiki/',
            syntax = 'markdown',
            ext = '.md',
        },
    }
end

return M
