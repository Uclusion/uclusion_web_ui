import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { TODO_TYPE } from '../../../constants/comments';
import messages from '../../../config/locales/en';
import AddCommentStep from './AddCommentStep';

const mockCommentAdd = jest.fn(() => null);
const mockJobDescription = jest.fn(() => null);

jest.mock('../../Comments/CommentAdd', () => ({
  __esModule: true,
  default: (props) => mockCommentAdd(props),
  hasCommentValue: () => false,
}));
jest.mock('../../InboxWizards/JobDescription', () => (props) => mockJobDescription(props));
jest.mock('../../Avatars/GravatarGroup', () => () => null);
jest.mock('../WizardStepContainer', () => (props) => props.children);
jest.mock('../WizardStylesContext', () => {
  const React = require('react');
  return {
    WizardStylesContext: React.createContext({
      introText: 'introText',
      introSubText: 'introSubText',
      borderBottom: 'borderBottom',
    }),
  };
});

const MARKET_ID = 'workspace';
const JOB_ID = 'job';
const OPTION_ID = 'option';

function renderStep(extraProps = {}) {
  const dispatch = jest.fn();
  const jobTask = { id: 'task', comment_type: TODO_TYPE, investible_id: JOB_ID, market_id: MARKET_ID };
  ReactDOMServer.renderToStaticMarkup(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <OperationInProgressContext.Provider value={[false, jest.fn()]}>
          <NotificationsContext.Provider value={[{ messages: [] }, dispatch]}>
            <MarketsContext.Provider value={[{ marketDetails: [] }, dispatch]}>
              <MarketStagesContext.Provider value={[{}, dispatch]}>
                <InvestiblesContext.Provider value={[{}, dispatch]}>
                  <CommentsContext.Provider value={[{ [MARKET_ID]: [jobTask] }, dispatch]}>
                    <AddCommentStep marketId={MARKET_ID} investibleId={JOB_ID} groupId="view" useType={TODO_TYPE}
                                    presences={[]} subscribed={[]} {...extraProps}/>
                  </CommentsContext.Provider>
                </InvestiblesContext.Provider>
              </MarketStagesContext.Provider>
            </MarketsContext.Provider>
          </NotificationsContext.Provider>
        </OperationInProgressContext.Provider>
      </IntlProvider>
    </MemoryRouter>
  );
  return {
    editor: mockCommentAdd.mock.calls[mockCommentAdd.mock.calls.length - 1][0],
    job: mockJobDescription.mock.calls.find(([props]) => props.investibleId === JOB_ID)[0],
  };
}

describe('AddCommentStep', () => {
  beforeEach(() => {
    mockCommentAdd.mockClear();
    mockJobDescription.mockClear();
  });

  it('gives a task made from an option its own draft and only that option', () => {
    // B-all-675: the job's shared task draft, even an emptied one, replaced the prefilled option
    // link, and the job's other tasks showed as a Tasks section above the one option
    const { editor, job } = renderStep({ decisionInvestibleId: OPTION_ID, decisionMarketId: 'inline' });
    expect(editor.nameDifferentiator).toBe(`jobComment${TODO_TYPE}${OPTION_ID}`);
    expect(editor.fromDecisionInvestibleId).toBe(OPTION_ID);
    expect(job.comments).toBeUndefined();
  });

  it('keeps a plain task on the job draft with the job tasks shown', () => {
    const { editor, job } = renderStep();
    expect(editor.nameDifferentiator).toBe(`jobComment${TODO_TYPE}`);
    expect(job.comments.map((comment) => comment.id)).toEqual(['task']);
  });
});
