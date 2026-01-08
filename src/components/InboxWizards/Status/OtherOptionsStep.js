import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription';
import { ISSUE_TYPE, REPORT_TYPE } from '../../../constants/comments';
import { formInvestibleAddCommentLink, formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE, JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function OtherOptionsStep(props) {
  const { marketId, investibleId, message, formData = {}, updateFormData = () => {} } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const intl = useIntl();
  const [marketStagesState] = useContext(MarketStagesContext);
  const { useCompression } = formData;

  function moveToBacklog() {
    const backlogStage = getFurtherWorkStage(marketStagesState, marketId)
    navigate(history,
      `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${backlogStage.id}&typeObjectId=${message.type_object_id}&isAssign=false`);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: message?.type === 'REPORT_REQUIRED' ? 'JobStatusTitle' : 'JobMovedTitle' })}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Reporting progress also gets feedback. Moving to ready to assign unassigns the job.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      removeActions />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
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
        otherSpinOnClick={false}
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

export default OtherOptionsStep;