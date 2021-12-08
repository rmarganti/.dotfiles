local p = require('rmarganti.colors.palette')

local M = {}

M = {
    -- Visual hierarchy
    minus3 = p.bg_lightest,
    minus2 = p.black_bright,
    minus1 = p.gray0,
    base = p.gray2,
    plus1 = p.blue,
    plus2 = p.green,
    plus3 = p.white,

    success = p.green,
    error = p.red,
    warning = p.yellow,
    info = p.blue,

    border = p.gray0,

    float_bg = p.bg_light,

    select_fg = p.fg,
    select_bg = p.bg_lightest,
}

return M
