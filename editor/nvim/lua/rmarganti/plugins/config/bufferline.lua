local M = {}

M.config = function()
    local p = require('rmarganti.colors.palette')
    local a = require('rmarganti.colors.abstractions')

    require('bufferline').setup({
        highlights = {
            background = { guibg = p.bg_light.gui, },
            buffer_visible = {
                guibg = p.bg_light.gui,
                guifg = a.plus3.gui,
            },
            diagnostic = { guibg = p.bg_light.gui },
            diagnostic_visible = { guibg = p.bg_light.gui },
            duplicate = { guibg = p.bg_light.gui },
            duplicate_visible = { guibg = p.bg_light.gui },
            error = { guibg = p.bg_light.gui },
            error_visible = { guibg = p.bg_light.gui },
            error_diagnostic = { guibg = p.bg_light.gui },
            error_diagnostic_visible = { guibg = p.bg_light.gui },
            fill = { guibg = p.bg_light.gui, },
            hint = { guibg = p.bg_light.gui },
            hint_visible = { guibg = p.bg_light.gui },
            hint_diagnostic = { guibg = p.bg_light.gui },
            hint_diagnostic_visible = { guibg = p.bg_light.gui },
            info = { guibg = p.bg_light.gui },
            info_visible = { guibg = p.bg_light.gui },
            info_diagnostic = { guibg = p.bg_light.gui },
            info_diagnostic_visible = { guibg = p.bg_light.gui },
            modified = { guibg = p.bg_light.gui },
            modified_visible = { guibg = p.bg_light.gui },
            numbers = { guibg = p.bg_light.gui },
            numbers_visible = { guibg = p.bg_light.gui },
            pick_selected = { guibg = 'none', },
            pick_visible = { guibg = p.bg_light.gui, },
            pick = { guibg = p.bg_light.gui, },
            separator = {
                guibg = p.bg_light.gui,
                guifg = p.bg_light.gui,
            },
            separator_selected = { guifg = p.bg_light.gui, },
            separator_visible = {
                guibg = p.bg_light.gui,
                guifg = p.bg_light.gui,
            },
            warning = { guibg = p.bg_light.gui },
            warning_visible = { guibg = p.bg_light.gui },
            warning_diagnostic = { guibg = p.bg_light.gui },
            warning_diagnostic_visible = { guibg = p.bg_light.gui },
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
