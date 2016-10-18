'use babel';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import CSON from 'season';
import mkdirp from 'mkdirp';
import {keys, extend} from 'lodash';

const TARGET = path.resolve(os.homedir(), '.atom/snippets');

export default class Manager {
    constructor(root) {
        this._path = root.replace(/~/, os.homedir());
    }

    gather(cb) {
        this.files = new Promise((resolve, reject) => {
            this.walk(this._path, (err, files) => {
                if (err) reject(err);
                console.log(files);
                if (cb) cb(files);
                resolve(files);
            });
        });

        return this;
    }

    symlink() {
        try { fs.statSync(TARGET); }
        catch (e) { mkdirp.sync(TARGET); }

        return this.files.then(files =>
            Promise.all(files.map(file => {
                return new Promise(resolve => {
                    try {
                        fs.symlink(file, path.join(TARGET, path.basename(file)), fid => resolve(fid))
                    } catch (e) {
                        console.log(e);
                    }
                });
            })));
    }

    readSnippets() {
        return fs.readdirSync(TARGET).map(file => {
            if (path.basename(file, '.cson') !== file)
                return CSON.readFileSync(path.join(TARGET, file));
            else if (path.basename(file, '.json' !== file))
                return JSON.parse(fs.readFileSync(path.join(TARGET, file), 'utf8'));
        });
    }

    merge(destination, ...sources) {
        sources.map(source => {
                keys(source).map(key => {
                        console.log(sources);
                        console.log(source);
                        console.log(key);
                        if (typeof source[key] === 'object') {
                            if (!destination[key]) destination[key]= {};
                            this.merge(destination[key], source[key]);
                        }
                    });
                extend(destination, source);
            });
        return destination;
    }

    write() {
        const snippetCSON = path.join(os.homedir(), '.atom', 'snippets.cson');
        const snippetJSON = path.join(os.homedir(), '.atom', 'snippets.json');
        let main;
        try { main = CSON.readFileSync(snippetCSON); }
        catch (e) { main = {}; }

        main = this.merge(main, ...this.readSnippets());

        (!atom.config.get('snippet-manager:json')) ?
            CSON.writeFileSync(snippetCSON, main) :
            fs.writeFileSync(snippetJSON, JSON.stringify(main, null, '  '));
    }

    walk(dir, done) {
        let results = [];
        try {
            fs.readdir(dir, (err, list) => {
                let pending = list.length;
                if (!pending) return done(null, results);
                list.map(file => {
                    const filePath = path.resolve(dir, file);
                    fs.stat(filePath, (err, fid) => {
                        if (fid && fid.isDirectory()) {
                            this.walk(filePath, (err, res) => {
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
        } catch (e) {
            console.log(e);
        }
    }
}
