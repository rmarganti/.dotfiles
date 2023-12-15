// Name: Github Notifications
// Description: List and launch all GitHub notifications
// Author: Ryan Marganti
// Twitter: @soulsizzledsgn

import '@johnlindquist/kit';
import { Octokit } from 'octokit';

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

    return { choices };
};

// [ Choose notification ]-------------------------

const notificationsCache = await db('ghNotifications2', fetchNotifications);
const choice = await arg('Select a notification', notificationsCache.choices);

console.log(choice);

await div(
    md(`
# ${choice.subject.url}
`)
);
