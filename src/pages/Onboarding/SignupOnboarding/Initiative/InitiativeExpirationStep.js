import React, { useContext } from 'react';
import { useIntl } from 'react-intl'

import { updateValues } from '../../onboardingReducer'
import { Typography } from '@material-ui/core'
import StepButtons from '../../StepButtons'
import ExpirationSelector from '../../../../components/Expiration/ExpirationSelector'
import PropTypes from 'prop-types'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { createMyInitiative } from './initiativeCreator';

function InitiativeExpirationStep(props) {
  const { updateFormData, formData, active, classes, setOperationStatus } = props;
  const intl = useIntl();
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);

  const value = formData.initiativeExpiration || 1440;

  if (!active) {
    return React.Fragment;
  }
  const validForm = value !== 0;

  function onExpiresChange(event) {
    const { value } = event.target;
    updateFormData(updateValues({
      initiativeExpiration: value,
    }));
  }

  function doCreateInitiative(formData){
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
    };
    createMyInitiative(dispatchers, formData, updateFormData, setOperationStatus);
  }

  function onNext() {
    const newValues = {
      initiativeExpiration: value,
    }
    updateFormData(updateValues(newValues));
    doCreateInitiative({...formData, ...newValues});
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Votes from a long time ago aren't very useful when determining support.
        Therefore, Uclusion Initiatives give voters a set number of days to vote before the Initiative expires.
        You can extend the expiration later as long as it hasn't already passed.
      </Typography>
      <label className={classes.inputLabel} htmlFor="name">{intl.formatMessage({ id: 'InitiativeWizardInitiativeExpirationPlaceHolder' })}</label>
      <ExpirationSelector value={value} onChange={onExpiresChange}/>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm} onNext={onNext}/>
    </div>
  );
}

InitiativeExpirationStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

InitiativeExpirationStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default InitiativeExpirationStep;