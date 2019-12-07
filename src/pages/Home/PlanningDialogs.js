import React, { useContext, useState } from 'react';
import {
  Grid, Typography, Card, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import LinkIcon from '@material-ui/icons/Link';
import { useIntl } from 'react-intl';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import ChangeToParticipantButton from './Decision/ChangeToParticipantButton';
import ChangeToObserverButton from './Decision/ChangeToObserverButton';
import InviteLinker from './Decision/InviteLinker';
import LeaveMarketButton from './Decision/LeaveMarketButton';
import ArchiveMarketButton from './Decision/ArchiveMarketButton';
import RaisedCard from '../../components/Cards/RaisedCard';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getBudgetTotalsForUser } from '../../utils/userFunctions';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },

}));

function PlanningDialogs(props) {
  const history = useHistory();
  const intl = useIntl();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [showInvite, setShowInvite] = useState({});

  function getParticipantInfo(presences, marketId) {
    const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
    const marketStages = getStages(marketStagesState, marketId);
    const votingStage = marketStages.find((stage) => stage.allows_investment);
    // eslint-disable-next-line max-len
    const acceptedStage = marketStages.find((stage) => (!stage.allows_investment && stage.singular_only));
    // eslint-disable-next-line max-len
    const reviewStage = marketStages.find((stage) => (!stage.singular_only && stage.appears_in_context));
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
              xs={3}
            >
              <Typography>{name}</Typography>
            </Grid>
            <Grid
              item
              xs={3}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, votingStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
            <Grid
              item
              xs={3}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, acceptedStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
            <Grid
              item
              xs={3}
            >
              <Typography>
                {getBudgetTotalsForUser(userId, reviewStage.id, marketId, presences,
                  marketInvestibles)}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      );
    });
  }

  function setInviteVisible(value, marketId) {
    setShowInvite({ ...showInvite, [marketId]: value });
  }

  function toggleInviteVisible(marketId) {
    const oldValue = showInvite[marketId];
    const newValue = !oldValue;
    setInviteVisible(newValue, marketId);
  }

  function getDialogActions(marketId, myPresence) {
    const { following } = myPresence;
    const actions = [];
    actions.push(
      <TooltipIconButton
        key="invite"
        translationId="decisionDialogsInviteParticipant"
        icon={<LinkIcon/>}
        onClick={() => toggleInviteVisible(marketId)}
      />,
    );
    actions.push(
      <ArchiveMarketButton key="archive" marketId={marketId}/>,
    );
    actions.push(
      <LeaveMarketButton key="leave" marketId={marketId}/>,
    );
    // if participant you can become observer, or if observer you can become participant
    if (following) {
      actions.push(
        <ChangeToObserverButton key="observe" marketId={marketId}/>,
      );
    } else {
      actions.push(
        <ChangeToParticipantButton key="participate" marketId={marketId}/>,
      );
    }
    return actions;
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id: marketId, name, market_type } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
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
              {getDialogTypeIcon(market_type)}
              <Typography>
                <Link
                  href="#"
                  variant="inherit"
                  underline="always"
                  color="primary"
                  onClick={() => navigate(history, formMarketLink(marketId))}
                >
                  {name}
                </Link>
              </Typography>
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
                  xs={3}
                />
                <Grid
                  item
                  xs={3}
                >
                  <Typography>{intl.formatMessage({ id: 'planningVotingStageLabel' })}</Typography>
                </Grid>
                <Grid
                  item
                  xs={3}
                >
                  <Typography>{intl.formatMessage({ id: 'planningAcceptedStageLabel' })}</Typography>
                </Grid>
                <Grid
                  item
                  xs={3}
                >
                  <Typography>{intl.formatMessage({ id: 'planningReviewStageLabel' })}</Typography>
                </Grid>
              </Grid>
              {getParticipantInfo(sortedPresences, marketId)}
            </CardContent>
            <CardActions>
              {getDialogActions(marketId, myPresence)}
            </CardActions>
            <InviteLinker
              hidden={!showInvite[marketId]}
              marketId={marketId}
            />
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
