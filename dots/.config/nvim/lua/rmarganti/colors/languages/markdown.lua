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

    ['@markup.heading.1'] = { fg = p.magenta, bold = true },
    ['@markup.heading.2'] = { fg = p.yellow, bold = true },
    ['@markup.heading.3'] = { fg = p.cyan, bold = true },
    ['@markup.heading.4'] = { fg = p.blue, bold = true },
    ['@markup.heading.5'] = { fg = p.gray_light, bold = true },
    ['@markup.heading.6'] = { fg = p.gray_light, bold = true },

    ['@markup.heading.1.marker'] = { fg = a.minus2 },
    ['@markup.heading.2.marker'] = { fg = a.minus2 },
    ['@markup.heading.3.marker'] = { fg = a.minus2 },
    ['@markup.heading.4.marker'] = { fg = a.minus2 },
    ['@markup.heading.5.marker'] = { fg = a.minus2 },
    ['@markup.heading.6.marker'] = { fg = a.minus2 },

    ['@markup.link'] = { fg = a.plus1, underline = true },
}
