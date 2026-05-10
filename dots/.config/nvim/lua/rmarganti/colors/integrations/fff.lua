local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    FFFNormal = { fg = a.fg, bg = a.float_bg },
    FFFBorder = { fg = a.border, bg = a.float_bg },
    FFFTitle = { fg = p.gray, bg = a.float_bg },
}
