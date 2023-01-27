import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideStartStep from './DecideStartStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function StartWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`start_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideStartStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

StartWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StartWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StartWizard;

