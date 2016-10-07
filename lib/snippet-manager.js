'use babel';

import { CompositeDisposable } from 'atom';

import Manager from './manager';

/* eslint-disable no-undef */

export default {

    config: {
        root: {
            title: 'Directory',
            description: 'The directory to recursively search and symlink snippet files.',
            type: 'string',
            default: '',
        },
    },

    subscriptions: null,
    manager: null,

    activate() {
        this.subscriptions = new CompositeDisposable();
        this.subscriptions.add(
            atom.commands.add('atom-workspace', {'snippet-manager:toggle': () => this.toggle()}));
    },

    deactivate() { this.subscriptions.dispose(); },

    // eslint-disable-next-line
    serialize() { },

    toggle() {
        if (!this.manager) {
            const ROOT = atom.config.get('snippet-manager.root');
            if (!ROOT) return atom.notifications.addError('Snippet Manager: Must include directory to sync snippets.');
            this.manager = new Manager(ROOT);
        }
        atom.notifications.addInfo('Snippet Manager: Synchronizing Snippets!');
        this.manager
            .gather()
            .symlink()
            .then(() => {
                this.manager.write();
                atom.notifications.addSuccess('Snippet Manager: Done Synch.');
            });

        return true;
    },

};
