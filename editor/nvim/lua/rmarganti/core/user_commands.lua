local edit_nearest = require('rmarganti.core.functions').edit_nearest

vim.api.nvim_create_user_command(
    'EditNearest',
    function(opts)
        edit_nearest(opts.args)
    end,
    { nargs = 1, force = true }
)
