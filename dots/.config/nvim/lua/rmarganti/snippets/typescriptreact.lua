local ls = require('luasnip')

return {
    ls.snippet({ trig = 'rfc', name = 'React functional component' }, {
        ls.text_node('interface '),
        ls.insert_node(1, 'Component'),
        ls.text_node({ 'Props {', '    ' }),
        ls.insert_node(2),
        ls.text_node({ '', '}', '', 'export function ' }),
        ls.function_node(function(args)
            return args[1][1] or ''
        end, { 1 }),
        ls.text_node('({ '),
        ls.insert_node(3),
        ls.text_node(' }: '),
        ls.function_node(function(args)
            return args[1][1] or ''
        end, { 1 }),
        ls.text_node({ 'Props) {', '    return (', '        ' }),
        ls.insert_node(0),
        ls.text_node({ '', '    );', '};', '' }),
    }),
}
