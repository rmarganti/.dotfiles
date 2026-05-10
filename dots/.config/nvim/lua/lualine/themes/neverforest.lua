local p = require('rmarganti.colors.palette')

return {
    normal = {
        a = { bg = p.bg_lighter.gui, fg = p.gray.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },

    insert = {
        a = { bg = p.bg_lighter.gui, fg = p.green.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },

    visual = {
        a = { bg = p.bg_lighter.gui, fg = p.gray.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },

    replace = {
        a = { bg = p.bg_lighter.gui, fg = p.green.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },

    command = {
        a = { bg = p.bg_lighter.gui, fg = p.yellow.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },

    inactive = {
        a = { bg = p.bg_lighter.gui, fg = p.magenta.gui, gui = 'bold' },
        b = { bg = p.bg_dark.gui, fg = p.gray_dark.gui },
        c = { bg = p.bg.gui, fg = p.gray_dark.gui },
    },
}
