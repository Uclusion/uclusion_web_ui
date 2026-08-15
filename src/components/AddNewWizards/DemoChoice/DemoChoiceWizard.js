import React from 'react';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DemoChoiceStep from './DemoChoiceStep';
import AIChoiceStep from '../Workspace/AIChoiceStep';

// J-all-400: onboarding leads with Connect AI first; the demo choice moved one step deeper
function DemoChoiceWizard() {
  return (
    <WizardStylesProvider>
      <FormdataWizard useLocalStorage={false} name="demo_choice_wizard">
          <AIChoiceStep isOnboarding />
          <DemoChoiceStep  />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default DemoChoiceWizard
