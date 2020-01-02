import React, { useContext } from 'react';
import {
  Grid, Typography, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import InviteLinker from './Decision/InviteLinker';
import LeaveMarketButton from './Decision/LeaveMarketButton';
import ArchiveMarketButton from './Decision/ArchiveMarketButton';
import RaisedCard from '../../components/Cards/RaisedCard';
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { getParticipantInfo } from '../../utils/userFunctions';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { ACTIVE_STAGE } from '../../constants/markets';

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },

}));

function DecisionDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);

  function getDialogActions(marketId, myPresence, marketStage) {
    const { is_admin } = myPresence;
    const actions = [];

    if (is_admin) {
      if (marketStage === 'Active') {
        actions.push(

        );
        actions.push(
          <ArchiveMarketButton key="archive" marketId={marketId}/>,
        );
      } else {
        // admins can't exit a dialog or change their role on an active market
        actions.push(
          <LeaveMarketButton key="leave" marketId={marketId}/>,
        );
      }
    } else {
      actions.push(
        <LeaveMarketButton key="leave" marketId={marketId}/>,
      );
    }
    return actions;
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const {
        id: marketId, name, created_at: createdAt, expiration_minutes: expirationMinutes,
        market_type: marketType, market_stage: marketStage,
      } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following);
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
      const active = marketStage === ACTIVE_STAGE;
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
              <Grid
                container
              >
                <Grid
                  item
                  xs={3}
                >
                  {getDialogTypeIcon(marketType)}
                </Grid>
              </Grid>
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
                  xs={3}
                >
                  {active && (
                    <ExpiresDisplay
                      createdAt={createdAt}
                      expirationMinutes={expirationMinutes}
                    />)}
                </Grid>
                <Grid
                  item
                  xs={9}
                >
                  {getParticipantInfo(sortedPresences, marketInvestibles)}
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              {getDialogActions(marketId, myPresence, marketStage)}
            </CardActions>
            <InviteLinker
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

DecisionDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DecisionDialogs;
