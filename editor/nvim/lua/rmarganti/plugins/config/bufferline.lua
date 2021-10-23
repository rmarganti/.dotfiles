local M = {}

M.setup = function()
    local theme = require('rmarganti.core.theme')

    require('bufferline').setup({
        highlights = {
            background = { guibg = theme.bg0, },
            buffer_visible = {
                guibg = theme.bg0,
                guifg = { attribute = "fg", highlight = "Normal" },
            },
            diagnostic = { guibg = theme.bg0 },
            diagnostic_visible = { guibg = theme.bg0 },
            duplicate = { guibg = theme.bg0 },
            duplicate_visible = { guibg = theme.bg0 },
            error = { guibg = theme.bg0 },
            error_visible = { guibg = theme.bg0 },
            error_diagnostic = { guibg = theme.bg0 },
            error_diagnostic_visible = { guibg = theme.bg0 },
            fill = { guibg = theme.bg0, },
            info = { guibg = theme.bg0 },
            info_visible = { guibg = theme.bg0 },
            info_diagnostic = { guibg = theme.bg0 },
            info_diagnostic_visible = { guibg = theme.bg0 },
            modified = { guibg = theme.bg0 },
            modified_visible = { guibg = theme.bg0 },
            pick_selected = { guibg = 'none', },
            pick_visible = { guibg = theme.bg0, },
            pick = { guibg = theme.bg0, },
            separator = {
                guibg = theme.bg0,
                guifg = theme.bg0,
            },
            separator_selected = { guifg = theme.bg0, },
            separator_visible = {
                guibg = theme.bg0,
                guifg = theme.bg0,
            },
            warning = { guibg = theme.bg0 },
            warning_visible = { guibg = theme.bg0 },
            warning_diagnostic = { guibg = theme.bg0 },
            warning_diagnostic_visible = { guibg = theme.bg0 },
        },
        options = {
            diagnostics = 'nvim_lsp',
            diagnostics_indicator = function(_, level, _, _)
                  local icon = level:match("error") and " " or " "
                  return " " .. icon
            end,
            numbers = function(opts)
                return string.format('%s.', opts.ordinal)
            end,
            separator_style = 'slant',
            show_buffer_close_icons = false,
            show_close_icon = false,
        },
    })
end

return M
