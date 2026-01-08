import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { goToChosenWizard } from './ComposeWizard';

function ChooseGroupStep (props) {
  const { marketId, groups, updateFormData = () => {}, formData = {} } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const { useType, groupId } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Create in which view?
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="group-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ groupId: value });
          }}
          value={groupId || ''}
        >
          {groups.map((group) => {
            const groupId = group.id;
            return (
                <FormControlLabel
                  id={`type${groupId}`}
                  key={groupId}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio color="primary" />}
                  style={{backgroundColor: 'white', paddingRight: '0.5rem'}}
                  label={group.name}
                  labelPlacement="end"
                  value={groupId}
                />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(groupId)}
        nextLabel="WizardContinue"
        onNext={() => goToChosenWizard(useType, marketId, groupId, history)}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseGroupStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

export default ChooseGroupStep;