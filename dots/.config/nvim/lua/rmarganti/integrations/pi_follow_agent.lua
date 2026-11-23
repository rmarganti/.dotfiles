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
function M.follow(path, line, column)
  if type(path) ~= 'string' or path == '' then
    return false
  end

  local buffer = vim.fn.bufadd(vim.fn.fnamemodify(path, ':p'))
  vim.bo[buffer].buflisted = true
  vim.fn.bufload(buffer)
  vim.api.nvim_win_set_buf(0, buffer)

  local line_count = vim.api.nvim_buf_line_count(buffer)
  local target_line = math.max(1, math.min(tonumber(line) or 1, line_count))
  local text = vim.api.nvim_buf_get_lines(buffer, target_line - 1, target_line, false)[1] or ''
  local target_column = math.max(0, math.min((tonumber(column) or 1) - 1, #text))
  vim.api.nvim_win_set_cursor(0, { target_line, target_column })
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

--- Opens a verified file for the desktop link handler, never a missing path.
function M.follow_link(path, line, column)
  return vim.fn.filereadable(path) == 1 and M.follow(path, line, column)
end

--- Starts a pane-specific RPC listener for the TUI or a terminal-specific one for the app.
function M.setup()
  local tui = vim.env.HERDR_ENV == '1' and vim.env.HERDR_PANE_ID
  local terminal = vim.env.HC_TERMINAL_ID
  local runtime = vim.env.XDG_RUNTIME_DIR or vim.env.TMPDIR
  if tui then
    socket = socket_path()
  elseif terminal and terminal:match('^t[0-9a-z]+$') and runtime and runtime ~= '' then
    socket = string.format('%s/herdr-nvim/%s.sock', runtime:gsub('/+$', ''), terminal)
  else
    return
  end

  vim.api.nvim_set_hl(0, 'PiFollowAgentChange', { default = true, link = 'Visual' })

  vim.fn.mkdir(vim.fn.fnamemodify(socket, ':h'), 'p', 448) -- 0700
  if tui then
    vim.fn.delete(socket)
  end

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
