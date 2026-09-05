import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import DecideResponseStep from './DecideResponseStep';

jest.mock('../WizardStepContainer', () => ({ children }) => children);
jest.mock('../WizardStepButtons', () => () => null);
jest.mock('../../Comments/Comment', () => ({ comment, useCompression }) => (
  <article>{useCompression ? 'Question context' : comment.body}</article>
));
jest.mock('../../Descriptions/DescriptionOrDiff', () => () => null);
jest.mock('../../TextEditors/Utilities/CoreUtils', () => ({ editorEmpty: (description) => !description }));
jest.mock('../../Comments/Options', () => ({ getNewBugNotifications: () => [] }));
jest.mock('../../../pages/Dialog/Planning/MarketTodos', () => ({ todoClasses: () => ({}) }));
jest.mock('../../AddNewWizards/Reply/ReplyStep', () => ({ hasReply: () => false }));
jest.mock('../../../pages/Investible/Planning/PlanningInvestible', () => ({
  usePlanningInvestibleStyles: () => ({})
}));

function renderNotification(commentType, includeQuestion = true) {
  const info = {
    id: 'info', investible_id: 'option', comment_type: commentType,
    body: 'Please record your vote for this verification scope.', is_sent: true
  };
  const unrelated = { ...info, id: 'unrelated', body: 'Another option thread.' };
  const contexts = [
    [CommentsContext, {
      inline: [info, unrelated],
      planning: includeQuestion ? [{ id: 'question', comment_type: 'QUESTION', body: 'Verification scope?' }] : []
    }],
    [MarketsContext, { marketDetails: [{
      id: 'inline', market_type: 'DECISION',
      parent_comment_id: 'question', parent_comment_market_id: 'planning'
    }] }],
    [InvestiblesContext, { option: {
      investible: { id: 'option', name: 'Verify editor sync' },
      market_infos: [{ market_id: 'inline', investible_id: 'option' }]
    } }],
    [NotificationsContext, {}],
    [MarketPresencesContext, {}],
    [MarketStagesContext, {}],
    [SearchResultsContext, {}],
    [OperationInProgressContext, false]
  ];
  const wizard = <DecideResponseStep marketId="inline" commentId="info"
    message={{ decision_investible_id: 'option', type_object_id: 'UNREAD_COMMENT_info' }}
    formData={{ useCompression: true }} />;
  const tree = contexts.reduceRight((children, [Context, state]) => (
    <Context.Provider value={[state, jest.fn()]}>{children}</Context.Provider>
  ), wizard);
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(
    <IntlProvider locale="en" messages={{
      DecideResponseTitle: 'How do you respond?', inOptionLabel: 'In option',
      taskSection: 'Tasks', openTodosTip: 'Open tasks'
    }}>
      <ThemeProvider theme={createTheme()}><MemoryRouter>{tree}</MemoryRouter></ThemeProvider>
    </IntlProvider>
  ));
  const html = container.innerHTML;
  act(() => root.unmount());
  return html;
}

describe('option-comment notification', () => {
  beforeAll(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => { delete globalThis.IS_REACT_ACT_ENVIRONMENT; });
  it.each(['TODO', 'ISSUE'])('shows the selected %s comment immediately beneath its option', (commentType) => {
    const html = renderNotification(commentType);
    expect(html).toContain('Verify editor sync');
    expect(html).toContain('Question context');
    expect(html).toContain('Please record your vote for this verification scope.');
    expect(html).not.toContain('Another option thread.');
    expect(html).not.toContain('id="tasksOverview"');
  });

  it('keeps the option Info visible while parent-question context is loading', () => {
    const html = renderNotification('TODO', false);
    expect(html).toContain('Please record your vote for this verification scope.');
    expect(html).not.toContain('Question context');
  });
});
