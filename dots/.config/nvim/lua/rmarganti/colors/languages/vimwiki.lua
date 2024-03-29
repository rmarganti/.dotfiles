local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    VimwikiHeaderChar = { fg = a.base },

    VimwikiHeader1 = { fg = p.magenta, bold = true },
    VimwikiHeader2 = { fg = p.yellow, bold = true },
    VimwikiHeader3 = { fg = p.cyan, bold = true },
    VimwikiHeader4 = { fg = p.blue, bold = true },
    VimwikiHeader5 = { fg = p.gray_light, bold = true },
    VimwikiHeader6 = { fg = p.gray_light, bold = true },

    VimwikiLink = { fg = a.plus1, underline = true },
    VimwikiHR = { fg = a.base },
    VimwikiList = { fg = a.base },
    VimwikiTag = { fg = a.base },
    VimwikiCellSeparator = { fg = a.minus2 },

    VimwikiCode = { link = 'markdownCodeBlock' },
}
