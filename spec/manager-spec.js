'use babel';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import Manager from '../lib/manager';

describe('Manager', () => {
    let manager;

    beforeEach(() => manager = new Manager('~/MB3'));

    it('should be able to fetch files from the root directory', () => {
        manager.gather(files => {
            expect(files.length).toBe(1);
        });
    });

    it('should be able to symlink files', (done) => {
        waitsForPromise(() =>
            manager.gather().symlink().then(() =>
                fs.readdirSync(path.join(os.homedir(), '/.atom/snippets'), (err, files) => {
                    expect(files.length).toBe(1);
                    done();
                })));
    });

    it('should be able to rewrite the snippets file', () => {
        waitsForPromise(() => {
            manager.gather().symlink().then(() => {
                manager.write();

                expect(fs.readFileSync(path.join(os.homedir(), '.atom', 'snippets.cson'), 'utf8')
                                .includes(''))
                                    .toBeTruthy();
            });
        });
    });
});
