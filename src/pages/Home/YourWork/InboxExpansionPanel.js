import Comment from '../../../components/Comments/Comment'
import React from 'react'
import _ from 'lodash'
import {
  getCommentRoot, getInvestibleComments,
  getMarketComments,
  getUnresolvedInvestibleComments
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import InvestibleStatus from './InvestibleStatus'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import {
  getInvestible,
  getMarketInvestibles,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { PLANNING_TYPE } from '../../../constants/markets'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { Assignments, getCollaborators } from '../../Investible/Planning/PlanningInvestible'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { assignedInStage, getMarketInfo } from '../../../utils/userFunctions'
import { DaysEstimate } from '../../../components/AgilePlan'
import Voting from '../../Investible/Decision/Voting'
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import DialogManage from '../../Dialog/DialogManage'
import { Checkbox, FormControlLabel } from '@material-ui/core'
import { updateInvestible } from '../../../api/investibles'
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import YourVoting from '../../Investible/Voting/YourVoting'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import PlanningInvestibleEdit from '../../Investible/Planning/PlanningInvestibleEdit'
import { removeWorkListItem } from './WorkListItem'
import { editorEmpty } from '../../../components/TextEditors/QuillEditor2'
import InputLabel from '@material-ui/core/InputLabel'
import MoveToNextVisibleStageActionButton from '../../Investible/Planning/MoveToNextVisibleStageActionButton'

export function addExpansionPanel(props) {
  const {item, commentState, marketState, investiblesState, investiblesDispatch, diffState,
    planningClasses, marketPresencesState, marketStagesState, marketsState, mobileLayout, messagesState,
    messagesDispatch, operationRunning, setOperationRunning, intl, workItemClasses} = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType } = message;

  if ((['UNREAD_REPLY', 'NEW_TODO', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE'].includes(messageType)) ||
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
            <>
              <PlanningInvestibleEdit
                fullInvestible={fullInvestible}
                marketId={marketId}
                marketPresences={marketPresences}
                onSave={(result) => {
                  const { fullInvestible } = result;
                  refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
                  removeWorkListItem(message, workItemClasses.removed, messagesDispatch);
                }}
                isAdmin={isAdmin}
                isAssign={true}
                isReview={false}
                isApprove={false}
                isInbox
              />
              <div style={{paddingTop: '1.25rem'}} />
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
            </>
          )}
          {!_.isEmpty(description) && !editorEmpty(description) && (
            <div style={{paddingTop: '0.5rem'}}>
              <DescriptionOrDiff id={investibleId} description={description} showDiff={diff !== undefined}/>
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
    'ISSUE_RESOLVED', 'UNREAD_ASSIGNMENT'].includes(messageType)) {
    const market = getMarket(marketsState, marketId) || {};
    const userId = getMyUserForMarket(marketsState, marketId) || '';
    const marketPresences = getMarketPresences(marketPresencesState, marketId);
    const yourPresence = marketPresences.find((presence) => presence.current_user);
    const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
    const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
    const investmentReasons = investibleComments.filter(comment => comment.comment_type === JUSTIFY_TYPE) || [];
    const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
      investibleId);
    const inv = getInvestible(investiblesState, investibleId) || {};
    const { investible: myInvestible } = inv;
    const { description } = myInvestible || {};
    const marketInfo = getMarketInfo(inv, marketId) || {};
    const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate, required_approvers:  requiredApprovers,
      required_reviews: requiredReviewers } = marketInfo;
    const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
    const assigned = invAssigned || [];
    const isInVoting = messageType === 'NOT_FULLY_VOTED';
    const isReview = ['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'].includes(messageType);
    const allowedTypes = messageType === 'ASSIGNED_UNREVIEWABLE' ? [TODO_TYPE] :
      (isReview ? [REPORT_TYPE] : [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE]);
    const inAcceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
    const investibles = getMarketInvestibles(investiblesState, marketId);
    const assignedInAcceptedStage = assigned.reduce((acc, userId) => {
      return acc.concat(assignedInStage(
        investibles,
        userId,
        inAcceptedStage.id,
        marketId
      ));
    }, []);
    const acceptedFull = inAcceptedStage.allowed_investibles > 0
      && assignedInAcceptedStage.length >= inAcceptedStage.allowed_investibles;
    item.expansionPanel = (
      <div style={{padding: '1rem'}}>
        <div style={{display: mobileLayout ? 'block' : 'flex'}}>
          {!_.isEmpty(assigned) && (
              <div className={clsx(planningClasses.group, planningClasses.assignments)}
                   style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
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
                 style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
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
          {((!_.isEmpty(requiredApprovers) && ['NOT_FULLY_VOTED', 'UNREAD_ASSIGNMENT'].includes(messageType))||
            (!_.isEmpty(requiredReviewers) && isReview)) && (
            <div className={clsx(planningClasses.group, planningClasses.assignments)}
                 style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
              <div style={{textTransform: 'capitalize'}}>
                <b><FormattedMessage id={isInVoting ? 'requiredApprovers' : 'requiredReviewers'}/></b>
                <Assignments
                  classes={planningClasses}
                  marketPresences={marketPresences}
                  assigned={isInVoting ? requiredApprovers : requiredReviewers}
                  isAdmin={false}
                  toggleAssign={() => {}}
                  toolTipId={isInVoting ? 'storyApproversLabel' : 'storyReviewersLabel'}
                />
              </div>
            </div>
          )}
          {messageType === 'ASSIGNED_UNREVIEWABLE' && (
            <div style={{marginTop: mobileLayout ? '1rem' : '1.5rem'}}>
              <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
            </div>
          )}
          {['ASSIGNED_UNREVIEWABLE', 'ISSUE_RESOLVED', 'UNREAD_ASSIGNMENT'].includes(messageType) && (
            <div style={{marginTop: mobileLayout ? '1rem' : undefined, marginLeft: mobileLayout ? undefined : '2rem'}}>
              <InputLabel id="next-allowed-stages-label" style={{ marginBottom: '0.25rem' }}>
                {intl.formatMessage({ id: 'quickChangeStage' })}</InputLabel>
              <MoveToNextVisibleStageActionButton
                key="visible"
                investibleId={investibleId}
                marketId={market.id}
                currentStageId={stage}
                disabled={false}
                acceptedStageAvailable={!acceptedFull}
                hasTodos={false}
                hasAssignedQuestions={false}
              />
            </div>
          )}
        </div>
        {!_.isEmpty(description) && !editorEmpty(description) && (
          <div style={{paddingTop: '1rem'}}>
            <DescriptionOrDiff id={investibleId} description={description} showDiff={false}/>
          </div>
        )}
        {messageType === 'UNREAD_ASSIGNMENT' && (
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
        )}
        {messageType === 'NOT_FULLY_VOTED' && (
          <>
            <YourVoting
              investibleId={investibleId}
              marketPresences={marketPresences}
              comments={investmentReasons}
              userId={userId}
              market={market}
              isAssigned={false}
            />
            <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
          </>
        )}
        {marketId && !_.isEmpty(myInvestible) && messageType !== 'ISSUE_RESOLVED' && (
          <>
            {messageType !== 'NOT_FULLY_VOTED' && (
              <div style={{paddingTop: '0.5rem'}} />
            )}
            <CommentAddBox
              allowedTypes={allowedTypes}
              investible={myInvestible}
              marketId={marketId}
              issueWarningId={'issueWarningPlanning'}
              isInReview={isReview}
              isAssignee={['ASSIGNED_UNREVIEWABLE', 'UNREAD_ASSIGNMENT'].includes(messageType)}
              isStory
            />
          </>
        )}
        {!_.isEmpty(investmentReasonsRemoved) && (
          <div style={{paddingTop: '0.5rem', overflowY: 'auto', maxHeight: '25rem'}}>
            <CommentBox
              comments={investmentReasonsRemoved}
              marketId={marketId}
              allowedTypes={[]}
              isInbox
            />
          </div>
        )}
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
  }
}