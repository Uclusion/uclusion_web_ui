import React from 'react'
import PropTypes from 'prop-types'
//import { useIntl } from 'react-intl';
import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Typography } from '@material-ui/core'
import StepButtons from '../../StepButtons'
import DeleteIcon from '@material-ui/icons/Delete'

import { updateValues } from '../../onboardingReducer'
import TooltipIconButton from '../../../../components/Buttons/TooltipIconButton'
import AddOptionWizard from './AddOption/AddOptionWizard'

function AddOptionsStep (props) {

  const {
    formData,
    updateFormData,
    active,
    setOverrideUIContent,
    classes,
    isHome,
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

  function onSkip(){
    updateFormData((updateValues({ addOptionsSkipped: true})));
  }

  function onStepChange() {
    updateFormData((updateValues({ addOptionsSkipped: false})));
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
                   onNext={onStepChange}
                   onPrevious={onStepChange}
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