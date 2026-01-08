import React from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import TaskReviewStep from './TaskReviewStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import _ from 'lodash';

function TaskedWizard(props) {
  const { marketId, message } = props;
  const parentElementId = getMessageId(message);
  const commentId = _.isEmpty(message.comment_list) ? message.comment_id : message.comment_list[0];
  return (
    <FormdataWizard name={`tasked_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <TaskReviewStep marketId={marketId} message={message} />
    </FormdataWizard>
  );
}

TaskedWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default TaskedWizard;

