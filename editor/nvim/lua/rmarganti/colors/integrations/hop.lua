local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    HopNextKey = { bg = p.none, fg = a.plus4, bold = true, underline = false },
    HopNextKey1 = { bg = p.none, fg = a.plus4, bold = true, underline = false },
    HopNextKey2 = { bg = p.none, fg = a.base, bold = true, underline = false },
    HopUnmatched = { bg = p.none, fg = a.minus2 },
}
