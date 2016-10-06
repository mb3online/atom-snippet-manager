'use babel';

import * as path from 'path';
import * as fs from 'fs';
import CSON from 'cson-parser';

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

const TARGET = '~/.atom/snippets/';
const SNIPPETS = path.join(TARGET, 'main.cson');

function walk(root) {
    return new Promise((resolve, reject) => {
        fs.readdir(root, (err, list) => {
            if (err) return reject(err);
            list.map(file => {
                const filePath = path.resolve(root, file);
                fs.stat(filePath, (err, stat) => {
                    if (err) return reject(err);
                    if (stat && stat.isDirectory()) {
                        walk(filePath).then(resolve, reject);
                    } else if (file.includes('snippet.json')) {
                        fs.symlink(TARGET, path.resolve(root, file), fid => {
                            return fid.isFile() ? resolve(fid) : reject(fid);
                        });
                    } else reject('No Snippets Found.');
                });
            });
        });
    });
}

function rewriteSnippets() {
    const snippets = fs.readFileSync('~/.atom/snippets.cson');
    let modSnippets = CSON.parse(snippets);
}

function gather() {
    atom.notifications.addInfo('Snippet Manager: Synchronizing snippets');
    const ROOT = atom.config.get('snippet-manager.root');
    if (!ROOT) return atom.notifications.addError('Snippet Manager: You must specify the root directory to search.');
    walk(ROOT).then(() => {
        rewriteSnippets();
        atom.notifications.addSuccess('Snippet Manager: Done Synchronizing snippets!');
    }, err => atom.notifications.addError(`Snippet Manager: Had an error! [${err}]`));
}

export default {
    snippetManagerView: null,
    subscriptions: null,

    activate(state) {
        this.snippetManagerView = new SnippetManagerView(state.packageViewState);
        this.subscriptions = new CompositeDisposable();
        gather();
    },

    deactivate() {
        this.subscriptions.dispose();
        this.snippetManagerView.destroy();
    },

    serialize() {
        return {snippetManagerViewState: this.snippetManagerView.serialize()};
    },

    toggle() { gather(); },
};
