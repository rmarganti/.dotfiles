local a = require('rmarganti.colors.abstractions')

local M = {
    'nvim-lualine/lualine.nvim',
    dependencies = {
        'nvim-tree/nvim-web-devicons',
        'SmiteshP/nvim-navic',
    },
    config = function()
        require('lualine').setup({
            options = {
                component_separators = { left = '', right = '' },
                section_separators = { left = '', right = '' },
            },

            sections = {
                lualine_a = {
                    {
                        'mode',
                        fmt = function(str)
                            return str:sub(1, 3)
                        end,
                    },
                },
                lualine_b = {
                    {
                        'branch',
                        separator = { right = '' },
                    },
                },
                lualine_c = { 'diff', 'diagnostics', 'filename' },
                lualine_x = { 'encoding', 'fileformat', 'filetype' },
                lualine_y = {
                    {
                        'progress',
                        separator = { left = '' },
                    },
                },
                lualine_z = { 'location' },
            },

            inactive_sections = {
                lualine_a = {},
                lualine_b = {},
                lualine_c = { 'filename' },
                lualine_x = { 'location' },
                lualine_y = {},
                lualine_z = {},
            },

            winbar = {
                lualine_a = {},
                lualine_b = {},
                lualine_c = {
                    {
                        'filename',
                        path = 4,
                        color = { fg = a.base.gui, bg = 'NONE' },
                    },
                    {
                        'navic',
                        color = { fg = a.minus1.gui, bg = 'NONE' },
                        color_correction = nil,
                        navic_opts = nil,
                    },
                },
                lualine_x = {},
                lualine_y = {},
                lualine_z = {},
            },

            inactive_winbar = {
                lualine_a = {},
                lualine_b = {},
                lualine_c = {
                    {
                        'filename',
                        path = 4,
                        color = {
                            fg = a.minus2.gui,
                            bg = 'NONE',
                        },
                    },
                },
                lualine_x = {},
                lualine_y = {},
                lualine_z = {},
            },
        })
    end,
}

return M
