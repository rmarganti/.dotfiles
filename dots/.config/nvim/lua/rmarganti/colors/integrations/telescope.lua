local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    ------------------------------------------------
    -- Defaults
    ------------------------------------------------

    TelescopeNormal = { fg = p.fg, bg = a.float_bg },
    TelescopeBorder = { fg = a.border, bg = a.float_bg },

    ------------------------------------------------
    -- Preview
    ------------------------------------------------

    TelescopePreviewTitle = { fg = p.gray2, bg = p.bg_lighter },

    ------------------------------------------------
    -- Results
    ------------------------------------------------

    TelescopeResultsTitle = { fg = p.gray2, bg = p.bg_lighter },
    TelescopeSelectionCaret = { fg = a.select_bg },
    TelescopeSelection = { fg = a.select_fg, bg = a.select_bg },
    TelescopeMatching = { fg = p.cyan },

    ------------------------------------------------
    -- Prompt
    ------------------------------------------------

    TelescopePromptTitle = { fg = p.gray3, bg = p.bg_lighter },
    TelescopePromptBorder = { fg = p.gray2, bg = a.float_bg, bold = true },
}
