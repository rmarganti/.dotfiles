local p = require('rmarganti.colors.palette')
local a = require('rmarganti.colors.abstractions')

return {
    Comment = { fg = a.minus2 }, -- just comments
    ColorColumn = { bg = p.black }, -- used for the columns set with 'colorcolumn'
    Conceal = { fg = p.black }, -- placeholder characters substituted for concealed text (see 'conceallevel')
    Cursor = { fg = p.fg, bg = p.bg_light }, -- character under the cursor
    lCursor = { fg = p.fg, bg = p.bg_light }, -- the character under the cursor when |language-mapping| is used (see 'guicursor')
    CursorIM = { fg = p.fg, bg = p.bg_light }, -- like Cursor, but used when in IME mode |CursorIM|
    CursorColumn = { bg = p.bg_dark }, -- Screen-column at the cursor, when 'cursorcolumn' is secp.
    CursorLine = { bg = p.bg_dark }, -- Screen-line at the cursor, when 'cursorline' is secp.  Low-priority if foreground (ctermfg OR guifg) is not secp.
    Directory = { fg = p.fg }, -- directory names (and other special names in listings)
    EndOfBuffer = { fg = p.black }, -- filler lines (~) after the end of the buffer.  By default, this is highlighted like |hl-NonText|.
    ErrorMsg = { fg = a.error }, -- error messages on the command line
    VertSplit = { fg = p.black }, -- the column separating vertically split windows
    Folded = { fg = p.fg, bg = p.bg_light }, -- line used for closed folds
    FoldColumn = { bg = p.bg_light, fg = p.fg }, -- 'foldcolumn'
    SignColumn = { bg = p.none, fg = a.minus2 }, -- column where |signs| are displayed
    signcolumnsb = { bg = p.bg_light, fg = p.fg }, -- column where |signs| are displayed
    substitute = { bg = p.bg_light, fg = p.fg }, -- |:substitute| replacement text highlighting
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
    NormalSB = { fg = p.fg, bg = p.none }, -- normal text in non-current windows
    NormalFloat = { fg = p.fg, bg = a.float_bg }, -- Normal text in floating windows.
    FloatBorder = { fg = a.border, bg = a.float_bg },
    Pmenu = { fg = p.fg, bg = a.float_bg }, -- Popup menu: normal item.
    PmenuSel = { fg = a.select_fg, bg = a.select_bg }, -- Popup menu: selected item.
    PmenuSbar = { bg = a.float_bg }, -- Popup menu: scrollbar.
    PmenuThumb = { bg = p.bg_light }, -- Popup menu: Thumb of the scrollbar.
    Question = { fg = p.fg }, -- |hit-enter| prompt and yes/no questions
    QuickFixLine = { bg = p.bg_light }, -- Current |quickfix| item in the quickfix window. Combined with |hl-CursorLine| when the cursor is there.
    Search = { bg = p.cyan, fg = p.black }, -- Last search pattern highlighting (see 'hlsearch').  Also used for similar items that need to stand oucp.
    IncSearch = { bg = p.cyan, fg = p.black }, -- 'incsearch' highlighting; also used for the text replaced with ":s///c"
    SpecialKey = { fg = p.fg }, -- Unprintable characters: text displayed differently from what it really is.  But not 'listchars' whitespace. |hl-Whitespace|
    SpellBad = { fg = p.none, sp = a.warning, gui = 'undercurl' }, -- Word that is not recognized by the spellchecker. |spell| Combined with the highlighting used otherwise.
    SpellCap = { fg = p.none, sp = a.warning, gui = 'undercurl' }, -- Word that should start with a capital. |spell| Combined with the highlighting used otherwise.
    SpellLocal = { fg = p.none, sp = a.warning, gui = 'undercurl' }, -- Word that is recognized by the spellchecker as one that is used in another region. |spell| Combined with the highlighting used otherwise.
    SpellRare = { fg = p.none, sp = a.warning, gui = 'undercurl' }, -- Word that is recognized by the spellchecker as one that is hardly ever used.  |spell| Combined with the highlighting used otherwise.
    StatusLine = { fg = p.fg, bg = p.bg_light }, -- status line of current window
    StatusLineNC = { fg = p.fg, bg = p.bg_light }, -- status lines of not-current windows Note: if this is equal to "StatusLine" Vim will use "^^^" in the status line of the current window.
    TabLine = { bg = p.bg_light, fg = p.fg }, -- tab pages line, not active tab page label
    TabLineFill = { bg = p.black }, -- tab pages line, where there are no labels
    TabLineSel = { fg = p.fg, bg = p.bg_light }, -- tab pages line, active tab page label
    Title = { fg = p.fg }, -- titles for output from ":set all", ":autocmd" etcp.
    Visual = { bg = p.black }, -- Visual mode selection
    VisualNOS = { bg = p.black }, -- Visual mode selection when vim is "Not Owning the Selection".
    WarningMsg = { fg = a.warning }, -- warning messages
    Whitespace = { fg = p.gray2 }, -- "nbsp", "space", "tab" and "trail" in 'listchars'
    WildMenu = { bg = p.gray2 }, -- current match in 'wildmenu' completion

    -- These groups are not listed as default vim groups,
    -- but they are defacto standard group names for syntax highlighting.

    -- code itself

    Constant = { fg = a.plus2 }, -- (prefercatppuccin5) any constant
    String = { fg = a.plus2 }, -- a string constant: "this is a string"
    Character = { fg = a.plus2 }, --  a character constant: 'c', '\n'
    Number = { fg = a.plus2 }, --   a number constant: 234, 0xff
    Float = { fg = a.plus2 }, --    a floating point constant: 2.3e10
    Boolean = { fg = a.plus2 }, --  a boolean constant: TRUE, false
    Identifier = { fg = a.plus3 }, -- (prefercatppuccin5) any variable name
    Function = { fg = a.plus1 }, -- function name (also: methods for classes)
    Statement = { fg = a.base }, -- (prefercatppuccin5) any statement
    Conditional = { fg = a.base }, --  if, then, else, endif, switch, etcp.
    Repeat = { fg = a.base }, --   for, do, while, etcp.
    Label = { fg = a.plus1 }, --    case, default, etcp.
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
    Todo = { bg = p.bg_light, fg = p.fg }, -- (prefercatppuccin5) anything that needs extra attention; mostly the keywords TODO FIXME and XXX
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
    debugPC = { bg = p.bg_light }, -- used for highlighting the current line in terminal-debug
    debugBreakpoint = { bg = p.bg_light, fg = p.fg }, -- used for breakpoint colors in terminal-debug
    -- illuminate
    illuminatedWord = { bg = p.bg_light },
    illuminatedCurWord = { bg = p.bg_light },
    -- diff
    diffAdded = { fg = p.green },
    diffRemoved = { fg = p.red },
    diffChanged = { fg = p.yellow },
    diffOldFile = { fg = p.fg },
    diffNewFile = { fg = p.fg },
    diffFile = { fg = p.fg },
    diffLine = { fg = p.fg },
    diffIndexLine = { fg = p.fg },
    DiffAdd = { fg = p.fg, bg = p.bg_light }, -- diff mode: Added line |diff.txt|
    DiffChange = { fg = p.fg, bg = p.bg_light }, -- diff mode: Changed line |diff.txt|
    DiffDelete = { fg = p.fg, bg = p.bg_light }, -- diff mode: Deleted line |diff.txt|
    DiffText = { fg = p.fg, bg = p.bg_light }, -- diff mode: Changed text within a changed line |diff.txt|
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
