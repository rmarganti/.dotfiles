local p = require('rmarganti.colors.palette')

local M = {}

M = {
    minus3 = p.gray0,
    minus2 = p.gray1,
    minus1 = p.gray2,
    base = p.gray3,
    plus1 = p.blue,
    plus2 = p.green,
    plus3 = p.white,

    success = p.green,
    error = p.red,
    warning = p.yellow,
    info = p.blue,

    border = p.gray1,

    float_bg = p.bg_light,

    select_fg = p.fg,
    select_bg = p.bg_lightest,
}

return M
