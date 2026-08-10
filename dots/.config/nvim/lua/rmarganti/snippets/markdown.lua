local ls = require('luasnip')

return {
    ls.snippet({ trig = 'jl', name = 'Jira link' }, {
        ls.text_node('['),
        ls.insert_node(1),
        ls.text_node('](https://usatodayco.atlassian.net/browse/'),
        ls.function_node(function(args)
            return args[1][1] or ''
        end, { 1 }),
        ls.text_node(')'),
    }),
}
