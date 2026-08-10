local ls = require('luasnip')

return {
    ls.snippet({ trig = 'eg', name = 'Effect.gen()' }, {
        ls.text_node({ 'Effect.gen(function*() {', '    ' }),
        ls.insert_node(0),
        ls.text_node({ '', '})' }),
    }),
    ls.snippet({ trig = 'egt', name = 'Effect.gen(this, ...)' }, {
        ls.text_node({ 'Effect.gen(this, function*() {', '    ' }),
        ls.insert_node(0),
        ls.text_node({ '', '})' }),
    }),
}
