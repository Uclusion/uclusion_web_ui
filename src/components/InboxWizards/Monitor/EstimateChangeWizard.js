import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';
import EstimateChangeViewStep from './EstimateChangeViewStep';

function StatusWizard(props) {
  const { marketId, investibleId, message, inboxDispatch } = props;
  const parentElementId = message.type_object_id;

  return (
    <FormdataWizard name={`status_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <EstimateChangeViewStep marketId={marketId} investibleId={investibleId} message={message}/>
    </FormdataWizard>
  );
}

StatusWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StatusWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StatusWizard;

