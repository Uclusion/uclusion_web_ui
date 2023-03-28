import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideReplyStep from './DecideReplyStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';

function ReplyWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`reply_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReplyWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReplyWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ReplyWizard;

