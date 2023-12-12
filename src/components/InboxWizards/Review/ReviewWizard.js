import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReviewStep from './DecideReviewStep';
import ReplyStep from '../ReplyStep';

function ReviewWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`review_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideReviewStep marketId={marketId} commentId={commentId} message={message} />
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

ReviewWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ReviewWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ReviewWizard;

