local wezterm = require('wezterm')
local action = wezterm.action

return {
    ------------------------------------------------
    -- Tabs
    ------------------------------------------------

    -- Create new Tab.
    { key = 't', mods = 'SUPER', action = action.SpawnTab('CurrentPaneDomain') },

    -- Select previous tab.
    { key = 'Tab', mods = 'CTRL|SHIFT', action = action.ActivateTabRelative(-1) },

    -- Select next tab.
    { key = 'Tab', mods = 'CTRL', action = action.ActivateTabRelative(1) },

    -- Move tab left.
    { key = ',', mods = 'SUPER', action = action.MoveTabRelative(-1) },

    -- Move tab right.
    { key = '.', mods = 'SUPER', action = action.MoveTabRelative(1) },

    -- Close tab.
    { key = 'X', mods = 'LEADER', action = action.CloseCurrentTab({ confirm = true }) },
    { key = 'w', mods = 'SUPER', action = action.CloseCurrentTab({ confirm = true }) },

    -- Activate tab by index.
    { key = '1', mods = 'LEADER', action = action.ActivateTab(0) },
    { key = '2', mods = 'LEADER', action = action.ActivateTab(1) },
    { key = '3', mods = 'LEADER', action = action.ActivateTab(2) },
    { key = '4', mods = 'LEADER', action = action.ActivateTab(3) },
    { key = '5', mods = 'LEADER', action = action.ActivateTab(4) },
    { key = '6', mods = 'LEADER', action = action.ActivateTab(5) },
    { key = '7', mods = 'LEADER', action = action.ActivateTab(6) },
    { key = '8', mods = 'LEADER', action = action.ActivateTab(7) },
    { key = '9', mods = 'LEADER', action = action.ActivateTab(8) },

    ------------------------------------------------
    -- Panes
    ------------------------------------------------

    { key = '\\', mods = 'LEADER', action = action.SplitHorizontal({ domain = 'CurrentPaneDomain' }) },
    { key = '-', mods = 'LEADER', action = action.SplitVertical({ domain = 'CurrentPaneDomain' }) },

    -- Navigate panes.
    { key = 'h', mods = 'CTRL', action = action.ActivatePaneDirection('Left') },
    { key = 'l', mods = 'CTRL', action = action.ActivatePaneDirection('Right') },
    { key = 'k', mods = 'CTRL', action = action.ActivatePaneDirection('Up') },
    { key = 'j', mods = 'CTRL', action = action.ActivatePaneDirection('Down') },


    -- Resize panes.
    { key = 'H', mods = 'CTRL', action = action.AdjustPaneSize({ 'Left', 5 }) },
    { key = 'L', mods = 'CTRL', action = action.AdjustPaneSize({ 'Right', 5 }) },
    { key = 'K', mods = 'CTRL', action = action.AdjustPaneSize({ 'Up', 2 }) },
    { key = 'J', mods = 'CTRL', action = action.AdjustPaneSize({ 'Down', 2 }) },

    -- Toggle pane zoom.
    { key = 'z', mods = 'LEADER', action = action.TogglePaneZoomState },

    -- Close pane.
    { key = 'x', mods = 'LEADER', action = action.CloseCurrentPane({ confirm = true }) },

    -- Rotate panes.
    { key = '[', mods = 'LEADER', action = action.RotatePanes('CounterClockwise') },
    { key = ']', mods = 'LEADER', action = action.RotatePanes('Clockwise') },

    ------------------------------------------------
    -- Misc
    ------------------------------------------------

    -- Copy
    { key = 'c', mods = 'SUPER', action = action.CopyTo('Clipboard') },

    -- Paste
    { key = 'v', mods = 'SUPER', action = action.PasteFrom('Clipboard') },

    -- Quit
    { key = 'q', mods = 'SUPER', action = action.QuitApplication },

    -- Quick select.
    { key = 'q', mods = 'LEADER', action = action.QuickSelect },

    -- Copy mode.
    { key = 'c', mods = 'LEADER', action = action.ActivateCopyMode },

    -- Clear scrollback.
    {
        key = 'k',
        mods = 'SUPER',
        action = action.Multiple({
            action.ClearScrollback 'ScrollbackAndViewport',
            action.SendKey { key = 'L', mods = 'CTRL' },
        }),
    },
}
