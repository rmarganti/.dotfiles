local M = {}

local highlight_namespace = vim.api.nvim_create_namespace('pi-follow-agent')
local highlight_timer

-- Each Herdr pane owns a unique Neovim RPC socket.
local socket

local function socket_path()
  local runtime_directory = vim.env.XDG_RUNTIME_DIR or vim.env.TMPDIR or '/tmp'
  runtime_directory = runtime_directory:gsub('/+$', '')
  local pane_id = vim.env.HERDR_PANE_ID:gsub(':', '-')
  return string.format('%s/pi-follow-agent/%s.sock', runtime_directory, pane_id)
end

--- Opens a file in the current Neovim window and reveals the requested line.
function M.follow(path, line)
  if type(path) ~= 'string' or path == '' then
    return false
  end

  local buffer = vim.fn.bufadd(vim.fn.fnamemodify(path, ':p'))
  vim.fn.bufload(buffer)
  vim.api.nvim_win_set_buf(0, buffer)

  local line_count = vim.api.nvim_buf_line_count(buffer)
  local target_line = math.max(1, math.min(tonumber(line) or 1, line_count))
  vim.api.nvim_win_set_cursor(0, { target_line, 0 })
  vim.cmd('normal! zz')
  return true
end

--- Reloads an externally changed file and briefly highlights the changed lines.
function M.refresh(path, start_line, end_line)
  if not M.follow(path, start_line) then
    return false
  end

  local buffer = vim.api.nvim_get_current_buf()
  vim.cmd('checktime ' .. buffer)

  local line_count = vim.api.nvim_buf_line_count(buffer)
  local first_line = math.max(1, math.min(tonumber(start_line) or 1, line_count))
  local last_line = math.max(first_line, math.min(tonumber(end_line) or first_line, line_count))
  vim.api.nvim_win_set_cursor(0, { first_line, 0 })
  vim.cmd('normal! zz')

  vim.api.nvim_buf_clear_namespace(buffer, highlight_namespace, 0, -1)
  vim.api.nvim_buf_set_extmark(buffer, highlight_namespace, first_line - 1, 0, {
    end_row = last_line,
    hl_group = 'PiFollowAgentChange',
    hl_eol = true,
    priority = 200,
  })

  if highlight_timer then
    highlight_timer:stop()
    highlight_timer:close()
  end

  highlight_timer = vim.defer_fn(function()
    if vim.api.nvim_buf_is_valid(buffer) then
      vim.api.nvim_buf_clear_namespace(buffer, highlight_namespace, 0, -1)
    end
    highlight_timer = nil
  end, 700)

  return true
end

--- Starts the pane-specific RPC listener when Neovim is running inside Herdr.
function M.setup()
  if vim.env.HERDR_ENV ~= '1' or not vim.env.HERDR_PANE_ID then
    return
  end

  vim.api.nvim_set_hl(0, 'PiFollowAgentChange', { default = true, link = 'Visual' })

  socket = socket_path()
  vim.fn.mkdir(vim.fn.fnamemodify(socket, ':h'), 'p')
  vim.fn.delete(socket)

  local ok = pcall(vim.fn.serverstart, socket)
  if not ok then
    socket = nil
    return
  end

  vim.api.nvim_create_autocmd('VimLeavePre', {
    once = true,
    callback = function()
      if socket then
        pcall(vim.fn.serverstop, socket)
        vim.fn.delete(socket)
      end
    end,
  })
end

return M
