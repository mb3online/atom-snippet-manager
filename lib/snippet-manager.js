'use babel';

import SnippetManagerView from './snippet-manager-view';
import { CompositeDisposable } from 'atom';

/* eslint-disable no-undef */

export const config = {
    root: {
        title: 'Directory',
        description: 'The directory to recursively search and symlink snippet files.',
        type: 'string',
        default: '',
    },
};

export default {

    snippetManagerView: null,
    subscriptions: null,

    activate(state) {
        this.snippetManagerView = new SnippetManagerView(state.snippetManagerViewState);

        // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
        this.subscriptions = new CompositeDisposable();

        // Register command that toggles this view
        this.subscriptions.add(atom.commands.add('atom-workspace',
            {'snippet-manager:toggle': () => this.toggle()}));
    },

    deactivate() {
        this.subscriptions.dispose();
        this.snippetManagerView.destroy();
    },

    serialize() {
        return {snippetManagerViewState: this.snippetManagerView.serialize()};
    },

    toggle() {
        console.log('SnippetManager was toggled!');
    },

};
