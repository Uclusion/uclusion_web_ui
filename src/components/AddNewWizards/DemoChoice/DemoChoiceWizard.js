import React from 'react';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DemoChoiceStep from './DemoChoiceStep';

function DemoChoiceWizard() {
  return (
    <WizardStylesProvider>
      <FormdataWizard useLocalStorage={false} name="demo_choice_wizard">
          <DemoChoiceStep  />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default DemoChoiceWizard

