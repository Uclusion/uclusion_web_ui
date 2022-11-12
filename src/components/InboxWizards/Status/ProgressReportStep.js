import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import CommentAddBox from '../../../containers/CommentBox/CommentAddBox'

function ProgressReportStep(props) {
  const {marketId, investibleId, formData} = props;
  const classes = useContext(WizardStylesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible: myInvestible } = inv || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { commentType } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        What is your progress?
      </Typography>
      <CommentAddBox
        allowedTypes={[commentType]}
        investible={myInvestible}
        marketId={marketId}
        groupId={groupId}
        issueWarningId={'issueWarningPlanning'}
        isInReview={false}
        isStory
        wizardProps={props}
        nameDifferentiator="actionProgress"
      />
    </div>
    </WizardStepContainer>
  );
}

ProgressReportStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ProgressReportStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ProgressReportStep;