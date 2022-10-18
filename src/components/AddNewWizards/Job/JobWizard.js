import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStep from './JobDescriptionStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { formMarketLink } from '../../../utils/marketIdPathFunctions'

function JobWizard(props) {
  const { onStartOver, onFinish, marketId } = props;

  function createGroup(formData) {
    const dispatchers = {

    };
    // default things not filled in
    const groupData = {
      ...formData,
      marketId,
      votesRequired: formData.votesRequired ?? 0,
    };


  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard"
                      onFinish={createGroup}
                      onStartOver={onStartOver}
      >
        <JobDescriptionStep />
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

