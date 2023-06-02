local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    markdownCode = { fg = p.gray_light },
    markdownCodeBlock = { fg = p.gray_light },

    markdownHeadingDelimiter = { fg = p.gray_light, bold = true },
    markdownH1 = { fg = p.magenta, bold = true },
    markdownH2 = { fg = p.yellow, bold = true },
    markdownH3 = { fg = p.cyan, bold = true },
    markdownH4 = { fg = p.blue, bold = true },
    markdownH5 = { fg = p.gray_light, bold = true },
    markdownH6 = { fg = p.gray_light, bold = true },

    markdownLinkText = { fg = p.green, underline = true },
    markdownLinkTextDelimiter = { fg = a.base },
}
