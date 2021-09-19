return function()
	require('bufferline').setup({
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
