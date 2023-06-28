import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import EstimateChangeViewStep from './EstimateChangeViewStep';

function EstimateChangeWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId = message.type_object_id;

  return (
    <FormdataWizard name={`estimate_change_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <EstimateChangeViewStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

EstimateChangeWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

EstimateChangeWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default EstimateChangeWizard;

