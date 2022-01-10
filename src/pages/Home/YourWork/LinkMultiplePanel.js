import React, { useContext } from 'react'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import CommentPanel from './CommentPanel'
import _ from 'lodash'
import InboxInvestible from './InboxInvestible'

function LinkMultiplePanel(props) {
  const { linkMultiple, marketId, commentId, planningClasses, mobileLayout } = props;
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
  else if (!_.isEmpty(_.intersection(['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE','UNREAD_REVIEWABLE', 'REVIEW_REQUIRED',
      'ISSUE_RESOLVED', 'UNREAD_ASSIGNMENT', 'NEW_TODO', 'UNREAD_NAME'],
    messageTypes))) {
    const { investible_id: investibleId, market_type: marketType } = messagesFull[0];
    return <InboxInvestible marketId={marketId} investibleId={investibleId} messageTypes={messageTypes}
                            planningClasses={planningClasses} marketType={marketType} mobileLayout={mobileLayout} />
  }
    // TODO finish other cases (all must be listed here unless impossible they combine) and remove this
  return <React.Fragment />;
}

export default LinkMultiplePanel;