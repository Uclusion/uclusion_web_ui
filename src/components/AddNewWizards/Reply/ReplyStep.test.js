import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { resolveComment, saveComment } from '../../../api/comments';
import { getQuillStoredState } from '../../TextEditors/Utilities/CoreUtils';
import messages from '../../../config/locales/en';
import ReplyStep from './ReplyStep';

jest.mock('../../../api/comments', () => ({
  saveComment: jest.fn(),
  resolveComment: jest.fn(),
  getMentionsFromText: () => [],
}));
jest.mock('../../../containers/CommentBox/CommentBox', () => () => null);
jest.mock('../WizardStepContainer', () => ({ children }) => children);
jest.mock('../../TextEditors/quillHooks', () => ({ useEditor: () => [null] }));
jest.mock('../../TextEditors/Utilities/CoreUtils', () => ({
  getQuillStoredState: jest.fn(),
  editorEmpty: (value) => !value,
  focusEditor: jest.fn(),
  resetEditor: jest.fn(),
}));
jest.mock('../../SpinBlocking/SpinningButton', () => ({ id, disabled, onClick, children }) => (
  <button id={id} disabled={disabled} onClick={onClick}>{children}</button>
));

const question = {
  id: 'question', market_id: 'workspace', group_id: 'view', investible_id: 'job',
  inline_market_id: 'options', created_by: 'ai', comment_type: 'QUESTION',
};
const reply = { id: 'reply', market_id: 'workspace', group_id: 'view', investible_id: 'job',
  comment_type: 'REPLY', reply_id: question.id, root_comment_id: question.id };

function renderReply(overrides = {}, bannedAI = false) {
  const dispatch = jest.fn();
  const providers = [
    [CommentsContext, [{ workspace: [{ ...question, ...overrides }] }, dispatch]],
    [InvestiblesContext, [{
      job: { investible: { id: 'job' }, market_infos: [{ market_id: 'workspace', assigned: [] }] },
      option: { investible: { id: 'option' }, market_infos: [{ market_id: 'options' }] },
    }, dispatch]],
    [MarketStagesContext, [{}, dispatch]],
    [MarketPresencesContext, [{ workspace: [
      { id: 'ai', market_banned: bannedAI }, { id: 'human', email: 'human@example.com', current_user: true },
    ] }, dispatch]],
    [MarketGroupsContext, [{}, dispatch]],
    [MarketsContext, [{ marketDetails: [{ id: 'workspace', market_type: 'PLANNING' }] }, dispatch]],
    [NotificationsContext, [{ messages: [] }, dispatch]],
    [OperationInProgressContext, [false, dispatch]],
    [SearchResultsContext, [{ search: '', results: [], parentResults: [] }, dispatch]],
  ];
  const step = providers.reduceRight((children, [Context, value]) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  ), <ReplyStep marketId="workspace" commentId="question" />);
  let renderer;
  act(() => {
    renderer = TestRenderer.create(
      <MemoryRouter><IntlProvider locale="en" messages={messages}>{step}</IntlProvider></MemoryRouter>
    );
  });
  return renderer;
}

describe('question reply actions', () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    saveComment.mockReset().mockResolvedValue(reply);
    resolveComment.mockReset().mockResolvedValue({ ...question, resolved: true });
    getQuillStoredState.mockReturnValue('<p>This question is no longer needed.</p>');
  });

  it('offers all three choices and closes only after the reply is saved', async () => {
    let saveReply;
    saveComment.mockReturnValue(new Promise((resolve) => { saveReply = resolve; }));
    const renderer = renderReply();
    const buttons = renderer.root.findAllByType('button');
    expect(buttons.map((button) => button.children.join(''))).toEqual([
      'Send', 'Send and delegate', 'Send and close',
    ]);
    expect(JSON.stringify(renderer.toJSON())).toContain(messages.questionReplyCloseHint);
    let closing;
    act(() => { closing = buttons[2].props.onClick(); });
    expect(resolveComment).not.toHaveBeenCalled();
    await act(async () => { saveReply(reply); await closing; });
    expect(saveComment).toHaveBeenCalledTimes(1);
    expect(resolveComment).toHaveBeenCalledWith('workspace', 'question', true);
    renderer.unmount();
  });

  it('keeps Send and Send and delegate behavior', async () => {
    for (const [id, expectedResolves] of [['OnboardingWizardNext', 0], ['OnboardingWizardOtherNext', 1]]) {
      saveComment.mockClear();
      resolveComment.mockClear();
      const renderer = renderReply();
      await act(async () => { await renderer.root.findByProps({ id }).props.onClick(); });
      expect(saveComment).toHaveBeenCalledTimes(1);
      expect(resolveComment).toHaveBeenCalledTimes(expectedResolves);
      if (expectedResolves) expect(resolveComment).toHaveBeenCalledWith('workspace', 'question', false);
      renderer.unmount();
    }
  });

  it('does not close the question when saving its reply fails', async () => {
    saveComment.mockRejectedValue(new Error('Reply was not saved'));
    const renderer = renderReply();
    await act(async () => {
      await expect(renderer.root.findByProps({ id: 'OnboardingWizardAdditionalNext' }).props.onClick())
        .rejects.toThrow('Reply was not saved');
    });
    expect(resolveComment).not.toHaveBeenCalled();
    renderer.unmount();
  });

  it('requires a reply and only offers close alongside delegation', () => {
    getQuillStoredState.mockReturnValue('');
    const empty = renderReply();
    expect(empty.root.findAllByType('button').every((button) => button.props.disabled)).toBe(true);
    empty.unmount();
    const humanQuestion = renderReply({ created_by: 'human' });
    expect(humanQuestion.root.findAllByType('button').map((button) => button.children.join('')))
      .toEqual(['Send', 'Send and resolve']);
    expect(JSON.stringify(humanQuestion.toJSON())).not.toContain(messages.questionReplyCloseHint);
    humanQuestion.unmount();
    const bannedAuthor = renderReply({}, true);
    expect(bannedAuthor.root.findAllByType('button').map((button) => button.children.join('')))
      .toContain('Send and close');
    expect(JSON.stringify(bannedAuthor.toJSON())).toContain(messages.questionReplyCloseHint);
    bannedAuthor.unmount();
  });
});
