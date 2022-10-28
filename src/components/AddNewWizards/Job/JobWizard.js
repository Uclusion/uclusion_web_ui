import React from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStep from './JobDescriptionStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobAssignStep from './JobAssignStep'

function JobWizard(props) {
  const { onStartOver, onFinish, marketId, groupId } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard"
                      onStartOver={onStartOver}
      >
        <JobDescriptionStep onFinish={onFinish} marketId={marketId} groupId={groupId}/>
        <JobAssignStep onFinish={onFinish} marketId={marketId} groupId={groupId}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobWizard;

