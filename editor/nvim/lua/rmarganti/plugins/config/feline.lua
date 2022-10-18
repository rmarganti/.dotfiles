local M = {}

M.config = function()
    local feline = require('feline')
    local vi_mode_utils = require('feline.providers.vi_mode')
    local navic = require('nvim-navic')
    local p = require('rmarganti.colors.palette')

    local vi_mode_colors = {
        NORMAL = p.green.gui,
        OP = p.red.gui,
        INSERT = p.red.gui,
        VISUAL = p.yellow.gui,
        LINES = p.yellow.gui,
        BLOCK = p.yellow.gui,
        REPLACE = p.magenta.gui,
        ['V-REPLACE'] = p.magenta.gui,
        ENTER = p.cyan.gui,
        MORE = p.cyan.gui,
        SELECT = p.blue.gui,
        COMMAND = p.green.gui,
        SHELL = p.green.gui,
        TERM = p.green.gui,
        NONE = p.gray1.gui,
    }

    local pieces = {
        vim_mode = {
            provider = '▊ ',
            hl = function()
                return {
                    name = vi_mode_utils.get_mode_highlight_name(),
                    fg = vi_mode_utils.get_mode_color(),
                    style = 'bold',
                }
            end,
        },

        duck = {
            provider = ' ',
        },

        file_format = {
            provider = function()
                local os = vim.bo.fileformat:lower()

                if os == 'unix' then
                    return ' '
                elseif os == 'mac' then
                    return ' '
                else
                    return ' '
                end
            end,
            left_sep = '  ',
        },

        file_encoding = {
            provider = 'file_encoding',
            right_sep = '  ',
        },

        file_info_inactive = {
            provider = 'file_info',
            left_sep = '       ',
            right_sep = ' ',
        },

        file_type = {
            provider = 'file_type',
            hl = {
                fg = p.gray2.gui,
                bg = p.bg_lighter.gui,
            },
            left_sep = {
                str = '  ',
                hl = { bg = p.bg_lighter.gui },
            },
            right_sep = {
                str = '  ',
                hl = { bg = p.bg_lighter.gui },
            },
        },

        git_branch = {
            provider = 'git_branch',
            hl = {
                bg = p.none.gui,
                style = 'bold',
            },
            left_sep = {
                str = '  ',
                hl = { bg = p.none.gui, fg = p.bg_light.gui },
            },
            right_sep = {
                str = '  ',
                hl = { bg = p.none.gui, fg = p.bg_light.gui },
            },
        },

        github_notifications = {
            provider = function()
                local data =
                    require('github-notifications').statusline_notifications()
                if data.count > 0 then
                    return data.icon .. ' ' .. tostring(data.count)
                else
                    return ''
                end
            end,
            hl = {
                fg = p.blue.gui,
            },
            left_sep = ' ',
            right_sep = ' ',
        },

        line_percentage = {
            provider = 'line_percentage',
            hl = function()
                return {
                    bg = p.bg_lightest.gui,
                    fg = vi_mode_utils.get_mode_color(),
                    style = 'bold',
                }
            end,
            left_sep = {
                hl = { bg = p.bg_lightest.gui },
                str = '  ',
            },
            right_sep = {
                hl = { bg = p.bg_lightest.gui },
                str = '  ',
            },
        },

        scroll_bar = {
            provider = 'scroll_bar',
            hl = function()
                return {
                    bg = p.bg_lightest.gui,
                    fg = vi_mode_utils.get_mode_color(),
                    style = 'bold',
                }
            end,
        },

        file_info_winbar = {
            provider = {
                name = 'file_info',
                opts = {
                    colored_icon = false,
                },
            },
            left_sep = {
                str = ' ',
                hl = { bg = p.none.gui },
            },
            hl = {
                bg = p.none.gui,
                fg = p.gray3.gui,
                style = 'bold',
            },
        },

        breadcrumbs = {
            provider = function()
                return navic.get_location()
            end,
            enabled = function()
                return navic.is_available()
            end,
            left_sep = {
                str = ' > ',
                hl = {
                    bg = p.none.gui,
                    fg = p.black_bright.gui,
                },
            },
            hl = {
                bg = p.none.gui,
                fg = p.black_bright.gui,
            },
        },
    }

    ------------------------------------------------
    --
    -- Status bar
    --
    ------------------------------------------------

    local status_bar_pieces = {
        {
            pieces.vim_mode,
            pieces.duck,
            pieces.git_branch,
            -- Empty component to clear styles.
            { hl = { bg = p.bg_light.gui, fg = p.bg_light.gui } },
        },
        {
            pieces.github_notifications,
            pieces.file_format,
            pieces.file_encoding,
            pieces.file_type,
            pieces.line_percentage,
            -- Empty component to clear styles.
            { hl = { bg = p.bg_light.gui, fg = p.bg_light.gui } },
        },
    }

    feline.setup({
        components = {
            active = status_bar_pieces,
            inactive = status_bar_pieces,
        },
        vi_mode_colors = vi_mode_colors,
        theme = {
            bg = p.bg_light.gui,
            fg = p.gray1.gui,
        },
    })

    ------------------------------------------------
    --
    -- Win bar
    --
    ------------------------------------------------

    feline.winbar.setup({
        components = {
            active = {
                {
                    pieces.file_info_winbar,
                    pieces.breadcrumbs,
                },
            },
            inactive = {
                {
                    pieces.file_info_winbar,
                },
            },
        },

        disable = {
            filetypes = {
                '^NvimTree$',
                '^packer$',
                '^startify$',
                '^fugitive$',
                '^fugitiveblame$',
                '^qf$',
                '^help$',
            },
            buftypes = {
                '^terminal$',
            },
            bufnames = {},
        },
    })
end

return M
