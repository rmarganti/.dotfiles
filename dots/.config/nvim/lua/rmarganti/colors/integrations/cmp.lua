local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    -- Main completion window
    CmpNormal = { fg = a.fg, bg = a.float_bg },
    CmpBorder = { fg = a.border, bg = a.float_bg },
    
    -- Documentation window
    CmpDocNormal = { fg = a.fg, bg = a.float_bg },
    CmpDocBorder = { fg = a.border, bg = a.float_bg },
    
    -- Completion items
    CmpItemAbbr = { fg = a.plus4 },
    CmpItemAbbrMatch = { fg = p.cyan },
    CmpItemAbbrMatchFuzzy = { fg = p.cyan },
    CmpItemKind = { fg = a.base },
    CmpItemMenu = { fg = a.minus1 },
    
    -- Selected item (matches telescope selection)
    CmpItemAbbrDeprecated = { fg = a.minus2, strikethrough = true },
}
