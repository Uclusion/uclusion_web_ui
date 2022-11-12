import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import ProgressReportStep from './ProgressReportStep'
import InvestibleStatus from '../../../pages/Home/YourWork/InvestibleStatus'

function ActionStatusStep(props) {
  const { marketId, investibleId, formData, message } = props;
  const classes = useContext(WizardStylesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { commentType } = formData;

  if (commentType) {
    return <ProgressReportStep {...props} groupId={groupId}/>;
  }
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        When is your estimated completion?
      </Typography>
      <InvestibleStatus investibleId={investibleId} message={message} marketId={marketId} wizardProps={props} />
    </div>
    </WizardStepContainer>
  );
}

ActionStatusStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ActionStatusStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ActionStatusStep;