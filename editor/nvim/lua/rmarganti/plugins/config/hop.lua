-- Quickly jump elsewhere in window.
local M = {
    'phaazon/hop.nvim',
    cmd = { 'HopChar1' },
}

function M.config()
    local hop = require('hop')

    hop.setup({
        keys = 'asdhklqwertyuiopzxcvbnmfj',
    })
end

return M
