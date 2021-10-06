import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Typography } from '@material-ui/core';
import StepButtons from '../StepButtons';
import DeleteIcon from '@material-ui/icons/Delete';

import TooltipIconButton from '../../Buttons/TooltipIconButton';
import AddOptionWizard from './AddOption/AddOptionWizard';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { createMyDialog } from './dialogCreator';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';
import { editorReset } from '../../TextEditors/quillHooks'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'

function AddOptionsStep (props) {
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  const {
    formData,
    updateFormData,
  } = props;
  const classes = useContext(WizardStylesContext);
  const { addShowSubWizard } = formData;

  const dialogOptions = formData.dialogOptions || [];

  function deleteOption (index) {
    const newOptions = [...dialogOptions];
    newOptions.splice(index, 1); // remove the element
    updateFormData({
      dialogOptions: newOptions,
    });
  }

  function startSubWizard () {
    updateFormData({
      addShowSubWizard: true,
    });
  }

  function hideSubWizard () {
    updateFormData({ addShowSubWizard: false });
  }

  function onSubWizardFinish (optionData) {
    const newOptions = [...dialogOptions, optionData];
    updateFormData({
      dialogOptions: newOptions,
    });
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

  function createDialog (formData) {
    const dispatchers = {
      diffDispatch,
      marketsDispatch,
      investiblesDispatch,
      presenceDispatch
    };
    const { editorController } = formData;
    return createMyDialog(dispatchers, formData, updateFormData)
      .then((marketId) => {
        if (editorController) {
          editorController(editorReset());
        }
        setOperationRunning(false);
        return ({ ...formData, link: formMarketLink(marketId) });
      });
  }

  function onSkip () {
    const newValues = {
      addOptionsSkipped: true
    };
    updateFormData(newValues);
    return createDialog({ ...formData, ...newValues });
  }

  function onPrevious () {
    updateFormData({ addOptionsSkipped: false });
  }

  function onNext () {
    const newValues = {
      addOptionsSkipped: false,
    };
    updateFormData(newValues);
    return createDialog({ ...formData, ...newValues });
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
                  icon={<DeleteIcon htmlColor="black" />}
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
    <WizardStepContainer
      {...props}
      titleId="DialogWizardAddOptionsStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          We'll be adding the options you know about here and any option your team proposes must
          be approved by you before people can choose it.
        </Typography>
        {currentOptions()}
        <Button className={classes.buttonClass} onClick={startSubWizard}>Add New Option</Button>
        <div className={classes.borderBottom}></div>
        <StepButtons
          {...props}
          spinOnClick
          validForm={validForm}
          onSkip={onSkip}
          onNext={onNext}
          onPrevious={onPrevious}
          showSkip
          showFinish={false}
        />
      </div>
    </WizardStepContainer>
  );

}

AddOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

AddOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default AddOptionsStep;