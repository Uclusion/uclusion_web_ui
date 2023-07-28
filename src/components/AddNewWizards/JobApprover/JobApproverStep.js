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
import JobDescription from '../../InboxWizards/JobDescription';

function JobApproverStep (props) {
  const { marketId, updateFormData, formData, onFinish, investibleId } = props;
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { required_approvers: approvers } = marketInfo;
  const value = (formData.wasSet ? formData.approvers : approvers) || [];
  const validForm = !_.isEqual(value, approvers);

  function onApproverChange(newApprovers){
    updateFormData({
      approvers: newApprovers,
      wasSet: true
    });
  }

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function approversJob() {
    const updateInfo = {
      marketId,
      investibleId,
      requiredApprovers: value,
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
        <Typography className={classes.introText} variant="h6">
          Who should be required to approve the job?
        </Typography>
        <JobDescription marketId={marketId} investibleId={investibleId} showDescription={false} showAssigned={false} />
        <AssignmentList
          fullMarketPresences={marketPresences}
          previouslyAssigned={approvers}
          onChange={onApproverChange}
        />

        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={true}
          onNext={approversJob}
        />
    </WizardStepContainer>
  )
}

JobApproverStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobApproverStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobApproverStep