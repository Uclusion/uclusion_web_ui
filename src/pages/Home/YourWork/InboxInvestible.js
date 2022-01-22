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
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE
} from '../../../constants/comments'
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { getInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { Assignments, getCollaborators } from '../../Investible/Planning/PlanningInvestible'
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import clsx from 'clsx'
import { PLANNING_TYPE } from '../../../constants/markets'
import { DaysEstimate } from '../../../components/AgilePlan'
import InputLabel from '@material-ui/core/InputLabel'
import MoveToNextVisibleStageActionButton from '../../Investible/Planning/MoveToNextVisibleStageActionButton'
import { editorEmpty } from '../../../components/TextEditors/QuillEditor2'
import DescriptionOrDiff from '../../../components/Descriptions/DescriptionOrDiff'
import Voting from '../../Investible/Decision/Voting'
import YourVoting from '../../Investible/Voting/YourVoting'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { Typography } from '@material-ui/core'
import { getDiff } from '../../../contexts/DiffContext/diffContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import AttachedFilesList from '../../../components/Files/AttachedFilesList'
import Chip from '@material-ui/core/Chip'
import PropTypes from 'prop-types'

function InboxInvestible(props) {
  const { marketId, marketType, planningClasses, messageTypes, investibleId, mobileLayout, isOutbox } = props;
  const intl = useIntl();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState] = useContext(CommentsContext);
  const [diffState] = useContext(DiffContext);
  const market = getMarket(marketsState, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const investibleComments = getInvestibleComments(investibleId, marketId, commentState);
  const investmentReasonsRemoved = investibleComments.filter(comment => comment.comment_type !== JUSTIFY_TYPE) || [];
  const todoComments = investibleComments.filter(comment => comment.comment_type === TODO_TYPE) || [];
  const investmentReasons = investibleComments.filter(comment => comment.comment_type === JUSTIFY_TYPE) || [];
  const investibleCollaborators = getCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId);
  const inv = getInvestible(investiblesState, investibleId) || {};
  const { investible: myInvestible } = inv;
  const { name, description, label_list: labelList, attached_files: attachedFiles } = myInvestible || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage, assigned: invAssigned, completion_estimate: marketDaysEstimate, required_approvers:  requiredApprovers,
    required_reviews: requiredReviewers } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const assigned = invAssigned || [];
  const isInVoting = messageTypes.includes('NOT_FULLY_VOTED');
  const isReview = !_.isEmpty(_.intersection(['UNREAD_REVIEWABLE', 'REVIEW_REQUIRED'], messageTypes));
  const allowedTypes = messageTypes.includes('ASSIGNED_UNREVIEWABLE') || isReview ?
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
  const diff = getDiff(diffState, investibleId);
  return (
    <div style={{paddingTop: '1rem', paddingRight: '1rem', paddingLeft: '1rem',
      paddingBottom: !_.isEmpty(messageTypes) ? '1rem' : undefined}}>
      <div style={{display: mobileLayout ? 'block' : 'flex'}}>
        {!_.isEmpty(messageTypes) && !_.isEmpty(assigned) && (
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
        {!_.isEmpty(messageTypes) && marketType === PLANNING_TYPE && !_.isEmpty(investibleCollaborators) && (
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
        {((!_.isEmpty(requiredApprovers) &&
          !_.isEmpty(_.intersection(['NOT_FULLY_VOTED', 'UNREAD_ASSIGNMENT'], messageTypes))) ||
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
        {messageTypes.includes('ASSIGNED_UNREVIEWABLE') && (
          <div style={{marginTop: mobileLayout ? '1rem' : '1.5rem'}}>
            <DaysEstimate readOnly value={marketDaysEstimate} isInbox />
          </div>
        )}
        {!_.isEmpty(_.intersection(['ASSIGNED_UNREVIEWABLE', 'ISSUE_RESOLVED', 'UNREAD_ASSIGNMENT'],
          messageTypes)) && (
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
        {!_.isEmpty(messageTypes) && (
          <Typography variant="body1" style={{marginTop: mobileLayout ? '1rem' : '1.5rem'}}>
            {market.name}
          </Typography>
        )}
      </div>
      {_.isEmpty(messageTypes) && (
        <Typography variant="h6">
          {intl.formatMessage({ id: 'investibleInboxHeader' }, { x: market.name, y: name })}
        </Typography>
      )}
      {!_.isEmpty(description) && !editorEmpty(description) && (
        <div style={{paddingTop: '1rem'}}>
          <DescriptionOrDiff id={investibleId} description={description}
                             showDiff={diff !== undefined && messageTypes.includes('UNREAD_DESCRIPTION')}/>
        </div>
      )}
      {messageTypes.includes('UNREAD_NAME') && (
        <Typography variant="h6" style={{paddingTop: '1rem'}}>
          {intl.formatMessage({ id: 'nameChange' }, { x: name })}
        </Typography>
      )}
      {messageTypes.includes('UNREAD_ATTACHMENT') && (
        <div style={{paddingTop: '1rem', width: 'fit-content'}}>
          <AttachedFilesList
            marketId={market.id}
            isAdmin={false}
            attachedFiles={attachedFiles}
          />
        </div>
      )}
      {messageTypes.includes('UNREAD_LABEL') && (
        <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
          {labelList && labelList.map((label) =>
            <div key={label} className={planningClasses.labelChip}>
              <Chip label={label} color="primary" />
            </div>
          )}
        </div>
      )}
      {!_.isEmpty(_.intersection(['UNREAD_ASSIGNMENT', 'UNREAD_VOTE'], messageTypes)) && (
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
      {messageTypes.includes('NOT_FULLY_VOTED') && (
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
      {!_.isEmpty(messageTypes) && marketId && !_.isEmpty(myInvestible) && !isOutbox &&
        _.isEmpty(_.intersection(['NEW_TODO', 'ISSUE_RESOLVED', 'UNREAD_VOTE'], messageTypes)) && (
        <>
          <div style={{paddingTop: '1rem'}} />
          <CommentAddBox
            allowedTypes={allowedTypes}
            investible={myInvestible}
            marketId={marketId}
            issueWarningId={'issueWarningPlanning'}
            isInReview={isReview}
            isAssignee={!_.isEmpty(_.intersection(['ASSIGNED_UNREVIEWABLE', 'UNREAD_ASSIGNMENT'], messageTypes))}
            isStory
          />
        </>
      )}
      {!_.isEmpty(messageTypes) &&
        (!_.isEmpty(investmentReasonsRemoved) || (messageTypes.includes('NEW_TODO') && !_.isEmpty(todoComments))) && (
        <div style={{paddingTop: '0.5rem'}}>
          <CommentBox
            comments={messageTypes.includes('NEW_TODO') ? todoComments : investmentReasonsRemoved}
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
  messageTypes: [],
  isOutbox: false
};

export default InboxInvestible;