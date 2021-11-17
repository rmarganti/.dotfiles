local M = {}

M.setup = function()
    local dashboard = require('alpha.themes.dashboard')

    dashboard.section.header.val = {
        '-------------------------------------------------------------------------------------------',
        '--                                                                                       --',
        '--    ██▀███   ███▄ ▄███▓ ▄▄▄       ██▀███    ▄████  ▄▄▄       ███▄    █ ▄▄▄█████▓ ██▓   --',
        '--   ▓██ ▒ ██▒▓██▒▀█▀ ██▒▒████▄    ▓██ ▒ ██▒ ██▒ ▀█▒▒████▄     ██ ▀█   █ ▓  ██▒ ▓▒▓██▒   --',
        '--   ▓██ ░▄█ ▒▓██    ▓██░▒██  ▀█▄  ▓██ ░▄█ ▒▒██░▄▄▄░▒██  ▀█▄  ▓██  ▀█ ██▒▒ ▓██░ ▒░▒██▒   --',
        '--   ▒██▀▀█▄  ▒██    ▒██ ░██▄▄▄▄██ ▒██▀▀█▄  ░▓█  ██▓░██▄▄▄▄██ ▓██▒  ▐▌██▒░ ▓██▓ ░ ░██░   --',
        '--   ░██▓ ▒██▒▒██▒   ░██▒ ▓█   ▓██▒░██▓ ▒██▒░▒▓███▀▒ ▓█   ▓██▒▒██░   ▓██░  ▒██▒ ░ ░██░   --',
        '--   ░ ▒▓ ░▒▓░░ ▒░   ░  ░ ▒▒   ▓▒█░░ ▒▓ ░▒▓░ ░▒   ▒  ▒▒   ▓▒█░░ ▒░   ▒ ▒   ▒ ░░   ░▓     --',
        '--     ░▒ ░ ▒░░  ░      ░  ▒   ▒▒ ░  ░▒ ░ ▒░  ░   ░   ▒   ▒▒ ░░ ░░   ░ ▒░    ░     ▒ ░   --',
        '--     ░░   ░ ░      ░     ░   ▒     ░░   ░ ░ ░   ░   ░   ▒      ░   ░ ░   ░       ▒ ░   --',
        '--      ░            ░         ░  ░   ░           ░       ░  ░         ░           ░     --',
        '--                                                                                       --',
        '-------------------------------------------------------------------------------------------',
        '--                                      N E O V I M                                      --',
        '-------------------------------------------------------------------------------------------',
    }

    dashboard.section.header.opts.hl = 'Comment'

    local function button(sc, txt, keybind, keybind_opts)
        local b = dashboard.button(sc, txt, keybind, keybind_opts)
        b.opts.hl = "Function"
        b.opts.hl_shortcut = "Type"
        return b
    end

    dashboard.section.buttons.val = {
        button("e", "  New file", ":ene <CR>"),
        button("SPC s f", "  Search Files"),
        button("SPC s r", "  Search Recent files"),
        button("SPC s t", "  Search Text"),
        button("SPC f x", "  File eXplorer"),
        button("q", "  Quit", "<Cmd>qa<CR>")
    }

    require('alpha').setup(dashboard.opts)
end

return M
