import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { updateMarket, updateStage } from '../../../api/markets'
import CardType, { AGILE_PLAN_TYPE } from '../../../components/CardType'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import clsx from 'clsx'
import CardActions from '@material-ui/core/CardActions'
import Button from '@material-ui/core/Button'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import Card from '@material-ui/core/Card'
import { usePlanFormStyles, VoteExpiration, Votes } from '../../../components/AgilePlan'
import AllowedInProgress from './AllowedInProgress';
import { getStages, updateStagesForMarket } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import _ from 'lodash'
import ShowInVerifiedStageAge from './ShowInVerifiedStageAge'
import { TextField, Typography } from '@material-ui/core'

function PlanningDialogEdit(props) {
  const { onSpinStop, onCancel, market, acceptedStage, verifiedStage } = props;
  const [marketStagesState, marketStagesDispatch] = useContext(MarketStagesContext);
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
  const [showInvestiblesAge, setShowInvestiblesAge] = useState(verifiedStage.days_visible);
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
    votes_required,
    ticket_sub_code
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

  function onShowInvestiblesAgeChange(event) {
    const { value } = event.target;
    setShowInvestiblesAge(parseInt(value, 10));
  }

  function updateShowInvestibles(retValue) {
    return updateStage(id, verifiedStage.id, undefined, showInvestiblesAge).then((newStage) => {
      const marketStages = getStages(marketStagesState, id);
      const newStages = _.unionBy([newStage], marketStages, 'id');
      updateStagesForMarket(marketStagesDispatch, id, newStages);
      return retValue;
    });
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
          votesRequiredInt,
          undefined,
          ticket_sub_code
        ).then(market => {
          const retValue = {
            result: market,
            spinChecker: () => Promise.resolve(true)
          };
          if (allowedInvestibles !== acceptedStage.allowed_investibles) {
            return updateStage(id, acceptedStage.id, allowedInvestibles).then((newStage) => {
              const marketStages = getStages(marketStagesState, id);
              const newStages = _.unionBy([newStage], marketStages, 'id');
              updateStagesForMarket(marketStagesDispatch, id, newStages);
              if (showInvestiblesAge !== verifiedStage.days_visible) {
                return updateShowInvestibles(retValue);
              }
              return retValue;
            });
          }
          if (showInvestiblesAge !== verifiedStage.days_visible) {
            return updateShowInvestibles(retValue);
          }
          return retValue;
        });
  }

  return (
    <Card className={classes.overflowVisible}>
      <CardType className={classes.cardType} type={AGILE_PLAN_TYPE} />
      <CardContent className={classes.cardContent}>
        <legend className={classes.optional}>*{intl.formatMessage({ id: "optionalEdit" })}</legend>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
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
              onChange={handleChange("investment_expiration")}
              value={investment_expiration}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <Votes onChange={handleChange("votes_required")} value={votes_required} />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <TextField
              id="name"
              className={classes.input}
              value={ticket_sub_code}
              onChange={handleChange("ticket_sub_code")}
            />
            <Typography>
              {intl.formatMessage({ id: "ticketSubCodeHelp" })}
            </Typography>
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
