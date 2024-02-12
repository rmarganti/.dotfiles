local p = require('rmarganti.colors.palette')
local a = require('rmarganti.colors.abstractions')

return {
    Comment = { fg = a.minus2, italic = true }, -- just comments
    ColorColumn = { bg = p.bg_darker }, -- used for the columns set with 'colorcolumn'
    Conceal = { fg = p.black }, -- placeholder characters substituted for concealed text (see 'conceallevel')
    Cursor = { fg = a.fg, bg = p.bg_light }, -- character under the cursor
    lCursor = { fg = a.fg, bg = p.bg_light }, -- the character under the cursor when |language-mapping| is used (see 'guicursor')
    CursorIM = { fg = a.fg, bg = p.bg_light }, -- like Cursor, but used when in IME mode |CursorIM|
    CursorColumn = { bg = p.bg_dark }, -- Screen-column at the cursor, when 'cursorcolumn' is secp.
    CursorLine = { bg = p.bg_dark }, -- Screen-line at the cursor, when 'cursorline' is secp.  Low-priority if foreground (ctermfg OR guifg) is not secp.
    Directory = { fg = a.fg }, -- directory names (and other special names in listings)
    EndOfBuffer = { fg = p.black }, -- filler lines (~) after the end of the buffer.  By default, this is highlighted like |hl-NonText|.
    ErrorMsg = { fg = a.error }, -- error messages on the command line
    VertSplit = { fg = a.minus3 }, -- the column separating vertically split windows
    Folded = { fg = a.fg, bg = p.bg_light }, -- line used for closed folds
    FoldColumn = { bg = p.none, fg = a.minus2 }, -- 'foldcolumn'
    SignColumn = { bg = p.none, fg = a.minus2 }, -- column where |signs| are displayed
    signcolumnsb = { bg = p.bg_light, fg = a.fg }, -- column where |signs| are displayed
    substitute = { bg = p.bg_light, fg = a.fg }, -- |:substitute| replacement text highlighting
    LineNr = { fg = a.minus2 }, -- Line number for ":number" and ":#" commands, and when 'number' or 'relativenumber' option is secp.
    CursorLineNr = { fg = a.plus2, bg = p.bg_dark }, -- Like LineNr when 'cursorline' or 'relativenumber' is set for the cursor line. highlights the number in numberline.
    CursorLineSign = { bg = p.bg_dark }, -- Like LineNr when 'cursorline' or 'relativenumber' is set for the cursor line. highlights the number in numberline.
    CursorLineFold = { bg = p.bg_dark }, -- Like LineNr when 'cursorline' or 'relativenumber' is set for the cursor line. highlights the number in numberline.
    MatchParen = { fg = p.yellow }, -- Character under the cursor or just before it, if it is a paired bracket, and its match. |pi_paren.txt|
    ModeMsg = { fg = a.fg }, -- 'showmode' message (e.g., "-- INSERT -- ")
    MsgArea = { fg = a.fg }, -- Area for messages and cmdline
    MsgSeparator = {}, -- Separator for scrolled messages, `msgsep` flag of 'display'
    MoreMsg = { fg = a.fg }, -- |more-prompt|
    NonText = { fg = a.minus2 }, -- '@' at the end of the window, characters from 'showbreak' and other characters that do not really exist in the text (e.g., ">" displayed when a double-wide character doesn't fit at the end of the line). See also |hl-EndOfBuffer|.
    Normal = { fg = a.fg, bg = p.none }, -- normal text
    NormalNC = { fg = a.fg, bg = p.none }, -- normal text in non-current windows
    NormalSB = { fg = a.fg, bg = p.none }, -- normal text in non-current windows
    NormalFloat = { fg = a.fg, bg = a.float_bg }, -- Normal text in floating windows.
    FloatBorder = { fg = a.border, bg = a.float_bg },
    FloatTitle = { fg = a.plus2, bg = a.float_bg },
    Pmenu = { fg = a.fg, bg = a.float_bg }, -- Popup menu: normal item.
    PmenuSel = { fg = a.select_fg, bg = a.select_bg }, -- Popup menu: selected item.
    PmenuSbar = { bg = a.float_bg }, -- Popup menu: scrollbar.
    PmenuThumb = { bg = p.bg_light }, -- Popup menu: Thumb of the scrollbar.
    Question = { fg = a.fg }, -- |hit-enter| prompt and yes/no questions
    QuickFixLine = { bg = p.bg_light }, -- Current |quickfix| item in the quickfix window. Combined with |hl-CursorLine| when the cursor is there.
    Search = { fg = p.bg_dark, bg = p.green_dark }, -- Last search pattern highlighting (see 'hlsearch').  Also used for similar items that need to stand oucp.
    IncSearch = { fg = p.bg_dark, bg = p.green_dark }, -- 'incsearch' highlighting; also used for the text replaced with ":s///c"
    CurSearch = { fg = p.bg_dark, bg = p.green_light }, -- The 'incsearch' item currently under the cursor
    SpecialKey = { fg = a.minus2 }, -- Unprintable characters: text displayed differently from what it really is.  But not 'listchars' whitespace. |hl-Whitespace|
    SpellBad = { sp = p.blue_dark, underdotted = true }, -- Word that is not recognized by the spellchecker. |spell| Combined with the highlighting used otherwise.
    SpellCap = { sp = p.blue_dark, underdotted = true }, -- Word that should start with a capital. |spell| Combined with the highlighting used otherwise.
    SpellLocal = { sp = p.blue_dark, underdotted = true }, -- Word that is recognized by the spellchecker as one that is used in another region. |spell| Combined with the highlighting used otherwise.
    SpellRare = { sp = p.blue_dark, underdotted = true }, -- Word that is recognized by the spellchecker as one that is hardly ever used.  |spell| Combined with the highlighting used otherwise.
    StatusLine = { fg = a.fg, bg = p.bg_light }, -- status line of current window
    -- StatusLineNC = { fg = a.fg, bg = p.bg_light }, -- status lines of not-current windows Note: if this is equal to "StatusLine" Vim will use "^^^" in the status line of the current window.
    TabLine = { bg = p.bg_light, fg = a.fg }, -- tab pages line, not active tab page label
    TabLineFill = { bg = p.black }, -- tab pages line, where there are no labels
    TabLineSel = { fg = a.fg, bg = p.bg_light }, -- tab pages line, active tab page label
    Title = { fg = p.plus2 }, -- titles for output from ":set all", ":autocmd" etcp.
    Visual = { bg = p.bg_lighter }, -- Visual mode selection
    VisualNOS = { bg = p.bg_lighter }, -- Visual mode selection when vim is "Not Owning the Selection".
    WarningMsg = { fg = a.warning }, -- warning messages
    Whitespace = { fg = a.minus3 }, -- "nbsp", "space", "tab" and "trail" in 'listchars'
    WildMenu = { bg = p.base }, -- current match in 'wildmenu' completion

    -- These groups are not listed as default vim groups,
    -- but they are defacto standard group names for syntax highlighting.

    -- code itself

    Constant = { fg = a.plus4 }, -- any constant
    String = { fg = p.green }, -- a string constant: "this is a string"
    Character = { fg = p.green }, --  a character constant: 'c', '\n'
    Number = { fg = p.green }, --   a number constant: 234, 0xff
    Float = { fg = p.green }, --    a floating point constant: 2.3e10
    Boolean = { fg = p.green }, --  a boolean constant: TRUE, false
    Identifier = { fg = a.plus4 }, -- any variable name
    Function = { fg = a.plus3 }, -- function name (also: methods for classes)
    Statement = { fg = a.plus3 }, -- any statement
    Conditional = { fg = a.base }, --  if, then, else, endif, switch, etcp.
    Repeat = { fg = a.base }, --   for, do, while, etcp.
    Label = { fg = a.plus1 }, --    case, default, etcp.
    Operator = { fg = a.base }, -- "sizeof", "+", "*", etcp.
    Keyword = { fg = a.minus1 }, --  any other keyword
    Exception = { fg = a.base }, --  try, catch, throw

    PreProc = { fg = a.minus1 }, -- generic Preprocessor
    Include = { fg = a.plus1 }, --  preprocessor #include
    Define = { fg = a.plus1 }, --   preprocessor #define
    Macro = { fg = a.plus1 }, --    same as Define
    PreCondit = {}, --  preprocessor #if, #else, #endif, etcp.

    Type = { fg = a.plus2 }, -- int, long, char, etcp.
    StorageClass = { fg = a.plus2 }, -- static, register, volatile, etcp.
    Structure = { fg = a.plus2 }, --  struct, union, enum, etcp.
    Typedef = { fg = a.plus2 }, --  A typedef
    Special = { fg = a.plus2 }, -- any special symbol
    SpecialChar = { fg = a.plus1 }, --  special character in a constant
    Tag = { fg = a.base }, --    you can use CTRL-] on this
    Delimiter = { fg = a.base }, --  character that needs attention
    Debug = { fg = a.base }, --    debugging statements

    Underlined = { underline = true }, -- text that stands out, HTML links
    Bold = { bold = true },
    Italic = { italic = true },
    -- ("Ignore", below, may be invisible...)
    Ignore = {}, -- left blank, hidden  |hl-Ignore|

    Error = { fg = a.error }, -- any erroneous construct
    Todo = { fg = a.fg, bg = p.blue_darker }, -- anything that needs extra attention; mostly the keywords TODO FIXME and XXX
    qfLineNr = { fg = a.plus2 },
    qfFileName = { fg = a.plus4 },
    htmlH1 = { fg = a.fg },
    htmlH2 = { fg = a.fg },
    mkdHeading = { fg = a.fg },
    mkdCode = { bg = p.none, fg = a.fg },
    mkdCodeDelimiter = { bg = p.none, fg = a.fg },
    mkdCodeStart = { fg = a.fg },
    mkdCodeEnd = { fg = a.fg },
    mkdLink = { fg = a.fg },

    -- debugging
    debugPC = { bg = p.bg_light }, -- used for highlighting the current line in terminal-debug
    debugBreakpoint = { bg = p.bg_light, fg = a.fg }, -- used for breakpoint colors in terminal-debug

    -- illuminate
    illuminatedWord = { bg = p.bg_light },
    illuminatedCurWord = { bg = p.bg_light },

    -- diff
    diffAdded = { fg = p.green },
    diffRemoved = { fg = p.red },
    diffChanged = { fg = p.yellow },
    diffOldFile = { fg = a.fg },
    diffNewFile = { fg = a.fg },
    diffFile = { fg = a.fg },
    diffLine = { fg = a.fg },
    diffIndexLine = { fg = a.fg },
    DiffAdd = { fg = p.bg_darker, bg = p.green_dark }, -- diff mode: Added line |diff.txt|
    DiffChange = { fg = p.bg_darker, bg = p.yellow_dark }, -- diff mode: Added line |diff.txt|
    DiffDelete = { fg = p.bg_darker, bg = p.red_dark }, -- diff mode: Added line |diff.txt|
    DiffText = { fg = p.bg_darker, bg = p.yellow }, -- diff mode: Changed text within a changed line |diff.txt|

    -- NeoVim
    healthError = { fg = a.error },
    healthSuccess = { fg = a.success },
    healthWarning = { fg = a.warning },
    -- misc

    -- glyphs
    GlyphPalette1 = { fg = a.fg },
    GlyphPalette2 = { fg = a.fg },
    GlyphPalette3 = { fg = a.fg },
    GlyphPalette4 = { fg = a.fg },
    GlyphPalette6 = { fg = a.fg },
    GlyphPalette7 = { fg = a.fg },
    GlyphPalette9 = { fg = a.fg },
}
