-- Buffers as tabs
local M = {
    'akinsho/bufferline.nvim',
    dependencies = { 'kyazdani42/nvim-web-devicons' },
}

function M.config()
    local p = require('rmarganti.colors.palette')
    local a = require('rmarganti.colors.abstractions')

    require('bufferline').setup({
        highlights = {
            background = { bg = p.bg_light.gui },
            buffer_selected = {
                fg = a.fg.gui,
                italic = false,
            },
            buffer_visible = {
                bg = p.bg_light.gui,
                fg = a.plus1.gui,
            },
            diagnostic = { bg = p.bg_light.gui },
            diagnostic_visible = { bg = p.bg_light.gui },
            duplicate = { bg = p.bg_light.gui },
            duplicate_visible = { bg = p.bg_light.gui },
            error = { bg = p.bg_light.gui },
            error_visible = { bg = p.bg_light.gui },
            error_diagnostic = { bg = p.bg_light.gui },
            error_diagnostic_visible = { bg = p.bg_light.gui },
            fill = { bg = p.bg_light.gui },
            hint = { bg = p.bg_light.gui },
            hint_visible = { bg = p.bg_light.gui },
            hint_diagnostic = { bg = p.bg_light.gui },
            hint_diagnostic_visible = { bg = p.bg_light.gui },
            info = { bg = p.bg_light.gui },
            info_visible = { bg = p.bg_light.gui },
            info_diagnostic = { bg = p.bg_light.gui },
            info_diagnostic_visible = { bg = p.bg_light.gui },
            modified = { bg = p.bg_light.gui },
            modified_visible = { bg = p.bg_light.gui },
            numbers = { bg = p.bg_light.gui },
            numbers_visible = { bg = p.bg_light.gui },
            pick_selected = { bg = 'none' },
            pick_visible = { bg = p.bg_light.gui },
            pick = { bg = p.bg_light.gui },
            separator = {
                bg = p.bg_light.gui,
                fg = p.bg_light.gui,
            },
            separator_selected = { fg = p.bg_light.gui },
            separator_visible = {
                bg = p.bg_light.gui,
                fg = p.bg_light.gui,
            },
            warning = { bg = p.bg_light.gui },
            warning_visible = { bg = p.bg_light.gui },
            warning_diagnostic = { bg = p.bg_light.gui },
            warning_diagnostic_visible = { bg = p.bg_light.gui },
        },
        options = {
            diagnostics = 'nvim_lsp',
            diagnostics_indicator = function(_, level, _, _)
                local icon = level:match('error') and ' ' or ' '
                return ' ' .. icon
            end,
            max_name_length = 32,
            separator_style = 'slant',
            show_buffer_close_icons = false,
            show_buffer_icons = false,
            show_close_icon = false,
        },
    })
end

return M
