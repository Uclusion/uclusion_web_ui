import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core';
//import { useIntl } from 'react-intl';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { createPlanning } from '../../../api/markets';
import WorkspaceStepButtons from './WorkspaceStepButtons';
import { setUclusionLocalStorageItem } from '../../localStorageUtils';
import { ONBOARDING_WIZARD_KEY } from '../../../pages/Onboarding/Onboarding';

function WorkspaceNameStep (props) {
  const { updateFormData, formData, onboarding } = props;
  //const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onNext () {
    const { name } = formData;
    const marketInfo = {
      name,
    };
    // set the in onboarding flag, because we if we're onboarding creating the planning market will turn of
    // needs onboarding
    if(onboarding){
      setUclusionLocalStorageItem(ONBOARDING_WIZARD_KEY, true);
    }
    return createPlanning(marketInfo)
      .then((marketInfo) => {
        const {market} = marketInfo;
        setUclusionLocalStorageItem("workspace_created", true);
        updateFormData({
          marketId: market.id,
        });
      });

  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText}>
          What do you want to call your workspace?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          It's best to pick something everyone will recognize.
        </Typography>
        <OutlinedInput
          id="workspaceName"
          className={classes.input}
          value={value}
          onChange={onNameChange}
          placeholder="Ex: ACME Corp"
          variant="outlined"
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {80 - (formData?.name?.length ?? 0)}
            </InputAdornment>
          }
        />
        <div className={classes.borderBottom}/>
        <WorkspaceStepButtons {...props} showStartOver={false} onNext={onNext} validForm={validForm}/>
      </div>
    </WizardStepContainer>
  );
}

WorkspaceNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  onboarding: PropTypes.bool,
};

WorkspaceNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  onboarding: false,
};

export default WorkspaceNameStep;