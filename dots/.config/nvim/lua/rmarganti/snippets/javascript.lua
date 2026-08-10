local ls = require('luasnip')
local h = require('rmarganti.snippets.helpers')

return {
    h.comment_block('//'),
    h.comment_line('// -[ ', ' ]'),
    ls.snippet({ trig = 'clj', name = 'Console Log JSON' }, {
        ls.text_node('console.log(JSON.stringify('),
        ls.insert_node(1),
        ls.text_node(', null, 4));'),
    }),
}
