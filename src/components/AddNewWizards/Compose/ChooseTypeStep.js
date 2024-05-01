import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { goToChosenWizard } from './ComposeWizard';

function ChooseTypeStep (props) {
  const { marketId, groupId, updateFormData, formData } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const allowedTypes = ['JOB', QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE, 'GROUP'];
  const { useType } = formData;
  const isFinal = !_.isEmpty(groupId) || useType === 'GROUP';

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What do you want to create?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        These are the types that can be created directly under a workspace.
      </Typography>
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value });
          }}
          value={useType || ''}
        >
          {allowedTypes.map((objectType) => {
            return (
                <FormControlLabel
                  id={`type${objectType}`}
                  key={objectType}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio color="primary" />}
                  label={<FormattedMessage id={`${objectType}ComposeLabel`} />}
                  labelPlacement="end"
                  value={objectType}
                />
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={!_.isEmpty(useType)}
        nextLabel="WizardContinue"
        onNext={isFinal ? () => goToChosenWizard(useType, marketId, groupId, history) : undefined}
        isFinal={isFinal}
        onNextDoAdvance={!isFinal}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseTypeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ChooseTypeStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ChooseTypeStep;