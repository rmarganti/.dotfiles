local p = require('rmarganti.colors.palette')

return {
    markdownHeadingDelimiter = { fg = p.gray2, style = "bold" },
    markdownCode = { fg = p.gray2 },
    markdownCodeBlock = { fg = p.gray2 },
    markdownH1 = { fg = p.red, style = "bold" },
    markdownH2 = { fg = p.yellow, style = "bold" },
    markdownH3 = { fg = p.cyan, style = "bold" },
    markdownLinkText = { fg = p.green, style = "underline" },
}
