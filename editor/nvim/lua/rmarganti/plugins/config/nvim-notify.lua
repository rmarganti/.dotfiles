-- Replaces `vim.notify`.
local M = {
    'rcarriga/nvim-notify',
    event = 'VeryLazy',
}

local bottom_right

function M.config()
    local notify = require('notify')

    notify.setup({
        background_colour = 'NormalFloat',
        stages = bottom_right(),
    })

    vim.notify = notify
end

-- Default fade_in_slide_out but in bottom right corner.
function bottom_right()
    local stages_util = require('notify.stages.util')

    return {
        function(state)
            local next_height = state.message.height + 2
            local next_row = stages_util.available_slot(
                state.open_windows,
                next_height,
                stages_util.DIRECTION.BOTTOM_UP
            )

            if not next_row then
                return nil
            end

            return {
                relative = 'editor',
                anchor = 'NE',
                width = state.message.width,
                height = state.message.height,
                col = vim.opt.columns:get(),
                row = next_row,
                border = 'rounded',
                style = 'minimal',
                opacity = 0,
            }
        end,
        function(state, win)
            return {
                opacity = { 100 },
                col = { vim.opt.columns:get() },
                row = {
                    stages_util.slot_after_previous(
                        win,
                        state.open_windows,
                        stages_util.DIRECTION.BOTTOM_UP
                    ),
                    frequency = 3,
                    complete = function()
                        return true
                    end,
                },
            }
        end,
        function(state, win)
            return {
                col = { vim.opt.columns:get() },
                time = true,
                row = {
                    stages_util.slot_after_previous(
                        win,
                        state.open_windows,
                        stages_util.DIRECTION.BOTTOM_UP
                    ),
                    frequency = 3,
                    complete = function()
                        return true
                    end,
                },
            }
        end,
        function(state, win)
            return {
                width = {
                    1,
                    frequency = 2.5,
                    damping = 0.9,
                    complete = function(cur_width)
                        return cur_width < 3
                    end,
                },
                opacity = {
                    0,
                    frequency = 2,
                    complete = function(cur_opacity)
                        return cur_opacity <= 4
                    end,
                },
                col = { vim.opt.columns:get() },
                row = {
                    stages_util.slot_after_previous(
                        win,
                        state.open_windows,
                        stages_util.DIRECTION.BOTTOM_UP
                    ),
                    frequency = 3,
                    complete = function()
                        return true
                    end,
                },
            }
        end,
    }
end

return M
