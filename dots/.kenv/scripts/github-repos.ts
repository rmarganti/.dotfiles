// @ts-check

// Name: Github Repositories
// Description: List and launch all GitHub repos
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn

import '@johnlindquist/kit';
import { Octokit } from 'octokit';

// [ Instantiate client ]--------------------------

const org = await env('GH_ORG', 'Enter a GitHub organization name');

const token = await env(
    'GH_PAT',
    'Enter a GitHub Personal Access Token with `notifications` and `repo` permissions.'
);

const octokit = new Octokit({ auth: token });

/**
 * Fetch all notifications.
 */
const fetchRepos = async () => {
    const fetchOrgRepos = octokit.paginate(octokit.rest.repos.listForOrg, {
        org,
        per_page: 100,
    });

    const fetchUserRepos = octokit.paginate(
        octokit.rest.repos.listForAuthenticatedUser,
        { type: 'owner', per_page: 100 }
    );

    const result = await Promise.all([fetchOrgRepos, fetchUserRepos]).then(
        (resp) => resp.flat()
    );

    const choices = result.map((repo) => ({
        name: repo.name,
        value: repo.html_url,
        description: repo.owner.login,
    }));

    return { choices };
};

// [ Choose notification ]-------------------------

const repoCache = await db('ghRepos', fetchRepos);
const choice = await arg('Select a notification', repoCache.choices);

open(choice);
