local core_fns = require('rmarganti.core.functions')

vim.api.nvim_create_user_command('EditNearest', function(opts)
    core_fns.edit_nearest(opts.args)
end, { nargs = 1, force = true })

vim.api.nvim_create_user_command('ReadURL', core_fns.read_url, {
    nargs = 0,
    force = true,
})
