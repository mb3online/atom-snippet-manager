'use babel';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import Manager from '../lib/manager';

describe('Manager', () => {
    let manager;

    beforeEach(() => manager = new Manager(__dirname));

    it('should be able to fetch files from the root directory', () => {
        manager.gather(files => {
            expect(files.length).toBe(1);
        });
    });

    it('should be able to symlink files', () => {
        const sym = manager.gather().symlink();
        console.log(sym);
        waitsForPromise(() =>
            sym.then(() =>
                fs.readdirSync(path.join(os.homedir(), '/.atom/snippets'), (err, files) => {
                    expect(files.length).toBe(1);
                    done();
                })));
    });

    it('should be able to rewrite the snippets file', () => {
        const sym = manager.gather().symlink();
        const done = () => {
            manager.write();

            expect(fs.readFileSync(path.join(os.homedir(), '.atom', 'snippets.cson'))
                            .toString()
                            .includes('DocBlock'))
                                .toBeTruthy();
        };
        waitsForPromise(() => sym.then(done, done));
    });

    it('should be able to get snippets from gists', () => {
        atom.config.set('snippet-manager:gist', 'ericadamski');
        waitsForPromise(() =>
            manager.getGistSnippets()
                .then(data => expect(data.length).toBe(2)));
    });

    it('shouldn\'t break if no github username selected', () => {
        atom.config.set('snippet-manager:gist', 'lol');
        waitsForPromise(() =>
            manager.getGistSnippets()
                .then(data => expect(data.length).toBe(0)));
        // atom.config.set('snippet-manager:gist', 'ericadamski');
    });
});
