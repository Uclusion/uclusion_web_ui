import { ISSUE_TYPE, REPORT_TYPE } from '../../../constants/comments';
import BlockedWizard from '../../../components/InboxWizards/Unblock/BlockedWizard';
import NoteReviewWizard from '../../../components/InboxWizards/NoteReview/NoteReviewWizard';
import { calculateTitleExpansionPanel } from './InboxExpansionPanel';

jest.mock('../../../components/InboxWizards/JobDescription', () => () => null);
jest.mock('../../../components/InboxWizards/Approval/ApprovalWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Status/StatusWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Answer/AnswerWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Vote/VoteWizard', () => () => null);
jest.mock('../../../components/InboxWizards/AcceptReject/AcceptRejectWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Start/StartWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Resolve/ResolveWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Review/ReviewWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Unblock/BlockedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Stage/StageWizard', () => () => null);
jest.mock('../../../components/InboxWizards/WaitingAssistance/WaitingAssistanceWizard', () => () => null);
jest.mock('../../../components/InboxWizards/AssignToOther/AssignToOtherWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Monitor/EstimateChangeWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Reply/ReplyWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Submission/OptionSubmittedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Upgrade/UpgradeWizard', () => () => null);
jest.mock('../../../components/InboxWizards/ReplyResolve/ReplyResolveWizard', () => () => null);
jest.mock('../../../components/InboxWizards/NewGroup/NewGroupWizard', () => () => null);
jest.mock('../../../components/InboxWizards/RequestWork/RequestWorkWizard', () => () => null);
jest.mock('../../../components/InboxWizards/OptionResponse/RespondInOptionWizard', () => () => null);
jest.mock('../../../components/InboxWizards/ReviewNewTask/TaskedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/Triage/TriageWizard', () => () => null);
jest.mock('../../../components/InboxWizards/JobEdited/InvestibleEditedWizard', () => () => null);
jest.mock('../../../components/InboxWizards/NoteReview/NoteReviewWizard', () => () => null);

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

describe('inbox comment wizard routing', () => {
  it('routes a current intent/design capsule to design review', () => {
    const item = routeAIComment({
      id: 'capsule-id',
      comment_type: REPORT_TYPE,
      notification_type: 'BLUE',
      pinned: true
    }, { link_type: 'INVESTIBLE_COMMENT' });

    expect(item.title).toBe('ReviewDesignTitle');
    expect(item.expansionPanel.type).toBe(BlockedWizard);
    expect(item.expansionPanel.props).toEqual(expect.objectContaining({
      marketId: 'market-id',
      commentId: 'capsule-id',
      message: item.message
    }));
  });

  it('routes an AI-authored view note to note review', () => {
    const item = routeAIComment({ id: 'note-id', comment_type: REPORT_TYPE });

    expect(item.title).toBe('ReviewAINoteTitle');
    expect(item.expansionPanel.type).toBe(NoteReviewWizard);
    expect(item.expansionPanel.props).toEqual(expect.objectContaining({
      marketId: 'market-id',
      commentId: 'note-id',
      message: item.message
    }));
  });

  it('keeps an AI-authored view issue in the unblock flow', () => {
    const item = routeAIComment({ id: 'issue-id', comment_type: ISSUE_TYPE });

    expect(item.title).toBe('DecideUnblockTitle');
    expect(item.expansionPanel.type).toBe(BlockedWizard);
  });

  it('does not treat a human-authored view note as an AI note review', () => {
    const item = routeAIComment(
      { id: 'note-id', comment_type: REPORT_TYPE },
      { alert_type: undefined }
    );

    expect(item.title).toBe('DecideUnblockTitle');
    expect(item.expansionPanel.type).toBe(BlockedWizard);
  });

  it('does not treat another AI report notification route as a view note review', () => {
    const item = routeAIComment(
      { id: 'report-id', comment_type: REPORT_TYPE },
      { link_type: 'INVESTIBLE_COMMENT' }
    );

    expect(item.title).toBe('DecideUnblockTitle');
    expect(item.expansionPanel.type).toBe(BlockedWizard);
  });
});
