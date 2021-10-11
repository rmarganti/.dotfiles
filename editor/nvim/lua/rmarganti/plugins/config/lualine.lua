return function()
    local function rubber_duck()
        return ''
    end

    require('lualine').setup({
        options = {
            theme = 'everforest',
        },
        sections = {
            lualine_a = { rubber_duck, 'mode'},
            lualine_b = {
                'branch',
                require('github-notifications').statusline_notification_count
            },
            lualine_c = {'filename'},
            lualine_x = {'filetype'},
            lualine_y = {'progress'},
            lualine_z = {'location'},
        },
    })
end
