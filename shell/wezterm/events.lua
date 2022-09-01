local wezterm = require('wezterm')

local colors = require('colors')
local utils = require('utils')

local M = {}


M.attach = function()
    ------------------------------------------------
    --
    -- Sets tab text to CWD of current pane.
    --
    ------------------------------------------------
    wezterm.on(
        'format-tab-title',
        function(tab) -- , _tabs, panes, _config, _hover, _max_width)
            -- Info about current pane.
            local cwd = tab.active_pane.current_working_dir
            local is_zoomed = tab.is_active and tab.active_pane.is_zoomed

            -- Info about the current working directory.
            local path_pieces = utils.string_split(cwd, '/')
            local label = path_pieces[#path_pieces]

            if label == nil then
                label = '<unknown>'
            end

            local tab_text = {
                Text = string.format(
                    '  %d: %s  ',
                    tab.tab_index + 1,
                    label
                )
            }

            -- Show alternate colors to indicate the current pane is zoomed.
            if (is_zoomed) then
                return {
                    { Foreground = { Color = colors.palette.cyan.gui } },
                    -- { Background = { Color = colors.palette.cyan.gui } },
                    { Attribute = { Intensity = 'Bold' } },
                    tab_text,
                }
            end

            return {
                tab_text,
            }
        end
    )
end

return M
