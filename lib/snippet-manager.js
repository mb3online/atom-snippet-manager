'use babel';

import { CompositeDisposable } from 'atom';

import Manager from './manager';

/* eslint-disable no-undef */

export default {
    config: {
        root: {
            title: 'Directory (Absolute Path)',
            description:
                'The directory to recursively search and symlink snippet files.',
            type: 'string',
            default: '',
        },
        json: {
            title: 'Snippet file as JSON',
            description: 'Output the snippets file as JSON',
            type: 'boolean',
            default: false,
        },
        gist: {
            title: 'Github Username',
            description: 'Search and pull snippets from Gists',
            type: 'string',
            default: '',
        },
        gtoken: {
            title: 'Github Token',
            description:
                'Personal access token for private github gists. (https://github.com/settings/tokens/new)',
            type: 'string',
            default: '',
        },
    },

    subscriptions: null,
    manager: null,

    activate() {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(
            atom.commands.add('atom-workspace', {
                'snippet-manager:toggle': () => this.toggle(),
            })
        );
    },

    deactivate() {
        this.subscriptions.dispose();
    },

    // eslint-disable-next-line
    serialize() {},

    toggle() {
        if (!this.manager) {
            const ROOT = atom.config.get('snippet-manager.root');
            if (!ROOT)
                return atom.notifications.addError(
                    'Snippet Manager: Must include directory to sync snippets.'
                );
            this.manager = new Manager(ROOT);
        }
        atom.notifications.addInfo('Snippet Manager: Synchronizing Snippets!');
        this.manager
            .gather()
            .symlink()
            .then(() => {
                this.manager.write();
                atom.notifications.addSuccess('Snippet Manager: Done Sync.');
            });

        return true;
    },
};
