import React from 'react';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DemoChoiceStep from './DemoChoiceStep';

function DemoChoiceWizard(props) {
  const { setUtm } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard useLocalStorage={false} name="demo_choice_wizard">
          <DemoChoiceStep setUtm={setUtm} />
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default DemoChoiceWizard

