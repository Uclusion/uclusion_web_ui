import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { ISSUE_TYPE, REPORT_TYPE } from '../../../constants/comments';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { formInvestibleAddCommentLink, formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function OtherOptionsStep(props) {
  const { marketId, investibleId, message, formData, updateFormData } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investiblesState, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId } = marketInfo;
  const { useCompression } = formData;

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

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: message?.type === 'REPORT_REQUIRED' ? 'JobStatusTitle' : 'JobMovedTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Reporting progress also gets feedback. Moving to ready to start unassigns the job.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        nextLabel="StatusWizardReport"
        onNext={() => {
          navigate(history,
            formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, REPORT_TYPE,
              message.type_object_id));
        }}
        spinOnClick={false}
        showOtherNext
        otherNextLabel="JobAssignBacklog"
        onOtherNext={moveToBacklog}
        showTerminate
        onFinish={() => navigate(history,
          formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, ISSUE_TYPE,
            message.type_object_id))}
        terminateLabel='ApprovalWizardBlock'/>
    </WizardStepContainer>
  );
}

OtherOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

OtherOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default OtherOptionsStep;