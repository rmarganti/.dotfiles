local M = {
    'dmtrKovalenko/fff.nvim',
    build = function()
        -- downloads a prebuilt binary or falls back to cargo build
        require('fff.download').download_or_build_binary()
    end,
    -- for nixos:
    -- build = "nix run .#release",
    opts = {
        debug = {
            enabled = false,
            show_scores = false,
        },
        hl = {
            normal = 'FFFNormal',
            border = 'FFFBorder',
            title = 'FFFTitle',
        },
    },
    lazy = false, -- the plugin lazy-initializes itself
    config = function(_, opts)
        require('fff').setup(opts)
    end,
}

return M
