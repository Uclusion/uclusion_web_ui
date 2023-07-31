import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { updateGroup } from '../../../api/markets';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import clsx from 'clsx';
import CardActions from '@material-ui/core/CardActions';
import Card from '@material-ui/core/Card';
import { usePlanFormStyles } from '../../../components/AgilePlan';
import { InputAdornment, makeStyles, OutlinedInput, TextField, Typography, useTheme } from '@material-ui/core';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { Clear, SettingsBackupRestore } from '@material-ui/icons';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import ManageExistingUsers from '../UserManagement/ManageExistingUsers';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext';
import DialogManage from '../DialogManage';
import { NAME_MAX_LENGTH } from '../../../components/TextFields/NameField';

const useStyles = makeStyles((theme) => {
  return {
    actions: {
      margin: theme.spacing(-3, 0, 0, 6),
      paddingBottom: '2rem'
    },
  };
});

function PlanningDialogEdit(props) {
  const { group } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const { id, market_id: marketId } = group;
  const intl = useIntl();
  const theme = useTheme();
  const classes = usePlanFormStyles();
  const wizardClasses = wizardStyles(theme);
  const myClasses = useStyles();
  const [mutableGroup, setMutableGroup] = useState(getInitialGroup());
  const {
    ticket_sub_code,
    name
  } = mutableGroup;

  function getInitialGroup() {
    return {...group, ticket_sub_code: decodeURI(group.ticket_sub_code)};
  }

  function handleChange(name) {
    return event => {
      const { value } = event.target;
      setMutableGroup({ ...mutableGroup, [name]: value });
    };
  }

  function handleSave() {
    return updateGroup({
      marketId,
      groupId: id, name,
      ticketSubCode: encodeURI(ticket_sub_code),
  }).then(savedGroup => {
      addGroupToStorage(groupsDispatch, marketId, savedGroup);
      setOperationRunning(false);
    });
  }

  return (
    <Card className={classes.overflowVisible}>
      <CardContent className={classes.cardContent}>
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
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}
              style={{paddingTop: '2rem'}}>
          <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              <Typography variant="h6">
                {intl.formatMessage({ id: 'channelOptions' })}
              </Typography>
          </Grid>
          <OutlinedInput
            id="workspaceName"
            className={wizardClasses.input}
            value={name}
            onChange={handleChange('name')}
            placeholder={name}
            variant="outlined"
            inputProps={{ maxLength : NAME_MAX_LENGTH }}
            endAdornment={
              <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
                {NAME_MAX_LENGTH - (name?.length ?? 0)}
              </InputAdornment>
            }
          />
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <TextField
              id="name"
              className={classes.input}
              value={ticket_sub_code}
              onChange={handleChange('ticket_sub_code')}
            />
            <Typography>
              {intl.formatMessage({ id: 'ticketSubCodeHelp' })}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions className={myClasses.actions}>
        <SpinningIconLabelButton onClick={() => setMutableGroup(getInitialGroup())} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketEditCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="planningDialogUpdateButton">
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>
  );
}

PlanningDialogEdit.propTypes = {
  group: PropTypes.object.isRequired,
};

export default PlanningDialogEdit;
