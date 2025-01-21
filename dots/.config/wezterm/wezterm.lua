local wezterm = require('wezterm')

local colors = require('colors')
local events = require('events')
local keys = require('keys')

events.attach()

return {
    ------------------------------------------------
    --
    -- Fonts
    --
    ------------------------------------------------

    font = wezterm.font('JetBrainsMono Nerd Font Mono'),
    font_size = 14.5,

    ------------------------------------------------
    --
    -- App window
    --
    ------------------------------------------------

    window_decorations = 'RESIZE',

    window_padding = {
        left = 12,
        right = 12,
        top = 12,
        bottom = 12,
    },

    ------------------------------------------------
    --
    -- Panes
    --
    ------------------------------------------------

    inactive_pane_hsb = {
        saturation = 0.5,
        brightness = 1.25,
    },

    ------------------------------------------------
    --
    -- Tab bar
    --
    ------------------------------------------------

    tab_bar_at_bottom = true,
    use_fancy_tab_bar = false,
    tab_max_width = 32,

    window_frame = {
        active_titlebar_bg = colors.palette.bg_dark.gui,
        inactive_titlebar_bg = colors.palette.bg_dark.gui,
    },

    ------------------------------------------------
    --
    -- Color
    --
    ------------------------------------------------

    colors = colors.config,

    ------------------------------------------------
    --
    -- Keybindings
    --
    ------------------------------------------------

    disable_default_key_bindings = true,
    leader = { key = 'Space', mods = 'CTRL', timeout_milliseconds = 1000 },
    keys = keys,

    ------------------------------------------------
    --
    -- Misc.
    --
    ------------------------------------------------

    audible_bell = 'Disabled',

    visual_bell = {
        fade_in_duration_ms = 75,
        fade_out_duration_ms = 75,
        target = 'CursorColor',
    },

    quick_select_patterns = {
        -- Jira tickets
        'ADREV-\\d{3,5}',
        'APPOPS-\\d{3,5}',
        'CH-\\d{3,5}',
        'GCCDEV-\\d{3,5}',

        -- Versions
        '[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}(?:-beta[0-9]?)?',

        -- PHPUnit test names
        '[A-Za-z]+::test[A-Za-z_]+',

        -- Git-recommended commands
        'git branch -D [A-Za-z0-9_.-]+',
    },

    -- Disable hyperlinks
    hyperlink_rules = {},

    prefer_to_spawn_tabs = true,
}
