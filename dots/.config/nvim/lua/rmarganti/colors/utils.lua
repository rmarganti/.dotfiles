local M = {}

M.apply = function()
    local core = M.get_core_config()
    M.syntax(core)

    local integrations = M.get_integrations_config()
    M.syntax(integrations)
end

M.syntax = function(tbl)
    for group, colors in pairs(tbl) do
        M.highlight(group, colors)
    end
end

M.highlight = function(group, color)
    vim.api.nvim_set_hl(0, group, {
        -- Foreground
        fg = color.fg and color.fg.gui,
        ctermfg = color.fg and color.fg.cterm,

        -- Background
        bg = color.bg and color.bg.gui,
        ctermbg = color.bg and color.bg.cterm,

        -- Special
        sp = color.sp and color.sp.gui,

        -- Blend (number from 1-100)

        -- Attributes (booleans)
        bold = color.bold,
        standout = color.standout,
        underline = color.underline,
        undercurl = color.undercurl,
        underdouble = color.underdouble,
        underdotted = color.underdotted,
        underdashed = color.underdashed,
        strikethrough = color.strikethrough,
        italic = color.italic,
        reverse = color.reverse,
        nocombine = color.nocombine,

        -- Name of another group to link to.
        link = color.link,
    })
end

return M
