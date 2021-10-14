import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { updateMarket, updateStage } from '../../../api/markets'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import clsx from 'clsx'
import CardActions from '@material-ui/core/CardActions'
import Card from '@material-ui/core/Card'
import { usePlanFormStyles, VoteExpiration, Votes } from '../../../components/AgilePlan'
import AllowedInProgress from './AllowedInProgress';
import { getStages, updateStagesForMarket } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import _ from 'lodash'
import ShowInVerifiedStageAge from './ShowInVerifiedStageAge'
import { FormControlLabel, makeStyles, Radio, RadioGroup, TextField, Typography } from '@material-ui/core'
import ChangeToObserverButton from '../ChangeToObserverButton'
import ChangeToParticipantButton from '../ChangeToParticipantButton'
import { getMarketPresences, getMarketUnits } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ManageExistingUsers from '../UserManagement/ManageExistingUsers'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'

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
  const { onCancel, market, acceptedStage, verifiedStage, userId } = props;
  const [marketStagesState, marketStagesDispatch] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const { id } = market
  const marketPresences = getMarketPresences(marketPresencesState, id)
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const following = myPresence ? myPresence.following : false;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const myClasses = useStyles();
  const [allowedInvestibles, setAllowedInvestibles] = useState(acceptedStage.allowed_investibles);
  const [showInvestiblesAge, setShowInvestiblesAge] = useState(verifiedStage.days_visible);
  const [mutableMarket, setMutableMarket] = useState(market);
  const {
    use_budget,
    budget_unit,
    investment_expiration,
    votes_required,
    assigned_can_approve,
    ticket_sub_code
  } = mutableMarket;

  function handleChange(name) {
    return event => {
      const { value } = event.target;
      let useValue = value;
      if (name === 'use_budget' || name === 'assigned_can_approve') {
        useValue = value === 'true';
      }
      setMutableMarket({ ...mutableMarket, [name]: useValue });
    };
  }

  function onUnitChange(event, value) {
    setMutableMarket({ ...mutableMarket, budget_unit: value });
  }

  function onAllowedInvestiblesChange(event) {
    const { value } = event.target;
    setAllowedInvestibles(parseInt(value, 10));
  }

  function onShowInvestiblesAgeChange(event) {
    const { value } = event.target;
    setShowInvestiblesAge(parseInt(value, 10));
  }

  function updateShowInvestibles() {
    return updateStage(id, verifiedStage.id, undefined, showInvestiblesAge).then((newStage) => {
      const marketStages = getStages(marketStagesState, id);
      const newStages = _.unionBy([newStage], marketStages, 'id');
      updateStagesForMarket(marketStagesDispatch, id, newStages);
      setOperationRunning(false);
    });
  }

  function onSaveSettings(savedMarket) {
    const diffSafe = {
      ...savedMarket,
      updated_by: userId,
      updated_by_you: true,
    };
    addMarketToStorage(marketsDispatch, diffDispatch, diffSafe);
  }

  function handleSave() {
    const votesRequiredInt =
      votes_required != null ? parseInt(votes_required, 10) : null;
    return updateMarket(
      id,
      null,
      null,
      null,
      use_budget,
      parseInt(investment_expiration, 10),
      votesRequiredInt,
      null,
      ticket_sub_code,
      assigned_can_approve,
      budget_unit
    ).then(market => {
      onSaveSettings(market)
      if (allowedInvestibles !== acceptedStage.allowed_investibles) {
        return updateStage(id, acceptedStage.id, allowedInvestibles).then((newStage) => {
          const marketStages = getStages(marketStagesState, id)
          const newStages = _.unionBy([newStage], marketStages, 'id')
          updateStagesForMarket(marketStagesDispatch, id, newStages)
          if (showInvestiblesAge !== verifiedStage.days_visible) {
            return updateShowInvestibles();
          } else {
            setOperationRunning(false);
          }
        });
      }
      if (showInvestiblesAge !== verifiedStage.days_visible) {
        return updateShowInvestibles();
      } else {
        setOperationRunning(false);
      }
    });
  }

  const isDraft = _.size(marketPresences) < 2;
  const defaultProps = {
    options: getMarketUnits(intl),
    getOptionLabel: (option) => option,
  };

  return (
    <Card className={classes.overflowVisible}>
      <CardContent className={classes.cardContent}>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
          {!isDraft && (
            <Grid item md={6} xs={12} className={classes.fieldsetContainer}>
              <ManageExistingUsers market={market}/>
            </Grid>
          )}
          <Grid item md={isDraft ? 12 : 4} xs={12} className={classes.fieldsetContainer}>
            <Typography variant="h6">
              Archive or Restore Workspace
            </Typography>
            <Typography variant="body2" style={{marginBottom: "0.5rem"}}>
              Archiving prevents notifications and moves the workspace from the home page to the archives.
            </Typography>
            {following && (
              <ChangeToObserverButton key="change-to-observer" marketId={id} />
            )}
            {!following && (
              <ChangeToParticipantButton key="change-to-participant" marketId={id}/>
            )}
          </Grid>
        </Grid>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}
              style={{paddingTop: "2rem"}}>
          <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              <Typography variant="h6">
               Workspace Options
              </Typography>
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <AllowedInProgress
              onChange={onAllowedInvestiblesChange}
              value={allowedInvestibles}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <ShowInVerifiedStageAge
              onChange={onShowInvestiblesAgeChange}
              value={showInvestiblesAge}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <VoteExpiration
              onChange={handleChange('investment_expiration')}
              value={investment_expiration}
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
              value={budget_unit}
              disabled={!use_budget}
              className={myClasses.maxBudgetUnit}
              onInputChange={onUnitChange}
            />
            <Typography>
              {intl.formatMessage({ id: 'budgetUnitDropdownHelp' })}
            </Typography>
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <RadioGroup value={assigned_can_approve === true ? 'true' : 'false'}
                        onChange={handleChange('assigned_can_approve')}>
              <FormControlLabel value={'false'} control={<Radio/>}
                                label={intl.formatMessage({ id: 'ApprovalRestrictYes' })}/>
              <FormControlLabel value={'true'} control={<Radio/>}
                                label={intl.formatMessage({ id: 'ApprovalRestrictNo' })}/>
            </RadioGroup>
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
        <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="planningDialogUpdateButton"
                                 disabled={!(parseInt(investment_expiration, 10) > 0) || (use_budget && !budget_unit)}>
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>
  );
}

PlanningDialogEdit.propTypes = {
  market: PropTypes.object.isRequired,
  acceptedStage: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
};

PlanningDialogEdit.defaultProps = {
  onCancel: () => {},
  onSpinStop: () => {}
};

export default PlanningDialogEdit;
