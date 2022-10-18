import React, { useContext } from 'react'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import Screen from '../../containers/Screen/Screen'
import {
  navigate
} from '../../utils/marketIdPathFunctions'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import GroupWizard from '../../components/AddNewWizards/Group/GroupWizard'
import queryString from 'query-string'
import { JOB_WIZARD_TYPE, PLANNING_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets'
import WorkspaceWizard from '../../components/AddNewWizards/Workspace/WorkspaceWizard';
import JobWizard from '../../components/AddNewWizards/Job/JobWizard'

function Wizard(props) {
  const { hidden } = props;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type: createType, marketId } = values;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function onWizardFinish (formData) {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  return (
    <Screen
      title={intl.formatMessage({ 'id': 'wizardBreadCrumb' })}
      tabTitle={intl.formatMessage({ id: 'wizardBreadCrumb' })}
      hidden={hidden}
    >
      {createType === PLANNING_TYPE.toLowerCase() && (
        <GroupWizard marketId={marketId} onFinish={onWizardFinish} />
      )}

      {createType === WORKSPACE_WIZARD_TYPE.toLowerCase() && (
        <WorkspaceWizard onFinish={onWizardFinish} />
      )}
      {createType === JOB_WIZARD_TYPE.toLowerCase() && (
        <JobWizard onFinish={onWizardFinish} />
      )}
    </Screen>
  );
}

Wizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Wizard;
