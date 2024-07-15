import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription'
import { ISSUE_TYPE, REPORT_TYPE } from '../../../constants/comments';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formInvestibleAddCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import UsefulRelativeTime from '../../TextFields/UseRelativeTime';
import { getLabelForTerminate } from '../../../utils/messageUtils';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getMarketPresences, isSingleUserMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';


function JobDescriptionStatusStep(props) {
  const { marketId, investibleId, message, formData, updateFormData } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investiblesState, invDispatch] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState,,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { is_highlighted: isHighlighted, link_type: linkType } = message;
  const market = getMarket(marketsState, marketId) || {};
  const { started_expiration: startedExpiration } = market;
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true, true);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { completion_estimate: daysEstimate, last_stage_change_date: lastStageChangeDate,
    stage: currentStageId } = marketInfo;
  let millisSinceDue = null;
  if (daysEstimate) {
    const daysEstimateDate = new Date(daysEstimate);
    millisSinceDue = Date.now() - daysEstimateDate.getTime();
  }
  let millisStalled = Date.now() - (new Date(lastStageChangeDate)).getTime();
  if (millisSinceDue !== null && millisSinceDue < millisStalled) {
    millisStalled = millisSinceDue;
  }
  let reportId;
  comments.forEach((comment) => {
    if (comment.comment_type === REPORT_TYPE) {
      reportId = comment.id;
      const millisSinceReporting = Date.now() - (new Date(comment.updated_at)).getTime();
      if (millisSinceReporting < millisStalled) {
        millisStalled = millisSinceReporting;
      }
    }
  })
  const millisBeforeMove = startedExpiration*86400000 - millisStalled;
  const alreadyMoved = linkType === 'INVESTIBLE_STAGE';
  const { useCompression } = formData;
  const isSingleUser = isSingleUserMarket(marketPresences);

  function myTerminate() {
    if (isHighlighted || alreadyMoved) {
      removeWorkListItem(message, messagesDispatch, history);
    } else {
      navigate(history,
        formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, ISSUE_TYPE,
          message.type_object_id));
    }
  }

  function moveToBacklog() {
    const backlogStage = getFurtherWorkStage(marketStagesState, marketId)
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: backlogStage.id,
        open_for_investment: true
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(backlogStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
          invDispatch, () => {}, marketStagesState, undefined, backlogStage,
          marketPresencesDispatch);
        setOperationRunning(false);
        navigate(history, `${formInvestibleLink(marketId, investibleId)}#approve`);
      });
  }

  const stageName = isSingleUser ? 'Backlog' : 'Assigned';

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: message?.type === 'REPORT_REQUIRED' ? 'JobStatusTitle' : 'JobMovedTitle' })}
      </Typography>
      {alreadyMoved && (
        <Typography className={classes.introSubText} variant="subtitle1">
          This job was moved back to {stageName} after {startedExpiration} days with no estimate or progress
          report.
        </Typography>
      )}
      {!alreadyMoved && millisBeforeMove > 0 && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Without an estimated date or progress report this job moves to {stageName} <UsefulRelativeTime
          milliSecondsGiven={millisBeforeMove}/>.
          Reporting progress also gets feedback.
        </Typography>
      )}
      {!alreadyMoved && millisBeforeMove <= 0 && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Without an estimated date or progress report this job will move to {stageName}. Reporting progress also
          gets feedback.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments}
                      useCompression={useCompression} inboxMessageId={reportId}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions/>
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel={alreadyMoved ? 'StatusWizardEstimateStart' : 'StatusWizardEstimate'}
        isFinal={false}
        spinOnClick={false}
        showOtherNext
        otherNextLabel={alreadyMoved ? 'JobAssignBacklog' : 'otherOptionsLabel'}
        onOtherNext={alreadyMoved ? moveToBacklog : undefined}
        onOtherNextSkipStep
        onOtherNextDoAdvance={!alreadyMoved}
        otherSpinOnClick={alreadyMoved}
        showTerminate
        onFinish={myTerminate}
        terminateLabel={(isHighlighted || alreadyMoved) ? getLabelForTerminate(message) : 'ApprovalWizardBlock'}/>
    </WizardStepContainer>
  );
}

JobDescriptionStatusStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStatusStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStatusStep;