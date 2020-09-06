import React, { useContext } from 'react';
import PropTypes from 'prop-types'
//import { useIntl } from 'react-intl';
import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Typography } from '@material-ui/core'
import StepButtons from '../../StepButtons'
import DeleteIcon from '@material-ui/icons/Delete'

import { updateValues } from '../../onboardingReducer'
import TooltipIconButton from '../../../../components/Buttons/TooltipIconButton'
import AddOptionWizard from './AddOption/AddOptionWizard'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { createMyDialog } from './dialogCreator';

function AddOptionsStep (props) {
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);


  const {
    formData,
    updateFormData,
    active,
    setOverrideUIContent,
    classes,
    isHome,
    setOperationStatus,
  } = props;
  //const intl = useIntl();
  const { addShowSubWizard } = formData;


  if (!active) {
    return React.Fragment;
  }

  const dialogOptions = formData.dialogOptions || [];

  function deleteOption (index) {
    const newOptions = [...dialogOptions];
    newOptions.splice(index, 1); // remove the element
    updateFormData(updateValues({
      dialogOptions: newOptions,
    }));
  }

  function startSubWizard () {
    updateFormData(updateValues({
      addShowSubWizard: true,
    }));
    setOverrideUIContent(true);
  }

  function hideSubWizard () {
    updateFormData(updateValues({addShowSubWizard: false}));
    setOverrideUIContent(false);
  }

  function onSubWizardFinish (optionData) {
    console.log(optionData);
    const newOptions = [...dialogOptions, optionData];
    updateFormData(updateValues({
      dialogOptions: newOptions,
    }));
    hideSubWizard();
  }

  function onSubWizardStartOver () {
    hideSubWizard();
  }


  const validForm = dialogOptions.length >= 1;

  if (addShowSubWizard) {
   return (<AddOptionWizard
      hidden={false}
      isHome={isHome}
      onStartOver={onSubWizardStartOver}
      onFinish={onSubWizardFinish}
    />);
  }

  function createDialog(formData) {
    const dispatchers = {
      diffDispatch,
      marketsDispatch,
      investiblesDispatch,
      presenceDispatch
    };
    createMyDialog(dispatchers, formData, updateFormData, setOperationStatus);
  }


  function onSkip(){
    const newValues = {
      addOptionsSkipped: true
    };
    updateFormData(updateValues(newValues));
    return createDialog({...formData, ...newValues});
  }

  function onPrevious() {
    updateFormData(updateValues({ addOptionsSkipped: false}));
  }

  function onNext() {
    const newValues = {
      addOptionsSkipped: false,
    };
    updateFormData(newValues);
    return createDialog({...formData, ...newValues});
  }

  function currentOptions () {
    return (
      <List>
        {dialogOptions.map((option, index) => {
          return (
            <ListItem key={index}>
              <ListItemText>
                {option.optionName}
              </ListItemText>
              <ListItemSecondaryAction>
                <TooltipIconButton
                  translationId="delete"
                  icon={<DeleteIcon/>}
                  onClick={() => deleteOption(index)}
                />
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    );
  }

// now for the card UI
  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        We'll be adding the options you know about here and any option your team proposes must
        be approved by you before people can choose it.
      </Typography>
      {currentOptions()}
      <Button className={classes.buttonClass} onClick={startSubWizard}>Add New Option</Button>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={validForm}
                   onSkip={onSkip}
                   onNext={onNext}
                   onPrevious={onPrevious}
                   showSkip={isHome}/>
    </div>
  );

}

AddOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
  setOverrideUIContent: PropTypes.func,
  isHome: PropTypes.bool,
};

AddOptionsStep.defaultProps = {
  updateFormData: () => {},
  setOverrideUIContent: () => {},
  formData: {},
  active: false,
  isHome: false,
};

export default AddOptionsStep;