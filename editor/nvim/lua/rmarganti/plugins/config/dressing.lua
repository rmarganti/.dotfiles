local M = {}

M.config = function()
    require('dressing').setup({
        input = {
            insert_only = false,
            winblend = 0,
            get_config = function(opts)
                if (opts.kind == 'read_url') then
                    return {
                        relative = 'win',
                        prefer_width = 60,
                    }
                end
            end
        },
    })
end

return M
