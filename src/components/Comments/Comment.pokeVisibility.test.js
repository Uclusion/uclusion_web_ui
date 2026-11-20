import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { ScrollContext } from '../../contexts/ScrollContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { ACTIVE_STAGE, PLANNING_TYPE } from '../../constants/markets';
import messages from '../../config/locales/en';
import Comment from './Comment';

jest.mock('quill', () => {
  function Quill() {}
  Quill.import = () => function QuillImport() {};
  Quill.register = () => {};
  return Quill;
});
jest.mock('../TextEditors/ReadOnlyQuillEditor', () => () => null);
jest.mock('./CommentEdit', () => () => null);
jest.mock('../TextEditors/DiffDisplay', () => () => null);
jest.mock('../TextFields/UseRelativeTime', () => () => null);
jest.mock('../Avatars/GravatarAndName', () => () => null);
jest.mock('../../pages/Dialog/InvesibleCommentLinker', () => () => null);
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  isMyPokableComment: () => false,
}));
jest.mock('../../containers/CommentBox/InlineInitiativeBox', () => () => null);
jest.mock('./Options', () => () => null);
jest.mock('./Reply', () => () => null);
jest.mock('../../pages/Investible/Planning/CondensedTodos', () => () => null);
jest.mock('../AddNewWizards/Reply/ReplyStep', () => ({ hasReply: () => false }));
jest.mock('../AddNewWizards/TaskInProgress/TaskInProgressWizard', () => ({
  previousInProgress: () => [],
}));
jest.mock('../Buttons/TooltipIconButton', () => {
  const React = require('react');
  return function MockTooltipIconButton({ id, translationId, onClick }) {
    return <button id={id} title={translationId} onClick={onClick} />;
  };
});

const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
beforeAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

function commentTree(commentType, createdBy) {
  const marketId = 'planning-market';
  const comment = {
    id: 'comment-id',
    market_id: marketId,
    group_id: 'view-id',
    created_by: createdBy,
    comment_type: commentType,
    ticket_code: 'Q-all-500',
    body: '<p>Comment body</p>',
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-28T10:00:00Z',
    notification_type: 'RED',
    resolved: false,
  };
  const noOp = () => {};
  const providers = [
    [AccountContext, [{ user: { id: 'human-user' } }, noOp]],
    [CommentsContext, [{ [marketId]: [comment] }, noOp]],
    [DiffContext, [{}, noOp]],
    [GroupMembersContext, [{}, noOp]],
    [InvestiblesContext, [{}, noOp]],
    [MarketGroupsContext, [{}, noOp]],
    [MarketPresencesContext, [{ [marketId]: [
      { id: 'ai-user', name: 'AI', email: '', investments: [] },
      { id: 'human-user', name: 'Human', email: 'human@example.com', current_user: true, investments: [] },
    ] }, noOp]],
    [MarketsContext, [{ marketDetails: [
      { id: marketId, market_type: PLANNING_TYPE, market_stage: ACTIVE_STAGE },
    ] }, noOp, { [`MARKET_${marketId}`]: 'token' }]],
    [MarketStagesContext, [{}, noOp]],
    [NotificationsContext, [{ messages: [] }, noOp]],
    [OperationInProgressContext, [false, noOp]],
    [ScrollContext, [undefined, undefined, noOp]],
    [SearchResultsContext, [{}, noOp]],
  ];
  const tree = providers.reduceRight((children, [Context, value]) => (
    <Context.Provider value={value}>{children}</Context.Provider>
  ), <Comment comment={comment} comments={[comment]} marketId={marketId} />);

  return (
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="en" messages={messages}>
        <MemoryRouter>{tree}</MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('Comment Poke AI visibility', () => {
  it.each([ISSUE_TYPE, TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE])(
    'shows Poke AI for a human %s and hides it for an AI author',
    async (commentType) => {
      const container = document.createElement('div');
      const root = createRoot(container);

      await act(async () => root.render(commentTree(commentType, 'human-user')));
      expect(container.querySelector('#pokeAIcomment-id')).not.toBeNull();

      await act(async () => root.render(commentTree(commentType, 'ai-user')));
      expect(container.querySelector('#pokeAIcomment-id')).toBeNull();

      await act(async () => root.unmount());
    }
  );
});
