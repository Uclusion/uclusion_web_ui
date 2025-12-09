import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import Link from '@material-ui/core/Link';

function WorkspaceViewStep (props) {
  const { updateFormData, formData, createWorkspace } = props;
  const intl = useIntl();
  const value = formData.group_name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const isEveryoneView = formData?.groupType === 'EVERYONE';

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      group_name: value
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What do you want to call your view?
      </Typography>
      {!isEveryoneView && (
        <Typography className={classes.introSubText} variant="subtitle1" style={{paddingBottom: '1rem'}}>
          Name your <Link href="https://documentation.uclusion.com/views" target="_blank">view</Link> to indicate 
          who should be part of it, like 'Engineering' or 'Feedback'.
        </Typography>
      )}
      {isEveryoneView && (
        <Typography className={classes.introSubText} variant="subtitle1" style={{paddingBottom: '1rem'}}>
          Name your <Link href="https://documentation.uclusion.com/views" target="_blank">view</Link> to indicate 
          what will be included in it, like 'Engineering' or 'Feedback'. Everyone in the workspace will be part of it.
        </Typography>
      )}
      <OutlinedInput
        id="groupName"
        style={{maxWidth: '25rem'}}
        className={classes.input}
        value={value}
        autoFocus
        onChange={onNameChange}
        placeholder={intl.formatMessage({ id: 'GroupWizardMeetingName' })}
        variant="outlined"
        inputProps={{ maxLength : NAME_MAX_LENGTH }}
        endAdornment={
          <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
            {NAME_MAX_LENGTH - (formData?.group_name?.length ?? 0)}
          </InputAdornment>
        }
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        nextLabel='OnboardingWizardFinish'
        onNext={() => createWorkspace(formData)}
      />
    </WizardStepContainer>
  );
}

WorkspaceViewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

WorkspaceViewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default WorkspaceViewStep;