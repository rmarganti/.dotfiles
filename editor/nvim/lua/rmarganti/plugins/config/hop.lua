local hop = require('hop')

local M = {}

M.config = function()
    hop.setup({
        keys = 'asdhklqwertyuiopzxcvbnmfj'
    })
end

return M
