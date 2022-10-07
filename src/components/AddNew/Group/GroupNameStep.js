import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';

function GroupNameStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What do you want to call your group?
      </Typography>
      <OutlinedInput
        id="groupName"
        className={classes.input}
        value={value}
        onChange={onNameChange}
        placeholder={intl.formatMessage({ id: 'GroupWizardMeetingName' })}
        variant="outlined"
        endAdornment={
          <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
            {80 - (formData?.name?.length ?? 0)}
          </InputAdornment>
        }
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        nextLabel="GroupWizardAddMembers"
        showFinish={true}
        finishLabel="GroupWizardGotoGroup"/>
    </div>
    </WizardStepContainer>
  );
}

GroupNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

GroupNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default GroupNameStep;