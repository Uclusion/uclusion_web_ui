import React, { useContext } from 'react';
import {
  Grid, Typography, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { useIntl } from 'react-intl';
import {
  getMarketPresences,
  marketHasOnlyCurrentUser
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, formMarketManageLink, navigate } from '../../utils/marketIdPathFunctions';
import RaisedCard from '../../components/Cards/RaisedCard';
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getParticipantInfo } from '../../utils/userFunctions';
import { ACTIVE_STAGE, INITIATIVE_TYPE } from '../../constants/markets';
import DialogActions from './DialogActions';
import ExpiredDisplay from '../../components/Expiration/ExpiredDisplay';

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

function InitiativeDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const intl = useIntl();
  const { markets } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);

  function getMarketItems() {
    return markets.map((market) => {
      const {
        id: marketId, created_at: createdAt, expiration_minutes: expirationMinutes,
        market_type: marketType, market_stage: marketStage, updated_at: updatedAt,
      } = market;
      const investibles = getMarketInvestibles(investiblesState, marketId);
      if (!investibles || _.isEmpty(investibles)) {
        return <></>;
      }
      const baseInvestible = investibles[0];
      const { investible } = baseInvestible;
      const { name, id: baseInvestibleId } = investible;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const isDraft = marketHasOnlyCurrentUser(marketPresencesState, marketId);
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const isAdmin = myPresence && myPresence.is_admin;
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
                      navigate(history, formMarketLink(marketId));
                    }}
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
                  xs={3}
                >
                  {!active && (
                    <ExpiredDisplay expiresDate={updatedAt}/>
                  )}
                  {active && (
                    <ExpiresDisplay
                      createdAt={createdAt}
                      expirationMinutes={expirationMinutes}
                      showEdit={isAdmin}
                      history={history}
                      marketId={marketId}
                    />
                  )}
                </Grid>
                <Grid
                  item
                  xs={9}
                >
                  {getParticipantInfo(sortedPresences, marketInvestibles, INITIATIVE_TYPE)}
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              <DialogActions
                marketStage={marketStage}
                marketId={marketId}
                marketType={marketType}
                isAdmin
                inArchives={myPresence.market_hidden}
                initiativeId={baseInvestibleId}
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

InitiativeDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InitiativeDialogs;
