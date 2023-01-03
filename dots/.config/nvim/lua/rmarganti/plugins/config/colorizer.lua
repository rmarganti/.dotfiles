-- Preview CSS colors.
local M = {
    'norcalli/nvim-colorizer.lua',
    event = 'VeryLazy',
}

function M.config()
    require('colorizer').setup()
end

return M
