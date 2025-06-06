local a = require('rmarganti.colors.abstractions')
local p = require('rmarganti.colors.palette')

-- https://neovim.io/doc/user/treesitter.html#treesitter-highlight-groups

return {
    -- Misc

    -- ['@comment'] = {}, -- line and block comments
    ['@error'] = { fg = a.error }, -- syntax/parser errors
    -- ['@none'] = {}, -- completely disable the highlight
    -- ['@preproc'] = {}, -- various preprocessor directives & shebangs
    -- ['@define'] = {}, -- preprocessor definition directives
    -- ['@operator'] = {}, -- symbolic operators (e.g. `+` / `*`)

    -- Punctuation

    ['@punctuation.delimiter'] = { fg = a.minus1 }, -- delimiters (e.g. `;` / `.` / `,`)
    ['@punctuation.bracket'] = { fg = a.minus1 }, -- brackets (e.g. `()` / `{}` / `[]`)
    ['@punctuation.special'] = { fg = a.minus1 }, -- special symbols (e.g. `{}` in string interpolation)

    -- Literals

    -- ['@string'] = { fg = a.plus2 }, -- string literals
    -- ['@string.regex'] = {}, -- regular expressions
    ['@string.escape'] = { fg = a.minus1 }, -- escape sequences
    -- ['@string.special'] = {}, -- other special strings (e.g. dates)

    -- ['@character'] = {}, -- character literals
    -- ['@character.special'] = {}, -- special characters (e.g. wildcards)

    -- ['@boolean'] = {}, -- boolean literals
    -- ['@number'] = {}, -- numeric literals
    -- ['@float'] = {}, -- floating-point number literals

    -- Functions

    -- ['@function'] = { fg = a.plus3 }, -- function definitions
    ['@function.builtin'] = { fg = a.plus3 }, -- built-in functions
    -- ['@function.call'] = {}, -- function calls
    ['@function.macro'] = { fg = a.plus2 }, -- preprocessor macros
    -- ['@macro'] = {}, -- preprocessor macros

    -- ['@method'] = { fg = a.plus3 }, -- method definitions
    -- ['@method.call'] = {}, -- method calls

    ['@constructor'] = { fg = a.plus3 }, -- constructor calls and definitions.
    ['@parameter'] = { fg = a.plus4, italic = true }, -- parameters of a function

    -- Keywords

    -- ['@keyword'] = {}, -- various keywords
    -- ['@keyword.function'] = {}, -- keywords that define a function (e.g. `func` in Go, `def` in Python)
    -- ['@keyword.operator'] = {}, -- operators that are English words (e.g. `and` / `or`)
    -- ['@keyword.return'] = {}, -- keywords like `return` and `yield`

    -- ['@conditional'] = {}, -- keywords related to conditionals (e.g. `if` / `else`)
    -- ['@repeat'] = {}, -- keywords related to loops (e.g. `for` / `while`)
    -- ['@debug'] = {}, -- keywords related to debugging
    -- ['@label'] = {}, -- GOTO and other labels (e.g. `label:` in C)
    ['@include'] = { fg = a.minus1 }, -- keywords for including modules (e.g. `import` / `from` in Python)
    -- ['@exception'] = {}, -- keywords related to exceptions (e.g. `throw` / `catch`)

    -- Types

    -- ['@type'] = {}, -- type or class definitions and annotations
    -- ['@type.builtin'] = {}, -- built-in types
    -- ['@type.definition'] = {}, -- type definitions (e.g. `typedef` in C)
    ['@type.qualifier'] = { fg = a.minus1 }, -- type qualifiers (e.g. `const`)

    -- ['@storageclass'] = {}, -- visibility/life-time/etc. modifiers (e.g. `static`)
    ['@attribute'] = { fg = a.minus1 }, -- attribute annotations (e.g. Python decorators)
    ['@field'] = { fg = a.plus1 }, -- object and struct fields
    ['@property'] = { fg = a.plus1 }, -- similar to `@field`

    -- Identifiers

    ['@variable'] = { fg = a.plus4 }, -- various variable names
    ['@variable.builtin'] = { fg = a.plus4, italic = true }, -- built-in variable names (e.g. `this`)
    ['@variable.member'] = { fg = a.plus1, italic = true },

    -- ['@constant'] = { fg = a.plus4 }, -- constant identifiers
    -- ['@constant.builtin'] = {}, -- built-in constant values
    -- ['@constant.macro'] = {}, -- constants defined by the preprocessor

    ['@namespace'] = { fg = a.plus1 }, -- modules or namespaces
    ['@symbol'] = { fg = a.base }, -- symbols or atoms

    -- Text (Mainly for markup languages).

    -- ['@text'] = {}, -- non-structured text
    ['@text.strong'] = { bold = true }, -- bold text
    ['@text.emphasis'] = { italic = true }, -- text with emphasis
    ['@text.underline'] = { underline = true }, -- underlined text
    ['@text.strike'] = { fg = a.minus2 }, -- strikethrough text
    ['@text.title'] = { fg = a.plus3 }, -- text that is part of a title
    ['@text.literal'] = { fg = a.fg }, -- literal or verbatim text
    ['@text.uri'] = { fg = a.plus2, underdotted = true, sp = p.blue_darker }, -- URIs (e.g. hyperlinks)
    -- ['@text.math'] = {}, -- math environments (e.g. `$ ... $` in LaTeX)
    -- ['@text.environment'] = {}, -- text environments of markup languages
    -- ['@text.environment.name'] = {}, -- text indicating the type of an environment
    ['@text.reference'] = { fg = a.plus1, underline = true }, -- text references, footnotes, citations, etc.

    ['@text.todo'] = { fg = a.plus1 }, -- todo notes
    -- ['@text.note'] = {}, -- info notes
    -- ['@text.warning'] = {}, -- warning notes
    -- ['@text.danger'] = {}, -- danger/error notes

    -- Tags (Used for XML-like tags).

    ['@tag'] = { fg = a.plus3 }, -- XML tag names
    ['@tag.attribute'] = { fg = a.base }, -- XML tag attributes
    ['@tag.delimiter'] = { fg = a.minus1 }, -- XML tag delimiters

    -- Markup

    ['@markup'] = { fg = a.plus1 }, -- markup tags
    ['@markup.strong'] = { bold = true }, -- bold markup
    ['@markup.italic'] = { italic = true }, -- emphasized markup
    ['@markup.strikethrough'] = { fg = a.minus2 },

    -- Conceal

    -- ['@conceal'] = {}, -- for captures that are only used for concealing

    -- Spell

    -- ['@spell'] = {}, -- for defining regions to be spellchecked

    -- Non-standard
    -- These captures are used by some languages but don't have any default highlights. They fall back to the parent capture if they are not manually defined.

    -- ['@variable.global'] = {},

    -- Locals

    -- ['@definition'] = {}, -- various definitions
    -- ['@definition.constant'] = {}, -- constants
    -- ['@definition.function'] = {}, -- functions
    -- ['@definition.method'] = {}, -- methods
    -- ['@definition.var'] = {}, -- variables
    -- ['@definition.parameter'] = {}, -- parameters
    -- ['@definition.macro'] = {}, -- preprocessor macros
    -- ['@definition.type'] = {}, -- types or classes
    -- ['@definition.field'] = {}, -- fields or properties
    -- ['@definition.enum'] = {}, -- enumerations
    -- ['@definition.namespace'] = {}, -- modules or namespaces
    -- ['@definition.import'] = {}, -- imported names
    -- ['@definition.associated'] = {}, -- the associated type of a variable

    -- ['@scope'] = {}, -- scope block
    -- ['@reference'] = {}, -- identifier reference

    ------------------------------------------------
    -- PHP
    ------------------------------------------------

    ['@type.phpdoc'] = { fg = a.minus1 },
    ['@parameter.phpdoc'] = { fg = a.minus1 },
}
