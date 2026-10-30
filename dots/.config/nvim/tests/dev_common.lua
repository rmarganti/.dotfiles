-- Run from the repo root: nvim --headless -u NONE -l dots/.config/nvim/tests/dev_common.lua
package.path = './dots/.config/nvim/lua/?.lua;' .. package.path

local path = vim.fn.tempname()
local expand = vim.fn.expand
local notify = vim.notify
vim.fn.expand = function(value)
    return value == '~/.config/dev-common.json' and path or expand(value)
end
local warnings = 0
vim.notify = function()
    warnings = warnings + 1
end

local function load(content)
    vim.fn.delete(path)
    if content then
        vim.fn.writefile({ content }, path)
    end
    package.loaded['rmarganti.utils.dev_common'] = nil
    return require('rmarganti.utils.dev_common')
end

for _, content in ipairs({
    '{}',
    '{"neovim":null}',
    '{"neovim":{"copilot":true}}',
    '{"neovim":{"copilot":{"enabled":"true"}}}',
    '{"neovim":{"copilot":{"enabled":false}}}',
}) do
    assert(not load(content).copilot_enabled(), content)
end
assert(not load(nil).copilot_enabled())
assert(not load('{invalid').copilot_enabled())
assert(warnings == 1)
assert(not load('false').copilot_enabled())
assert(warnings == 2)

for _, enabled in ipairs({ false, true }) do
    local common = load(vim.json.encode({
        neovim = { copilot = { enabled = enabled } },
        obsidian = { workspaces = { { name = 'test', path = '/tmp/vault' } } },
    }))
    assert(common.copilot_enabled() == enabled)
    local function spec(name)
        local module = 'rmarganti.plugins.config.' .. name
        package.loaded[module] = nil
        return require(module)
    end

    local copilot = spec('copilot')
    assert(copilot.cond == enabled)
    local sidekick = spec('sidekick')
    assert(sidekick.dependencies[1].cond == enabled)
    local sidekick_opts
    package.loaded.sidekick = {
        setup = function(opts)
            sidekick_opts = opts
        end,
    }
    sidekick.config()
    assert(sidekick_opts.nes.enabled == enabled)
    assert(sidekick_opts.copilot.status.enabled == enabled)
    assert(sidekick_opts.cli.tools.copilot == false)

    local cmp = spec('cmp')
    assert(cmp.dependencies[#cmp.dependencies].cond == enabled)
    local cmp_opts
    local mapping = setmetatable({
        preset = {
            insert = function(value)
                return value
            end,
        },
        scroll_docs = function() end,
        close = function() end,
    }, { __call = function() end })
    package.loaded.cmp = {
        mapping = mapping,
        PreselectMode = { None = 0 },
        setup = function(opts)
            cmp_opts = opts
        end,
    }
    package.loaded.luasnip = {}
    local cmp_setup = false
    package.loaded.copilot_cmp = {
        setup = function()
            cmp_setup = true
        end,
    }
    cmp.config()
    assert(cmp_setup == enabled)
    local found = false
    for _, source in ipairs(cmp_opts.sources) do
        found = found or source.name == 'copilot'
    end
    assert(found == enabled)
    if enabled then
        assert(cmp_opts.sources[3].name == 'copilot')
    end

    local obsidian = spec('obsidian-nvim')
    assert(obsidian.opts.workspaces[1].path == '/tmp/vault')
end

vim.fn.expand = expand
vim.notify = notify
vim.fn.delete(path)
print(
    'dev-common tests passed: defaults, malformed config, Copilot on/off, cmp, Sidekick, Obsidian'
)
