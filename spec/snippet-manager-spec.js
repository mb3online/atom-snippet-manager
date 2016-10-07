'use babel';

import SnippetManager from '../lib/snippet-manager';

describe('SnippetManager', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('snippet-manager');
  });

  describe('when the snippet-manager:toggle event is triggered', () => {
      it('should create symlinks in ~/.atom/snippets directory',() => {
         expect('this should').toBe('fail');
      });
  });
});
