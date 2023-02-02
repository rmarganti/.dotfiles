-- Patterns for matching related files

return {
    ------------------------------------------------
    -- PHP
    ------------------------------------------------

    -- unit test -> class
    {
        pattern = '/tests/[Uu]nit/(.*)/(.*)Test.php$',
        target = '/src/%1/%2.php',
        context = 'unit test',
        condition = function()
            return vim.fn.isdirectory('src') == 1
        end,
    },

    -- class -> unit test
    {
        pattern = '/src/(.*)/(.*).php$',
        target = '/tests/unit/%1/%2Test.php',
        context = 'unit test',
    },

    ------------------------------------------------
    -- Laravel
    ------------------------------------------------

    -- controller integration test -> controller
    {
        pattern = '/tests/[Ii]ntegration/(.*)/(.*)ControllerTest.php$',
        target = '/app/%1/%2Controller.php',
        context = 'unit test',
        condition = function()
            return vim.fn.isdirectory('app') == 1
        end,
    },

    -- controller -> controller integration test
    {
        pattern = '/app/(.*)/(.*)Controller.php$',
        target = '/tests/integration/%1/%2ControllerTest.php',
        context = 'unit test',
    },

    -- unit test -> class
    {
        pattern = '/tests/unit/(.*)/(.*)Test.php$',
        target = '/app/%1/%2.php',
        context = 'unit test',
        condition = function()
            return vim.fn.isdirectory('app') == 1
        end,
    },

    -- class -> unit test
    {
        pattern = '/app/(.*)/(.*).php$',
        target = '/tests/unit/%1/%2Test.php',
        context = 'unit test',
    },

    ------------------------------------------------
    -- Typescript
    ------------------------------------------------

    -- unit test -> class
    {
        pattern = '/(.*)/(.*).spec.(tsx?)$',
        target = '/%1/%2.%3',
        context = 'tested file',
    },

    -- file -> unit test
    {
        pattern = '/(.*)/(.*).(tsx?)$',
        target = '/%1/%2.spec.%3',
        context = 'unit test',
    },

    ------------------------------------------------
    -- Go
    ------------------------------------------------

    -- unit test -> class
    {
        pattern = '/(.*)/(.*)_test.go$',
        target = '/%1/%2.go',
        context = 'tested file',
    },

    -- file -> unit test
    {
        pattern = '/(.*)/(.*).go$',
        target = '/%1/%2_test.go',
        context = 'unit test',
        condition = function()
            local filename = vim.fn.expand('%:t')
            return filename:find('_test.go') == nil
        end
    },
}
