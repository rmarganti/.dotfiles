return function()
    -- The color used for unfocused windows in Tmux.
    local unfocused_window_bg = '#404649'

	require('bufferline').setup({
        highlights = {
            background = {
                guibg = unfocused_window_bg,
            },
            buffer_visible = {
                guibg = unfocused_window_bg,
                guifg = {
                    attribute = "fg",
                    highlight = "Normal"
                },
            },
            fill = {
                guibg = unfocused_window_bg,
            },
            pick_selected = {
                guibg = 'none',
            },
            pick_visible = {
                guibg = unfocused_window_bg,
            },
            pick = {
                guibg = unfocused_window_bg,
            },
            separator_selected = {
                guifg = unfocused_window_bg,
            },
            separator_visible = {
                guibg = unfocused_window_bg,
                guifg = unfocused_window_bg,
            },
            separator = {
                guibg = unfocused_window_bg,
                guifg = unfocused_window_bg,
            },

		--[[ BufferLinePick = { fg = fg, bg = bg, gui = 'bold' },
		BufferLinePickSelected = { fg = blue, bg = bg, gui = 'bold,italic' },
		BufferLinePickVisible = { fg = fg, bg = bg_alt }, ]]
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
