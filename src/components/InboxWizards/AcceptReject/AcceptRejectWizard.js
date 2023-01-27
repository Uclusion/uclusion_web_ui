import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAcceptRejectStep from './DecideAcceptRejectStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function AcceptRejectWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`accept_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideAcceptRejectStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AcceptRejectWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AcceptRejectWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AcceptRejectWizard;

