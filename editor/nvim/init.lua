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

require('rmarganti.core.autocommands')
require('rmarganti.core.config')
require('rmarganti.core.lsp')
require('rmarganti.core.keybindings')
require('rmarganti.core.user_commands')

vim.cmd('colorscheme neverforest')

require('rmarganti.plugins')
