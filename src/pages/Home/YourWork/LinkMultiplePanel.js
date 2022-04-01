import React, { useContext } from 'react'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import CommentPanel from './CommentPanel'
import _ from 'lodash'
import InboxInvestible from './InboxInvestible'
import { UNASSIGNED_TYPE } from '../../../constants/notifications'
import { findMessageOfType } from '../../../utils/messageUtils'

function LinkMultiplePanel(props) {
  const { linkMultiple, marketId, commentId, planningClasses, mobileLayout, isDeletable, message } = props;
  const [messagesState] = useContext(NotificationsContext);
  const { messages: messagesUnsafe } = messagesState;
  const messagesFull = (messagesUnsafe || []).filter((message) => message.link_multiple === linkMultiple);
  const messageTypes = messagesFull.reduce((acc, message) => {
    return acc.concat([message.type]);
  }, []);
  const investibleLinkMessage = messagesFull.find((message) => {
    const { link_type: linkType } = message;
    return linkType === 'INVESTIBLE';
  });
  if (_.isEmpty(investibleLinkMessage) && (!_.isEmpty(
    _.intersection(['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'FULLY_VOTED'], messageTypes))
    || ['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].find((aType) => {
      return messagesFull.find((message) => {
        const { type: messageType, link_type: linkType } = message;
        return linkType.startsWith('INLINE') && messageType === aType;
      });
    }))) {
    return (
      <CommentPanel marketId={marketId} commentId={commentId} planningClasses={planningClasses}
                    mobileLayout={mobileLayout} messagesFull={messagesFull} isDeletable={isDeletable}
                    message={message} />
    );
  }
  else if (!_.isEmpty(_.intersection(['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE', 'UNREAD_REVIEWABLE',
      'REVIEW_REQUIRED', 'ISSUE_RESOLVED', 'UNACCEPTED_ASSIGNMENT', 'NEW_TODO', 'UNREAD_NAME', 'UNREAD_DESCRIPTION',
      UNASSIGNED_TYPE, 'UNREAD_LABEL', 'UNREAD_ATTACHMENT', 'UNREAD_ESTIMATE'], messageTypes))) {
    const { investible_id: investibleId, market_type: marketType } = messagesFull[0];
    return <InboxInvestible marketId={marketId} investibleId={investibleId} messageTypes={messageTypes}
                            messagesFull={messagesFull} isDeletable={isDeletable} message={message}
                            planningClasses={planningClasses} marketType={marketType} mobileLayout={mobileLayout}
                            unacceptedAssignment={findMessageOfType('UNACCEPTED_ASSIGNMENT', investibleId,
                              messagesState)}/>
  }
  console.warn(messageTypes);
  return <React.Fragment />;
}

export default LinkMultiplePanel;