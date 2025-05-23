import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideVoteStep from './DecideVoteStep';
import { getCommentRoot } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useHistory } from 'react-router';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function VoteWizard(props) {
  const { marketId, commentId, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const parentElementId =  getMessageId(message);
  function myOnFinish() {
    removeWorkListItem(message, messagesDispatch, history);
  }

  return (
    <FormdataWizard name={`vote_wizard${commentId}`}
                    defaultFormData={{parentElementId, originalQuantity: 0, useCompression: true}}>
      <DecideVoteStep onFinish={myOnFinish} marketId={marketId} commentRoot={commentRoot} message={message}/>
    </FormdataWizard>
  );
}

VoteWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

VoteWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default VoteWizard;

