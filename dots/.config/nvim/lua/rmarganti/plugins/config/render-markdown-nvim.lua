-- Used for both configuring and lazy-loading the plugin
local file_types = { 'markdown', 'Avante', 'codecompanion' }

return {
    'MeanderingProgrammer/render-markdown.nvim',
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    opts = {
        file_types = file_types,
        heading = { enabled = false },
        bullet = {
            enabled = true,
            icons = { '•', '◦', '•', '◦' },
        },
        code = {
            sign = false,
        },
    },
    ft = file_types,
}
