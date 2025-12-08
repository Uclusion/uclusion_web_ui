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
import {
  getGroupPresences,
  isAutonomousGroup,
  usePresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { fixName } from '../../../utils/userFunctions';

function GroupNameStep (props) {
  const { updateFormData, formData, marketId } = props;
  const history = useHistory();
  const intl = useIntl();
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupsState, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [groupPresencesState, groupMembersDispatch] = useContext(GroupMembersContext);
  const presences = usePresences(marketId);
  const myPresence = presences?.find((presence) => presence.current_user);
  const hasOthers = !_.isEmpty(_.differenceBy(presences, [myPresence], 'id'));
  const myAutonomousGroups = groupsState[marketId]?.filter((group) => {
    const groupPresences = getGroupPresences(presences, groupPresencesState, marketId,
      group.id) || [];
    return !_.isEmpty(groupPresences.find((presence) => presence.id === myPresence?.id))
      && isAutonomousGroup(groupPresences, group);
  });
  const hasAutonomousGroups = !_.isEmpty(myAutonomousGroups);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      name: value
    });
  }

  function createGroup(groupType) {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };

    const groupData = {
      ...formData,
      marketId,
      groupType
    };
    if (groupType === 'AUTONOMOUS' && _.isEmpty(groupData.name)) {
      groupData.name = intl.formatMessage({id: 'singleView'});
      // Not great may have to let them choose later
      groupData.ticket_sub_code = fixName(myPresence.name).slice(0, 80);
    }
    return doCreateGroup(dispatchers, groupData)
      .then((group) => {
        setOperationRunning(false);
        const {id: groupId} = group;
        const participantsDecided = ['AUTONOMOUS', 'EVERYONE'].includes(groupType);
        const link = participantsDecided || hasOthers ? formMarketLink(marketId, groupId) :
          `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${marketId}`;
        updateFormData({
          link,
          groupId,
        });
        if (participantsDecided || !hasOthers) {
          navigate(history, link);
        } else {
          return link;
        }
      });
  }

  function onNext(){
      return createGroup('TEAM');
  }

  function onOtherNext(){
    return createGroup(hasAutonomousGroups ? 'EVERYONE' : 'AUTONOMOUS');
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
        A <Link href="https://documentation.uclusion.com/views" target="_blank">view</Link> has its own status and
        backlog. It also controls the addressing of notifications unless using mentions or a subscription to a
        job. {_.isEmpty(myAutonomousGroups) && 'A My work view has only you and shows your work across views.'}
      </Typography>
      <OutlinedInput
        id="groupName"
        className={classes.input}
        style={{maxWidth: '25rem'}}
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
        otherNextLabel={hasAutonomousGroups ? 'createEveryoneView' : 'createMyWorkView'}
        otherNextValid={!hasAutonomousGroups || validForm}
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