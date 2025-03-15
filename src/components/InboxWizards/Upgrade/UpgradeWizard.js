import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideUpgradeStep from './DecideUpgradeStep';
import UpgradeStep from './UpgradeStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function UpgradeWizard(props) {
  const { message } = props;
  const parentElementId =  getMessageId(message);
  return (
    <FormdataWizard name='upgrade_wizard' defaultFormData={{parentElementId}}>
      <DecideUpgradeStep message={message}/>
      <UpgradeStep message={message}/>
    </FormdataWizard>
  );
}

UpgradeWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

UpgradeWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default UpgradeWizard;

