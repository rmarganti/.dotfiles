return function()
    -- The color used for unfocused windows in Tmux.
    local unfocused_window_bg = '#404649'

    require('bufferline').setup({
        highlights = {
            background = { guibg = unfocused_window_bg, },
            buffer_visible = {
                guibg = unfocused_window_bg,
                guifg = { attribute = "fg", highlight = "Normal" },
            },
            diagnostic = { guibg = unfocused_window_bg },
            diagnostic_visible = { guibg = unfocused_window_bg },
            duplicate = { guibg = unfocused_window_bg },
            duplicate_visible = { guibg = unfocused_window_bg },
            error = { guibg = unfocused_window_bg },
            error_visible = { guibg = unfocused_window_bg },
            error_diagnostic = { guibg = unfocused_window_bg },
            error_diagnostic_visible = { guibg = unfocused_window_bg },
            fill = { guibg = unfocused_window_bg, },
            info = { guibg = unfocused_window_bg },
            info_visible = { guibg = unfocused_window_bg },
            info_diagnostic = { guibg = unfocused_window_bg },
            info_diagnostic_visible = { guibg = unfocused_window_bg },
            modified = { guibg = unfocused_window_bg },
            modified_visible = { guibg = unfocused_window_bg },
            pick_selected = { guibg = 'none', },
            pick_visible = { guibg = unfocused_window_bg, },
            pick = { guibg = unfocused_window_bg, },
            separator = {
                guibg = unfocused_window_bg,
                guifg = unfocused_window_bg,
            },
            separator_selected = { guifg = unfocused_window_bg, },
            separator_visible = {
                guibg = unfocused_window_bg,
                guifg = unfocused_window_bg,
            },
            warning = { guibg = unfocused_window_bg },
            warning_visible = { guibg = unfocused_window_bg },
            warning_diagnostic = { guibg = unfocused_window_bg },
            warning_diagnostic_visible = { guibg = unfocused_window_bg },
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
