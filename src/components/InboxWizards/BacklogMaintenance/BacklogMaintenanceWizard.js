import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import BacklogReportStep from './BacklogReportStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

// J-all-500: a backlog maintenance run that found something delivers its report as this inbox item
function BacklogMaintenanceWizard(props) {
  const { message } = props;
  const parentElementId = getMessageId(message);
  return (
    <FormdataWizard name="backlog_maintenance_wizard" defaultFormData={{parentElementId}}>
      <BacklogReportStep message={message} />
    </FormdataWizard>
  );
}

BacklogMaintenanceWizard.propTypes = {
  message: PropTypes.object.isRequired
};

export default BacklogMaintenanceWizard;
