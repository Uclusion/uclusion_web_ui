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
import ExpiresDisplay from '../../../components/Expiration/ExpiresDisplay'
import DialogManage from '../../Dialog/DialogManage'
import { Checkbox, FormControlLabel } from '@material-ui/core'
import { updateInvestible } from '../../../api/investibles'
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications'

export function addExpansionPanel(props) {
  const {item, commentState, marketState, investiblesState, investiblesDispatch, diffState,
    planningClasses, marketPresencesState, marketStagesState, marketsState, mobileLayout, messagesState,
    messagesDispatch, operationRunning, setOperationRunning, intl} = props;
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
    // Note - checking resolved here because can be race condition with message removal and comment resolution
    if (!_.isEmpty(rootComment) && (messageType === 'UNREAD_RESOLVED' || !rootComment.resolved)) {
      const { comment_type: commentType, investible_id: investibleId } = rootComment;
      item.expansionPanel = <div style={{paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem'}}>
        <Comment
          depth={0}
          marketId={useMarketId}
          comment={rootComment}
          comments={getMarketComments(commentState, useMarketId)}
          defaultShowDiff
          allowedTypes={[]}
          noAuthor={marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId}
        />
      </div>;
    }
  } else if (messageType === 'REPORT_REQUIRED') {
    if (!_.isEmpty(investibleId)) {
      item.expansionPanel = <InvestibleStatus
        investibleId={investibleId}
        message={message}
        marketId={marketId}
      />;
    }
  } else if (['UNREAD_DESCRIPTION', UNASSIGNED_TYPE].includes(messageType)) {
    const market = getMarket(marketState, marketId) || {};
    if (!_.isEmpty(investibleId)) {
      const diff = getDiff(diffState, investibleId);
      const fullInvestible = getInvestible(investiblesState, investibleId) || {};
      const { investible: myInvestible } = fullInvestible;
      const { description } = myInvestible || {};
      const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
      const { stage, assigned, open_for_investment: openForInvestment } = marketInfo;
      const marketPresences = getMarketPresences(marketPresencesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
      item.expansionPanel = (
        <div style={{paddingLeft: '1.25rem', paddingTop: '0.75rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
          {openForInvestment && _.isEmpty(assigned) && (
            <FormControlLabel
              control={
                <Checkbox
                  value={openForInvestment}
                  disabled={operationRunning || !isAdmin}
                  checked={openForInvestment}
                  onClick={() => {
                    const updateInfo = {
                      marketId,
                      investibleId,
                      openForInvestment: true,
                    };
                    setOperationRunning(true);
                    return updateInvestible(updateInfo).then((fullInvestible) => {
                      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
                        undefined, investiblesDispatch, () => {}, marketStagesState,
                        messagesState, messagesDispatch, [UNASSIGNED_TYPE]);
                      notify(myPresence.id, investibleId, UNASSIGNED_TYPE, YELLOW_LEVEL, investiblesState, market,
                        messagesDispatch);
                      setOperationRunning(false);
                    });
                  }}
                />
              }
              label={intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}
            />
          )}
          <div style={{paddingTop: '0.5rem'}}>
            <DescriptionOrDiff id={investibleId} description={description} showDiff={diff !== undefined}/>
          </div>
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
      <div style={{padding: '1rem'}}>
        <div style={{display: mobileLayout ? 'block' : 'flex'}}>
          {!_.isEmpty(assigned) && (
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
          )}
          {marketType === PLANNING_TYPE && !_.isEmpty(investibleCollaborators) && (
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
          )}
          {!_.isEmpty(requiredApprovers) && messageType === 'NOT_FULLY_VOTED' && (
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
          {messageType === 'ASSIGNED_UNREVIEWABLE' && (
            <div style={{marginTop: mobileLayout? '1rem' : '2rem'}}>
              <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
            </div>
          )}
        </div>
      </div>
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
      <div style={{paddingLeft: '1rem', paddingRight: '1rem'}}>
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
      </div>
    );
  } else if (messageType === 'DRAFT') {
    item.expansionPanel = (
      <DialogManage marketId={marketId} onClose={() => {}} isInbox />
    );
  } else if (messageType === 'UNREAD_COLLABORATION') {
    const market = getMarket(marketsState, marketId) || {};
    item.expansionPanel = (
      <div style={{paddingLeft: '2rem', paddingRight: '2rem', paddingTop: '1rem', paddingBottom: '1rem'}}>
        {market.created_at && (
          <ExpiresDisplay createdAt={market.created_at} expirationMinutes={market.expiration_minutes} />
        )}
        <DialogManage marketId={marketId} expires={true} onClose={() => {}} isInbox />
      </div>
    );
  }
}