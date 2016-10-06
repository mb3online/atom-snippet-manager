'use babel';

export default class SnippetManagerView {

    constructor() {
        this.element = document.createElement('div');
        this.element.classList.add('snippet-manager');
    }

    serialize() {}

    destroy() { this.element.remove(); }

    getElement() { return this.element; }

}
