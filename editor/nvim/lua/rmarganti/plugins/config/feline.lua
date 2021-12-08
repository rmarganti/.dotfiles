local M = {}

M.setup = function()
    local p = require('rmarganti.colors.palette')
    local vi_mode_utils = require('feline.providers.vi_mode')

    local vi_mode_colors = {
        NORMAL = p.green,
        OP = p.red,
        INSERT = p.red,
        VISUAL = p.yellow,
        LINES = p.yellow,
        BLOCK = p.yellow,
        REPLACE = p.purple,
        ['V-REPLACE'] = p.magenta,
        ENTER = p.cyan,
        MORE = p.cyan,
        SELECT = p.blue,
        COMMAND = p.green,
        SHELL = p.green,
        TERM = p.green,
        NONE = p.grey1
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
                bg = p.none,
                style = 'bold',
            },
            left_sep = {
                str = '  ',
                hl = { bg = p.none, fg = p.bg_light },
            },
            right_sep = {
                str = ' ',
                hl = { bg = p.none, fg = p.bg_light },
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
                bg = p.bg_lighter,
            },
            left_sep = {
                str = '  ',
                hl = { bg = p.bg_lighter },
            },
            right_sep = {
                str = '  ',
                hl = { bg = p.bg_lighter },
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
                fg = p.blue,
            },
            left_sep = ' ',
            right_sep = ' ',
        },

        scroll_bar = {
            provider = 'scroll_bar',
            hl = function()
                return {
                    bg = p.bg_lightest,
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
            bg = p.bg_light,
            fg = p.grey0,
        },
        vi_mode_colors = vi_mode_colors,
    })
end

return M
