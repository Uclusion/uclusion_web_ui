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
import AllowedInProgress from './AllowedInProgress';
import {
  getStages,
  isAcceptedStage,
  updateStagesForMarket
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import _ from 'lodash'
import ShowInVerifiedStageAge from './ShowInVerifiedStageAge'
import { makeStyles, Typography } from '@material-ui/core'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { addMarketToStorage, getMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import Screen from '../../../containers/Screen/Screen'
import ManageMarketUsers from '../UserManagement/ManageMarketUsers'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { useHistory } from 'react-router'
import { decomposeMarketPath, navigate } from '../../../utils/marketIdPathFunctions'
import NameField, { getNameStoredState } from '../../../components/TextFields/NameField'

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
  const acceptedStage = marketStages.find(stage => isAcceptedStage(stage)) || {};
  const verifiedStage = marketStages.find(stage => stage.appears_in_market_summary) || {};
  const [allowedInvestibles, setAllowedInvestibles] = useState(acceptedStage.allowed_investibles);
  const [showInvestiblesAge, setShowInvestiblesAge] = useState(verifiedStage.days_visible);
  const market = getMarket(marketsState, marketId) || {};
  const [investmentExpiration, setInvestmentExpiration] = useState(market.investment_expiration);
  const nameId = `marketEdit${marketId}`;

  function onAllowedInvestiblesChange(event) {
    const { value } = event.target;
    setAllowedInvestibles(parseInt(value, 10));
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
    console.debug(`${allowedInvestibles !== acceptedStage.allowed_investibles} ${allowedInvestibles} ${acceptedStage.allowed_investibles}`)
    const name = getNameStoredState(nameId);
    return updateMarket(
      marketId,
      name,
      investmentExpiration ? parseInt(investmentExpiration, 10) : null
    ).then(market => {
      addMarketToStorage(marketsDispatch, market);
      if (allowedInvestibles !== acceptedStage.allowed_investibles) {
        return updateStage(marketId, acceptedStage.id, allowedInvestibles).then((newStage) => {
          const marketStages = getStages(marketStagesState, marketId)
          const newStages = _.unionBy([newStage], marketStages, 'id')
          updateStagesForMarket(marketStagesDispatch, marketId, newStages)
          if (showInvestiblesAge !== verifiedStage.days_visible) {
            return updateShowInvestibles();
          }
          setOperationRunning(false);
        });
      }
      if (showInvestiblesAge !== verifiedStage.days_visible) {
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
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
          <Grid item md={6} xs={12} className={classes.fieldsetContainer}>
            <ManageMarketUsers market={market}/>
          </Grid>
        </Grid>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}
              style={{paddingTop: "2rem"}}>
          <NameField id={marketId} initialValue={market.name} />
          <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
              <Typography variant="h6">
                {intl.formatMessage({ id: 'marketOptions' })}
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
              onChange={(event) => setInvestmentExpiration(event.target)}
              value={investmentExpiration}
            />
          </Grid>
        </Grid>
      </CardContent>
      <CardActions className={myClasses.actions}>
        <SpinningIconLabelButton onClick={() => navigate(history)} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
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
