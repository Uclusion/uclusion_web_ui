import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAcceptRejectStep from './DecideAcceptRejectStep'

function AcceptRejectWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`accept_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideAcceptRejectStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AcceptRejectWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AcceptRejectWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default AcceptRejectWizard;

