import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import TaskReviewStep from './TaskReviewStep';
import ReplyStep from '../ReplyStep';

function TaskedWizard(props) {
  const { marketId, commentId, message } = props;
  const parentElementId = message.type_object_id;
  return (
    <FormdataWizard name={`tasked_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <TaskReviewStep marketId={marketId} commentId={commentId} message={message} />
      <ReplyStep marketId={marketId} commentId={commentId} message={message}/>
    </FormdataWizard>
  );
}

TaskedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

TaskedWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default TaskedWizard;

