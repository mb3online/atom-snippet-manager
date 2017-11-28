'use babel';

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import axios from 'axios';
import CSON from 'season';
import mkdirp from 'mkdirp';
import { reject, isNil, mergeDeepRight } from 'ramda';

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
            Promise.all(
                files.map(file => {
                    return new Promise(resolve => {
                        try {
                            fs.symlink(
                                file,
                                path.join(TARGET, path.basename(file)),
                                fid => resolve(fid)
                            );
                        } catch (e) {
                            console.log(e);
                        }
                    });
                })
            )
        );
    }

    readSnippets() {
        return fs.readdirSync(TARGET).map(file => {
            if (path.basename(file, '.cson') !== file)
                return CSON.readFileSync(path.join(TARGET, file));
            else if (path.basename(file, '.json') !== file)
                return JSON.parse(
                    fs.readFileSync(path.join(TARGET, file), 'utf8')
                );
        });
    }

    merge(destination, ...sources) {

        return reject(isNil, sources).reduce(mergeDeepRight, destination);
    }

    getGistSnippets() {
        const username = atom.config.get('snippet-manager:gist');
        if (!username) return [];
        const token = atom.config.get('snippet-manager:gtoken');
        const options = {
            baseURL: 'https://api.github.com',
            withCredentials: !!token,
            auth: {
                username: username,
                password: token,
            },
            headers: {
                'x-gitHub-media-type': 'github.v3',
                'x-oauth-scopes': 'gist',
                'x-ratelimit-limit': 5000,
            },
        };

        if (!token) delete options.auth;

        return axios
            .get(token ? '/gists' : `/users/${username}/gists`, options)
            .then(response => {
                const { data } = response;
                const dups = [];

                let d = data
                    .map(gist => {
                        return Object.keys(gist.files)
                            .filter(file => {
                                const lang = gist.files[file].language;
                                if (!lang) return false;
                                return (
                                    lang.toLowerCase() === 'cson' ||
                                    lang.toLowerCase() === 'json'
                                );
                            })
                            .filter(filename => filename.includes('snippet'))
                            .map(file => {
                                dups.push(file);

                                return {
                                    filename: file,
                                    id: gist.id,
                                };
                            });
                    })
                    .filter(obj => !dups.includes(obj.filename));

                if (d.length > 0) d = d.reduce((a, b) => a.concat(...b));

                return d;
            })
            .then(files => {
                return Promise.all(
                    files.map(file =>
                        axios
                            .get(`/gists/${file.id}`, options)
                            .then(response => {
                                const { data } = response;

                                return data.files[file.filename];
                            })
                    )
                );
            })
            .then(files => {
                return files.map(file => {
                    try {
                        return file.language.toLowerCase() === 'cson'
                            ? CSON.parse(file.content)
                            : JSON.parse(file.content);
                    } catch (e) {
                        atom.notifications.addError(
                            `Could not parse ${file.filename} : ${e.message}`
                        );
                    }
                });
            });
    }

    getGitlabSnippets() {
        return [];
    }

    async write() {
        const snippetCSON = path.join(os.homedir(), '.atom', 'snippets.cson');
        const snippetJSON = path.join(os.homedir(), '.atom', 'snippets.json');
        let main;
        try {
            main = CSON.readFileSync(snippetCSON);
        } catch (e) {
            main = {};
        }

        const snippets = [].concat(this.readSnippets(), this.getGistSnippets());

        main = this.merge(main, ...snippets);

        !atom.config.get('snippet-manager:json')
            ? CSON.writeFileSync(snippetCSON, main)
            : fs.writeFileSync(snippetJSON, JSON.stringify(main, null, 2));
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
