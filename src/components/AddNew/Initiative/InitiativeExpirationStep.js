import React, { useContext } from 'react';
import { useIntl } from 'react-intl'
import { Typography } from '@material-ui/core'
import StepButtons from '../StepButtons'
import ExpirationSelector from '../../Expiration/ExpirationSelector'
import PropTypes from 'prop-types'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { createMyInitiative } from './initiativeCreator';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function InitiativeExpirationStep(props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const value = formData.initiativeExpiration || 1440;

  const validForm = value !== 0;

  function onExpiresChange(event) {
    const { value } = event.target;
    updateFormData({
      initiativeExpiration: value,
    });
  }

  function doCreateInitiative(formData){
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
    };
    return createMyInitiative(dispatchers, formData, updateFormData);
  }

  function onNext() {
   const newValues = {
      initiativeExpiration: value,
    }
    updateFormData(newValues);
    return doCreateInitiative({...formData, ...newValues})
      .then((marketId) => {
        return ({ ...formData, marketId });
      });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="InitiativeWizardInitiativeExpirationStepLabel"
    >
    <div>
      <Typography className={classes.introText} variant="body2">
        Votes from a long time ago aren't very useful when determining support.
        Therefore, Uclusion Initiatives give voters a set number of days to vote before the Initiative expires.
        You can extend the expiration later as long as it hasn't already passed.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'InitiativeWizardInitiativeExpirationPlaceHolder' })}</label>
      <ExpirationSelector value={value} onChange={onExpiresChange}/>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} spinOnClick validForm={validForm} onNext={onNext} />
    </div>
    </WizardStepContainer>
  );
}

InitiativeExpirationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitiativeExpirationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitiativeExpirationStep;