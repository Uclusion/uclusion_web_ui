import React from 'react'
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideAnswerStep from './DecideAnswerStep'
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';
import ReplyStep from '../ReplyStep';

function AnswerWizard(props) {
  const { marketId, commentId, message, inboxDispatch } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`answer_wizard${commentId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <DecideAnswerStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

AnswerWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

AnswerWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default AnswerWizard;

