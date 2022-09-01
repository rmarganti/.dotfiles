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

    font = wezterm.font 'JetBrainsMono Nerd Font',
    font_size = 14.5,

    ------------------------------------------------
    --
    -- App window
    --
    ------------------------------------------------
    window_decorations = "RESIZE",

    window_padding = {
        left = 4,
        right = 4,
        top = 4,
        bottom = 4,
    },

    ------------------------------------------------
    --
    -- Panes
    --
    ------------------------------------------------

    inactive_pane_hsb = {
        saturation = 0.5,
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

    unix_domains = {
        { name = 'unix' },
    },

    -- This causes `wezterm` to act as though it was started as
    -- `wezterm connect unix` by default, connecting to the unix
    -- domain on startup.
    -- If you prefer to connect manually, leave out this line.
    default_gui_startup_args = { 'connect', 'unix' },
}
