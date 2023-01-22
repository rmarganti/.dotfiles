-- Patterns for matching related files

return {
    ------------------------------------------------
    -- PHP
    ------------------------------------------------

    -- unit test -> class
    {
        pattern = '/tests/Unit/(.*)/(.*)Test.php$',
        target = '/src/%1/%2.php',
        context = 'unit test',
    },

    -- class -> unit test
    {
        pattern = '/src/(.*)/(.*).php$',
        target = '/tests/Unit/%1/%2Test.php',
        context = 'unit test',
    },

    ------------------------------------------------
    -- Laravel
    ------------------------------------------------

    -- controller integration test -> controller
    {
        pattern = '/tests/integration/Http/Controllers/ApiV1/(.*)Test.php$',
        target = '/app/Http/Controllers/ApiV1/%1.php',
        context = 'unit test',
    },

    -- controller -> controller integration test
    {
        pattern = '/app/Http/Controllers/ApiV1/(.*).php$',
        target = '/tests/integration/Http/Controllers/ApiV1/%1Test.php',
        context = 'unit test',
    },

    -- unit test -> class
    {
        pattern = '/app/(.*)/(.*).php$',
        target = '/tests/unit/%1/%2Test.php',
        context = 'unit test',
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
        pattern = '/(.*)/(.*).spec.ts$',
        target = '/%1/%2.ts',
        context = 'tested file',
    },

    -- class -> unit test
    {
        pattern = '/(.*)/(.*).ts$',
        target = '/%1/%2.spec.ts',
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

    -- class -> unit test
    {
        pattern = '/(.*)/(.*).go$',
        target = '/%1/%2_test.go',
        context = 'unit test',
    },
}
