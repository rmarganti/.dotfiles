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
vim.g.loaded_tarPlugin = false
vim.g.loaded_zipPlugin = false
vim.g.loaded_2html_plugin = false

require('rmarganti.core.autocommands')
require('rmarganti.core.config')
require('rmarganti.core.statuscolumn')
require('rmarganti.core.lsp')
require('rmarganti.core.keybindings')
require('rmarganti.core.user_commands')

-- Let Pi reveal files it is changing when both tools run inside Herdr.
require('rmarganti.integrations.pi_follow_agent').setup()

vim.cmd('colorscheme neverforest')

require('rmarganti.plugins')
require('rmarganti.core.filetypes')
