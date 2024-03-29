import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideStartStep from './DecideStartStep';
import AddToJobStep from './AddToJobStep';

function StartWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`start_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideStartStep marketId={marketId} commentId={commentId} message={message}/>
      <AddToJobStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

StartWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StartWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default StartWizard;

