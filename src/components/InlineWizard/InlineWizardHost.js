import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { InlineWizardContext } from './InlineWizardContext';
import {
  APPROVAL_WIZARD_TYPE,
  BUG_WIZARD_TYPE,
  DELETE_COMMENT_TYPE,
  DISCUSSION_WIZARD_TYPE,
  JOB_COMMENT_WIZARD_TYPE,
  JOB_EDIT_WIZARD_TYPE,
  JOB_WIZARD_TYPE
} from '../../constants/markets';
import JobCommentWizard from '../AddNewWizards/JobComment/JobCommentWizard';
import ApprovalWizard from '../AddNewWizards/Approval/ApprovalWizard';
import JobWizard from '../AddNewWizards/Job/JobWizard';
import JobEditWizard from '../AddNewWizards/JobEdit/JobEditWizard';
import BugWizard from '../AddNewWizards/Bug/BugWizard';
import DiscussionWizard from '../AddNewWizards/Discussion/DiscussionWizard';
import DeleteWizard from '../AddNewWizards/Delete/DeleteWizard';

/**
 * J-all-325: wizards that used to open on the full-screen /wizard route now open inside their
 * container (the planning investible or planning dialog screen). Launch sites set a piece of
 * state local to the screen (see openInlineWizard) and the screen renders InlineWizardHost in
 * place of the tab body. The open-state is intentionally NOT in the URL so that navigating away
 * and back shows the page as it normally displays (T-all-2188).
 */

function InlineWizardDispatch(props) {
  const { wizardType, marketId, groupId, investibleId, commentType, notificationType, jobType, voteFor, commentId,
    isInbox } = props;
  switch (wizardType) {
    case JOB_COMMENT_WIZARD_TYPE:
      return <JobCommentWizard investibleId={investibleId} marketId={marketId} commentType={commentType}
                               notificationType={notificationType} isInline />;
    case APPROVAL_WIZARD_TYPE:
      return <ApprovalWizard marketId={marketId} groupId={groupId} investibleId={investibleId} voteFor={voteFor}
                             isInline />;
    case JOB_WIZARD_TYPE:
      return <JobWizard marketId={marketId} groupId={groupId} jobType={jobType} useType={commentType} />;
    case JOB_EDIT_WIZARD_TYPE:
      // T-all-2215: edit job (name + description) opens inline, replacing the Overview tab body
      // (Q-all-159, O-2). The edit step closes the inline view itself on update/cancel.
      return <JobEditWizard marketId={marketId} investibleId={investibleId} />;
    case BUG_WIZARD_TYPE:
      return <BugWizard marketId={marketId} groupId={groupId} commentType={commentType} />;
    case DISCUSSION_WIZARD_TYPE:
      return <DiscussionWizard marketId={marketId} groupId={groupId} commentType={commentType} />;
    case DELETE_COMMENT_TYPE:
      return <DeleteWizard marketId={marketId} commentId={commentId} isInbox={isInbox} />;
    default:
      return null;
  }
}

function InlineWizardHost(props) {
  const { inlineWizard, onClose } = props;
  if (_.isEmpty(inlineWizard)) {
    return null;
  }
  return (
    <InlineWizardContext.Provider value={{ closeInlineWizard: onClose }}>
      <InlineWizardDispatch {...inlineWizard} />
    </InlineWizardContext.Provider>
  );
}

InlineWizardHost.propTypes = {
  inlineWizard: PropTypes.object,
  onClose: PropTypes.func.isRequired
};

export default InlineWizardHost;
