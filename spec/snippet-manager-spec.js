'use babel';

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

import SnippetManager from '../lib/snippet-manager';

describe('SnippetManager', () => {
  let workspaceElement, activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    activationPromise = atom.packages.activatePackage('snippet-manager');
  });

  describe('when the snippet-manager:toggle event is triggered', () => {
      it('should toggle',() => {
         expect(SnippetManager.toggle()).toBeTruthy();
      });
  });
});
