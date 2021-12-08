local M = {}

M.setup = function()
    local a = require('rmarganti.colors.palette')

    require('bufferline').setup({
        highlights = {
            background = { guibg = a.bg_light, },
            buffer_visible = {
                guibg = a.bg_light,
                guifg = a.plus3,
            },
            diagnostic = { guibg = a.bg_light },
            diagnostic_visible = { guibg = a.bg_light },
            duplicate = { guibg = a.bg_light },
            duplicate_visible = { guibg = a.bg_light },
            error = { guibg = a.bg_light },
            error_visible = { guibg = a.bg_light },
            error_diagnostic = { guibg = a.bg_light },
            error_diagnostic_visible = { guibg = a.bg_light },
            fill = { guibg = a.bg_light, },
            info = { guibg = a.bg_light },
            info_visible = { guibg = a.bg_light },
            info_diagnostic = { guibg = a.bg_light },
            info_diagnostic_visible = { guibg = a.bg_light },
            modified = { guibg = a.bg_light },
            modified_visible = { guibg = a.bg_light },
            pick_selected = { guibg = 'none', },
            pick_visible = { guibg = a.bg_light, },
            pick = { guibg = a.bg_light, },
            separator = {
                guibg = a.bg_light,
                guifg = a.bg_light,
            },
            separator_selected = { guifg = a.bg_light, },
            separator_visible = {
                guibg = a.bg_light,
                guifg = a.bg_light,
            },
            warning = { guibg = a.bg_light },
            warning_visible = { guibg = a.bg_light },
            warning_diagnostic = { guibg = a.bg_light },
            warning_diagnostic_visible = { guibg = a.bg_light },
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
