local M = {}

M.setup = function()
    -- Mostly full-screen.
    vim.g.rnvimr_layout = {
        relative = 'editor',
        width = vim.o.columns - 8,
        height = vim.o.lines - 7,
        col = 4,
        row = 3,
        style = 'minimal'
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
