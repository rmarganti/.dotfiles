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

    -- Move tab left (<).
    { key = ',', mods = 'SUPER', action = action.MoveTabRelative(-1) },

    -- Move tab right (>).
    { key = '.', mods = 'SUPER', action = action.MoveTabRelative(1) },

    -- Close tab.
    {
        key = 'w',
        mods = 'SUPER',
        action = action.CloseCurrentTab({ confirm = true }),
    },

    -- Activate tab by index.
    { key = '1', mods = 'SUPER', action = action.ActivateTab(0) },
    { key = '2', mods = 'SUPER', action = action.ActivateTab(1) },
    { key = '3', mods = 'SUPER', action = action.ActivateTab(2) },
    { key = '4', mods = 'SUPER', action = action.ActivateTab(3) },
    { key = '5', mods = 'SUPER', action = action.ActivateTab(4) },
    { key = '6', mods = 'SUPER', action = action.ActivateTab(5) },
    { key = '7', mods = 'SUPER', action = action.ActivateTab(6) },
    { key = '8', mods = 'SUPER', action = action.ActivateTab(7) },
    { key = '9', mods = 'SUPER', action = action.ActivateTab(8) },

    ------------------------------------------------
    -- Panes
    ------------------------------------------------

    {
        key = '\\',
        mods = 'LEADER',
        action = action.SplitHorizontal({ domain = 'CurrentPaneDomain' }),
    },
    {
        key = '-',
        mods = 'LEADER',
        action = action.SplitVertical({ domain = 'CurrentPaneDomain' }),
    },

    -- Navigate panes.
    { key = 'h', mods = 'CTRL', action = action.EmitEvent('ActivatePaneDirection-left') },
    { key = 'j', mods = 'CTRL', action = action.EmitEvent('ActivatePaneDirection-down') },
    { key = 'k', mods = 'CTRL', action = action.EmitEvent('ActivatePaneDirection-up') },
    { key = 'l', mods = 'CTRL', action = action.EmitEvent('ActivatePaneDirection-right') },

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

    -- Swap panes.
    { key = 's', mods = 'LEADER', action = action.PaneSelect({ mode = 'SwapWithActive' }) },

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
        action = action.ClearScrollback('ScrollbackAndViewport'),
    },

    -- Search
    { key = '/', mods = 'LEADER', action = action.Search({ CaseSensitiveString = '' }) },

    -- Page up/down.
    { key = 'u', mods = 'CTRL|SHIFT', action = action.ScrollByPage(-0.75) },
    { key = 'd', mods = 'CTRL|SHIFT', action = action.ScrollByPage(0.75) },

    { key = 'l', mods = 'SUPER', action = action.ShowLauncher },
}
