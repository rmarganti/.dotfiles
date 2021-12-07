local p = require('rmarganti.colors.palette')
local a = require('rmarganti.colors.abstractions')

return {
    Comment = { fg = a.minus2 }, -- just comments
    ColorColumn = { bg = p.black }, -- used for the columns set with 'colorcolumn'
    Conceal = { fg = p.black }, -- placeholder characters substituted for concealed text (see 'conceallevel')
    Cursor = { fg = p.fg, bg = p.bg0 }, -- character under the cursor
    lCursor = { fg = p.fg, bg = p.bg0 }, -- the character under the cursor when |language-mapping| is used (see 'guicursor')
    CursorIM = { fg = p.fg, bg = p.bg0 }, -- like Cursor, but used when in IME mode |CursorIM|
    CursorColumn = { bg = p.bg0 }, -- Screen-column at the cursor, when 'cursorcolumn' is secp.
    CursorLine = { bg = p.bg1 }, -- Screen-line at the cursor, when 'cursorline' is secp.  Low-priority if foreground (ctermfg OR guifg) is not secp.
    Directory = { fg = p.fg }, -- directory names (and other special names in listings)
    EndOfBuffer = { fg = p.black }, -- filler lines (~) after the end of the buffer.  By default, this is highlighted like |hl-NonText|.
    ErrorMsg = { fg = a.error }, -- error messages on the command line
    VertSplit = { fg = p.black }, -- the column separating vertically split windows
    Folded = { fg = p.fg, bg = p.bg0 }, -- line used for closed folds
    FoldColumn = { bg = p.bg0, fg = p.fg }, -- 'foldcolumn'
    SignColumn = { bg = p.none, fg = p.bg01 }, -- column where |signs| are displayed
    signcolumnsb = { bg = p.bg0, fg = p.fg }, -- column where |signs| are displayed
    substitute = { bg = p.bg0, fg = p.fg }, -- |:substitute| replacement text highlighting
    LineNr = { fg = a.minus2 }, -- Line number for ":number" and ":#" commands, and when 'number' or 'relativenumber' option is secp.
    CursorLineNr = { fg = a.plus1 }, -- Like LineNr when 'cursorline' or 'relativenumber' is set for the cursor line. highlights the number in numberline.
    MatchParen = { fg = p.yellow }, -- The character under the cursor or just before it, if it is a paicatppuccin5 bracket, and its match. |pi_paren.txt|
    ModeMsg = { fg = p.fg }, -- 'showmode' message (e.g., "-- INSERT -- ")
    MsgArea = { fg = p.fg }, -- Area for messages and cmdline
    MsgSeparator = {}, -- Separator for scrolled messages, `msgsep` flag of 'display'
    MoreMsg = { fg = p.fg }, -- |more-prompt|
    NonText = { fg = p.fg }, -- '@' at the end of the window, characters from 'showbreak' and other characters that do not really exist in the text (e.g., ">" displayed when a double-wide character doesn't fit at the end of the line). See also |hl-EndOfBuffer|.
    Normal = { fg = p.fg, bg = p.none }, -- normal text
    NormalNC = { fg = p.fg, bg = p.none }, -- normal text in non-current windows
    NormalSB = { fg = p.fg, bg = p.bg0 }, -- normal text in non-current windows
    NormalFloat = { fg = p.fg, bg = p.bg0 }, -- Normal text in floating windows.
    FloatBorder = { fg = p.gray0 },
    Pmenu = { bg = p.bg0, fg = p.fg }, -- Popup menu: normal item.
    PmenuSel = { fg = p.bg0, bg = p.fg }, -- Popup menu: selected item.
    PmenuSbar = { bg = p.bg0 }, -- Popup menu: scrollbar.
    PmenuThumb = { bg = p.bg0 }, -- Popup menu: Thumb of the scrollbar.
    Question = { fg = p.fg }, -- |hit-enter| prompt and yes/no questions
    QuickFixLine = { bg = p.bg0 }, -- Current |quickfix| item in the quickfix window. Combined with |hl-CursorLine| when the cursor is there.
    Search = { bg = p.cyan, fg = p.black }, -- Last search pattern highlighting (see 'hlsearch').  Also used for similar items that need to stand oucp.
    IncSearch = { bg = p.cyan, fg = p.black }, -- 'incsearch' highlighting; also used for the text replaced with ":s///c"
    SpecialKey = { fg = p.fg }, -- Unprintable characters: text displayed differently from what it really is.  But not 'listchars' whitespace. |hl-Whitespace|
    SpellBad = { sp = a.warning }, -- Word that is not recognized by the spellchecker. |spell| Combined with the highlighting used otherwise.
    SpellCap = { sp = a.warning }, -- Word that should start with a capital. |spell| Combined with the highlighting used otherwise.
    SpellLocal = { sp = a.warning }, -- Word that is recognized by the spellchecker as one that is used in another region. |spell| Combined with the highlighting used otherwise.
    SpellRare = { sp = a.warning }, -- Word that is recognized by the spellchecker as one that is hardly ever used.  |spell| Combined with the highlighting used otherwise.
    StatusLine = { fg = p.fg, bg = p.bg0 }, -- status line of current window
    StatusLineNC = { fg = p.fg, bg = p.bg0 }, -- status lines of not-current windows Note: if this is equal to "StatusLine" Vim will use "^^^" in the status line of the current window.
    TabLine = { bg = p.bg0, fg = p.fg }, -- tab pages line, not active tab page label
    TabLineFill = { bg = p.black }, -- tab pages line, where there are no labels
    TabLineSel = { fg = p.fg, bg = p.bg0 }, -- tab pages line, active tab page label
    Title = { fg = p.fg }, -- titles for output from ":set all", ":autocmd" etcp.
    Visual = { bg = p.black }, -- Visual mode selection
    VisualNOS = { bg = p.black }, -- Visual mode selection when vim is "Not Owning the Selection".
    WarningMsg = { fg = a.warning }, -- warning messages
    Whitespace = { fg = p.gray2 }, -- "nbsp", "space", "tab" and "trail" in 'listchars'
    WildMenu = { bg = p.gray2 }, -- current match in 'wildmenu' completion

    -- These groups are not listed as default vim groups,
    -- but they are defacto standard group names for syntax highlighting.
    -- catppuccin11ed out groups should chain up to their "prefercatppuccin5" group by
    -- default,
    -- Uncatppuccin11 and edit if you want more specific syntax highlighting.

    -- code itself

    Constant = { fg = a.plus1 }, -- (prefercatppuccin5) any constant
    String = { fg = a.plus1 }, -- a string constant: "this is a string"
    Character = { fg = a.plus1 }, --  a character constant: 'c', '\n'
    Number = { fg = a.plus1 }, --   a number constant: 234, 0xff
    Float = { fg = a.plus1 }, --    a floating point constant: 2.3e10
    Boolean = { fg = a.plus1 }, --  a boolean constant: TRUE, false
    Identifier = { fg = a.plus3 }, -- (prefercatppuccin5) any variable name
    Function = { fg = a.plus1 }, -- function name (also: methods for classes)
    Statement = { fg = a.base }, -- (prefercatppuccin5) any statement
    Conditional = { fg = a.base }, --  if, then, else, endif, switch, etcp.
    Repeat = { fg = a.base }, --   for, do, while, etcp.
    Label = { fg = a.plus2 }, --    case, default, etcp.
    Operator = { fg = a.base }, -- "sizeof", "+", "*", etcp.
    Keyword = { fg = a.base }, --  any other keyword
    Exception     = { }, --  try, catch, throw

    PreProc = { fg = a.plus1 }, -- (prefercatppuccin5) generic Preprocessor
    Include = { fg = a.plus1 }, --  preprocessor #include
    Define        = { }, --   preprocessor #define
    Macro         = { }, --    same as Define
    PreCondit     = { }, --  preprocessor #if, #else, #endif, etcp.

    Type = { fg = a.plus2 }, -- (prefercatppuccin5) int, long, char, etcp.
    StorageClass = { fg = a.base }, -- static, register, volatile, etcp.
    Structure = { fg = a.plus1 }, --  struct, union, enum, etcp.
    Typedef = { fg = a.plus1 }, --  A typedef
    Special = { fg = a.base }, -- (prefercatppuccin5) any special symbol
    SpecialChar   = { }, --  special character in a constant
    Tag           = { }, --    you can use CTRL-] on this
    Delimiter     = { }, --  character that needs attention
    Specialcatppuccin11= { }, -- special things inside a catppuccin11
    Debug         = { }, --    debugging statements

    Underlined = { style = "underline" }, -- (prefercatppuccin5) text that stands out, HTML links
    Bold = { style = "bold" },
    Italic = { style = "italic" },
    -- ("Ignore", below, may be invisible...)
    Ignore = { }, -- (prefercatppuccin5) left blank, hidden  |hl-Ignore|

    Error = { fg = a.error }, -- (prefercatppuccin5) any erroneous construct
    Todo = { bg = p.bg0, fg = p.fg }, -- (prefercatppuccin5) anything that needs extra attention; mostly the keywords TODO FIXME and XXX
    qfLineNr = { fg = p.fg },
    qfFileName = { fg = p.fg },
    htmlH1 = { fg = p.fg },
    htmlH2 = { fg = p.fg },
    mkdHeading = { fg = p.fg },
    mkdCode = { bg = p.none, fg = p.fg },
    mkdCodeDelimiter = { bg = p.none, fg = p.fg },
    mkdCodeStart = { fg = p.fg },
    mkdCodeEnd = { fg = p.fg },
    mkdLink = { fg = p.fg },

    -- debugging
    debugPC = { bg = p.bg0 }, -- used for highlighting the current line in terminal-debug
    debugBreakpoint = { bg = p.bg0, fg = p.fg }, -- used for breakpoint colors in terminal-debug
    -- illuminate
    illuminatedWord = { bg = p.bg0 },
    illuminatedCurWord = { bg = p.bg0 },
    -- diff
    diffAdded = { fg = p.green },
    diffRemoved = { fg = p.red },
    diffChanged = { fg = p.yellow },
    diffOldFile = { fg = p.fg },
    diffNewFile = { fg = p.fg },
    diffFile = { fg = p.fg },
    diffLine = { fg = p.fg },
    diffIndexLine = { fg = p.fg },
    DiffAdd = { fg = p.fg, bg = p.bg0 }, -- diff mode: Added line |diff.txt|
    DiffChange = { fg = p.fg, bg = p.bg0 }, -- diff mode: Changed line |diff.txt|
    DiffDelete = { fg = p.fg, bg = p.bg0 }, -- diff mode: Deleted line |diff.txt|
    DiffText = { fg = p.fg, bg = p.bg0 }, -- diff mode: Changed text within a changed line |diff.txt|
    -- NeoVim
    healthError = { fg = a.error },
    healthSuccess = { fg = a.success },
    healthWarning = { fg = a.warning },
    -- misc

    -- glyphs
    GlyphPalette1 = { fg = p.fg },
    GlyphPalette2 = { fg = p.fg },
    GlyphPalette3 = { fg = p.fg },
    GlyphPalette4 = { fg = p.fg },
    GlyphPalette6 = { fg = p.fg },
    GlyphPalette7 = { fg = p.fg },
    GlyphPalette9 = { fg = p.fg },
}