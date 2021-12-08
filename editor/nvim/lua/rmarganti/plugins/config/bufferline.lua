local M = {}

M.setup = function()
    local a = require('rmarganti.colors.abstractions')

    require('bufferline').setup({
        highlights = {
            background = { guibg = a.inactive_bg, },
            buffer_visible = {
                guibg = a.inactive_bg,
                guifg = a.plus3,
            },
            diagnostic = { guibg = a.inactive_bg },
            diagnostic_visible = { guibg = a.inactive_bg },
            duplicate = { guibg = a.inactive_bg },
            duplicate_visible = { guibg = a.inactive_bg },
            error = { guibg = a.inactive_bg },
            error_visible = { guibg = a.inactive_bg },
            error_diagnostic = { guibg = a.inactive_bg },
            error_diagnostic_visible = { guibg = a.inactive_bg },
            fill = { guibg = a.inactive_bg, },
            info = { guibg = a.inactive_bg },
            info_visible = { guibg = a.inactive_bg },
            info_diagnostic = { guibg = a.inactive_bg },
            info_diagnostic_visible = { guibg = a.inactive_bg },
            modified = { guibg = a.inactive_bg },
            modified_visible = { guibg = a.inactive_bg },
            pick_selected = { guibg = 'none', },
            pick_visible = { guibg = a.inactive_bg, },
            pick = { guibg = a.inactive_bg, },
            separator = {
                guibg = a.inactive_bg,
                guifg = a.inactive_bg,
            },
            separator_selected = { guifg = a.inactive_bg, },
            separator_visible = {
                guibg = a.inactive_bg,
                guifg = a.inactive_bg,
            },
            warning = { guibg = a.inactive_bg },
            warning_visible = { guibg = a.inactive_bg },
            warning_diagnostic = { guibg = a.inactive_bg },
            warning_diagnostic_visible = { guibg = a.inactive_bg },
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
