import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { doCreateGroup } from './groupCreator'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'

function GroupNameStep (props) {
  const { updateFormData, formData, marketId } = props;
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function onNext(){
      const dispatchers = {
        groupsDispatch,
        diffDispatch,
        groupMembersDispatch
      };
      // default things not filled in
      const groupData = {
        ...formData,
        marketId,
        votesRequired: formData.votesRequired ?? 0,
      };
      return doCreateGroup(dispatchers, groupData)
        .then((group) => {
          const {id: groupId} = group;
          const link = formMarketLink(marketId, groupId);
          updateFormData({
            link,
            groupId,
          })
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
        onNext={onNext}
        nextLabel="GroupWizardAddMembers"
        showTerminate={true}
        terminateLabel="GroupWizardGotoGroup"/>
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