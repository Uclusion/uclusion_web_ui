import React from 'react';
import WorkspaceNameStep from './WorkspaceNameStep';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function WorkspaceWizard() {

  return (
    <WizardStylesProvider>
      <FormdataWizard
        useLocalStorage={false}
        name="workspace_wizard"
      >
        <WorkspaceNameStep />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default WorkspaceWizard

