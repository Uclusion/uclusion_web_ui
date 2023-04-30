import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../WizardStylesContext'
import FormdataWizard from 'react-formdata-wizard'
import WorkspaceMembersStep from './WorkspaceMemberStep'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../localStorageUtils'
import { navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';

function WorkspaceWizard (props) {
  const { onboarding, setInOnboarding } = props
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  const myOnFinish = (formData) => {
    setInOnboarding(false);
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  function onStartOnboarding() {
    setInOnboarding(true);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard
        useLocalStorage={false}
        name="workpsace_wizard"
        onFinish={myOnFinish}
      >
        <WorkspaceNameStep onboarding={onboarding} onStartOnboarding={onStartOnboarding}/>
        <WorkspaceMembersStep onboarding={onboarding}/>
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

WorkspaceWizard.propTypes = {
  onboarding: PropTypes.bool,
  setInOnboarding: PropTypes.func,
}

WorkspaceWizard.defaultProps = {
  onboarding: false,
  setInOnboarding: () => {},
}

export default WorkspaceWizard

