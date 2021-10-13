return function()
    local secrets = require('rmarganti.secrets')

    require('telescope').load_extension('ghn')

    require('github-notifications').setup({
        username = secrets.github_username,
        token = secrets.github_token,
    })
end
