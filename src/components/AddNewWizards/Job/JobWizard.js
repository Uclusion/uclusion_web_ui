import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStep from './JobDescriptionStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import { formInvestibleLink, formMarketLink } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

function JobWizard(props) {
  const { onStartOver, onFinish, marketId, groupId } = props;
  const history = useHistory();


  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard"
                      onStartOver={onStartOver}
      >
        <JobDescriptionStep onFinish={onFinish} marketId={marketId} groupId={groupId}/>
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

