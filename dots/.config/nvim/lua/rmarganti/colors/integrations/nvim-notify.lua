-- nvim-notify [https://github.com/rcarriga/nvim-notify]
local a = require('rmarganti.colors.abstractions')

return {
    NotifyERRORTitle = { fg = a.error },
    NotifyERRORBorder = { fg = a.error },
    NotifyERRORIcon = { fg = a.error },

    NotifyWARNTitle = { fg = a.warning },
    NotifyWARNBorder = { fg = a.warning },
    NotifyWARNIcon = { fg = a.warning },

    NotifyINFOTitle = { fg = a.info },
    NotifyINFOBorder = { fg = a.info },
    NotifyINFOIcon = { fg = a.info },

    NotifyDEBUGTitle = { fg = a.info },
    NotifyDEBUGBorder = { fg = a.info },
    NotifyDEBUGIcon = { fg = a.info },

    NotifyTRACETitle = { fg = a.info },
    NotifyTRACEBorder = { fg = a.info },
    NotifyTRACEIcon = { fg = a.info },
}
