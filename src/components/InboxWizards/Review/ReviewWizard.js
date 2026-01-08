import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideReviewStep from './DecideReviewStep';
import ChooseCommentTypeStep from '../ChooseCommentTypeStep';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import _ from 'lodash';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function ReviewWizard(props) {
  const { marketId, commentId, message } = props;
  const [commentsState] = useContext(CommentsContext);
  const parentElementId = getMessageId(message);
  const report = getComment(commentsState, marketId, commentId) || {};
  const investibleId = report.investible_id;
  if (_.isEmpty(report)) {
    return React.Fragment;
  }
  return (
    <FormdataWizard name={`review_wizard${commentId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideReviewStep marketId={marketId} message={message} report={report} />
      <ChooseCommentTypeStep investibleId={investibleId} marketId={marketId} message={message} />
    </FormdataWizard>
  );
}

ReviewWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ReviewWizard;

