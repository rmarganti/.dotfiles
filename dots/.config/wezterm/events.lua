local wezterm = require('wezterm')
local action = wezterm.action

local colors = require('colors')
local utils = require('utils')

local M = {}

-- A list of processes that should capture the the
-- pane-management key binds instead of Wezterm.
local prioritized_processes = {
    'nvim',
    'k9s',
}

-- Determine if the foreground process should capture the key strokes.
local function is_prioritized_process(pane)
    -- get_foreground_process_name On Linux, macOS and Windows,
    -- the process can be queried to determine this path. Other operating systems
    -- (notably, FreeBSD and other unix systems) are not currently supported
    local process_name = pane:get_foreground_process_name()

    if process_name == nil then
        return false
    end

    for _, name in ipairs(prioritized_processes) do
        if process_name:find(name) ~= nil then
            return true
        end
    end

    return false
end

-- Send window navigation keys to priority processes if they
-- are actively focused. Otherwise, navigate Wezterm panes.
local function conditionally_activate_pane(window, pane, pane_direction, original_key)
    if is_prioritized_process(pane) then
        window:perform_action(action.SendKey({ key = original_key, mods = 'CTRL' }), pane)
    else
        window:perform_action(action.ActivatePaneDirection(pane_direction), pane)
    end
end

local function get_tab_label(tab)
    -- if the tab title is explicitly set, take that

    local title = tab.tab_title
    if title and #title > 0 then
        return title
    end

    -- Otherwise, use the current working directory of the active pane.

    local cwd = tab.active_pane.current_working_dir

    if cwd == nil then
        return '<unknown>'
    end

    local path_pieces = utils.string_split(cwd.path, '/')
    local label = path_pieces[#path_pieces]

    if label == nil then
        label = '<unknown>'
    end

    return label
end

M.attach = function()
    ------------------------------------------------
    -- Sets tab text to CWD of current pane.
    ------------------------------------------------

    wezterm.on('format-tab-title', function(tab)
        -- Info about current pane.
        local is_zoomed = tab.is_active and tab.active_pane.is_zoomed

        local tab_text = {
            Text = string.format('  %d: %s  ', tab.tab_index + 1, get_tab_label(tab)),
        }

        -- Show alternate colors to indicate the current pane is zoomed.
        if is_zoomed then
            return {
                { Foreground = { Color = colors.palette.cyan_bright.gui } },
                { Attribute = { Intensity = 'Bold' } },
                tab_text,
            }
        end

        return {
            tab_text,
        }
    end)

    ------------------------------------------------
    -- Put date in bottom-right corner.
    ------------------------------------------------

    wezterm.on('update-right-status', function(window)
        window:set_right_status(wezterm.format({
            { Foreground = { Color = colors.palette.bg_lightest.gui } },
            { Text = wezterm.strftime(' %A, %d %B %Y %I:%M %p ') },
        }))
    end)

    ------------------------------------------------
    -- Pane navigation.
    ------------------------------------------------

    wezterm.on('ActivatePaneDirection-right', function(window, pane)
        conditionally_activate_pane(window, pane, 'Right', 'l')
    end)

    wezterm.on('ActivatePaneDirection-left', function(window, pane)
        conditionally_activate_pane(window, pane, 'Left', 'h')
    end)

    wezterm.on('ActivatePaneDirection-up', function(window, pane)
        conditionally_activate_pane(window, pane, 'Up', 'k')
    end)

    wezterm.on('ActivatePaneDirection-down', function(window, pane)
        conditionally_activate_pane(window, pane, 'Down', 'j')
    end)

    ------------------------------------------------
    -- Rename a tab.
    ------------------------------------------------

    wezterm.on('RenameTab', function(window, pane)
        window:perform_action(
            action.PromptInputLine({
                description = 'Enter new name for tab',
                action = wezterm.action_callback(function(window2, _, line)
                    -- line will be `nil` if they hit escape without entering anything
                    -- An empty string if they just hit enter
                    -- Or the actual line of text they wrote
                    if line then
                        window2:active_tab():set_title(line)
                    end
                end),
            }),
            pane
        )
    end)
end

return M
