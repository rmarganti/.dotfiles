local p = require('rmarganti.colors.palette')

local M = {}

M = {
    fg = p.white,
    bg = p.bg,

    minus3 = p.gray_darker,
    minus2 = p.gray_dark,
    minus1 = p.gray,
    base = p.gray_light,
    plus1 = p.gray_lighter,
    plus2 = p.blue,
    plus3 = p.cyan,
    plus4 = p.white,

    success = p.green,
    error = p.red,
    warning = p.yellow,
    info = p.blue,

    border = p.gray_dark,

    float_bg = p.bg_light,

    select_fg = p.white,
    select_bg = p.gray_dark,
}

return M
