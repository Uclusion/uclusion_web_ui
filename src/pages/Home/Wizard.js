import React from 'react'
import { useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import GroupWizard from '../../components/AddNewWizards/Group/GroupWizard'
import queryString from 'query-string'
import {
  ADD_COLLABORATOR_WIZARD_TYPE, BUG_WIZARD_TYPE,
  JOB_WIZARD_TYPE,
  PLANNING_TYPE,
  WORKSPACE_WIZARD_TYPE
} from '../../constants/markets';
import WorkspaceWizard from '../../components/AddNewWizards/Workspace/WorkspaceWizard';
import JobWizard from '../../components/AddNewWizards/Job/JobWizard'
import CollaboratorWizard from '../../components/AddNewWizards/Collaborator/CollaboratorWizard';
import BugWizard from '../../components/AddNewWizards/Bug/BugWizard';

function Wizard(props) {
  const { hidden } = props;
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type: createType, marketId, groupId, assigneeId } = values;
  const intl = useIntl();

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
        <JobWizard marketId={marketId} groupId={groupId} assigneeId={assigneeId} />
      )}
      {createType === BUG_WIZARD_TYPE.toLowerCase() && (
        <BugWizard marketId={marketId} groupId={groupId} />
      )}
      {createType === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase() && (
        <CollaboratorWizard marketId={marketId} />
      )}
    </Screen>
  );
}

Wizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Wizard;
