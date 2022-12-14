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


function JobDescriptionStep (props) {
  const {marketId, investibleId, updateFormData} = props;
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const userId = getMyUserForMarket(marketsState, marketId);
  const { assigned } = marketInfo || {};
  const isAssigned = (assigned || []).includes(userId);

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