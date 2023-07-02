-- File explorer.
local M = {
    'kevinhwang91/rnvimr',
    event = 'VeryLazy',
}

function M.init()
    vim.g.rnvimr_presets = {
        { width = 0.950, height = 0.9 },
    }

    -- Take over from netrw.
    vim.g.rnvimr_enable_ex = 1

    -- Change border color.
    vim.g.rnvimr_border_attr = {
        fg = 8,
        bg = -1,
    }

    -- Close Ranger after picking file.
    vim.g.rnvimr_enable_picker = 1
end

return M
