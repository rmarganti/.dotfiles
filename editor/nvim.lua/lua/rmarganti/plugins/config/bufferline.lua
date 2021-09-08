return function()
	require('bufferline').setup({
		options = {
			numbers = function(opts)
                return string.format('%s.', opts.ordinal)
            end,
			separator_style = 'slant'
		},
	})
end
