import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography, useMediaQuery, useTheme } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import DatePicker from 'react-datepicker';
import WizardStepButtons from '../WizardStepButtons';
import { getMidnightToday } from '../../../utils/timerUtils';
import _ from 'lodash';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { useIntl } from 'react-intl';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { useHistory } from 'react-router';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { getAcceptedStage, getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import JobDescription from '../JobDescription';
import { REPORT_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { getCommentsSortedByType } from '../../../utils/commentFunctions';

function EstimateCompletionStep(props) {
  const { marketId, investibleId, message, updateFormData, formData } = props;
  const classes = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const { link_type: linkType } = message;
  const marketInvestible = getInvestible(investiblesState, investibleId) || {};
  const marketInfo = getMarketInfo(marketInvestible, marketId) || {};
  const { completion_estimate: daysEstimate, stage: currentStageId } = marketInfo;
  const { newEstimate, useCompression } = formData;
  const alreadyMoved = linkType === 'INVESTIBLE_STAGE';
  const marketComments = getMarketComments(commentsState, marketId);
  const comments = getCommentsSortedByType(marketComments, investibleId, true,
    true);

  function getDate() {
    if (newEstimate) {
      return new Date(newEstimate);
    }
    if (daysEstimate) {
      const nowDate = new Date();
      if (daysEstimate > nowDate) {
        return daysEstimate;
      }
    }
    return undefined;
  }
  function handleDateChange(rawDate) {
    const date = getMidnightToday(rawDate);
    if (!_.isEqual(date, daysEstimate) && !_.isEqual(date, newEstimate)) {
      updateFormData({ newEstimate: date });
    }
  }
  function submit() {
    if (alreadyMoved) {
      const startedStage = getAcceptedStage(marketStagesState, marketId);
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          completion_estimate: newEstimate,
          current_stage_id: currentStageId,
          stage_id: startedStage.id,
        },
      };
      const fullCurrentStage = getFullStage(marketStagesState, marketId, currentStageId);
      return stageChangeInvestible(moveInfo)
        .then((newInv) => {
          onInvestibleStageChange(startedStage.id, newInv, investibleId, marketId, commentsState,
            commentsDispatch, investiblesDispatch, diffDispatch, marketStagesState, undefined,
            fullCurrentStage, marketPresencesDispatch);
          setOperationRunning(false);
          dismissWorkListItem(message, messagesDispatch);
          navigate(history, formInvestibleLink(marketId, investibleId));
        });
    }
    const updateInfo = {
      marketId,
      investibleId,
      daysEstimate: newEstimate,
    };
    setOperationRunning(true);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
      setOperationRunning(false);
      dismissWorkListItem(message, messagesDispatch, history);
    });
  }

  let reportId;
  comments.forEach((comment) => {
    if (comment.comment_type === REPORT_TYPE) {
      reportId = comment.id;
    }
  })

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        When is your estimated completion?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments}
                      useCompression={useCompression} inboxMessageId={reportId}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions/>
      <div style={{paddingTop: '1rem', marginLeft: mobileLayout ? 'auto' : undefined, 
        marginRight: mobileLayout ? 'auto' : undefined, maxWidth: mobileLayout ? 'fit-content' : undefined}}>
        <DatePicker
          placeholderText={intl.formatMessage({ id: "selectDate" })}
          selected={getDate()}
          onChange={handleDateChange}
          disabled={operationRunning}
          popperPlacement="top"
          minDate={new Date()}
          inline
        />
        <div style={{paddingBottom: '1rem'}} />
        <WizardStepButtons
          {...props}
          validForm={!_.isEqual(newEstimate, daysEstimate)}
          nextLabel={alreadyMoved ? 'StatusWizardDateStart' : 'StatusWizardDate'}
          onNext={submit}
          onNextDoAdvance={false}
          showTerminate={message.type_object_id.startsWith('UNREAD')}
          terminateLabel="notificationDismiss"
        />
      </div>
    </WizardStepContainer>
  );
}

EstimateCompletionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

EstimateCompletionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default EstimateCompletionStep;