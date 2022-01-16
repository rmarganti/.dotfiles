local a = require('rmarganti.colors.abstractions')

return {
    DiagnosticError = { fg = a.error }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineError = { gui='underline', sp = a.error },

    DiagnosticWarn = { fg = a.warning }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineWarn = { gui='underline', sp = a.warning },

    DiagnosticInfo = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineInfo = { gui='underline', sp = a.info },

    DiagnosticHint = { fg = a.info }, -- Used as the base highlight group. Other Diagnostic highlights link to this by default
    DiagnosticUnderlineHint = { gui='underline', sp = a.info },
}
