-- Support JSONC.
vim.filetype.add({
    filename = {
        -- NRWL NX project config
        ['project.json'] = function(_, bufnr)
            local content = table.concat(vim.api.nvim_buf_get_lines(bufnr, 0, -1, false), '\n')

            if string.find(content, 'nx/schemas/project-schema.json', 1, true) == nil then
                return 'json'
            else
                return 'jsonc'
            end
        end,
        ['tsconfig.json'] = 'jsonc',
        ['composer.lock'] = 'json',
    },
    pattern = {
        ['tsconfig.*.json'] = 'jsonc',
    },
})