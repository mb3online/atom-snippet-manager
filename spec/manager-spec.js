'use babel';

require('dotenv').config();

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import Manager from '../lib/manager';

describe('Manager', () => {
    let manager;

    beforeEach(() => (manager = new Manager(__dirname)));

    it('should be able to get snippets from secret gists', () => {
        atom.config.set('snippet-manager:gist', 'ericadamski');
        atom.config.set('snippet-manager:gtoken', process.env.ACCESS_TOKEN);

        waitsForPromise(() =>
            manager.getGistSnippets().then(data => {
                atom.config.set('snippet-manager:gtoken', '');
                expect(data.length).toBe(2);
            })
        );
    });

    it('should be able to fetch files from the root directory', () => {
        manager.gather(files => {
            expect(files.length).toBe(1);
        });
    });

    describe('.merge', () => {
        it('should not fail if undefined or null is present', () => {
            const destination = {};
            const sources = [
                null,
                {
                    js: { banana: '🍌' },
                },
                undefined,
                {
                    js: { orange: '🍎' },
                },
                {
                    clojure: {
                        body: 'asdasd',
                        name: 'hello',
                    },
                },
            ];

            // Act
            const result = manager.merge(destination, ...sources);

            // Assert
            expect(result).toBeInstanceOf(Object);
        });

        it('should deep merge all sources into the destination object', () => {
            // Arrange
            const destination = {};
            const sources = [
                {
                    js: { banana: '🍌' },
                },
                {
                    js: { orange: '🍎' },
                },
                {
                    clojure: {
                        body: 'asdasd',
                        name: 'hello',
                    },
                },
            ];

            // Act
            const result = manager.merge(destination, ...sources);

            // Assert
            expect(result).toEqual({
                js: {
                    banana: '🍌',
                    orange: '🍎',
                },
                clojure: {
                    body: 'asdasd',
                    name: 'hello',
                },
            });
        });
    });

    it('should be able to symlink files', () => {
        const sym = manager.gather().symlink();
        waitsForPromise(() =>
            sym.then(() =>
                fs.readdir(
                    path.join(os.homedir(), '/.atom/snippets'),
                    (err, files) => {
                        expect(files.length).toBe(1);
                    }
                )
            )
        );
    });

    it('should be able to rewrite the snippets file', () => {
        atom.config.set('snippet-manager:gist', 'ericadamski');
        const sym = manager.gather().symlink();

        const done = () => {
            manager.write();

            expect(
                fs
                    .readFileSync(
                        path.join(os.homedir(), '.atom', 'snippets.cson')
                    )
                    .toString()
                    .includes('DocBlock')
            ).toBeTruthy();
        };

        waitsForPromise(() => sym.then(done, done));
    });

    it('should be able to get snippets from gists', () => {
        atom.config.set('snippet-manager:gist', 'ericadamski');
        waitsForPromise(() =>
            manager.getGistSnippets().then(data => expect(data.length).toBe(2))
        );
    });

    it("shouldn't break if no github username selected", () => {
        atom.config.set('snippet-manager:gist', 'lol');
        waitsForPromise(() =>
            manager.getGistSnippets().then(data => expect(data.length).toBe(0))
        );
    });
});
