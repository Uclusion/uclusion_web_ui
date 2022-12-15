import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import JobDescription from '../JobDescription'
import { ISSUE_TYPE } from '../../CardType'
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { wizardFinish } from '../InboxWizardUtils';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';


function JobDescriptionStep (props) {
  const {marketId, investibleId, updateFormData, message} = props;
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId);
  const { assigned } = marketInfo || {};
  const isAssigned = (assigned || []).includes(userId);

  function myOnFinish() {
    wizardFinish({link: `${formInvestibleLink(marketId, investibleId)}#approve`},
      setOperationRunning, message, history);
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Should this job be done now?
      </Typography>
      {isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Keep in mind that you are assigned to this job.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <WizardStepButtons
        {...props}
        nextLabel="ApprovalWizardApprove"
        showOtherNext
        otherNextLabel="ApprovalWizardBlock"
        onOtherNext={() => updateFormData({ commentType: ISSUE_TYPE })}
        onNext={() => updateFormData({ isApprove: true, investibleId })}
        showTerminate={true}
        onFinish={myOnFinish}
        terminateLabel="ApproveWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;