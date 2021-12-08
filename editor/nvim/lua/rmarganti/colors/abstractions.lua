local p = require('rmarganti.colors.palette')

local M = {}

M = {
    inactive_bg = p.bg0,

    -- Visual hierarchy
    minus3 = p.bg1,
    minus2 = p.black_bright,
    minus1 = p.gray0,
    base = p.gray2,
    plus1 = p.blue,
    plus2 = p.green,
    plus3 = p.white,

    sucess = p.green,
    error = p.red,
    warning = p.yellow,
    info = p.blue,
}

return M
