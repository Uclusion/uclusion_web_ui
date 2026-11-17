import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { Markets } from 'uclusion_sdk/src/components/markets';
import { getMarketClient } from '../../../api/marketLogin';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import JobApproveStep from './JobApproveStep';

const mockWizardStepButtons = jest.fn(() => null);

jest.mock('../../../api/marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../WizardStepButtons', () => (props) => mockWizardStepButtons(props));
jest.mock('../WizardStepContainer', () => ({ children }) => children);
jest.mock('../WizardStylesContext', () => ({ wizardStyles: () => ({}) }));
jest.mock('../../../pages/Investible/Voting/AddInitialVote', () => () => null);
jest.mock('../JobDescription', () => () => null);
jest.mock('../../AddNewWizards/JobComment/AddCommentStep', () => ({ hasJobComment: () => false }));
jest.mock('../../TextEditors/Utilities/CoreUtils', () => ({
  editorEmpty: (text) => !text,
  getQuillStoredState: () => '',
}));
jest.mock('../../../pages/Home/YourWork/WorkListItem', () => ({ dismissWorkListItem: jest.fn() }));

function renderStep(yourVote) {
  const contexts = [
    [CommentsContext, {}],
    [MarketPresencesContext, {}],
    [NotificationsContext, { messages: [] }],
    [OperationInProgressContext, false],
    [InvestiblesContext, {}],
    [MarketsContext, {}],
    [MarketStagesContext, {}],
  ];
  const step = <JobApproveStep marketId="market" investibleId="job" yourVote={yourVote}
    formData={{ approveQuantity: 100 }}
    message={{ type: 'NOT_FULLY_VOTED', type_object_id: 'NOT_FULLY_VOTED_job' }} />;
  const tree = contexts.reduceRight((children, [Context, state]) => (
    <Context.Provider value={[state, jest.fn()]}>{children}</Context.Provider>
  ), step);

  ReactDOMServer.renderToStaticMarkup(
    <MemoryRouter>
      <IntlProvider locale="en" messages={{ AssignmentApprovalTitle: 'Approve job' }}>{tree}</IntlProvider>
    </MemoryRouter>
  );
  return mockWizardStepButtons.mock.calls[0][0];
}

describe('inbox approval request', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
  });

  it.each([
    ['first approval without a capability', undefined, 0],
    ['first approval after being addressed', { investible_id: 'job', deleted: false }, 0],
    ['existing zero quantity', { investible_id: 'job', quantity: 0 }, 0],
    ['existing approval', { investible_id: 'job', quantity: 50 }, 50],
    ['deleted approval', { investible_id: 'job', quantity: 50, deleted: true }, 0],
  ])('sends the required former quantity for %s', async (_name, yourVote, formerQuantity) => {
    const doPost = jest.fn().mockResolvedValue({ data: {} });
    getMarketClient.mockResolvedValue({ markets: new Markets({ doPost }) });

    await renderStep(yourVote).onNext();

    expect(doPost).toHaveBeenCalledTimes(1);
    expect(doPost.mock.calls[0].slice(0, 3)).toEqual(['markets', 'invest', undefined]);
    expect(JSON.parse(JSON.stringify(doPost.mock.calls[0][3]))).toEqual({
      investible_id: 'job',
      quantity: 100,
      former_quantity: formerQuantity,
    });
  });
});
