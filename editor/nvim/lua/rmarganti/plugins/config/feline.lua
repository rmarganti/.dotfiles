local M = {}

M.setup = function()
    local theme = require('rmarganti.colors.palette')
    local vi_mode_utils = require('feline.providers.vi_mode')

    local vi_mode_colors = {
        NORMAL = theme.green,
        OP = theme.red,
        INSERT = theme.red,
        VISUAL = theme.yellow,
        LINES = theme.yellow,
        BLOCK = theme.yellow,
        REPLACE = theme.purple,
        ['V-REPLACE'] = theme.magenta,
        ENTER = theme.cyan,
        MORE = theme.cyan,
        SELECT = theme.blue,
        COMMAND = theme.green,
        SHELL = theme.green,
        TERM = theme.green,
        NONE = theme.grey1
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
            provider = ' '
        },

        file_info_active = {
            provider = 'file_info',
            hl = {
                bg = theme.none,
                style = 'bold',
            },
            left_sep = {
                str = '  ',
                hl = { bg = theme.none, fg = theme.bg0 },
            },
            right_sep = {
                str = ' ',
                hl = { bg = theme.none, fg = theme.bg0 },
            },
        },

        file_info_inactive = {
            provider = 'file_info',
            left_sep = '       ',
            right_sep = ' ',
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
            left_sep = ' ',
        },

        file_encoding = {
            provider = 'file_encoding',
            right_sep = '  ',
        },

        file_type = {
            provider = 'file_type',
            hl = {
                bg = theme.bg1,
            },
            left_sep = {
                str = '  ',
                hl = { bg = theme.bg1 },
            },
            right_sep = {
                str = '  ',
                hl = { bg = theme.bg1 },
            },
        },

        git_branch = {
            provider = 'git_branch',
            left_sep = '  ',
        },

        github_notifications = {
            provider = function()
                local data = require('github-notifications').statusline_notifications()
                if data.count > 0 then
                    return data.icon .. ' ' .. tostring(data.count)
                else
                    return ''
                end
            end,
            hl = {
                fg = theme.blue,
            },
            left_sep = ' ',
            right_sep = ' ',
        },

        scroll_bar = {
            provider = 'scroll_bar',
            hl = function()
                return {
                    bg = theme.bg3,
                    fg = vi_mode_utils.get_mode_color(),
                    style = 'bold'
                }
            end
        }
    }

    local components = {
        active = {
            {
                pieces.vim_mode,
                pieces.duck,
                pieces.file_info_active,
                pieces.git_branch,
                {}, -- empty componet to clear styles
            },
            {
                pieces.github_notifications,
                pieces.file_format,
                pieces.file_encoding,
                pieces.file_type,
                pieces.scroll_bar,
            }
        },
        inactive = {
            {
                pieces.file_info_inactive,
                {}, -- empty componet to clear styles
            }
        }
    }

    require('feline').setup({
        components = components,
        colors = {
            bg = theme.bg0,
            fg = theme.grey1,
        },
        vi_mode_colors = vi_mode_colors,
    })
end

return M
