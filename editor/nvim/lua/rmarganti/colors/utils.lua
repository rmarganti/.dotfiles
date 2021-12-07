local M = {}

M.apply = function()
    local core = M.get_core_config()
    M.syntax(core)

    local integrations = M.get_integrations_config()
    M.syntax(integrations)
end

M.syntax = function(tbl)
	for group, colors in pairs(tbl) do
		M.highlight(group, colors)
	end
end

M.highlight = function(group, color)
	-- Doc: :h highlight-gui
	local style = color.style and "gui=" .. color.style or "gui=NONE"
	local fg = color.fg and "guifg=" .. color.fg or "guifg=NONE"
	local bg = color.bg and "guibg=" .. color.bg or "guibg=NONE"
	local sp = color.sp and "guisp=" .. color.sp or ""
	local blend = color.blend and "blend=" .. color.blend or ""
	local hl = "highlight " .. group .. " " .. style .. " " .. fg .. " " .. bg .. " " .. sp .. " " .. blend

	vim.cmd(hl)
	if color.link then
		vim.cmd("highlight! link " .. group .. " " .. color.link)
	end
end

return M
