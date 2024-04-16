local M = {}

-- Determine if a table contains a value.
M.has_value = function(tab, val)
    for _, value in ipairs(tab) do
        if value == val then
            return true
        end
    end

    return false
end

return M
