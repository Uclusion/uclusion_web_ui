import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { updateInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function JobReviewerStep (props) {
  const { marketId, updateFormData, formData, onFinish, investibleId } = props;
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { required_reviews: reviewers } = marketInfo;
  const value = (formData.wasSet ? formData.reviewers : reviewers) || [];
  const validForm = !_.isEqual(value, reviewers);

  function onReviewerChange(newReviewers){
    updateFormData({
      reviewers: newReviewers,
      wasSet: true
    });
  }

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function reviewersJob() {
    const updateInfo = {
      marketId,
      investibleId,
      requiredReviewers: value,
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      setOperationRunning(false);
      finish();
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Who should be required to review the job?
        </Typography>
        <AssignmentList
          fullMarketPresences={marketPresences}
          previouslyAssigned={reviewers}
          onChange={onReviewerChange}
        />

        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={true}
          showTerminate={true}
          onNext={reviewersJob}
          onTerminate={finish}
          terminateLabel="JobWizardGotoJob"
        />
      </div>
    </WizardStepContainer>
  )
}

JobReviewerStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobReviewerStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobReviewerStep