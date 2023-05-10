import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideUpgradeStep from './DecideUpgradeStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';
import UpgradeStep from './UpgradeStep';

function UpgradeWizard(props) {
  const { message, inboxDispatch } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name='upgrade_wizard'
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideUpgradeStep message={message}/>
      <UpgradeStep message={message}/>
    </FormdataWizard>
  );
}

UpgradeWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

UpgradeWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default UpgradeWizard;

