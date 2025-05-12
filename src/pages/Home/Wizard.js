import React, { useContext } from 'react';
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl';
import Screen from '../../containers/Screen/Screen'
import GroupWizard from '../../components/AddNewWizards/Group/GroupWizard'
import queryString from 'query-string'
import {
  ADD_COLLABORATOR_WIZARD_TYPE,
  BUG_WIZARD_TYPE,
  DECISION_COMMENT_WIZARD_TYPE,
  DISCUSSION_WIZARD_TYPE,
  APPROVAL_WIZARD_TYPE,
  JOB_APPROVERS_WIZARD_TYPE,
  JOB_ASSIGNEE_WIZARD_TYPE,
  JOB_COLLABORATOR_WIZARD_TYPE,
  JOB_COMMENT_WIZARD_TYPE,
  JOB_STAGE_WIZARD_TYPE,
  JOB_WIZARD_TYPE,
  PLANNING_TYPE,
  WORKSPACE_WIZARD_TYPE,
  JOB_COMMENT_CONFIGURE_WIZARD_TYPE,
  OPTION_WIZARD_TYPE,
  REPLY_WIZARD_TYPE,
  COMPOSE_WIZARD_TYPE,
  SIGN_OUT_WIZARD_TYPE,
  JOB_EDIT_WIZARD_TYPE,
  OPTION_EDIT_WIZARD_TYPE,
  DELETE_COMMENT_TYPE,
  ARCHIVE_COMMENT_TYPE,
  IN_PROGRESS_WIZARD_TYPE
} from '../../constants/markets';
import WorkspaceWizard from '../../components/AddNewWizards/Workspace/WorkspaceWizard';
import JobWizard from '../../components/AddNewWizards/Job/JobWizard'
import CollaboratorWizard from '../../components/AddNewWizards/Collaborator/CollaboratorWizard';
import BugWizard from '../../components/AddNewWizards/Bug/BugWizard';
import DecisionCommentWizard from '../../components/AddNewWizards/DecisionComment/DecisionCommentWizard';
import DiscussionWizard from '../../components/AddNewWizards/Discussion/DiscussionWizard';
import JobCommentWizard from '../../components/AddNewWizards/JobComment/JobCommentWizard';
import JobAssigneeWizard from '../../components/AddNewWizards/JobAssignee/JobAssigneeWizard';
import JobCollaboratorWizard from '../../components/AddNewWizards/JobCollaborator/JobCollaboratorWizard';
import JobApproverWizard from '../../components/AddNewWizards/JobApprover/JobApproverWizard';
import JobStageWizard from '../../components/AddNewWizards/JobStage/JobStageWizard';
import ApprovalWizard from '../../components/AddNewWizards/Approval/ApprovalWizard';
import JobCommentConfigureWizard from '../../components/AddNewWizards/CommentConfigure/JobCommentConfigureWizard';
import OptionWizard from '../../components/AddNewWizards/Option/OptionWizard';
import { findMessagesForTypeObjectId, findMessagesForUserPoked } from '../../utils/messageUtils';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import _ from 'lodash';
import DismissableText from '../../components/Notifications/DismissableText';
import { formInboxItemLink, navigate } from '../../utils/marketIdPathFunctions';
import SpinningButton from '../../components/SpinBlocking/SpinningButton';
import { wizardStyles } from '../../components/AddNewWizards/WizardStylesContext';
import ReplyWizard from '../../components/AddNewWizards/Reply/ReplyWizard';
import ComposeWizard from '../../components/AddNewWizards/Compose/ComposeWizard';
import SignOutWizard from '../../components/AddNewWizards/SignOut/SignOutWizard';
import JobEditWizard from '../../components/AddNewWizards/JobEdit/JobEditWizard';
import OptionEditWizard from '../../components/AddNewWizards/OptionEdit/OptionEditWizard';
import AddWizardOnboardingBanner from '../../components/Banners/AddWizardOnboardingBanner';
import { getMarket, marketIsDemo } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import DeleteWizard from '../../components/AddNewWizards/Delete/DeleteWizard';
import ArchiveCommentWizard from '../../components/AddNewWizards/CommentArchive/ArchiveCommentWizard';
import TaskInProgressWizard from '../../components/AddNewWizards/TaskInProgress/TaskInProgressWizard';

function Wizard(props) {
  const { hidden } = props;
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type: createType, marketId, groupId, jobType, investibleId,
    commentId, commentType, voteFor, stageId, isAssign, isBlocked,
    typeObjectId, resolveId, isInbox, useType, assignId } = values;
  const intl = useIntl();
  const [messagesState] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const wizardClasses = wizardStyles();
  const upgradeMessages = findMessagesForUserPoked(messagesState);
  const message = findMessagesForTypeObjectId(typeObjectId, messagesState);
  const market = getMarket(marketsState, marketId) || {};
  const isDemo = marketIsDemo(market);

  if (!_.isEmpty(upgradeMessages)) {
    return (
      <Screen
        suppressBanner
        title={intl.formatMessage({ 'id': 'wizardBreadCrumb' })}
        tabTitle={intl.formatMessage({ id: 'wizardBreadCrumb' })}
        hidden={hidden}
      >
        <DismissableText textId="updradeHelp" display noPad
                         text={
                           <div>
                             Uclusion will be read only until an account payment method is resolved.
                           </div>
                         }/>
      </Screen>
    );
  }

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'wizardBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'wizardBreadCrumb' })}
      banner={<AddWizardOnboardingBanner createType={createType} />}
      showBanner={isDemo}
      hidden={hidden}
    >
      {typeObjectId && (
        <SpinningButton id="newMarketQuestion"
                        className={wizardClasses.actionNext}
                        style={{marginTop: '1rem', marginLeft: '2rem'}}
                        variant="text" doSpin={false}
                        onClick={() => navigate(history, formInboxItemLink(message))}>
          <FormattedMessage id='backToInboxWizard'/>
        </SpinningButton>
      )}
      {createType === PLANNING_TYPE.toLowerCase() && (
        <GroupWizard marketId={marketId} />
      )}
      {createType === REPLY_WIZARD_TYPE && (
        <ReplyWizard marketId={marketId} commentId={commentId} />
      )}
      {createType === IN_PROGRESS_WIZARD_TYPE.toLowerCase() && (
        <TaskInProgressWizard marketId={marketId} commentId={commentId} />
      )}
      {createType === WORKSPACE_WIZARD_TYPE.toLowerCase() && (
        <WorkspaceWizard />
      )}
      {createType === JOB_WIZARD_TYPE.toLowerCase() && (
        <JobWizard marketId={marketId} groupId={groupId} jobType={jobType} useType={commentType} />
      )}
      {createType === OPTION_WIZARD_TYPE.toLowerCase() && (
        <OptionWizard marketId={marketId} />
      )}
      {createType === BUG_WIZARD_TYPE.toLowerCase() && (
        <BugWizard marketId={marketId} groupId={groupId} commentType={commentType} useType={useType}
                   typeObjectId={typeObjectId} />
      )}
      {createType === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase() && (
        <CollaboratorWizard marketId={marketId} />
      )}
      {createType === DECISION_COMMENT_WIZARD_TYPE.toLowerCase() && (
        <DecisionCommentWizard investibleId={investibleId} commentType={commentType} />
      )}
      {createType === JOB_COMMENT_WIZARD_TYPE.toLowerCase() && (
        <JobCommentWizard investibleId={investibleId} marketId={marketId} commentType={commentType}
                          resolveId={resolveId} typeObjectId={typeObjectId} />
      )}
      {createType === JOB_ASSIGNEE_WIZARD_TYPE.toLowerCase() && (
        <JobAssigneeWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === JOB_APPROVERS_WIZARD_TYPE.toLowerCase() && (
        <JobApproverWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === JOB_COLLABORATOR_WIZARD_TYPE.toLowerCase() && (
        <JobCollaboratorWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === JOB_STAGE_WIZARD_TYPE.toLowerCase() && (
        <JobStageWizard investibleId={investibleId} marketId={marketId} stageId={stageId} isAssign={isAssign}
                        isBlocked={isBlocked} assignId={assignId} />
      )}
      {createType === JOB_EDIT_WIZARD_TYPE.toLowerCase() && (
        <JobEditWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === OPTION_EDIT_WIZARD_TYPE.toLowerCase() && (
        <OptionEditWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === DISCUSSION_WIZARD_TYPE.toLowerCase() && (
        <DiscussionWizard marketId={marketId} groupId={groupId} commentType={commentType} />
      )}
      {createType === COMPOSE_WIZARD_TYPE.toLowerCase() && (
        <ComposeWizard marketId={marketId} />
      )}
      {createType === SIGN_OUT_WIZARD_TYPE.toLowerCase() && (
        <SignOutWizard />
      )}
      {createType === APPROVAL_WIZARD_TYPE.toLowerCase() && (
        <ApprovalWizard marketId={marketId} groupId={groupId} investibleId={investibleId} voteFor={voteFor} />
      )}
      {createType === JOB_COMMENT_CONFIGURE_WIZARD_TYPE.toLowerCase() && (
        <JobCommentConfigureWizard marketId={marketId} commentId={commentId} typeObjectId={typeObjectId} />
      )}
      {createType === DELETE_COMMENT_TYPE.toLowerCase() && (
        <DeleteWizard marketId={marketId} commentId={commentId} isInbox={isInbox} />
      )}
      {createType === ARCHIVE_COMMENT_TYPE.toLowerCase() && (
        <ArchiveCommentWizard marketId={marketId} commentId={commentId} isInbox={isInbox} typeObjectId={typeObjectId} />
      )}
    </Screen>
  );
}

Wizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Wizard;
