import React, { useContext, useState } from 'react'
import { useIntl } from 'react-intl'
import {
  updateMarket,
  updateStage
} from '../../../api/markets'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import clsx from 'clsx'
import CardActions from '@material-ui/core/CardActions'
import Card from '@material-ui/core/Card'
import { usePlanFormStyles, VoteExpiration } from '../../../components/AgilePlan'
import {
  getStages,
  updateStagesForMarket
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import _ from 'lodash'
import ShowInVerifiedStageAge from './ShowInVerifiedStageAge'
import { makeStyles, Typography } from '@material-ui/core';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { addMarketToStorage, getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import Screen from '../../../containers/Screen/Screen'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { useHistory } from 'react-router'
import { decomposeMarketPath } from '../../../utils/marketIdPathFunctions'
import NameField, { clearNameStoredState, getNameStoredState } from '../../../components/TextFields/NameField'
import { StartedExpiration } from '../../../components/AgilePlan/StartedExpiration';
import ArchiveMarketButton from './ArchiveMarketButton';
import ActivateMarketButton from './ActivateMarketButton';

const useStyles = makeStyles((theme) => {
  return {
    actions: {
      margin: theme.spacing(-3, 0, 0, 6),
      paddingBottom: '2rem'
    },
  };
});

function PlanningMarketEdit() {
  const [marketStagesState, marketStagesDispatch] = useContext(MarketStagesContext);
  const [,setOperationRunning] = useContext(OperationInProgressContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const myClasses = useStyles();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const marketStages = getStages(marketStagesState, marketId);
  const verifiedStage = marketStages.find(stage => !stage.allows_tasks) || {};
  const [showInvestiblesAge, setShowInvestiblesAge] = useState(undefined);
  const market = getMarket(marketsState, marketId) || {};
  const [investmentExpiration, setInvestmentExpiration] = useState(market.investment_expiration || 14);
  const [startedExpiration, setStartedExpiration] = useState(market.started_expiration || 3);
  const nameId = `marketEdit${marketId}`;
  const isArchived = market.market_stage !== 'Active';

  function clear() {
    clearNameStoredState(nameId);
    const nameInput = document.getElementById(nameId);
    if (nameInput) {
      nameInput.value = market.name;
    }
    setShowInvestiblesAge(undefined);
    setInvestmentExpiration(undefined);
    setStartedExpiration(undefined);
  }

  function onShowInvestiblesAgeChange(event) {
    const { value } = event.target;
    setShowInvestiblesAge(parseInt(value, 10));
  }

  function updateShowInvestibles() {
    return updateStage(marketId, verifiedStage.id, undefined, showInvestiblesAge).then((newStage) => {
      const marketStages = getStages(marketStagesState, marketId);
      const newStages = _.unionBy([newStage], marketStages, 'id');
      updateStagesForMarket(marketStagesDispatch, marketId, newStages);
      setOperationRunning(false);
    });
  }

  function handleSave() {
    const name = getNameStoredState(nameId);
    return updateMarket(
      marketId,
      name,
      investmentExpiration ? parseInt(investmentExpiration, 10) : null, null
    ).then(market => {
      addMarketToStorage(marketsDispatch, market);
      if (showInvestiblesAge) {
        return updateShowInvestibles();
      }
      setOperationRunning(false);
    });
  }

  return (
    <Screen
      title={intl.formatMessage({ id: 'editWorkspace' })}
      tabTitle={intl.formatMessage({ id: 'editWorkspace' })}
      hidden={false}
      loading={_.isEmpty(market)}
    >
    <Card className={classes.overflowVisible}>
      <CardContent className={classes.cardContent}>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}
              style={{paddingTop: "2rem"}}>
          {!isArchived && (
            <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              Archiving a workspace removes it from the UI and its unique users from billing.
              <Typography variant="h6" style={{marginTop: '1rem'}}>
                {intl.formatMessage({ id: 'archiveWorkspace' })} <ArchiveMarketButton marketId={market.id} />
              </Typography>
            </Grid>
          )}
          {isArchived && market?.id && (
            <Grid item md={12} xs={12} className={classes.fieldsetContainer} style={{paddingTop: '4rem'}}>
              This workspace is archived and its users do not contribute to billing.
              <Typography variant="h6" style={{marginTop: '1rem'}}>
                {intl.formatMessage({ id: 'activateWorkspace' })} <ActivateMarketButton marketId={market.id} />
              </Typography>
            </Grid>
          )}
          <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              <Typography variant="h6" style={{marginTop: '2rem', marginBottom: '1rem'}}>
                {intl.formatMessage({ id: 'marketOptions' })}
              </Typography>
              <NameField id={nameId} initialValue={market.name} />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <ShowInVerifiedStageAge
              onChange={onShowInvestiblesAgeChange}
              value={showInvestiblesAge || verifiedStage.days_visible}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <VoteExpiration
              onChange={(event) => setInvestmentExpiration(event.target.value)}
              value={investmentExpiration}
            />
          </Grid>
          <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
            <StartedExpiration
              onChange={(event) => setStartedExpiration(event.target.value)}
              value={startedExpiration}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions className={myClasses.actions}>
        <SpinningIconLabelButton onClick={clear} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'clear' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="planningDialogUpdateButton">
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>
    </Screen>
  );
}

export default PlanningMarketEdit;
