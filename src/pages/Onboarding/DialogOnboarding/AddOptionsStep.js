import React  from 'react';
import PropTypes from 'prop-types';
//import { useIntl } from 'react-intl';
import { Typography, List, ListItem, ListItemText, ListItemSecondaryAction, Button } from '@material-ui/core';
import StepButtons from '../StepButtons';
import DeleteIcon from '@material-ui/icons/Delete';

import { updateValues } from '../onboardingReducer';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import AddOptionWizard from './AddOption/AddOptionWizard';

function AddOptionsStep (props) {

  const {
    formData,
    updateFormData,
    active,
    setOverrideUIContent,
    classes
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
      onStartOver={onSubWizardStartOver}
      onFinish={onSubWizardFinish}
    />);
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
        Uclusion Decisions require there to be options to choose from, and even allow your team to propose new ones.
        We'll be adding the options you know about here, and if your team does propose a new option you'll be able
        to review (and edit) the new option before people can choose it.
      </Typography>
      {currentOptions()}
      <Button onClick={startSubWizard}>Add New Option</Button>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props} validForm={validForm}/>
    </div>
  );

}

AddOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
  setOverrideUIContent: PropTypes.func,
};

AddOptionsStep.defaultProps = {
  updateFormData: () => {},
  setOverrideUIContent: () => {},
  formData: {},
  active: false,
};

export default AddOptionsStep;