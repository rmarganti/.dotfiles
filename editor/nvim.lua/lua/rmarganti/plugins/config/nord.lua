return function()
    vim.g.nord_contrast = false
    vim.g.nord_borders = true
    vim.g.nord_disable_background = true

    require('nord').set()
end
