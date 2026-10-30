local M = {}

-- Each herdr-app terminal owns a unique Neovim RPC socket, so the herdr-app
-- navigator mod can press ctrl-h/j/k/l here directly. Sending through
-- `hc keys` instead waits until nobody has typed for ~3 s.
-- Keep this path in sync with mods/navigator/main.js in the herdr-app config.
local socket

local function socket_path()
  return string.format('%s/.local/state/herdr-app-nvim/%s.sock', vim.env.HOME, vim.env.HC_TERMINAL_ID)
end

--- Starts the terminal-specific RPC listener when Neovim is running inside herdr-app.
function M.setup()
  if not vim.env.HC_TERMINAL_ID or vim.env.HC_TERMINAL_ID == '' then
    return
  end

  socket = socket_path()
  vim.fn.mkdir(vim.fn.fnamemodify(socket, ':h'), 'p')
  vim.fn.delete(socket)

  local ok = pcall(vim.fn.serverstart, socket)
  if not ok then
    socket = nil
    return
  end

  vim.api.nvim_create_autocmd('VimLeavePre', {
    callback = function()
      if socket then
        pcall(vim.fn.serverstop, socket)
        vim.fn.delete(socket)
      end
    end,
  })
end

return M
