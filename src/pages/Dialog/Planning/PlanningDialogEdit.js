import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import {
  updateGroup
} from '../../../api/markets'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import clsx from 'clsx'
import CardActions from '@material-ui/core/CardActions'
import Card from '@material-ui/core/Card'
import { usePlanFormStyles, VoteExpiration, Votes } from '../../../components/AgilePlan'
import {
  FormControlLabel,
  InputAdornment,
  makeStyles, OutlinedInput,
  Radio,
  RadioGroup,
  TextField,
  Typography, useTheme
} from '@material-ui/core'
import { getMarketUnits } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ManageExistingUsers from '../UserManagement/ManageExistingUsers'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper'
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { wizardStyles } from '../../../components/AddNewWizards/WizardStylesContext'
import DialogManage from '../DialogManage'

const useStyles = makeStyles((theme) => {
  return {
    actions: {
      margin: theme.spacing(-3, 0, 0, 6),
      paddingBottom: '2rem'
    },
    maxBudgetUnit: {
      backgroundColor: '#ecf0f1',
    }
  };
});

function PlanningDialogEdit(props) {
  const { group, userId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { id, market_id: marketId } = group;
  const intl = useIntl();
  const theme = useTheme();
  const classes = usePlanFormStyles();
  const wizardClasses = wizardStyles(theme);
  const myClasses = useStyles();
  const [mutableGroup, setMutableGroup] = useState({...group, ticket_sub_code: decodeURI(group.ticket_sub_code)});
  const {
    use_budget,
    budget_unit,
    investment_expiration: groupExpiration,
    votes_required,
    ticket_sub_code,
    name
  } = mutableGroup;

  const safeInvestmentExpiration = groupExpiration ?? "14";

  function handleChange(name) {
    return event => {
      const { value } = event.target;
      let useValue = value;
      if (name === 'use_budget') {
        useValue = value === 'true';
      }
      setMutableGroup({ ...mutableGroup, [name]: useValue });
    };
  }

  function onUnitChange(event, value) {
    setMutableGroup({ ...mutableGroup, budget_unit: value });
  }

  function onSaveSettings(savedGroup) {
    const diffSafe = {
      ...savedGroup,
      updated_by: userId,
      updated_by_you: true,
    };
    addGroupToStorage(groupsDispatch, diffDispatch, marketId, diffSafe);
  }

  function handleSave() {
    const votesRequiredInt =
      votes_required != null ? parseInt(votes_required, 10) : 0;
    return updateGroup({
      marketId,
      groupId: id, name,
      useBudget: use_budget,
      votesRequired: votesRequiredInt,
      ticketSubCode: encodeURI(ticket_sub_code),
      budgetUnit: budget_unit
  }).then(market => {
      onSaveSettings(market);
      setOperationRunning(false);
    });
  }

  const defaultProps = {
    options: getMarketUnits(intl),
    getOptionLabel: (option) => option,
  };
  const validOptions = parseInt(safeInvestmentExpiration, 10) > 0 && (!use_budget || budget_unit);
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
            endAdornment={
              <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
                {80 - (name?.length ?? 0)}
              </InputAdornment>
            }
          />
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <VoteExpiration
              onChange={handleChange('investment_expiration')}
              value={safeInvestmentExpiration}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <Votes onChange={handleChange('votes_required')} value={votes_required}/>
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <RadioGroup value={use_budget === true ? 'true' : 'false'} onChange={handleChange('use_budget')}>
              <FormControlLabel value={'false'} control={<Radio/>}
                                label={intl.formatMessage({ id: 'BudgetRestrictYes' })}/>
              <FormControlLabel value={'true'} control={<Radio/>}
                                label={intl.formatMessage({ id: 'BudgetRestrictNo' })}/>
            </RadioGroup>
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <Autocomplete
              {...defaultProps}
              id="addBudgetUnit"
              key="budgetUnit"
              freeSolo
              renderInput={(params) => <TextField {...params}
                                                  margin="dense"
                                                  label={intl.formatMessage({ id: 'addUnit' })}/>}
              value={budget_unit || ''}
              disabled={!use_budget}
              className={myClasses.maxBudgetUnit}
              onInputChange={onUnitChange}
            />
            <Typography>
              {intl.formatMessage({ id: 'budgetUnitDropdownHelp' })}
            </Typography>
          </Grid>
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
        <SpinningIconLabelButton onClick={() => setMutableGroup(group)} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketEditCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="planningDialogUpdateButton"
                                 disabled={!validOptions}>
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>
  );
}

PlanningDialogEdit.propTypes = {
  group: PropTypes.object.isRequired,
  acceptedStage: PropTypes.object.isRequired
};

export default PlanningDialogEdit;
