local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    HopNextKey = { bg = p.none, fg = a.plus3, style = "bold" },
    HopNextKey1 = { bg = p.none, fg = a.plus3, style="bold" },
    HopNextKey2 = { bg = p.none, fg = a.base, style = "bold" },
    HopUnmatched = { bg = p.none, fg = a.minus2 },
}
