local M = {}

local actions = require('telescope.actions')
local action_state = require('telescope.actions.state')
local custom_actions = {}

function custom_actions._multiopen(prompt_bufnr, open_cmd)
    local picker = action_state.get_current_picker(prompt_bufnr)
    local num_selections = #picker:get_multi_selection()

    if num_selections > 1 then
        vim.cmd("bw!") -- wipe the prompt buffer
        for _, entry in ipairs(picker:get_multi_selection()) do
            print(string.format("%s %s", open_cmd, entry.value))
            vim.cmd(string.format("%s %s", open_cmd, entry.value))
        end
        vim.cmd('stopinsert')
    else
        if open_cmd == "vsplit" then
            actions.file_vsplit(prompt_bufnr)
        elseif open_cmd == "split" then
            actions.file_split(prompt_bufnr)
        elseif open_cmd == "tabe" then
            actions.file_tab(prompt_bufnr)
        else
            actions.file_edit(prompt_bufnr)
        end
    end
end

function custom_actions.multi_selection_open_vsplit(prompt_bufnr)
    custom_actions._multiopen(prompt_bufnr, "vsplit")
end

function custom_actions.multi_selection_open_split(prompt_bufnr)
    custom_actions._multiopen(prompt_bufnr, "split")
end

function custom_actions.multi_selection_open_tab(prompt_bufnr)
    custom_actions._multiopen(prompt_bufnr, "tabe")
end

function custom_actions.multi_selection_open(prompt_bufnr)
    custom_actions._multiopen(prompt_bufnr, "edit")
end

-- https://github.com/nvim-telescope/telescope.nvim#telescope-defaults
M.setup = function()
    local telescope = require('telescope')

    telescope.setup({
        extensions = {
            fzf = {
                fuzzy = true,                    -- false will only do exact matching
                override_generic_sorter = false, -- override the generic sorter
                override_file_sorter = true,     -- override the file sorter
                case_mode = "smart_case",        -- or "ignore_case" or "respect_case"
            }
        },
        dynamic_preview_title = true,
        defaults = {
            dynamic_preview_title = true,
            file_ignore_patterns = {
                '^.git/',
                '^node_modules/',
                '^vendor/',
            },
            layout_config = {
                center = {
                    preview_cutoff = 40
                },
                height = 0.9,
                horizontal = {
                    preview_cutoff = 120,
                    prompt_position = "bottom"
                },
                vertical = {
                    preview_cutoff = 40
                },
                width = 0.9
            },
            mappings = {
                i = {
                    ["<cr>"] = custom_actions.multi_selection_open,
                },
                n = {
                    ["<cr>"] = custom_actions.multi_selection_open,
                }
            }
        },
    })
end

return M
