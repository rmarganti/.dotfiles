// Name: Github Notifications
// Description: List and launch all GitHub notifications
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn

import '@johnlindquist/kit';
import { Octokit } from 'octokit';
import { Endpoints } from '@octokit/types';

// -[ Types ]--------------------------------------

type GithubNotification =
    Endpoints['GET /notifications']['response']['data'][number];

// [ Instantiate client ]--------------------------

const token = await env(
    'GH_PAT',
    'Enter a GitHub Personal Access Token with `notifications` permissions'
);

const octokit = new Octokit({ auth: token });

/**
 * Fetch all notifications.
 */
const fetchNotifications = async () => {
    const { data } =
        await octokit.rest.activity.listNotificationsForAuthenticatedUser();

    const choices = data.map((notification) => ({
        name: notification.subject.title,
        value: notification,
        description: notification.subject.type,
    }));

    return choices;
};

// [ Choose notification ]-------------------------

const getUrl = (notification: GithubNotification): string => {
    switch (notification.subject.type) {
        case 'Discussion':
            return `${notification.repository.html_url}/discussions`;
        case 'Release':
            return `${notification.repository.html_url}/releases/tag/${notification.subject.title}`;
        case 'Issue':
            return `${
                notification.repository.html_url
            }/issues/${notification.subject.url?.split('/').pop()}`;
        case 'PullRequest':
            return `${
                notification.repository.html_url
            }/pull/${notification.subject.url?.split('/').pop()}`;
    }
};

const choices = await fetchNotifications();
const choice = await arg('Select a notification', choices);
const url = getUrl(choice);

open(url);
