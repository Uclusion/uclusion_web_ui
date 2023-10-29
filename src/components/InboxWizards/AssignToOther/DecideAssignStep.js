import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../JobDescription';
import { stageChangeInvestible } from '../../../api/investibles';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import UsefulRelativeTime from '../../TextFields/UseRelativeTime';
import { getMarketInfo } from '../../../utils/userFunctions';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { getFullStage, getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { JOB_ASSIGNEE_WIZARD_TYPE } from '../../../constants/markets';

function DecideAssignStep(props) {
  const { marketId, investibleId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const history = useHistory();
  const intl = useIntl();
  const classes = wizardStyles();

  function moveToBacklog() {
    const targetStageId = getFurtherWorkStage(marketStagesState, marketId).id;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: marketInfo.stage,
        stage_id: targetStageId,
      },
    };
    return stageChangeInvestible(moveInfo).then((investible) => {
      const fullStage = getFullStage(marketStagesState, marketId, marketInfo.stage) || {};
      onInvestibleStageChange(targetStageId, investible, investibleId, marketId, commentsState, commentsDispatch,
        investiblesDispatch, () => {}, marketStagesState, undefined, fullStage,
        marketPresencesDispatch);
      setOperationRunning(false);
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideAssignTitle'})}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        You assigned this job <UsefulRelativeTime value={new Date(marketInfo.last_stage_change_date)}/> and
        the assignee has not accepted.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="DecideWizardReassign"
        spinOnClick={false}
        onNext={() => navigate(history, formWizardLink(JOB_ASSIGNEE_WIZARD_TYPE, marketId, investibleId))}
        isFinal={false}
        showOtherNext
        onOtherNext={moveToBacklog}
        isOtherFinal
        otherNextLabel="DecideMoveBacklog"
      />
    </WizardStepContainer>
  );
}

DecideAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssignStep;