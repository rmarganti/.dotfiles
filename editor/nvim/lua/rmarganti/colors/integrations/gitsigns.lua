local p = require('rmarganti.colors.palette')

return {
    GitSignsAdd = { bg = p.none, fg = p.green_dark },
    GitSignsChange = { bg = p.none, fg = p.yellow_dark },
    GitSignsDelete = { bg = p.none, fg = p.red_dark },
}
