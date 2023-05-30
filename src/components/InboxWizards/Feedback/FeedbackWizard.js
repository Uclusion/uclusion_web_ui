import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideFeedbackStep from './DecideFeedbackStep';
import ReplyStep from '../ReplyStep';

function FeedbackWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId =  message.type_object_id;
  return (
    <FormdataWizard name={`feedback_wizard${commentId}`} defaultFormData={{parentElementId}}>
      <DecideFeedbackStep marketId={marketId} commentId={commentId} message={message}/>
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

FeedbackWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

FeedbackWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default FeedbackWizard;

