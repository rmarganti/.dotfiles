local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    MiniJump2dSpot = { bg = p.none, fg = a.plus4, bold = true, underline = false },
    MiniJump2dSpotAhead = { bg = p.none, fg = a.base, bold = true, underline = false },
    MiniJump2dDim = { bg = p.none, fg = a.minus2 },
}
