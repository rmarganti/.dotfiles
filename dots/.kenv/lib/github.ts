import { Octokit } from 'octokit';

/**
 * Fetch all repositories for a User and store them in cache.
 * This includes Organization repos.
 */
export const fetchAndCacheRepos = async (octokit: Octokit) => {
    const repoCache = await db('ghRepos', () => fetchRepos(octokit));

    return repoCache.choices;
};

/**
 * Fetch all repositories for a User. This includes Organization repos.
 */
async function fetchRepos(octokit: Octokit) {
    const org = await env('GH_ORG', 'Enter a GitHub organization name');

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
        value: repo,
        description: repo.owner.login,
    }));

    return { choices };
}
