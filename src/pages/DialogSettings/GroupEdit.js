import React, { useContext, useState } from 'react';
import Screen from '../../containers/Screen/Screen';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { addGroupToStorage, getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import {
  Checkbox,
  InputAdornment,
  makeStyles,
  OutlinedInput,
  TextField,
  Typography,
  useTheme
} from '@material-ui/core';
import { NAME_MAX_LENGTH } from '../../components/TextFields/NameField';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { Clear, SettingsBackupRestore } from '@material-ui/icons';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useIntl } from 'react-intl';
import { usePlanFormStyles } from '../../components/AgilePlan';
import { wizardStyles } from '../../components/AddNewWizards/WizardStylesContext';
import { updateGroup } from '../../api/markets';
import _ from 'lodash';
import { getGroupPresences, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

const useStyles = makeStyles((theme) => {
  return {
    myContainer: {
      marginLeft: '5rem',
      marginTop: '3rem',
      maxWidth: '50rem',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '0.5rem',
      },
    },
  };
});

function GroupEdit() {
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const [groupState] = useContext(MarketGroupsContext);
  const group = getGroup(groupState, marketId, groupId) || {};
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const groupPresences = getGroupPresences(presences, groupPresencesState, marketId, groupId) || [];
  const { id, name, ticket_sub_code: originalCode } = group;
  const intl = useIntl();
  const theme = useTheme();
  const classes = usePlanFormStyles();
  const wizardClasses = wizardStyles(theme);
  const myClasses = useStyles();
  const [ticketSubCode, setTicketSubCode] = useState(undefined);
  const [isDirtyTicketSubCode, setIsDirtyTicketSubCode] = useState(false);
  const [groupName, setGroupName] = useState(undefined);
  const [isDirtyName, setIsDirtyName] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(group.group_type === 'AUTONOMOUS');

  function handleSave() {
    const groupInfo = {
      marketId,
      groupId: id,
      name,
      ticketSubCode: originalCode,
      autonomousMode
    }
    if (!_.isEmpty(groupName)) {
      groupInfo.name = groupName;
    }
    if (!_.isEmpty(ticketSubCode)) {
      groupInfo.ticketSubCode = encodeURI(ticketSubCode);
    }
    return updateGroup(groupInfo).then(savedGroup => {
      addGroupToStorage(groupsDispatch, marketId, savedGroup);
      setOperationRunning(false);
    });
  }

  if (!id) {
    return React.Fragment;
  }

  return (
    <Screen
      title={`${group.name} Settings`}
      tabTitle={`${group.name} Settings`}
    >
      <div className={myClasses.myContainer}>
        <Typography variant="h6">
          {intl.formatMessage({ id: 'channelOptions' })}
        </Typography>
        <Typography style={{marginTop: '1rem'}}>
          {intl.formatMessage({ id: 'groupNameHelp' })}
        </Typography>
        <OutlinedInput
          id="groupName"
          className={wizardClasses.input}
          value={groupName === undefined ? name : groupName}
          onChange={(event) => {
            setGroupName(event.target.value);
            setIsDirtyName(true);
          }}
          autoFocus
          variant="outlined"
          inputProps={{ maxLength : NAME_MAX_LENGTH }}
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {NAME_MAX_LENGTH - (groupName?.length ?? 0)}
            </InputAdornment>
          }
        />
        <div className={classes.fieldsetContainer} style={{paddingTop: '2rem'}}>
          <Checkbox
            checked={autonomousMode}
            disabled={groupPresences?.length > 1 && !autonomousMode}
            onClick={() => setAutonomousMode(!autonomousMode)}
          />
          My work (only applies to views with one assignee).
        </div>
        <Typography style={{marginTop: '2rem'}}>
          {intl.formatMessage({ id: 'ticketSubCodeHelp' })}
        </Typography>
        <TextField
          id="name"
          className={classes.input}
          value={ticketSubCode === undefined ? decodeURI(originalCode) : ticketSubCode}
          onChange={(event) => {
            setTicketSubCode(event.target.value);
            setIsDirtyTicketSubCode(true);
          }}
        />
        <div style={{marginTop: '2rem'}}>
          <SpinningIconLabelButton onClick={() => {
            setGroupName(undefined);
            setIsDirtyName(false);
            setTicketSubCode(undefined);
            setIsDirtyTicketSubCode(false);
          }} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: 'marketEditCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                   disabled={(_.isEmpty(groupName) && isDirtyName) ||
                                     (_.isEmpty(ticketSubCode)&&isDirtyTicketSubCode)}
                                   id="planningDialogUpdateButton">
            {intl.formatMessage({ id: 'marketEditSaveLabel' })}
          </SpinningIconLabelButton>
        </div>
      </div>
    </Screen>
  );
}

export default GroupEdit;