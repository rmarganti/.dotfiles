lua << EOF
    package.loaded['rmarganti.colors.neverforest'] = nil

    require('rmarganti.colors.neverforest')
    vim.g.colors_name = 'neverforest'
EOF
