import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import {
  getCommentRoot,
  getMarketComments,
  getUnresolvedInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { JUSTIFY_TYPE, REPORT_TYPE, TODO_TYPE } from '../../../constants/comments'
import InvestibleStatus from './InvestibleStatus'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { PLANNING_TYPE } from '../../../constants/markets'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { Assignments, getCollaborators } from '../../Investible/Planning/PlanningInvestible'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import { DaysEstimate } from '../../../components/AgilePlan'
import Voting from '../../Investible/Decision/Voting'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'

export function addExpansionPanel(item, commentState, marketState, investiblesState, diffState, planningClasses,
  marketPresencesState, marketStagesState, marketsState, mobileLayout) {
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType } = message;

  if ((['UNREAD_REPLY', 'NEW_TODO', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE', 'UNREAD_REVIEWABLE',
      'REVIEW_REQUIRED'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (messageType === 'UNASSIGNED' && linkType === 'MARKET_TODO')) {
    let useMarketId = commentMarketId || marketId;
    let useCommentId = commentId;
    if (!useCommentId) {
      const market = getMarket(marketState, marketId) || {};
      const { parent_comment_id: inlineParentCommentId, parent_comment_market_id: parentMarketId } = market;
      if (inlineParentCommentId) {
        useMarketId = parentMarketId;
        useCommentId = inlineParentCommentId;
      }
    }
    if (!useCommentId && investibleId) {
      const investibleComments = getUnresolvedInvestibleComments(investibleId, marketId, commentState);
      const report = investibleComments.find((comment) => comment.comment_type === REPORT_TYPE
        && comment.creator_assigned) || {};
      useCommentId = report.id;
    }
    const rootComment = getCommentRoot(commentState, useMarketId, useCommentId);
    // Note passing all comments down instead of just related to the unread because otherwise confusing and also
    // have case of more than one reply being de-duped
    if (!_.isEmpty(rootComment)) {
      const { comment_type: commentType, investible_id: investibleId } = rootComment;
      item.expansionPanel = <Comment
        depth={0}
        marketId={useMarketId}
        comment={rootComment}
        comments={getMarketComments(commentState, useMarketId)}
        defaultShowDiff
        allowedTypes={[]}
        noAuthor={marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId}
      />;
    }
  } else if (messageType === 'REPORT_REQUIRED') {
    if (!_.isEmpty(investibleId)) {
      item.expansionPanel = <InvestibleStatus
        investibleId={investibleId}
        message={message}
        marketId={marketId}
      />;
    }
  } else if (messageType === 'UNREAD_DESCRIPTION') {
    if (!_.isEmpty(investibleId)) {
      const diff = getDiff(diffState, investibleId);
      if (diff) {
        const fullInvestible = getInvestible(investiblesState, investibleId) || {};
        const { investible: myInvestible } = fullInvestible;
        const { description } = myInvestible || {};
        item.expansionPanel = (
          <RaisedCard elevation={3}>
            <div style={{padding: '1.25rem'}}>
              <DescriptionOrDiff id={investibleId} description={description} showDiff={true}/>
            </div>
          </RaisedCard>
        );
      }
    } else {
      const diff = getDiff(diffState, marketId);
      if (diff) {
        const market = getMarket(marketState, marketId) || {};
        const { description } = market;
        item.expansionPanel = (
          <RaisedCard elevation={3}>
            <div style={{padding: '1.25rem'}}>
              <DescriptionOrDiff id={marketId} description={description} showDiff={true}/>
            </div>
          </RaisedCard>
        );
      }
    }
  } else if (['NOT_FULLY_VOTED', 'ASSIGNED_UNREVIEWABLE'].includes(messageType)) {
    const marketPresences = getMarketPresences(marketPresencesState, marketId);
    const investibleComments = getUnresolvedInvestibleComments(investibleId, marketId, commentState);
    const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
      investibleId);
    const inv = getInvestible(investiblesState, investibleId);
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { assigned: invAssigned, completion_estimate: marketDaysEstimate, required_approvers:  requiredApprovers
    } = marketInfo;
    const assigned = invAssigned || [];
    item.expansionPanel = (
      <RaisedCard elevation={3}>
        <div style={{display: mobileLayout ? 'block' : 'flex', padding: '1rem'}}>
          <div className={clsx(planningClasses.group, planningClasses.assignments)}
               style={{maxWidth: '15rem', marginRight: '1rem'}}>
            <div style={{textTransform: 'capitalize'}}>
              <b><FormattedMessage id="planningInvestibleAssignments"/></b>
              <Assignments
                classes={planningClasses}
                marketPresences={marketPresences}
                assigned={assigned}
                isAdmin={false}
                toggleAssign={() => {}}
                toolTipId="storyAddParticipantsLabel"
                showMoveMessage
              />
            </div>
          </div>
          <div className={clsx(planningClasses.group, planningClasses.assignments)}
               style={{maxWidth: '15rem', marginRight: '1rem'}}>
            <div style={{textTransform: 'capitalize'}}>
              <b><FormattedMessage id="collaborators"/></b>
              <Assignments
                classes={planningClasses}
                marketPresences={marketPresences}
                assigned={investibleCollaborators}
                isAdmin={false}
                toggleAssign={() => {}}
                toolTipId="collaborators"
              />
            </div>
          </div>
          {requiredApprovers && messageType === 'NOT_FULLY_VOTED' && (
            <div className={clsx(planningClasses.group, planningClasses.assignments)}
                 style={{maxWidth: '15rem', marginRight: '1rem'}}>
              <div style={{textTransform: 'capitalize'}}>
                <b><FormattedMessage id={'requiredApprovers'}/></b>
                <Assignments
                  classes={planningClasses}
                  marketPresences={marketPresences}
                  assigned={requiredApprovers}
                  isAdmin={false}
                  toggleAssign={() => {}}
                  toolTipId={'storyApproversLabel'}
                />
              </div>
            </div>
          )}
          {marketDaysEstimate && messageType === 'ASSIGNED_UNREVIEWABLE' && (
            <div style={{marginTop: mobileLayout? '1rem' : '2rem'}}>
              <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
            </div>
          )}
        </div>
      </RaisedCard>
    );
  } else if (messageType === 'UNREAD_VOTE' && marketType === PLANNING_TYPE && investibleId) {
    const marketPresences = getMarketPresences(marketPresencesState, marketId);
    const yourPresence = marketPresences.find((presence) => presence.current_user);
    const investibleComments = getUnresolvedInvestibleComments(investibleId, marketId, commentState);
    const investmentReasons = investibleComments.filter((comment) => {
        return comment.comment_type === JUSTIFY_TYPE;
    });
    const inv = getInvestible(investiblesState, investibleId);
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { stage } = marketInfo;
    const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
    const market = getMarket(marketsState, marketId) || {};
    item.expansionPanel = (
      <RaisedCard elevation={3}>
        <h2 id="approvals">
          <FormattedMessage id="decisionInvestibleOthersVoting" />
        </h2>
        <Voting
          investibleId={investibleId}
          marketPresences={marketPresences}
          investmentReasons={investmentReasons}
          showExpiration={fullStage.has_expiration}
          expirationMinutes={market.investment_expiration * 1440}
          votingPageState={{}}
          updateVotingPageState={() => {}}
          votingPageStateReset={() => {}}
          votingAllowed={false}
          yourPresence={yourPresence}
          market={market}
          isAssigned={true}
        />
      </RaisedCard>
    );
  }
}