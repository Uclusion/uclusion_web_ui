import React, { useContext } from 'react';
import WorkspaceNameStep from './WorkspaceNameStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import WorkspaceIntegrationsStep from './WorkspaceIntegrationsStep';

function WorkspaceWizard() {
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  const myOnFinish = (formData) => {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard
        useLocalStorage={false}
        name="workpsace_wizard"
        onFinish={myOnFinish}
      >
        <WorkspaceNameStep />
        <WorkspaceIntegrationsStep />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceWizard

