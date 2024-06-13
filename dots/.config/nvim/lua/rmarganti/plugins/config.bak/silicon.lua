-- Code screenshots.
local M = {
    'NarutoXY/silicon.lua',
    dependencies = {
        { 'nvim-lua/plenary.nvim' },
    },
    lazy = true,
}

function M.config()
    require('silicon').setup({
        theme = 'Nord',
        padHoriz = 10, -- Horizontal padding
        padVert = 10, -- vertical padding
        output = '~/Desktop/SILICON_$year-$month-$date-$time.png',
    })
end

return M
