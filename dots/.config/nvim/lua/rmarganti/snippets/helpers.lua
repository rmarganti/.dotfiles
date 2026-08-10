local ls = require('luasnip')

local M = {}

function M.comment_block(comment, separator)
    separator = separator or (comment .. ' ' .. string.rep('-', 64 - #comment - 1))

    return ls.snippet({ trig = 'cb', name = 'Comment block' }, {
        ls.text_node({ separator, comment .. ' ' }),
        ls.insert_node(1),
        ls.text_node({ '', separator, '' }),
        ls.insert_node(0),
    })
end

function M.comment_line(opening, closing)
    return ls.snippet({ trig = 'cl', name = 'Comment line' }, {
        ls.text_node(opening),
        ls.insert_node(1),
        ls.text_node(closing),
        ls.function_node(function(args)
            local label = args[1][1] or ''
            local used = vim.fn.strdisplaywidth(opening .. label .. closing)
            return string.rep('-', math.max(0, 64 - used))
        end, { 1 }),
        ls.text_node({ '', '' }),
        ls.insert_node(0),
    })
end

return M
