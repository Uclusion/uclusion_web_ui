import React from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AdvancedOptionsStep from './AdvancedOptionsStep';
import SwimlanesOptionsStep from './SwimlanesOptionsStep'
import ApprovalOptionsStep from './ApprovalOptionsStep'
import BudgetOptionsStep from './BudgetOptionsStep'

function GroupWizard(props) {
  const { onStartOver, onFinish } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
          <GroupNameStep />
          <AdvancedOptionsStep />
          <SwimlanesOptionsStep />
          <ApprovalOptionsStep/>
          <BudgetOptionsStep/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

GroupWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

GroupWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default GroupWizard;

