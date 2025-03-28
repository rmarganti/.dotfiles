local p = require('rmarganti.colors.palette')

return {
    normal = {
        a = { bg = p.bg_lightest.gui, fg = p.gray.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    },

    insert = {
        a = { bg = p.green.gui, fg = p.black.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    },

    visual = {
        a = { bg = p.gray_light.gui, fg = p.black.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    },

    replace = {
        a = { bg = p.green.gui, fg = p.black.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    },

    command = {
        a = { bg = p.yellow.gui, fg = p.black.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    },

    inactive = {
        a = { bg = p.gray.magenta, fg = p.black.gui, gui = 'bold' },
        b = { bg = p.bg_lighter.gui, fg = p.gray.gui },
        c = { bg = p.bg_light.gui, fg = p.gray.gui }
    }
 }
