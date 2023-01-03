local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    VimwikiHeaderChar = { fg = a.base },

    VimwikiHeader1 = { fg = p.magenta, bold = true },
    VimwikiHeader2 = { fg = p.yellow, bold = true },
    VimwikiHeader3 = { fg = p.cyan, bold = true },
    VimwikiHeader4 = { fg = p.blue, bold = true },
    VimwikiHeader5 = { fg = p.gray3, bold = true },
    VimwikiHeader6 = { fg = p.gray3, bold = true },

    VimwikiLink = { fg = p.green, underline = true },
    VimwikiHR = { fg = a.base },
    VimwikiList = { fg = a.base },
    VimwikiTag = { fg = a.base },

    VimwikiCode = { link = 'markdownCodeBlock' },
}
