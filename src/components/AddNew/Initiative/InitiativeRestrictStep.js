import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { FormControlLabel, RadioGroup, Radio, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import PropTypes from 'prop-types';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { createMyInitiative } from './initiativeCreator'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'

function InitiativeRestrictStep (props) {
  const { updateFormData, formData } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const value = formData.isRestricted || "false";


  function onChange (event) {
    const { value } = event.target;
    updateFormData({
      isRestricted: value,
    });
  }

  function doCreateInitiative(formData){
    const dispatchers = {
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
    };
    return createMyInitiative(dispatchers, formData);
  }

  function onNext() {
    const newValues = {
      isRestricted: value,
    }
    updateFormData(newValues);
    return doCreateInitiative({...formData, ...newValues})
      .then((data) => {
        const { marketId, investibleId } = data;
        setOperationRunning(false);
        return ({ ...formData, link: formInvestibleLink(marketId, investibleId) });
      });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="InitiativeWizardRestrictStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Initiatives can restrict participants from seeing each other's votes.
          The Initiative creator can still reply to comments.
          This setting cannot be changed once the Initiative is created.
        </Typography>
        <RadioGroup value={value} onChange={onChange}>
          <FormControlLabel value={"false"} control={<Radio/>} label={intl.formatMessage({id: 'InitiativeWizardRestrictYes'})}/>
          <FormControlLabel value={"true"} control={<Radio/>} label={intl.formatMessage({id: 'InitiativeWizardRestrictNo'})}/>
        </RadioGroup>
        <div className={classes.borderBottom}/>
        <StepButtons {...props} validForm={true} spinOnClick onNext={onNext} showFinish={false}/>
      </div>
    </WizardStepContainer>
  );
}

InitiativeRestrictStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitiativeRestrictStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitiativeRestrictStep;