local M = {}

M.load = function()
    local utils = require('rmarganti.colors.utils')
    local integrations = require('rmarganti.colors.integrations')
    local languages = require('rmarganti.colors.languages')

	vim.cmd("hi clear")

	if vim.fn.exists("syntax_on") then
		vim.cmd("syntax reset")
	end

	for _, integration in pairs(integrations) do
		utils.syntax(integration)
	end

	for _, language in pairs(languages) do
		utils.syntax(language)
	end
end

return M
