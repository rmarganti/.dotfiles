-- Override markdown filetype plugin's gO mapping
-- The official markdown ftplugin maps gO to show outline, but we want it for inserting lines above
vim.keymap.set('n', 'gO', "<Cmd>call append(line('.') - 1, repeat([''], v:count1))<CR>", {
  buffer = true,
  noremap = true,
  desc = 'Add line above',
})
