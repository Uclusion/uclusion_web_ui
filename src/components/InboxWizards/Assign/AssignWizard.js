import React from 'react'
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep'

function AssignWizard(props) {
  const { marketId, investibleId, message } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`assign_wizard${investibleId}`}>
        <DecideAssignStep marketId={marketId} investibleId={investibleId} message={message}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

AssignWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AssignWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AssignWizard;

