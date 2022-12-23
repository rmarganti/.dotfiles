-- Delete buffers without affecting layout of windows.
local M = {
    'ojroques/nvim-bufdel',
    cmd = 'BufDel',
}

function M.config()
    require('bufdel').setup({ quit = false })
end

return M
