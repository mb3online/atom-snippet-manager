'use babel';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import CSON from 'cson-parser';
import mkdirp from 'mkdirp';
import {keys} from 'lodash'

const TARGET = path.resolve(os.homedir(), '.atom/snippets');

export default class Manager {
    constructor(root) {
        this._path = root.replace(/~/, os.homedir());
    }

    gather(cb) {
        this.files = new Promise((resolve, reject) => {
            this.walk(this._path, (err, files) => {
                if (err) reject(err);
                if (cb) cb(files);
                resolve(files);
            });
        });

        return this;
    }

    symlink() {
        try {
            fs.statSync(TARGET);
        } catch (e) {
            mkdirp.sync(TARGET);
        }

        return this.files.then(files =>
            Promise.all(files.map(file => {
                return new Promise((resolve, reject) => fs.symlink(file, path.join(TARGET, path.basename(file)), fid => {
                    if (!fid) return reject(fid);
                    resolve(fid);
                }));
            })));
    }

    readSnippets() {
        return fs.readdirSync(TARGET).map(file => {
            const data = fs.readFileSync(path.join(TARGET, file), 'utf8');

            return path.basename(file, '.cson') !== file ? CSON.parse(data) : JSON.parse(data);
        });
    }

    write() {
        const snippetCSON = path.join(os.homedir(), '.atom', 'snippets.cson');
        let main;
        try {
            main = CSON.parse(fs.readFileSync(snippetCSON).toString('utf8'));
        } catch (e) {
            main = {};
        }

        this.readSnippets().map(snippet => keys(snippet).map(key => main[key] = snippet[key]));

        fs.writeFileSync(snippetCSON, CSON.stringify(main, null, '\t'));
    }

    walk(dir, done) {
        let results = [];
        fs.readdir(dir, (err, list) => {
            if (err) return done(err);
            let pending = list.length;
            if (!pending) return done(null, results);
            list.map(file => {
                const filePath = path.resolve(dir, file);
                fs.stat(filePath, (err, stat) => {
                    if (err) return done(err);
                    if (stat && stat.isDirectory()) {
                        this.walk(filePath, (err, res) => {
                            if (err) return done(err);
                            results = results.concat(res);
                            if (!--pending) done(null, results);
                        });
                    } else {
                        if (file.match(/(.*)\.snippet\.(cson|json)/))
                            results.push(path.resolve(dir, file));
                        if (!--pending) done(null, results);
                    }
                });
            });
        });
    }
}
