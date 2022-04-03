import React from 'react'
import DialogManage from '../../Dialog/DialogManage'
import { UNASSIGNED_TYPE } from '../../../constants/notifications'
import LinkMultiplePanel from './LinkMultiplePanel'
import CommentPanel from './CommentPanel'
import InboxInvestible from './InboxInvestible'
import { findMessageOfType } from '../../../utils/messageUtils'
import NotificationDeletion from './NotificationDeletion'

export function usesExpansion(item) {
  const { message, comment } = item;
  if (comment) {
    if (message) {
      return message.type !== 'NEW_TODO';
    }
    return true;
  }
  if (message && message.type) {
    return ['UNASSIGNED', 'UNREAD_DRAFT', 'UNREAD_VOTE', 'REPORT_REQUIRED', 'UNREAD_NAME', 'UNREAD_DESCRIPTION',
      'UNREAD_ATTACHMENT', 'UNREAD_LABEL', 'UNREAD_ESTIMATE', 'UNACCEPTED_ASSIGNMENT'].includes(message.type);
  }
  //Pending always expands
  return true;
}

export function addExpansionPanel(props) {
  const {item, planningClasses, mobileLayout, isMultiple, messagesState, isDeletable} = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, link_multiple: linkMultiple } = message;
  if (isMultiple) {
    item.expansionPanel = ( <LinkMultiplePanel linkMultiple={linkMultiple} marketId={commentMarketId || marketId}
                                               commentId={commentId} planningClasses={planningClasses} message={message}
                                               mobileLayout={mobileLayout} isDeletable={isDeletable}/> );
  } else if (linkType !== 'INVESTIBLE' && ((
    ['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'FULLY_VOTED'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (['UNREAD_REVIEWABLE', 'UNASSIGNED'].includes(messageType)
      && linkType === 'MARKET_TODO'))) {
    item.expansionPanel = ( <CommentPanel marketId={commentMarketId || marketId} commentId={commentId} message={message}
                                          marketType={marketType} messageType={messageType} isDeletable={isDeletable}
                                          planningClasses={planningClasses} mobileLayout={mobileLayout} /> );
  } else if (['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE','UNREAD_REVIEWABLE', 'REVIEW_REQUIRED', 'REPORT_REQUIRED',
    'ISSUE_RESOLVED', 'UNACCEPTED_ASSIGNMENT', 'NEW_TODO', 'UNREAD_VOTE', UNASSIGNED_TYPE, 'UNREAD_DESCRIPTION',
    'UNREAD_NAME', 'UNREAD_ATTACHMENT', 'UNREAD_LABEL', 'UNREAD_ESTIMATE'].includes(messageType)) {
    item.expansionPanel = <InboxInvestible marketId={marketId} investibleId={investibleId} messageType={messageType}
                                           planningClasses={planningClasses} marketType={marketType}
                                           mobileLayout={mobileLayout} isDeletable={isDeletable} message={message}
                                           unacceptedAssignment={findMessageOfType('UNACCEPTED_ASSIGNMENT',
                                             investibleId, messagesState)} />;
  } else if (messageType === 'UNREAD_DRAFT') {
    item.expansionPanel = (
      <>
        <div style={{paddingLeft: '1.25rem', paddingTop: '1rem'}}>
          <NotificationDeletion message={message} />
        </div>
        <DialogManage marketId={marketId} isInbox />
      </>
    );
  }
}