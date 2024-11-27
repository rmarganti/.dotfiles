return {
    'MeanderingProgrammer/render-markdown.nvim',
    dependencies = { 'nvim-treesitter/nvim-treesitter' },
    opts = {
        file_types = { 'markdown', 'Avante' },
        heading = { enabled = false },
        bullet = {
            enabled = true,
            icons = { '•', '◦', '•', '◦' },
        },
        code = {
            sign = false,
        },
    },
    ft = { 'markdown', 'Avante' },
}
