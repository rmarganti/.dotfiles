local M = {}

M.config = function()
    require('silicon').setup({
        theme = 'Nord',
        padHoriz = 10, -- Horizontal padding
        padVert = 10, -- vertical padding
        output = '~/Desktop/SILICON_$year-$month-$date-$time.png',
    })
end

return M
