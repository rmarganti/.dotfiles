local M = {}

M.palette = {
    none = { gui = 'NONE', cterm = 'NONE' },

    bg_darker = { gui = '#0d1011', cterm = 233 },
    bg_dark = { gui = '#181c1e', cterm = 234 },
    bg = { gui = '#1d2226', cterm = 235 },
    bg_light = { gui = '#2b3238', cterm = 237 },
    bg_lighter = { gui = '#39434b', cterm = 238 },
    bg_lightest = { gui = '#48545e', cterm = 240 },

    fg = { gui = '#d3c6aa', cterm = 187 },

    black_dark = { gui = '#3e474c', cterm = 237 },
    black = { gui = '#4b565c', cterm = 240 },
    black_bright = { gui = '#546066', cterm = 59 },

    red_dark = { gui = '#a56264', cterm = 131 },
    red = { gui = '#e67e80', cterm = 174 },
    red_bright = { gui = '#ff8c8e', cterm = 210 },

    green_dark = { gui = '#7e977a', cterm = 244 },
    green = { gui = '#accea1', cterm = 151 },
    green_bright = { gui = '#bdd991', cterm = 150 },

    yellow_dark = { gui = '#9e8b64', cterm = 101 },
    yellow = { gui = '#dbbc7f', cterm = 180 },
    yellow_bright = { gui = '#f5d38e', cterm = 222 },

    blue_dark = { gui = '#769692', cterm = 66 },
    blue = { gui = '#aeccc6', cterm = 152 },
    blue_bright = { gui = '#90d4cb', cterm = 116 },

    magenta_dark = { gui = '#9a7488', cterm = 96 },
    magenta = { gui = '#d699b6', cterm = 175 },
    magenta_bright = { gui = '#f0aacc', cterm = 218 },

    cyan_dark = { gui = '#638e70', cterm = 65 },
    cyan = { gui = '#9fcca9', cterm = 151 },
    cyan_bright = { gui = '#93d9a5', cterm = 115 },

    white_dark = { gui = '#989280', cterm = 245 },
    white = { gui = '#d3c6aa', cterm = 187 },
    white_bright = { gui = '#eddfc0', cterm = 223 },

    gray0 = { gui = '#2b3238', cterm = 243 },
    gray1 = { gui = '#515a5b', cterm = 244 },
    gray2 = { gui = '#77817d', cterm = 245 },
    gray3 = { gui = '#9da9a0', cterm = 247 },
    gray4 = { gui = '#bec8b5', cterm = 247 },
}

M.config = {
    background = M.palette.bg.gui,
    foreground = M.palette.fg.gui,

    cursor_bg = M.palette.fg.gui,
    cursor_fg = M.palette.bg.gui,

    selection_bg = M.palette.black_dark.gui,
    selection_fg = M.palette.fg.gui,

    ansi = {
        M.palette.black.gui,
        M.palette.red.gui,
        M.palette.green.gui,
        M.palette.yellow.gui,
        M.palette.blue.gui,
        M.palette.magenta.gui,
        M.palette.cyan.gui,
        M.palette.white.gui,
    },

    brights = {
        M.palette.black_bright.gui,
        M.palette.red_bright.gui,
        M.palette.green_bright.gui,
        M.palette.yellow_bright.gui,
        M.palette.blue_bright.gui,
        M.palette.magenta_bright.gui,
        M.palette.cyan_bright.gui,
        M.palette.white_bright.gui,
    },

    tab_bar = {
        background = M.palette.bg_dark.gui,

        active_tab = {
            bg_color = M.palette.bg.gui,
            fg_color = M.palette.gray4.gui,
        },

        inactive_tab = {
            bg_color = M.palette.bg_dark.gui,
            fg_color = M.palette.bg_lightest.gui,
        },

        -- Purposely non-visible.
        new_tab = {
            bg_color = M.palette.bg_dark.gui,
            fg_color = M.palette.bg_dark.gui,
        },
    },

    -- The color of the split lines between panes
    split = M.palette.bg.gui,
}

return M
