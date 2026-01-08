import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { useIntl } from 'react-intl';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { doCreateGroup } from '../Group/groupCreator';
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';

function CreateTeamViewStep(props) {
  const { updateFormData = () => {}, formData = {}, marketId, setViewCreated } = props;
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function createGroup() {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };

    const groupData = {
      ...formData,
      marketId,
    };
    return doCreateGroup(dispatchers, groupData)
      .then(() => {
        setViewCreated(true);
        setOperationRunning(false);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Do do you want a view for you and this collaborator?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1" style={{paddingBottom: '1rem'}}>
        Anything created in that view will notify this person. Otherwise you will have to @ mention them each time
        you want them involved.
      </Typography>
      <OutlinedInput
        id="groupName"
        className={classes.input}
        value={value}
        autoFocus
        onChange={onNameChange}
        placeholder={intl.formatMessage({ id: 'GroupWizardMeetingName' })}
        variant="outlined"
        inputProps={{ maxLength : NAME_MAX_LENGTH }}
        endAdornment={
          <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
            {NAME_MAX_LENGTH - (formData?.name?.length ?? 0)}
          </InputAdornment>
        }
      />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        onNext={createGroup}
        showSkip
        />
    </WizardStepContainer>
  );
}

CreateTeamViewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

export default CreateTeamViewStep;