import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { QUESTION_TYPE } from '../../../constants/comments';
import messages from '../../../config/locales/en';
import DecisionApproveStep from './DecisionApproveStep';

const mockToastErrorAndThrow = jest.fn();
const mockUpdateInvestment = jest.fn();
const mockWizardStepButtons = jest.fn(() => null);

jest.mock('../../../api/marketInvestibles', () => ({
  updateInvestment: (...args) => mockUpdateInvestment(...args),
}));
jest.mock('../../../utils/userMessage', () => ({
  toastErrorAndThrow: (...args) => mockToastErrorAndThrow(...args),
}));
jest.mock('../WizardStepButtons', () => (props) => mockWizardStepButtons(props));
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
jest.mock('../../../pages/Investible/Voting/AddInitialVote', () => () => null);
jest.mock('../../InboxWizards/Approval/JobApproveStep', () => ({
  getJobApproveEditorName: () => 'approval-editor',
}));
jest.mock('./ApprovalWizard', () => ({ commonQuick: jest.fn() }));
jest.mock('../DecisionComment/AddCommentStep', () => ({
  hasDecisionComment: () => false,
}));
jest.mock('../../InboxWizards/JobDescription', () => () => null);

function renderStep(parentResolved) {
  const parentMarketId = 'parent-market';
  const parentComment = {
    id: 'parent-question',
    comment_type: QUESTION_TYPE,
    resolved: parentResolved,
    investible_id: 'parent-job',
    group_id: 'parent-view',
  };
  const dispatch = jest.fn();

  ReactDOMServer.renderToStaticMarkup(
    <MemoryRouter>
      <OperationInProgressContext.Provider value={[false, jest.fn()]}>
        <NotificationsContext.Provider value={[{ messages: [] }, dispatch]}>
          <MarketPresencesContext.Provider value={[{}, dispatch]}>
            <CommentsContext.Provider value={[{ [parentMarketId]: [parentComment] }, dispatch]}>
              <DecisionApproveStep
                market={{
                  id: 'inline-market',
                  parent_comment_id: parentComment.id,
                  parent_comment_market_id: parentMarketId,
                }}
                investibleId="option-id"
                formData={{ approveQuantity: 4 }}
              />
            </CommentsContext.Provider>
          </MarketPresencesContext.Provider>
        </NotificationsContext.Provider>
      </OperationInProgressContext.Provider>
    </MemoryRouter>
  );
}

describe('DecisionApproveStep', () => {
  beforeEach(() => {
    mockToastErrorAndThrow.mockReset();
    mockUpdateInvestment.mockReset();
    mockWizardStepButtons.mockClear();
  });

  it('reports a question resolved underneath the open vote wizard', () => {
    renderStep(false);
    renderStep(true);

    const buttons = mockWizardStepButtons.mock.calls[1][0];
    buttons.onNext();

    expect(mockToastErrorAndThrow).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Question resolved' }),
      'errorQuestionResolved'
    );
    expect(messages.errorQuestionResolved).toBe('This question has been resolved');
    expect(mockUpdateInvestment).not.toHaveBeenCalled();
  });

  it('labels an inactive-market race as a resolved question', () => {
    mockUpdateInvestment.mockReturnValue(new Promise(() => {}));
    renderStep(false);

    const buttons = mockWizardStepButtons.mock.calls[0][0];
    buttons.onNext();

    expect(mockUpdateInvestment).toHaveBeenCalledWith(
      expect.objectContaining({ marketId: 'inline-market', investibleId: 'option-id' }),
      'errorQuestionResolved'
    );
  });
});
