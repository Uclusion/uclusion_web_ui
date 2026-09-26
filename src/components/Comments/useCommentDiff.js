import { useState } from 'react';
import { REPORT_TYPE } from '../../constants/comments';

export default function useCommentDiff(comment, marketId, location, storedShowDiff, updateEditState) {
  const [chosenEntryId, setChosenEntryId] = useState(null);
  const notification = location.state?.notification;
  const enteringViewNote = comment.comment_type === REPORT_TYPE && !comment.investible_id &&
    notification?.marketId === marketId && notification.commentId === comment.id;
  const showDiff = (enteringViewNote && chosenEntryId !== notification.entryId) || storedShowDiff === true;

  function toggleDiff() {
    setChosenEntryId(notification?.entryId);
    updateEditState({ showDiff: !showDiff });
  }

  return [showDiff, toggleDiff];
}
