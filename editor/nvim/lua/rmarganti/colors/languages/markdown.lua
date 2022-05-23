local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    markdownCode = { fg = p.gray2 },
    markdownCodeBlock = { fg = p.gray2 },

    markdownHeadingDelimiter = { fg = p.gray2, style = "bold" },
    markdownH1 = { fg = p.magenta, style = "bold" },
    markdownH2 = { fg = p.yellow, style = "bold" },
    markdownH3 = { fg = p.cyan, style = "bold" },
    markdownH4 = { fg = p.blue, style = "bold" },
    markdownH5 = { fg = p.gray2, style = "bold" },
    markdownH6 = { fg = p.gray2, style = "bold" },

    markdownLinkText = { fg = p.green, style = "underline" },
    markdownLinkTextDelimiter = { fg = a.base },
}

