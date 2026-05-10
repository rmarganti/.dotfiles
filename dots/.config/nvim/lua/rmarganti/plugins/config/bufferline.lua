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
            background = { bg = p.bg.gui },
            buffer_selected = {
                fg = a.fg.gui,
                italic = false,
            },
            buffer_visible = {
                bg = p.bg.gui,
                fg = a.plus1.gui,
            },
            diagnostic = { bg = p.bg.gui },
            diagnostic_visible = { bg = p.bg.gui },
            duplicate = { bg = p.bg.gui },
            duplicate_visible = { bg = p.bg.gui },
            error = { bg = p.bg.gui },
            error_visible = { bg = p.bg.gui },
            error_diagnostic = { bg = p.bg.gui },
            error_diagnostic_visible = { bg = p.bg.gui },
            fill = { bg = p.bg.gui },
            hint = { bg = p.bg.gui },
            hint_visible = { bg = p.bg.gui },
            hint_diagnostic = { bg = p.bg.gui },
            hint_diagnostic_visible = { bg = p.bg.gui },
            info = { bg = p.bg.gui },
            info_visible = { bg = p.bg.gui },
            info_diagnostic = { bg = p.bg.gui },
            info_diagnostic_visible = { bg = p.bg.gui },
            info_selected = { fg = a.fg.gui, italic = false },
            modified = { bg = p.bg.gui },
            modified_visible = { bg = p.bg.gui },
            numbers = { bg = p.bg.gui },
            numbers_visible = { bg = p.bg.gui },
            pick_selected = { bg = 'none' },
            pick_visible = { bg = p.bg.gui },
            pick = { bg = p.bg.gui },
            separator = {
                bg = p.bg.gui,
                fg = p.bg.gui,
            },
            separator_selected = { fg = p.bg.gui },
            separator_visible = {
                bg = p.bg.gui,
                fg = p.bg.gui,
            },
            warning = { bg = p.bg.gui },
            warning_visible = { bg = p.bg.gui },
            warning_diagnostic = { bg = p.bg.gui },
            warning_diagnostic_visible = { bg = p.bg.gui },
        },
        options = {
            diagnostics = 'nvim_lsp',
            diagnostics_indicator = function(_, level, _, _)
                if level:match('info') then
                    return ''
                end

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
