local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    ------------------------------------------------
    -- Defaults
    ------------------------------------------------

    TelescopeNormal = { fg = a.fg, bg = a.float_bg },
    TelescopeBorder = { fg = a.border, bg = a.float_bg },

    ------------------------------------------------
    -- Preview
    ------------------------------------------------

    TelescopePreviewTitle = { fg = p.gray, bg = p.bg_lighter },

    ------------------------------------------------
    -- Results
    ------------------------------------------------

    TelescopeResultsTitle = { fg = p.gray, bg = p.bg_lighter },
    TelescopeSelectionCaret = { fg = a.select_bg },
    TelescopeSelection = { fg = a.select_fg, bg = a.select_bg },
    TelescopeMatching = { fg = p.cyan },

    ------------------------------------------------
    -- Prompt
    ------------------------------------------------

    TelescopePromptNormal = { fg = p.red, bg = a.float_bg },
    TelescopePromptPrefix = { fg = a.fg, bg = a.float_bg },
    TelescopePromptTitle = { fg = p.gray_light, bg = p.bg_lighter },
    TelescopePromptBorder = { fg = p.gray, bg = a.float_bg, bold = true },
}
