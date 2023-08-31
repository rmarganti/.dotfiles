vim.opt.statuscolumn = [[%{(foldlevel(v:lnum) && foldlevel(v:lnum) > foldlevel(v:lnum - 1)) ? (foldclosed(v:lnum) == -1 ? '⌄' : '›') : ' '}]] -- Folds
    .. ' ' -- Spacer
    .. '%=%{v:virtnum < 1 ? (v:relnum ? v:relnum : v:lnum) : " "}' -- Line number
    .. '%s' -- Sign
