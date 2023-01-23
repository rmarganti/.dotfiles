local M = {}

local other_files_config = require('rmarganti.config.other-files')

-- A map of file -> other file
local cache = {}

local function populate_cache_and_edit(input, output)
    cache[input] = output
    vim.cmd.edit(output)
end

local function check_cache(filename)
    -- We've already seen this file, so we know what the other file is
    if cache[filename] ~= nil then
        return cache[filename]
    end

    -- We can also assume other file matches work in reverse
    for key, value in pairs(cache) do
        if value == filename then
            cache[filename] = key
            return key
        end
    end

    return nil
end

local function does_file_match_mapping(file_path, mapping)
    local match_results = file_path:match(mapping.pattern)

    if match_results == nil then
        return false
    end

    local meets_condition = true

    if type(mapping.condition) == 'function' then
        meets_condition = mapping.condition()
    end

    return meets_condition
end

local function build_telescope_picker(current_file_relative, matches)
    local telescope_pickers = require('telescope.pickers')
    local telescope_finders = require('telescope.finders')
    local telescope_conf = require('telescope.config').values
    local telescope_actions = require('telescope.actions')
    local telescope_action_state = require('telescope.actions.state')

    return function(opts)
        opts = opts or require('telescope.themes').get_dropdown({})

        telescope_pickers
            .new(opts, {
                prompt_title = 'Other Files',
                finder = telescope_finders.new_table({
                    results = matches,
                }),
                sorter = telescope_conf.generic_sorter(opts),
                attach_mappings = function(prompt_bufnr)
                    telescope_actions.select_default:replace(function()
                        telescope_actions.close(prompt_bufnr)
                        local selection = telescope_action_state.get_selected_entry()
                        populate_cache_and_edit(current_file_relative, selection[1])
                    end)
                    return true
                end,
            })
            :find()
    end
end

-- Open other file related to current buffer. This is usually
-- either a test, or the file to which a test applies.
M.edit_other = function()
    local cwd_length = #vim.fn.getcwd() + 1
    local current_file_absolute = vim.api.nvim_buf_get_name(0)
    local current_file_relative = current_file_absolute:sub(cwd_length + 1)

    local cache_hit = check_cache(current_file_relative)

    -- Use previously chosen value if available
    if cache_hit ~= nil then
        vim.cmd.edit(cache_hit)
        return
    end

    local matches = {}

    -- Collect matching patterns
    for _, mapping in pairs(other_files_config) do
        if does_file_match_mapping(current_file_absolute, mapping) then
            local target_file_absolute = current_file_absolute:gsub(mapping.pattern, mapping.target)
            local target_file_relative = target_file_absolute:sub(cwd_length + 1) -- +1 to include slash

            table.insert(matches, target_file_relative)
        end
    end

    if #matches == 0 then
        vim.notify('No other file found', 'warn')
        return
    end

    -- Only one match, open it
    if #matches == 1 then
        populate_cache_and_edit(current_file_relative, matches[1])
        return
    end

    -- If multiple options are available, present a Telescope picker.
    local telescope_picker = build_telescope_picker(
        current_file_relative,
        matches
    )

    telescope_picker()
end

return M
