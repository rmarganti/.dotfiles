local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    HopNextKey = { bg = p.none, fg = a.plus2, style = "bold,underline" },
    HopNextKey1 = { bg = p.none, fg = a.plus2, style = "bold" },
    HopNextKey2 = { bg = p.none, fg = a.plus1, style = "bold,italic" },
    HopUnmatched = { bg = p.none, fg = a.minus1 },
}
