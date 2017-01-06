# Atom Snippet Manager package

A simple Atom package to manage snippet files automatically

## Settings

Directory: `string`
> The directory to recusively search for snippet files.

JSON: `boolean` | `default : false`
> Output the snippets file as JSON rather than CSON

## Usage

Name any file with the convention `<name>.snippet.(cson|json)` and they will be entered into the snippets file after running cmd+opt+ctl+s.

To run the package on startup add `atom.commands.dispatch(document.querySelector('atom-workspace'), 'snippet-manager:toggle')` to the atom `init.coffee` file(. 😖)
