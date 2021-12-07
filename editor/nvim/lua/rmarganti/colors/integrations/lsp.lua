local a = require('rmarganti.colors.abstractions')

return {
    DiagnosticError = { fg = a.error }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticWarn = { fg = a.warning }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticInfo = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticHint = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
}
