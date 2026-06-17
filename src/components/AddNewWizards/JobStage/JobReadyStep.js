import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import ChoicePills from '../../Buttons/ChoicePills';
import { FormattedMessage } from 'react-intl';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { updateInvestible } from '../../../api/investibles';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../../InboxWizards/JobDescription';
import { getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function JobReadyStep(props) {
  const { updateFormData = () => {}, formData = {}, inv, marketId } = props;
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const { useAnswer } = formData;
  const marketInfo = getMarketInfo(inv, marketId);
  const { open_for_investment: openForInvestment, stage: currentStageId } = marketInfo;
  const investibleId = inv.investible.id;
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId);
  const isAlreadyInFurtherWork = furtherWorkStage?.id === currentStageId;

  function onFinish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function setReadyToStart() {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: useAnswer === 'Yes',
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      setOperationRunning(false);
      onFinish();
    });
  }

  const defaultAnswer = openForInvestment ? 'Yes': 'No';
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Is this job ready to assign?
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} showAssigned={false}/>
      <div style={{ marginBottom: '2rem' }} />
      <ChoicePills
        ariaLabel="comment-type-choice"
        value={useAnswer || defaultAnswer}
        onChange={(value) => updateFormData({ useAnswer: value })}
        options={['Yes', 'No'].map((answer) => ({
          value: answer,
          id: `${answer}Ready`,
          label: <FormattedMessage id={`${answer}Ready`} />,
        }))}
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        focus
        nextLabel="OnboardingWizardFinish"
        onNext={setReadyToStart}
        spinOnClick={true}
        showTerminate={true}
        onTerminate={onFinish}
        terminateLabel={isAlreadyInFurtherWork ? 'OnboardingWizardSkip' : 'cancel'}
      />
    </WizardStepContainer>
);
}

JobReadyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default JobReadyStep;