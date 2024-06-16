import React, { useContext, useState } from 'react';
import Screen from '../../containers/Screen/Screen';
import { useLocation } from 'react-router';
import queryString from 'query-string';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { addGroupToStorage, getGroup } from '../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import { isEveryoneGroup } from '../../contexts/GroupMembersContext/groupMembersHelper';
import Grid from '@material-ui/core/Grid';
import clsx from 'clsx';
import { InputAdornment, makeStyles, OutlinedInput, TextField, Typography, useTheme } from '@material-ui/core';
import ManageExistingUsers from '../Dialog/UserManagement/ManageExistingUsers';
import DialogManage from '../Dialog/DialogManage';
import { NAME_MAX_LENGTH } from '../../components/TextFields/NameField';
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton';
import { Clear, SettingsBackupRestore } from '@material-ui/icons';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useIntl } from 'react-intl';
import { usePlanFormStyles } from '../../components/AgilePlan';
import { wizardStyles } from '../../components/AddNewWizards/WizardStylesContext';
import { updateGroup } from '../../api/markets';
import _ from 'lodash';

const useStyles = makeStyles((theme) => {
  return {
    myContainer: {
      marginLeft: '5rem',
      maxWidth: '50rem',
      [theme.breakpoints.down('sm')]: {
        marginLeft: '0.5rem',
      },
    },
    container: {
      marginLeft: '5rem',
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
  const { id, name, ticket_sub_code: originalCode } = group;
  const intl = useIntl();
  const theme = useTheme();
  const classes = usePlanFormStyles();
  const wizardClasses = wizardStyles(theme);
  const myClasses = useStyles();
  const [ticketSubCode, setTicketSubCode] = useState(undefined);
  const [groupName, setGroupName] = useState(undefined);

  function handleSave() {
    const groupInfo = {
      marketId,
      groupId: id,
      name,
      ticketSubCode: originalCode
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
      <div className={myClasses.container}>
        {!isEveryoneGroup(id, marketId) && (
          <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
            <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              <Typography variant="h6">
                {intl.formatMessage({ id: 'addCollaboratorsMobile' })}
              </Typography>
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <ManageExistingUsers group={group}/>
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <DialogManage marketId={marketId} group={group} />
            </Grid>
          </Grid>
        )}
      </div>
      <div className={myClasses.myContainer}>
        <Typography variant="h6">
          {intl.formatMessage({ id: 'channelOptions' })}
        </Typography>
        <Typography style={{marginTop: '1rem'}}>
          {intl.formatMessage({ id: 'groupNameHelp' })}
        </Typography>
        <OutlinedInput
          id="workspaceName"
          className={wizardClasses.input}
          value={groupName === undefined ? name : groupName}
          onChange={(event) => {setGroupName(event.target.value)}}
          autoFocus
          variant="outlined"
          inputProps={{ maxLength : NAME_MAX_LENGTH }}
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {NAME_MAX_LENGTH - (groupName?.length ?? 0)}
            </InputAdornment>
          }
        />
        <Typography style={{marginTop: '2rem'}}>
          {intl.formatMessage({ id: 'ticketSubCodeHelp' })}
        </Typography>
        <TextField
          id="name"
          className={classes.input}
          value={ticketSubCode === undefined ? decodeURI(originalCode) : ticketSubCode}
          onChange={(event) => {setTicketSubCode(event.target.value)}}
        />
        <div style={{marginTop: '2rem'}}>
          <SpinningIconLabelButton onClick={() => {
            setGroupName(undefined);
            setTicketSubCode(undefined);
          }} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: 'marketEditCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                   disabled={_.isEmpty(groupName) && _.isEmpty(ticketSubCode)}
                                   id="planningDialogUpdateButton">
            {intl.formatMessage({ id: 'marketEditSaveLabel' })}
          </SpinningIconLabelButton>
        </div>
      </div>
    </Screen>
  );
}

export default GroupEdit;