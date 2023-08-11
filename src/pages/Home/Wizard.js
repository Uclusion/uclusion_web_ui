import React, { useContext } from 'react';
import { useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
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
  WORKSPACE_WIZARD_TYPE, JOB_COMMENT_CONFIGURE_WIZARD_TYPE, OPTION_WIZARD_TYPE
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
import { findMessagesForUserPoked } from '../../utils/messageUtils';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import _ from 'lodash';
import DismissableText from '../../components/Notifications/DismissableText';

function Wizard(props) {
  const { hidden } = props;
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type: createType, marketId, groupId, jobType, investibleId, commentId, commentType, voteFor } = values;
  const intl = useIntl();
  const [messagesState] = useContext(NotificationsContext);
  const upgradeMessages = findMessagesForUserPoked(messagesState);

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
      hidden={hidden}
    >
      {createType === PLANNING_TYPE.toLowerCase() && (
        <GroupWizard marketId={marketId} />
      )}

      {createType === WORKSPACE_WIZARD_TYPE.toLowerCase() && (
        <WorkspaceWizard />
      )}
      {createType === JOB_WIZARD_TYPE.toLowerCase() && (
        <JobWizard marketId={marketId} groupId={groupId} jobType={jobType} />
      )}
      {createType === OPTION_WIZARD_TYPE.toLowerCase() && (
        <OptionWizard marketId={marketId} />
      )}
      {createType === BUG_WIZARD_TYPE.toLowerCase() && (
        <BugWizard marketId={marketId} groupId={groupId} commentType={commentType} />
      )}
      {createType === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase() && (
        <CollaboratorWizard marketId={marketId} />
      )}
      {createType === DECISION_COMMENT_WIZARD_TYPE.toLowerCase() && (
        <DecisionCommentWizard investibleId={investibleId} />
      )}
      {createType === JOB_COMMENT_WIZARD_TYPE.toLowerCase() && (
        <JobCommentWizard investibleId={investibleId} marketId={marketId} commentType={commentType} />
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
        <JobStageWizard investibleId={investibleId} marketId={marketId} />
      )}
      {createType === DISCUSSION_WIZARD_TYPE.toLowerCase() && (
        <DiscussionWizard marketId={marketId} groupId={groupId} commentType={commentType} />
      )}
      {createType === APPROVAL_WIZARD_TYPE.toLowerCase() && (
        <ApprovalWizard marketId={marketId} groupId={groupId} investibleId={investibleId} voteFor={voteFor} />
      )}
      {createType === JOB_COMMENT_CONFIGURE_WIZARD_TYPE.toLowerCase() && (
        <JobCommentConfigureWizard marketId={marketId} commentId={commentId} />
      )}
    </Screen>
  );
}

Wizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Wizard;
