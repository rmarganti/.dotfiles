-- Status line.
local M = {
    'feline-nvim/feline.nvim',
    dependencies = {
        { 'kyazdani42/nvim-web-devicons' },
        { 'SmiteshP/nvim-navic' },
    },
}

local function position_provider()
    local cursor_pos = vim.api.nvim_win_get_cursor(0)
    local row = cursor_pos[1]
    local col = cursor_pos[2]

    return string.format('%d:%d', col, row)
end

function M.config()
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
        NONE = p.gray_dark.gui,
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
                fg = p.gray.gui,
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
                local data = require('github-notifications').statusline_notifications()

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

        cursor_position = {
            provider = position_provider,
            hl = {
                bg = p.bg_lightest.gui,
                fg = p.gray.gui,
                style = 'bold',
            },
            left_sep = {
                hl = { bg = p.bg_lightest.gui },
                str = '  ',
            },
            right_sep = {
                hl = { bg = p.bg_lightest.gui },
                str = '  ',
            },
        },

        file_info_winbar = {
            provider = {
                name = 'file_info',
                opts = {
                    colored_icon = false,
                    type = 'unique',
                },
            },
            left_sep = {
                str = ' ',
                hl = { bg = p.none.gui },
            },
            hl = {
                bg = p.none.gui,
                fg = p.gray_light.gui,
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
                    fg = p.black_light.gui,
                },
            },
            hl = {
                bg = p.none.gui,
                fg = p.black_light.gui,
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
            pieces.cursor_position,
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
            fg = p.gray_dark.gui,
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
