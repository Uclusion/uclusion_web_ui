import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReplyStep from './DecideReplyStep';
import ReplyStep from '../ReplyStep';

function ReplyWizard(props) {
  const { marketId, commentId, message } = props;
  const  parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`reply_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideReplyStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReplyWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReplyWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ReplyWizard;

