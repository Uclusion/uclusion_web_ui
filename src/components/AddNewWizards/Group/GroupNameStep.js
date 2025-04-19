import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { doCreateGroup } from './groupCreator'
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { useHistory } from 'react-router'
import { NAME_MAX_LENGTH } from '../../TextFields/NameField';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import Link from '@material-ui/core/Link';
import { ADD_COLLABORATOR_WIZARD_TYPE } from '../../../constants/markets';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function GroupNameStep (props) {
  const { updateFormData, formData, marketId } = props;
  const history = useHistory();
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const presences = usePresences(marketId);
  const myPresence = presences?.find((presence) => presence.current_user);
  const hasOthers = !_.isEmpty(_.differenceBy(presences, [myPresence], 'id'));

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function createGroup(isAutonomous) {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };

    const groupData = {
      ...formData,
      marketId,
      is_autonomous_group: isAutonomous
    };
    return doCreateGroup(dispatchers, groupData)
      .then((group) => {
        setOperationRunning(false);
        const {id: groupId} = group;
        const link = isAutonomous || hasOthers ? formMarketLink(marketId, groupId) :
          `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${marketId}`;
        updateFormData({
          link,
          groupId,
        });
        if (isAutonomous || !hasOthers) {
          navigate(history, link);
        } else {
          return link;
        }
      });
  }

  function onNext(){
      return createGroup(false);
  }

  function onOtherNext(){
    return createGroup(true);
  }

  function onTerminate(){
    return onNext()
      .then((link) => {
        setOperationRunning(false);
        navigate(history, link);
      });
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What do you want to call your view?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1" style={{paddingBottom: '1rem'}}>
        A <Link href="https://documentation.uclusion.com/views" target="_blank">view</Link> controls the default
        addressing of notifications. Anyone not in a view must be manually mentioned or subscribed to a job to
        be notified.
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
        onNext={onNext}
        onNextDoAdvance={hasOthers}
        nextLabel={'GroupWizardAddMembers'}
        otherNextLabel="createViewSingleUser"
        showOtherNext
        onOtherNext={onOtherNext}
        onOtherDoAdvance={false}
        showTerminate={validForm}
        onTerminate={onTerminate}
        terminateLabel="GroupWizardGotoGroup"/>
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