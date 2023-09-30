import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
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

function EstimateCompletionStep(props) {
  const { marketId, investibleId, message, updateFormData, formData } = props;
  const classes = wizardStyles();
  const intl = useIntl();
  const history = useHistory();
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
  const { newEstimate } = formData;
  const alreadyMoved = linkType === 'INVESTIBLE_STAGE';

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
          dismissWorkListItem(message, messagesDispatch, history);
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

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        When is your estimated completion?
      </Typography>
      <div style={{paddingTop: '1rem'}}>
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
          showTerminate={true}
          terminateLabel="defer"/>
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