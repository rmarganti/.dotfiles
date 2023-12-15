// Users/rmarganti/.kenv/scripts/github-repos.ts
import "@johnlindquist/kit";
import { Octokit } from "octokit";
var org = await env("GH_ORG", "Enter a GitHub organization name");
var token = await env(
  "GH_PAT",
  "Enter a GitHub Personal Access Token with `notifications` and `repo` permissions."
);
var octokit = new Octokit({ auth: token });
var fetchRepos = async () => {
  const fetchOrgRepos = octokit.paginate(octokit.rest.repos.listForOrg, {
    org,
    per_page: 100
  });
  const fetchUserRepos = octokit.paginate(
    octokit.rest.repos.listForAuthenticatedUser,
    { type: "owner", per_page: 100 }
  );
  const result = await Promise.all([fetchOrgRepos, fetchUserRepos]).then(
    (resp) => resp.flat()
  );
  const choices = result.map((repo) => ({
    name: repo.name,
    value: repo.html_url,
    description: repo.owner.login
  }));
  return { choices };
};
var repoCache = await db("ghRepos", fetchRepos);
var choice = await arg("Select a notification", repoCache.choices);
open(choice);
