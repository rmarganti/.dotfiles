-- Support JSONC.
vim.filetype.add({
    extension = {
        hurl = 'hurl',
        mermaid = 'mermaid',
        mjml = 'mjml',
    },
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
        ['go.sum'] = 'gosum',
    },
    pattern = {
        ['~/.kube/config'] = 'yaml',
        ['tsconfig.*.json'] = 'jsonc',
    },
})
