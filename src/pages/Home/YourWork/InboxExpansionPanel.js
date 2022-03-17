import React from 'react'
import _ from 'lodash'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import InvestibleStatus from './InvestibleStatus'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import DialogManage from '../../Dialog/DialogManage'
import { Link, Typography } from '@material-ui/core'
import { UNASSIGNED_TYPE } from '../../../constants/notifications'
import LinkMultiplePanel from './LinkMultiplePanel'
import CommentPanel from './CommentPanel'
import InboxInvestible from './InboxInvestible'
import { DaysEstimate } from '../../../components/AgilePlan'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import Chip from '@material-ui/core/Chip'
import InvestibleReady from './InvestibleReady'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { JUSTIFY_TYPE } from '../../../constants/comments'
import { findMessageOfType } from '../../../utils/messageUtils'
import NotificationDeletion from './NotificationDeletion'
import { formInvestibleLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  CURRENT_EVENT,
  MODIFY_NOTIFICATIONS_CHANNEL
} from '../../../contexts/NotificationsContext/notificationsContextMessages'

export function usesExpansion(item) {
  const { message, comment } = item;
  if (comment) {
    if (message) {
      return message.type !== 'NEW_TODO';
    }
    return true;
  }
  if (message && message.type) {
    return ['UNASSIGNED', 'UNREAD_DRAFT', 'UNREAD_VOTE', 'REPORT_REQUIRED',
      'UNACCEPTED_ASSIGNMENT'].includes(message.type);
  }
  //Pending always expands
  return true;
}

export function addExpansionPanel(props) {
  const {item, marketState, investiblesState, diffState, planningClasses, mobileLayout, intl, isMultiple,
    commentState, messagesState, isDeletable, investibleEditClasses, history} = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, link_multiple: linkMultiple } = message;
  if (isMultiple) {
    item.expansionPanel = ( <LinkMultiplePanel linkMultiple={linkMultiple} marketId={commentMarketId || marketId}
                                               commentId={commentId} planningClasses={planningClasses} message={message}
                                               mobileLayout={mobileLayout} isDeletable={isDeletable}/> );
  } else if ((['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'FULLY_VOTED'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (['UNREAD_REVIEWABLE', 'UNASSIGNED'].includes(messageType)
      && linkType === 'MARKET_TODO')) {
    item.expansionPanel = ( <CommentPanel marketId={commentMarketId || marketId} commentId={commentId} message={message}
                                          marketType={marketType} messageType={messageType} isDeletable={isDeletable}
                                          planningClasses={planningClasses} mobileLayout={mobileLayout} /> );
  } else if (messageType === 'REPORT_REQUIRED') {
    if (!_.isEmpty(investibleId)) {
      item.expansionPanel = <InvestibleStatus
        investibleId={investibleId}
        message={message}
        marketId={marketId}
      />;
    }
  } else if (['UNREAD_DESCRIPTION', UNASSIGNED_TYPE, 'UNREAD_NAME', 'UNREAD_ATTACHMENT',
    'UNREAD_LABEL', 'UNREAD_ESTIMATE'].includes(messageType)) {
    const market = getMarket(marketState, marketId) || {};
    if (!_.isEmpty(investibleId)) {
      const diff = getDiff(diffState, investibleId);
      const fullInvestible = getInvestible(investiblesState, investibleId) || {};
      const { investible: myInvestible } = fullInvestible;
      const { name, description, label_list: labelList } = myInvestible || {};
      const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
      const { stage, assigned, open_for_investment: openForInvestment,
        completion_estimate: marketDaysEstimate, } = marketInfo;
      const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
      const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
      item.expansionPanel = (
        <div style={{paddingLeft: '1.25rem', paddingTop: '0.75rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
          {isDeletable && (
            <NotificationDeletion message={message} />
          )}
          {openForInvestment && _.isEmpty(assigned) && (
            <InvestibleReady marketId={marketId} stage={stage} fullInvestible={fullInvestible} message={message}
                             market={market} investibleId={investibleId} openForInvestment={openForInvestment}/>
          )}
          {!_.isEmpty(myInvestible) && (
            <div style={{paddingTop: '0.5rem'}} className={investibleEditClasses.container}>
              <Link href={formInvestibleLink(marketId, investibleId)} onClick={(event) => {
                preventDefaultAndProp(event);
                if (message) {
                  pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: CURRENT_EVENT, message });
                }
                navigate(history, formInvestibleLink(marketId, investibleId));
              }}>
                <Typography className={investibleEditClasses.title} variant="h3" component="h1">
                  {name}
                </Typography>
              </Link>
              <DescriptionOrDiff id={investibleId} description={description} showDiff={diff !== undefined} />
            </div>
          )}
          {messageType === 'UNREAD_NAME' && (
            <Typography variant="h6" style={{paddingTop: '1rem'}}>
              {intl.formatMessage({ id: 'nameChange' }, { x: name })}
            </Typography>
          )}
          {messageType === 'UNREAD_ESTIMATE' && (
            <div style={{paddingTop: '1rem'}}>
              <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
            </div>
          )}
          {messageType === 'UNREAD_ATTACHMENT' && (
            <div style={{paddingTop: '1rem'}}>
              <AttachedFilesList
                marketId={market.id}
                isAdmin={false}
              />
            </div>
          )}
          {messageType === 'UNREAD_LABEL' && (
            <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
              {labelList && labelList.map((label) =>
                <div key={label} className={planningClasses.labelChip}>
                  <Chip label={label} color="primary" />
                </div>
              )}
            </div>
          )}
          {openForInvestment && _.isEmpty(assigned) && (
            <div style={{paddingTop: '0.5rem'}}>
              <CommentBox
                comments={investmentReasonsRemoved}
                marketId={marketId}
                allowedTypes={[]}
                stage={stage}
                isInbox
              />
            </div>
          )}
        </div>
      );
    } else {
      const diff = getDiff(diffState, marketId);
      if (diff) {
        const { description } = market;
        item.expansionPanel = (
          <div style={{padding: '1.25rem'}}>
            <DescriptionOrDiff id={marketId} description={description} showDiff={true}/>
          </div>
        );
      }
    }
  } else if (['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE','UNREAD_REVIEWABLE', 'REVIEW_REQUIRED',
    'ISSUE_RESOLVED', 'UNACCEPTED_ASSIGNMENT', 'NEW_TODO', 'UNREAD_VOTE'].includes(messageType)) {
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