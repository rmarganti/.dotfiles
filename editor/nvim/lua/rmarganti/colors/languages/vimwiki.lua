local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {

    VimwikiHeaderChar = { fg = a.base },

    VimwikiHeader1 = { fg = p.magenta, style = "bold" },
    VimwikiHeader2 = { fg = p.yellow, style = "bold" },
    VimwikiHeader3 = { fg = p.cyan, style = "bold" },
    VimwikiHeader4 = { fg = p.blue, style = "bold" },
    VimwikiHeader5 = { fg = p.gray2, style = "bold" },
    VimwikiHeader6 = { fg = p.gray2, style = "bold" },

    VimwikiLink = { fg = p.green, style = "underline" },
    VimwikiHR = { fg = a.base },
    VimwikiList = { fg = a.base },
    VimwikiTag = { fg = a.base },
}
