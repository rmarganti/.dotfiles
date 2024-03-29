local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

return {
    DiagnosticError = { fg = a.error }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineError = { underdotted = true, sp = p.red_dark },

    DiagnosticWarn = { fg = a.warning }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineWarn = { underdotted = true, sp = p.yellow_dark },

    DiagnosticInfo = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineInfo = { underdotted = true, sp = p.blue_dark },

    DiagnosticHint = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineHint = { underdotted = true, sp = p.blue_dark },

    DiagnosticUnnecessary = { fg = a.minus1 },

    LspCodeLens = { fg = a.minus3 },
    LspCodeLensSeparator = { fg = a.minus3 },

    ['@lsp.type.namespace'] = { link = '@namespace' },
    ['@lsp.type.type'] = { link = '@type' },
    ['@lsp.type.class'] = { fg = a.plus2 },
    ['@lsp.type.enum'] = { link = '@type' },
    ['@lsp.type.interface'] = { link = '@type' },
    ['@lsp.type.struct'] = { link = '@structure' },
    ['@lsp.type.parameter'] = { link = '@parameter' },
    ['@lsp.type.variable'] = { link = '@variable' },
    ['@lsp.type.property'] = { link = '@property' },
    ['@lsp.type.enumMember'] = { fg = a.plus2 },
    ['@lsp.type.function'] = { link = '@function' },
    ['@lsp.type.method'] = { link = '@method' },
    ['@lsp.type.macro'] = { link = '@macro' },
    ['@lsp.type.decorator'] = { fg = a.plus1 },

    ['@lsp.typemod.function.declaration'] = { italic = true },
}
