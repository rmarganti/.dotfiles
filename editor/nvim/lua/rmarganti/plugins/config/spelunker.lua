-- Code spell-checking.
local M = {
    'kamykn/spelunker.vim',
    dependencies = {
        { 'kamykn/popup-menu.nvim' },
    },
    event = 'VeryLazy',
}

function M.init()
    vim.g.spelunker_check_type = 2
    vim.g.spelunker_spell_bad_group = 'SpellBad'
    vim.g.spelunker_complex_or_compound_word_group = 'SpellBad'
end

return M
