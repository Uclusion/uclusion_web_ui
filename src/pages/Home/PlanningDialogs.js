import React, { useContext } from 'react';
import {
  Grid, Typography, Card, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage, getBlockedStage, getInCurrentVotingStage,
  getInReviewStage,
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getBudgetTotalsForUser } from '../../utils/userFunctions';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import DialogActions from './DialogActions';

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },
  draft: {
    color: '#E85757',
  },
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);

  function getParticipantInfo(presences, marketId) {
    const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
    const votingStage = getInCurrentVotingStage(marketStagesState, marketId);
    const acceptedStage = getAcceptedStage(marketStagesState, marketId);
    const reviewStage = getInReviewStage(marketStagesState, marketId);
    const blockedStage = getBlockedStage(marketStagesState, marketId);
    const loaded = votingStage && acceptedStage && reviewStage;
    if (!loaded) {
      return <></>; // TODO; this should render a better stub
    }
    return presences.map((presence) => {
      const { id: userId, name } = presence;
      return (
        <Card
          key={userId}
        >
          <Grid
            container
          >
            <Grid
              item
              xs={2}
            >
              <Typography>{name}</Typography>
            </Grid>
            <Grid
              item
              xs={2}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, votingStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
            <Grid
              item
              xs={2}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, acceptedStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
            <Grid
              item
              xs={2}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, reviewStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
            <Grid
              item
              xs={2}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, blockedStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      );
    });
  }

  function getMarketItems() {
    return markets.map((market) => {
      const {
        id: marketId, name, market_type: marketType, market_stage: marketStage,
        created_at: createdAt,
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      return (
        <Grid
          item
          key={marketId}
          xs={12}

        >
          <RaisedCard
            className={classes.paper}
            border={1}
          >
            <CardContent>
              {getDialogTypeIcon(marketType)}
              <div>
                {isDraft && (
                  <Typography className={classes.draft}>
                    {intl.formatMessage({ id: 'draft' })}
                  </Typography>
                )}
                <Typography>
                  <Link
                    href={formMarketLink(marketId)}
                    variant="inherit"
                    underline="always"
                    color="primary"
                    onClick={(event) => {
                      event.preventDefault();
                      navigate(history, formMarketLink(marketId));}}
                  >
                    {name}
                  </Link>
                </Typography>
                <Typography>
                  {intl.formatMessage({ id: 'homeCreatedAt' }, { dateString: intl.formatDate(createdAt) })}
                </Typography>
              </div>
              <Grid
                container
              >
                <Grid
                  item
                  xs={12}
                >
                  <Grid
                    container
                    justify="center"
                  >
                    <Grid
                      item
                    >
                      <Typography>{intl.formatMessage({ id: 'homePlanningReport' })}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
                <Grid
                  item
                  xs={2}
                />
                <Grid
                  item
                  xs={2}
                >
                  <Typography>{intl.formatMessage({ id: 'planningVotingStageLabel' })}</Typography>
                </Grid>
                <Grid
                  item
                  xs={2}
                >
                  <Typography>{intl.formatMessage({ id: 'planningAcceptedStageLabel' })}</Typography>
                </Grid>
                <Grid
                  item
                  xs={2}
                >
                  <Typography>{intl.formatMessage({ id: 'planningReviewStageLabel' })}</Typography>
                </Grid>
                <Grid
                  item
                  xs={2}
                >
                  <Typography>{intl.formatMessage({ id: 'planningBlockedStageLabel' })}</Typography>
                </Grid>
              </Grid>
              {getParticipantInfo(sortedPresences, marketId)}
            </CardContent>
            <CardActions>
              <DialogActions
                marketStage={marketStage}
                marketId={marketId}
                marketType={marketType}
                isAdmin
                isFollowing={myPresence.following}
                inArchives={myPresence.market_hidden}
              />
            </CardActions>
          </RaisedCard>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getMarketItems()}
    </Grid>
  );
}

PlanningDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default PlanningDialogs;
