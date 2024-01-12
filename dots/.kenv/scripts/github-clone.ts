// @ts-check

// Name: Github Clone
// Description: Copy a Git clone command to the clipbord
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn
// Keyword: ghc

import '@johnlindquist/kit';
import { Octokit } from 'octokit';
import { fetchAndCacheRepos } from '../lib/github';

// [ Instantiate client ]--------------------------

const token = await env(
    'GH_PAT',
    'Enter a GitHub Personal Access Token with `notifications` and `repo` permissions.'
);

const octokit = new Octokit({ auth: token });
const choices = await fetchAndCacheRepos(octokit);

const choice = await arg('Select a repository', choices);

const cloneUrl = choice.ssh_url || choice.clone_url;

if (cloneUrl) {
    await clipboard.writeText(`git clone ${cloneUrl}`);
} else {
    await div(md(`# Repo has no SSH or clone url`));
}
