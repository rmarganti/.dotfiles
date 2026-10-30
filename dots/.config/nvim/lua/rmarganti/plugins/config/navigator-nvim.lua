local HerdrMux = {}

function HerdrMux.is_available()
    return vim.env.HERDR_PANE_ID ~= nil and vim.env.HERDR_PANE_ID ~= ''
end

function HerdrMux.new()
    local herdr = vim.env.HERDR_BIN_PATH
    if herdr == nil or herdr == '' then
        herdr = 'herdr'
    end

    return {
        zoomed = function()
            return false
        end,

        navigate = function(_, direction)
            local map = {
                h = 'left',
                j = 'down',
                k = 'up',
                l = 'right',
            }

            local dir = map[direction]
            if not dir then
                return
            end

            vim.fn.jobstart({
                herdr,
                'pane',
                'focus',
                '--direction',
                dir,
                '--current',
            }, { detach = true })
        end,
    }
end

-- The Herdr desktop app (herdr-app). Its terminals are herdr-core terminals,
-- which set HC_TERMINAL_ID instead of HERDR_PANE_ID.
local HerdrAppMux = {}

function HerdrAppMux.is_available()
    return vim.env.HC_TERMINAL_ID ~= nil and vim.env.HC_TERMINAL_ID ~= ''
end

function HerdrAppMux.new()
    return {
        zoomed = function()
            return false
        end,

        navigate = function(_, direction)
            local map = {
                h = 'left',
                j = 'down',
                k = 'up',
                l = 'right',
            }

            local dir = map[direction]
            if not dir then
                return
            end

            vim.fn.jobstart({
                'herdr-app',
                'do',
                'pane.go',
                '--direction',
                dir,
            }, { detach = true })
        end,
    }
end

local M = {
    'numToStr/Navigator.nvim',
    opts = function()
        if HerdrMux.is_available() then
            return { mux = HerdrMux.new() }
        end

        if HerdrAppMux.is_available() then
            return { mux = HerdrAppMux.new() }
        end

        return { mux = 'auto' }
    end,
}

return M
