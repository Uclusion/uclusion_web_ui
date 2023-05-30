import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import EstimateChangeViewStep from './EstimateChangeViewStep';

function StatusWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = message.type_object_id;

  return (
    <FormdataWizard name={`status_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <EstimateChangeViewStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

StatusWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StatusWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default StatusWizard;

