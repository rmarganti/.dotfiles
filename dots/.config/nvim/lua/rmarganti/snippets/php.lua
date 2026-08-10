local ls = require('luasnip')
local h = require('rmarganti.snippets.helpers')

return {
    h.comment_block('//'),
    h.comment_line('// -[ ', ' ]'),
    ls.snippet({ trig = 'ali', name = 'App Log Info' }, {
        ls.text_node("app('log')->info("),
        ls.insert_node(0),
        ls.text_node(');'),
    }),
    ls.snippet({ trig = 'alje', name = 'App Log Info JSON Encode' }, {
        ls.text_node("app('log')->info(json_encode("),
        ls.insert_node(0),
        ls.text_node('));'),
    }),
    ls.snippet({ trig = 'nc', name = 'New Class' }, {
        ls.text_node({ '<?php', '', 'namespace A', '', 'class A', '{', '\tpublic function __construct()', '\t{', '\t}', '}' }),
    }),
    ls.snippet({ trig = 'putc', name = 'PHP Unit Test Class' }, {
        ls.text_node({ 'use Mockery as m;', '', 'class ' }),
        ls.function_node(function()
            local name = vim.fn.expand('%:t:r')
            return name ~= '' and name or 'ClassTest'
        end),
        ls.text_node({ ' extends PHPUnit_Framework_TestCase ', '{', '\tpublic function setUp(): void {}', '\t\t' }),
        ls.insert_node(0),
        ls.text_node({ '', '\t}', '}', '' }),
    }),
    ls.snippet({ trig = 'putf', name = 'PHP Unit Test Method' }, {
        ls.text_node('public function test_it_'),
        ls.insert_node(1),
        ls.text_node({ '(): void {', '\t' }),
        ls.insert_node(0, '// Do something'),
        ls.text_node({ '', '}', '' }),
    }),
}
