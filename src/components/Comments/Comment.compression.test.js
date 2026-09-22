import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import CompressedDescription from '../InboxWizards/CompressedDescription';
import { useCommentStyles } from './Comment';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

jest.mock('quill', () => {
  function Quill() {}
  Quill.import = () => function QuillImport() {};
  Quill.register = () => {};
  return Quill;
});
jest.mock('../TextEditors/ReadOnlyQuillEditor', () => () => null);
jest.mock('./CommentEdit', () => () => null);
jest.mock('../TextEditors/DiffDisplay', () => () => null);
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  isMyPokableComment: () => false,
}));
jest.mock('../../containers/CommentBox/InlineInitiativeBox', () => () => null);
jest.mock('./Options', () => () => null);
jest.mock('./Reply', () => () => null);
jest.mock('../../pages/Investible/Planning/CondensedTodos', () => () => null);
jest.mock('../AddNewWizards/Reply/ReplyStep', () => ({
  hasReply: () => false,
}));
jest.mock('../AddNewWizards/TaskInProgress/TaskInProgressWizard', () => ({
  previousInProgress: () => [],
}));
jest.mock('../Buttons/PokeAIButton', () => ({
  __esModule: true,
  default: () => null,
  isPokeAICommentType: () => false,
}));

const messages = {
  rowExpandDescription: 'Expand the description',
  commentCloseThreadLabel: 'Collapse',
  commentCloseThreadLabelExplanation: 'Collapse this',
};

function sheetText() {
  return Array.from(document.querySelectorAll('style')).map((node) => node.textContent).join('\n');
}

function PreviewProbe() {
  const classes = useCommentStyles();
  return <div className={classes.compressedComment}>Suggestion preview</div>;
}

describe('inbox wizard compression', () => {
  it('clamps a compressed comment to the seven-line allowance', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <ThemeProvider theme={createTheme()}>
          <PreviewProbe />
        </ThemeProvider>
      );
    });

    expect(container.textContent).toContain('Suggestion preview');
    const css = sheetText();
    expect(css).toMatch(/-webkit-line-clamp:\s*7/);
    expect(css).toMatch(/compressedComment[^}]*white-space:\s*normal/);
    expect(css).not.toMatch(/compressedComment[^}]*white-space:\s*nowrap/);

    await act(async () => root.unmount());
  });

  it('previews three description lines and collapses the expansion', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const description = Array.from({ length: 6 }, (_, index) => `<p>Description line ${index}.</p>`).join('');

    await act(async () => {
      root.render(
        <ThemeProvider theme={createTheme()}>
          <IntlProvider locale="en" messages={messages}>
            <OperationInProgressContext.Provider value={[false, () => {}]}>
              <CompressedDescription description={description} expansionPanel={<div>Full description</div>} />
            </OperationInProgressContext.Provider>
          </IntlProvider>
        </ThemeProvider>
      );
    });

    const expansion = Array.from(container.querySelectorAll('div')).find((node) =>
      node.textContent.includes('Full description') && node.style.display);
    expect(expansion.style.display).toBe('none');
    expect(sheetText()).toMatch(/-webkit-line-clamp:\s*3/);

    await act(async () => {
      container.querySelector('#rowExpandDescription').click();
    });
    expect(expansion.style.display).toBe('block');
    expect(container.textContent).toContain('Collapse');

    const collapse = Array.from(container.querySelectorAll('button')).find((node) =>
      node.textContent.includes('Collapse'));
    await act(async () => {
      collapse.click();
    });
    expect(expansion.style.display).toBe('none');

    await act(async () => root.unmount());
  });
});
