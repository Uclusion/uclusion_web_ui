import React, { useContext } from 'react'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import CommentPanel from './CommentPanel'
import _ from 'lodash'

function LinkMultiplePanel(props) {
  const { linkMultiple, marketId, commentId } = props;
  const [messagesState] = useContext(NotificationsContext);
  const { messages: messagesUnsafe } = messagesState;
  const messagesFull = (messagesUnsafe || []).filter((message) => message.link_multiple === linkMultiple);
  const messageTypes = messagesFull.reduce((acc, message) => {
    return acc.concat([message.link_type]);
  }, []);

  if (!_.isEmpty(_.intersection(['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE'], messageTypes)) ||
    ['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].find((aType) => {
      return messagesFull.find((message) => {
        const { type: messageType, link_type: linkType } = message;
        return linkType.startsWith('INLINE') && messageType === aType;
      });
    })) {
    return (
      <CommentPanel marketId={marketId} commentId={commentId} />
    );
  }
  // TODO finish other cases and remove this
  return <React.Fragment />;
}

export default LinkMultiplePanel;