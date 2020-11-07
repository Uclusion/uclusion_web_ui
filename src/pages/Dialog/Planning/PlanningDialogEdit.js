import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { updateMarket, updateStage } from '../../../api/markets'
import DismissableText from '../../../components/Notifications/DismissableText'
import CardType, { AGILE_PLAN_TYPE } from '../../../components/CardType'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import clsx from 'clsx'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import Card from '@material-ui/core/Card'
import { DaysEstimate, MaxBudget, usePlanFormStyles, VoteExpiration, Votes } from '../../../components/AgilePlan'
import { FormControl, FormHelperText, MenuItem, Select } from '@material-ui/core'
import InputLabel from '@material-ui/core/InputLabel'

function PlanningDialogEdit(props) {
  const { onSpinStop, onCancel, market, acceptedStage } = props;
  const {
    id,
    name: initialMarketName,
    max_budget: initialBudget,
    investment_expiration: initialExpiration,
    days_estimate: initialDaysEstimate,
    votes_required: initialVotesRequired
  } = market;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const [allowedInvestibles, setAllowedInvestibles] = useState(acceptedStage.allowed_investibles);
  const [mutableMarket, setMutableMarket] = useState({
    ...market,
    name: initialMarketName,
    max_budget: initialBudget,
    investment_expiration: initialExpiration,
    days_estimate: initialDaysEstimate,
    votes_required: initialVotesRequired
  });
  const {
    max_budget,
    investment_expiration,
    days_estimate,
    created_at: createdAt,
    votes_required
  } = mutableMarket;

  function handleChange(name) {
    return event => {
      const { value } = event.target;
      setMutableMarket({ ...mutableMarket, [name]: value });
    };
  }

  function onAllowedInvestiblesChange(event) {
    const { value } = event.target;
    setAllowedInvestibles(parseInt(value, 10));
  }

  function handleSave() {
    const daysEstimateInt =
      days_estimate != null ? parseInt(days_estimate, 10) : null;
    const votesRequiredInt =
      votes_required != null ? parseInt(votes_required, 10) : null;
    const maxBudget = max_budget ? parseInt(max_budget, 10) : 0;
    return updateMarket(
          id,
          undefined,
          undefined,
          undefined,
          maxBudget,
          parseInt(investment_expiration, 10),
          daysEstimateInt,
          votesRequiredInt
        ).then(market => {
          const retValue = {
            result: market,
            spinChecker: () => Promise.resolve(true)
          };
          if (allowedInvestibles !== acceptedStage.allowed_investibles) {
            return updateStage(id, acceptedStage.id, allowedInvestibles).then(() => retValue);
          }
          return retValue;
        });
  }

  return (
    <>
      <DismissableText textId='planningEditHelp' />
      <Card className={classes.overflowVisible}>
        <CardType className={classes.cardType} type={AGILE_PLAN_TYPE} />
        <CardContent className={classes.cardContent}>
          <legend className={classes.optional}>*{intl.formatMessage({ id: "optionalEdit" })}</legend>
          <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <FormControl variant="filled">
                <InputLabel id="select-allowed-investibles-label">
                  {intl.formatMessage({ id: 'allowedInvestiblesDropdownLabel' })}</InputLabel>
                <Select
                  value={allowedInvestibles}
                  onChange={onAllowedInvestiblesChange}
                  style={{backgroundColor: "#ecf0f1"}}
                >
                  <MenuItem value={0}>
                    {intl.formatMessage({ id: 'allowedInvestiblesUnlimitedValue' })}
                  </MenuItem>
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                  <MenuItem value={4}>4</MenuItem>
                  <MenuItem value={5}>5</MenuItem>
                </Select>
                <FormHelperText style={{color: "black"}}>
                  {intl.formatMessage({ id: 'allowedInvestiblesDropdownHelp' })}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <VoteExpiration
                onChange={handleChange("investment_expiration")}
                value={investment_expiration}
              />
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <Votes onChange={handleChange("votes_required")} value={votes_required} />
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <DaysEstimate showLabel={ window.outerWidth >= 600 }
                            onChange={handleChange("days_estimate")} value={days_estimate}
                            createdAt={createdAt} />
            </Grid>
            <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
              <MaxBudget onChange={handleChange("max_budget")} value={max_budget} />
            </Grid>
          </Grid>
        </CardContent>
        <CardActions className={classes.actions}>
          <Button
            className={classes.actionSecondary}
            color="secondary"
            onClick={onCancel}
            variant="contained"
          >
            <FormattedMessage
              id="marketAddCancelLabel"
            />
          </Button>
          <SpinBlockingButton
            className={classes.actionPrimary}
            color="primary"
            disabled={!(parseInt(investment_expiration, 10) > 0)}
            marketId={id}
            onClick={handleSave}
            hasSpinChecker
            onSpinStop={onSpinStop}
            variant="contained"
          >
            <FormattedMessage
              id="marketEditSaveLabel"
            />
          </SpinBlockingButton>
        </CardActions>
      </Card>
    </>
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
