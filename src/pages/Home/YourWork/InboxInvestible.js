import React, { useContext } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import _ from 'lodash'
import {
  getInvestible,
  getMarketInvestibles,
} from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { assignedInStage, getMarketInfo } from '../../../utils/userFunctions'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE, REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  accept,
  Assignments,
  getCollaborators,
  rejectInvestible,
  useMetaDataStyles
} from '../../Investible/Planning/PlanningInvestible'
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import clsx from 'clsx'
import { PLANNING_TYPE } from '../../../constants/markets'
import { DaysEstimate } from '../../../components/AgilePlan'
import InputLabel from '@material-ui/core/InputLabel'
import MoveToNextVisibleStageActionButton from '../../Investible/Planning/MoveToNextVisibleStageActionButton'
import Voting from '../../Investible/Decision/Voting'
import YourVoting from '../../Investible/Voting/YourVoting'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { Link, Typography } from '@material-ui/core'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import Chip from '@material-ui/core/Chip'
import PropTypes from 'prop-types'
import { getLabelList } from '../../../utils/messageUtils'
import SpinningButton from '../../../components/SpinBlocking/SpinningButton'
import { workListStyles } from './WorkListItem'
import { useInvestibleEditStyles } from '../../Investible/InvestibleBodyEdit'
import { useHistory } from 'react-router'
import NotificationDeletion from './NotificationDeletion'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import { formInvestibleLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'


function InboxInvestible(props) {
  const { marketId, marketType, planningClasses, messageTypes, investibleId, mobileLayout, isOutbox,
    messagesFull, unacceptedAssignment, messageType, isDeletable, message } = props;
  const useMessageTypes = _.isEmpty(messageTypes) ? (_.isEmpty(messageType) ? [] : [messageType]) : messageTypes;
  const history = useHistory();
  const intl = useIntl();
  const workItemClasses = workListStyles();
  const classes = useMetaDataStyles();
  const investibleEditClasses = useInvestibleEditStyles();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentsDispatch] = useContext(CommentsContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const market = getMarket(marketsState, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
  const todoComments = investibleComments.filter(comment => comment.comment_type === TODO_TYPE
    || comment.comment_type === REPLY_TYPE) || [];
  const investmentReasons = investibleComments.filter(comment => comment.comment_type === JUSTIFY_TYPE) || [];
  const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const { name, description, label_list: labelList, attached_files: attachedFiles } = myInvestible || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate, required_approvers:  requiredApprovers,
    required_reviews: requiredReviewers, accepted } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const assigned = invAssigned || [];
  const isInVoting = useMessageTypes.includes('NOT_FULLY_VOTED');
  const isReview = !_.isEmpty(_.intersection(['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'], useMessageTypes));
  const allowedTypes = useMessageTypes.includes('ASSIGNED_UNREVIEWABLE') || isReview ?
    [TODO_TYPE, REPORT_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE] :
    [QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE];
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
  const assignedNotAccepted = assigned.filter((assignee) => !(accepted || []).includes(assignee));
  const diff = getDiff(diffState, investibleId);
  const showDiff = diff !== undefined && useMessageTypes.includes('UNREAD_DESCRIPTION');

  function myAccept() {
    return accept(market.id, investibleId, inv, invDispatch, diffDispatch, unacceptedAssignment, workItemClasses);
  }

  function myRejectInvestible() {
    return rejectInvestible(market.id, investibleId, inv, commentState, commentsDispatch, invDispatch, diffDispatch,
      marketStagesState);
  }

  return (
    <div style={{paddingTop: '1rem', paddingRight: '1rem', paddingLeft: '1rem',
      paddingBottom: !_.isEmpty(useMessageTypes) ? '1rem' : undefined}}>
      <div style={{display: mobileLayout ? 'block' : 'flex'}}>
        {isDeletable && !_.isEmpty(useMessageTypes) && (
          <div style={{marginRight: '1rem'}}>
            <NotificationDeletion message={message} />
          </div>
        )}
        {!_.isEmpty(useMessageTypes) && !_.isEmpty(assigned) && (
          <div className={clsx(planningClasses.group, planningClasses.assignments)}
               style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
            <div>
              <b><FormattedMessage id="planningInvestibleAssignments"/></b>
              <Assignments
                classes={planningClasses}
                marketPresences={marketPresences}
                assigned={assigned}
                highlighted={isInVoting ? assignedNotAccepted : undefined}
                isAdmin={false}
                toggleAssign={() => {}}
                toolTipId="storyAddParticipantsLabel"
                showMoveMessage
              />
            </div>
          </div>
        )}
        {!_.isEmpty(useMessageTypes) && marketType === PLANNING_TYPE && !_.isEmpty(investibleCollaborators) && (
          <div className={clsx(planningClasses.group, planningClasses.assignments)}
               style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
            <div>
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
        {((!_.isEmpty(requiredApprovers) &&
          !_.isEmpty(_.intersection(['NOT_FULLY_VOTED', 'UNACCEPTED_ASSIGNMENT'], useMessageTypes))) ||
          (!_.isEmpty(requiredReviewers) && isReview)) && (
          <div className={clsx(planningClasses.group, planningClasses.assignments)}
               style={{maxWidth: '15rem', marginRight: '1rem', overflowY: 'auto', maxHeight: '8rem'}}>
            <div>
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
        {useMessageTypes.includes('ASSIGNED_UNREVIEWABLE') && !_.isEmpty(marketDaysEstimate) && (
          <div style={{marginTop: mobileLayout ? '1rem' : '1.5rem'}}>
            <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
          </div>
        )}
        {!_.isEmpty(_.intersection(['UNACCEPTED_ASSIGNMENT'], useMessageTypes)) && (
          <div style={{marginTop: mobileLayout ? '1rem' : undefined, marginLeft: mobileLayout ? undefined : '2rem'}}>
            <div style={{display: 'flex', paddingTop: '1rem', marginBottom: 0}}>
              <SpinningButton onClick={myAccept} className={classes.actionPrimary} id='accept'>
                {intl.formatMessage({ id: 'planningAcceptLabel' })}
              </SpinningButton>
              <SpinningButton onClick={myRejectInvestible} className={classes.actionSecondary} id='reject'
                              style={{marginRight: '1rem'}}>
                {intl.formatMessage({ id: 'saveReject' })}
              </SpinningButton>
            </div>
          </div>
        )}
        {!_.isEmpty(_.intersection(['ASSIGNED_UNREVIEWABLE', 'ISSUE_RESOLVED', 'UNREAD_VOTE'],
          useMessageTypes)) && (
          <div style={{marginTop: mobileLayout ? '1rem' : undefined, marginLeft: mobileLayout ? undefined : '2rem'}}>
            <InputLabel id="next-allowed-stages-label" style={{ marginBottom: '0.25rem' }}>
              {intl.formatMessage({ id: 'quickChangeStage' })}</InputLabel>
            <MoveToNextVisibleStageActionButton
              key="visible"
              investibleId={investibleId}
              marketId={market.id}
              currentStageId={stage}
              disabled={false}
              hasTodos={false}
              hasAssignedQuestions={false}
              highlighted={acceptedFull && isInVoting}
            />
          </div>
        )}
        {!_.isEmpty(useMessageTypes) && (
          <Typography variant="body1" style={{marginTop: mobileLayout ? '1rem' : '1.5rem'}}>
            {market.name}
          </Typography>
        )}
        {!_.isEmpty(messagesFull) && (
          <>
            {!mobileLayout && (
              <>
                <div style={{flexGrow: 1}} />
                <Typography variant="body1" style={{paddingTop: '0.5rem', paddingRight: '0.5rem'}}>
                  {intl.formatMessage({ id: 'notificationsListHeader' },
                    { x: getLabelList(messagesFull, intl, mobileLayout) })}
                </Typography>
              </>
            )}
            {mobileLayout && (
              <div style={{paddingLeft: '0.5rem', paddingRight: '0.5rem', paddingTop: '0.3rem'}}>
                {intl.formatMessage({ id: 'notificationsListHeader' },
                  { x: getLabelList(messagesFull, intl, mobileLayout) })}
              </div>
            )}
          </>
        )}
      </div>
      {_.isEmpty(useMessageTypes) && (
        <div style={{display: 'flex'}}>
          {isDeletable && (
            <NotificationDeletion message={message} />
          )}
          <Typography variant="body1" style={{paddingLeft: '1rem', marginTop: '0.25rem'}}>
            {market.name}
          </Typography>
        </div>
      )}
      {!_.isEmpty(myInvestible) && (
        <div style={{paddingTop: '1rem'}} className={investibleEditClasses.container}>
          <Link href={formInvestibleLink(marketId, investibleId)} onClick={(event) => {
            preventDefaultAndProp(event);
            navigate(history, formInvestibleLink(marketId, investibleId));
          }}>
            <Typography className={investibleEditClasses.title} variant="h3" component="h1">
              {name}
            </Typography>
          </Link>
          <DescriptionOrDiff id={investibleId} description={description} showDiff={showDiff} />
        </div>
      )}
      {useMessageTypes.includes('UNREAD_NAME') && (
        <Typography variant="h6" style={{paddingTop: '1rem'}}>
          {intl.formatMessage({ id: 'nameChange' }, { x: name })}
        </Typography>
      )}
      {useMessageTypes.includes('UNREAD_ATTACHMENT') && (
        <div style={{paddingTop: '1rem', width: 'fit-content'}}>
          <AttachedFilesList
            marketId={market.id}
            isAdmin={false}
            attachedFiles={attachedFiles}
          />
        </div>
      )}
      {useMessageTypes.includes('UNREAD_LABEL') && (
        <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
          {labelList && labelList.map((label) =>
            <div key={label} className={planningClasses.labelChip}>
              <Chip label={label} color="primary" />
            </div>
          )}
        </div>
      )}
      {!_.isEmpty(_.intersection(['UNACCEPTED_ASSIGNMENT', 'UNREAD_VOTE'], useMessageTypes)) && (
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
            isInbox
          />
        </div>
      )}
      {useMessageTypes.includes('NOT_FULLY_VOTED') && (
        <>
          <YourVoting
            investibleId={investibleId}
            marketPresences={marketPresences}
            comments={investmentReasons}
            userId={userId}
            market={market}
            isAssigned={false}
            isInbox
          />
          <h3>{intl.formatMessage({ id: 'orStructuredComment' })}</h3>
        </>
      )}
      {!_.isEmpty(useMessageTypes) && marketId && !_.isEmpty(myInvestible) && !isOutbox &&
        _.isEmpty(_.intersection(['NEW_TODO', 'ISSUE_RESOLVED', 'UNREAD_VOTE', 'UNACCEPTED_ASSIGNMENT'],
          useMessageTypes)) && (
        <>
          <div style={{paddingTop: '1rem'}} />
          <CommentAddBox
            allowedTypes={allowedTypes}
            investible={myInvestible}
            marketId={marketId}
            issueWarningId={'issueWarningPlanning'}
            isInReview={isReview}
            isAssignee={!_.isEmpty(_.intersection(['ASSIGNED_UNREVIEWABLE', 'UNACCEPTED_ASSIGNMENT'],
              useMessageTypes))}
            isStory
            nameDifferentiator="inboxInvestible"
          />
        </>
      )}
      {!_.isEmpty(useMessageTypes) && (!_.isEmpty(investmentReasonsRemoved) || useMessageTypes.includes('NEW_TODO'))
        && (
        <div style={{paddingTop: '0.5rem'}}>
          <CommentBox
            comments={useMessageTypes.includes('NEW_TODO') ? todoComments : investmentReasonsRemoved}
            marketId={marketId}
            allowedTypes={[]}
            fullStage={fullStage}
            isInbox
          />
        </div>
      )}
    </div>
  );
}

InboxInvestible.propTypes = {
  messageTypes: PropTypes.arrayOf(PropTypes.string),
  marketId: PropTypes.string.isRequired,
  isOutbox: PropTypes.bool
};

InboxInvestible.defaultProps = {
  isOutbox: false
};

export default React.memo(InboxInvestible);