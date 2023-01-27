import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideUnblockStep from './DecideUnblockStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function BlockedWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`unblock_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideUnblockStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

BlockedWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

BlockedWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default BlockedWizard;

