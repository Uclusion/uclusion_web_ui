import React from 'react'
import _ from 'lodash'
import { getUnresolvedInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { JUSTIFY_TYPE } from '../../../constants/comments'
import InvestibleStatus from './InvestibleStatus'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import {
  getInvestible,
  refreshInvestibles
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { PLANNING_TYPE } from '../../../constants/markets'
import { FormattedMessage } from 'react-intl'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { getMarketInfo } from '../../../utils/userFunctions'
import Voting from '../../Investible/Decision/Voting'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import DialogManage from '../../Dialog/DialogManage'
import { Checkbox, FormControlLabel, Typography } from '@material-ui/core'
import { updateInvestible } from '../../../api/investibles'
import { notify, onInvestibleStageChange } from '../../../utils/investibleFunctions'
import { UNASSIGNED_TYPE, YELLOW_LEVEL } from '../../../constants/notifications'
import PlanningInvestibleEdit from '../../Investible/Planning/PlanningInvestibleEdit'
import { removeWorkListItem } from './WorkListItem'
import { editorEmpty } from '../../../components/TextEditors/QuillEditor2'
import LinkMultiplePanel from './LinkMultiplePanel'
import CommentPanel from './CommentPanel'
import InboxInvestible from './InboxInvestible'
import { DaysEstimate } from '../../../components/AgilePlan'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import Chip from '@material-ui/core/Chip'

export function addExpansionPanel(props) {
  const {item, commentState, marketState, investiblesState, investiblesDispatch, diffState,
    planningClasses, marketPresencesState, marketStagesState, marketsState, mobileLayout, messagesState,
    messagesDispatch, operationRunning, setOperationRunning, intl, workItemClasses, isMultiple} = props;
  const { message } = item;
  const { type: messageType, market_id: marketId, comment_id: commentId, comment_market_id: commentMarketId,
    link_type: linkType, investible_id: investibleId, market_type: marketType, link_multiple: linkMultiple } = message;

  if (isMultiple) {
    item.expansionPanel = ( <LinkMultiplePanel linkMultiple={linkMultiple} marketId={commentMarketId || marketId}
                                               commentId={commentId} planningClasses={planningClasses}
                                               mobileLayout={mobileLayout}/> );
  } else if ((['UNREAD_REPLY', 'UNREAD_COMMENT', 'UNREAD_RESOLVED', 'ISSUE'].includes(messageType)) ||
    (['UNREAD_OPTION', 'UNREAD_VOTE', 'NOT_FULLY_VOTED', 'INVESTIBLE_SUBMITTED'].includes(messageType)
      && linkType.startsWith('INLINE')) || (messageType === 'UNASSIGNED' && linkType === 'MARKET_TODO')) {
    item.expansionPanel = ( <CommentPanel marketId={commentMarketId || marketId} commentId={commentId}
                                          marketType={marketType} messageType={messageType}/> );
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
    'ISSUE_RESOLVED', 'UNREAD_ASSIGNMENT', 'NEW_TODO'].includes(messageType)) {
    item.expansionPanel = <InboxInvestible marketId={marketId} investibleId={investibleId} messageTypes={[messageType]}
                                           planningClasses={planningClasses} marketType={marketType}
                                           mobileLayout={mobileLayout} />;
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
  } else if (messageType === 'UNREAD_DRAFT') {
    item.expansionPanel = (
      <DialogManage marketId={marketId} onClose={() => {}} isInbox />
    );
  }
}