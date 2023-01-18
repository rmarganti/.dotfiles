local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    TelescopeNormal = { fg = p.fg, bg = a.float_bg },
    TelescopeBorder = { fg = a.border, bg = a.float_bg },
    TelescopeSelectionCaret = { fg = a.select_bg },
    TelescopeSelection = { fg = a.select_fg, bg = a.select_bg },
    TelescopeMatching = { fg = p.cyan },

    TelescopeResultsNormal = { bg = p.bg_light },
    TelescopeResultsBorder = { fg = a.border, bg = p.bg_light },
    TelescopeResultsTitle = { fg = a.border, bg = p.bg_light },
}
