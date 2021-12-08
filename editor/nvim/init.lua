---------------------------------------------------------------------------------------
--                                                                                   --
--  ██▀███   ███▄ ▄███▓ ▄▄▄       ██▀███    ▄████  ▄▄▄       ███▄    █ ▄▄▄█████▓ ██▓ --
-- ▓██ ▒ ██▒▓██▒▀█▀ ██▒▒████▄    ▓██ ▒ ██▒ ██▒ ▀█▒▒████▄     ██ ▀█   █ ▓  ██▒ ▓▒▓██▒ --
-- ▓██ ░▄█ ▒▓██    ▓██░▒██  ▀█▄  ▓██ ░▄█ ▒▒██░▄▄▄░▒██  ▀█▄  ▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▒ --
-- ▒██▀▀█▄  ▒██    ▒██ ░██▄▄▄▄██ ▒██▀▀█▄  ░▓█  ██▓░██▄▄▄▄██ ▓██▒  ▐▌██▒░ ▓██▓ ░ ░██░ --
-- ░██▓ ▒██▒▒██▒   ░██▒ ▓█   ▓██▒░██▓ ▒██▒░▒▓███▀▒ ▓█   ▓██▒▒██░   ▓██░  ▒██▒ ░ ░██░ --
-- ░ ▒▓ ░▒▓░░ ▒░   ░  ░ ▒▒   ▓▒█░░ ▒▓ ░▒▓░ ░▒   ▒  ▒▒   ▓▒█░░ ▒░   ▒ ▒   ▒ ░░   ░▓   --
--   ░▒ ░ ▒░░  ░      ░  ▒   ▒▒ ░  ░▒ ░ ▒░  ░   ░   ▒   ▒▒ ░░ ░░   ░ ▒░    ░     ▒ ░ --
--   ░░   ░ ░      ░     ░   ▒     ░░   ░ ░ ░   ░   ░   ▒      ░   ░ ░   ░       ▒ ░ --
--    ░            ░         ░  ░   ░           ░       ░  ░         ░           ░   --
--                                                                                   --
---------------------------------------------------------------------------------------
--                             N E O V I M  C O N F I G                              --
---------------------------------------------------------------------------------------


-- Disable some unused built-in Neovim plugins
vim.g.loaded_man = false
vim.g.loaded_gzip = false
vim.g.loaded_netrwPlugin = false
vim.g.loaded_tarPlugin = false
vim.g.loaded_zipPlugin = false
vim.g.loaded_2html_plugin = false

-- Won't show this until bufferline is loaded.
vim.opt.showtabline = 0

require('rmarganti.core')

vim.opt.shadafile = ''
vim.defer_fn(function()
    vim.cmd([[
        rshada!
        doautocmd BufRead
        syntax on
        filetype on
        filetype plugin indent on

        silent! bufdo e
    ]])
end, 15)
