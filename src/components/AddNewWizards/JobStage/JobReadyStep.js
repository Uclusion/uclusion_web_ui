import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { FormattedMessage } from 'react-intl';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { updateInvestible } from '../../../api/investibles';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import JobDescription from '../../InboxWizards/JobDescription';

function JobReadyStep(props) {
  const { updateFormData, formData, inv, marketId } = props;
  const classes = useContext(WizardStylesContext);
  const history = useHistory();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { useAnswer } = formData;
  const marketInfo = getMarketInfo(inv, marketId);
  const { open_for_investment: openForInvestment } = marketInfo;
  const investibleId = inv.investible.id;

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
        Is this job ready to start?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Choosing ready will send a one time notification to the group.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} />
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useAnswer: value });
          }}
          value={useAnswer || defaultAnswer}
        >
          {['Yes', 'No'].map((answer) => {
            const id = `${answer}Ready`;
            return (
              <FormControlLabel
                id={id}
                key={answer}
                /* prevent clicking the label stealing focus */
                onMouseDown={e => e.preventDefault()}
                control={<Radio color="primary" />}
                label={<FormattedMessage id={id} />}
                labelPlacement="end"
                value={answer}
              />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="OnboardingWizardFinish"
        onNext={setReadyToStart}
        spinOnClick={true}
        showTerminate={true}
        onTerminate={onFinish}
        terminateLabel="OnboardingWizardSkip"
      />
    </WizardStepContainer>
  );
}

JobReadyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobReadyStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobReadyStep;