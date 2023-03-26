local p = require('rmarganti.colors.palette')

local M = {}

M = {
    minus3 = p.gray0,
    minus2 = p.gray1,
    minus1 = p.gray2,
    base = p.gray3,
    plus1 = p.gray4,
    plus2 = p.blue,
    plus3 = p.cyan,
    plus4 = p.white,

    success = p.green,
    error = p.red,
    warning = p.yellow,
    info = p.blue,

    border = p.gray1,

    float_bg = p.bg_light,

    select_fg = p.fg,
    select_bg = p.gray1,
}

return M
