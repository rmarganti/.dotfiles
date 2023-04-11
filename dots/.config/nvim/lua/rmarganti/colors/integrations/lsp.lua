local a = require('rmarganti.colors.abstractions')

return {
    DiagnosticError = { fg = a.error }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineError = { gui = 'underline', sp = a.error },

    DiagnosticWarn = { fg = a.warning }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineWarn = { gui = 'underline', sp = a.warning },

    DiagnosticInfo = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineInfo = { gui = 'underline', sp = a.info },

    DiagnosticHint = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineHint = { gui = 'underline', sp = a.info },

    DiagnosticUnnecessary = { fg = a.minus1 },

    ['@lsp.type.namespace'] = { link = '@namespace' },
    ['@lsp.type.type'] = { link = '@type' },
    ['@lsp.type.class'] = { fg = a.plus3 },
    ['@lsp.type.enum'] = { link = '@type' },
    ['@lsp.type.interface'] = { link = '@type' },
    ['@lsp.type.struct'] = { link = '@structure' },
    ['@lsp.type.parameter'] = { link = '@parameter' },
    ['@lsp.type.variable'] = { link = '@variable' },
    ['@lsp.type.property'] = { link = '@property' },
    ['@lsp.type.enumMember'] = { link = '@constant' },
    ['@lsp.type.function'] = { link = '@function' },
    ['@lsp.type.method'] = { link = '@method' },
    ['@lsp.type.macro'] = { link = '@macro' },
    ['@lsp.type.decorator'] = { link = '@function' },
}
