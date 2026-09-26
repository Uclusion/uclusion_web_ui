import { ISSUE_TYPE, REPORT_TYPE } from '../../../constants/comments';
import BlockedWizard from '../../../components/InboxWizards/Unblock/BlockedWizard';
import { calculateTitleExpansionPanel } from './InboxExpansionPanel';

jest.mock('../../../components/InboxWizards/JobDescription', () => () => null);
jest.mock('../../../components/InboxWizards/Approval/ApprovalWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Status/StatusWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Start/StartWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Resolve/ResolveWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Unblock/BlockedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Stage/StageWizard', () => () => null);
jest.mock('../../../components/InboxWizards/WaitingAssistance/WaitingAssistanceWizard', () => () => null);
jest.mock('../../../components/InboxWizards/AssignToOther/AssignToOtherWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Monitor/EstimateChangeWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Submission/OptionSubmittedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Upgrade/UpgradeWizard', () => () => null);
jest.mock('../../../components/InboxWizards/NewGroup/NewGroupWizard', () => () => null);
jest.mock('../../../components/InboxWizards/RequestWork/RequestWorkWizard', () => () => null);
jest.mock('../../../components/InboxWizards/OptionResponse/RespondInOptionWizard', () => () => null);
jest.mock('../../../components/InboxWizards/ReviewNewTask/TaskedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Triage/TriageWizard', () => () => null);
jest.mock('../../../components/InboxWizards/JobEdited/InvestibleEditedWizard', () => () => null);

const intl = {
  formatMessage: ({ id }) => id
};

function routeAIComment(rootComment, messageOverrides = {}) {
  const message = {
    type: 'UNREAD_COMMENT',
    type_object_id: 'UNREAD_COMMENT_note-id',
    link_type: 'MARKET_COMMENT',
    alert_type: 'AI_GENERATED',
    market_id: 'market-id',
    comment_id: rootComment.id,
    ...messageOverrides
  };
  const item = { message, isAssigned: false };

  calculateTitleExpansionPanel({ item, openExpansion: true, intl, rootComment });

  return item;
}

describe('inbox comment titles and remaining wizard routing', () => {
  it('keeps the design review title without an intermediate wizard', () => {
    const item = routeAIComment({
      id: 'capsule-id',
      comment_type: REPORT_TYPE,
      notification_type: 'BLUE',
      pinned: true
    }, { link_type: 'INVESTIBLE_COMMENT' });

    expect(item.title).toBe('ReviewDesignTitle');
    expect(item.expansionPanel).toBeUndefined();
  });

  it('keeps the AI note title without an intermediate wizard', () => {
    const item = routeAIComment({ id: 'note-id', comment_type: REPORT_TYPE });

    expect(item.title).toBe('ReviewAINoteTitle');
    expect(item.expansionPanel).toBeUndefined();
  });

  it('keeps an AI-authored view issue in the unblock flow', () => {
    const item = routeAIComment({ id: 'issue-id', comment_type: ISSUE_TYPE });

    expect(item.title).toBe('DecideUnblockTitle');
    expect(item.expansionPanel.type).toBe(BlockedWizard);
  });

  it('routes a human note directly with a review title', () => {
    const item = routeAIComment(
      { id: 'note-id', comment_type: REPORT_TYPE },
      { alert_type: undefined }
    );

    expect(item.title).toBe('DecideReviewTitle');
    expect(item.expansionPanel).toBeUndefined();
  });

  it('routes another report directly without an intermediate wizard', () => {
    const item = routeAIComment(
      { id: 'report-id', comment_type: REPORT_TYPE, investible_id: 'job-id' },
      { link_type: 'INVESTIBLE_COMMENT' }
    );

    expect(item.title).toBe('DecideReviewTitle');
    expect(item.expansionPanel).toBeUndefined();
  });
});
