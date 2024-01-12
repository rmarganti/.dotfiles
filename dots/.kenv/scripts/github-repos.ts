// @ts-check

// Name: Github Repositories
// Description: List and launch all GitHub repos
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn
// Keyword: ghr

import '@johnlindquist/kit';
import { Octokit } from 'octokit';
import { fetchAndCacheRepos } from '../lib/github';

const token = await env(
    'GH_PAT',
    'Enter a GitHub Personal Access Token with `notifications` and `repo` permissions.'
);

const octokit = new Octokit({ auth: token });

const choices = await fetchAndCacheRepos(octokit);
const choice = await arg('Select a repository', choices);

open(choice.html_url);
