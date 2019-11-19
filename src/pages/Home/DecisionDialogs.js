import React, { useContext } from 'react';
import { Grid, Paper, Typography, Card } from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { FormattedDate, useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
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
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);

  function getParticipantInfo(presences) {
    return presences.map((presence) => {
      const { id: userId, name, following } = presence;
      const roleNameKey = following ? 'decisionDialogsParticipantLabel' : 'decisionDialogsObserverLabel';
      return (
        <Card
          id={userId}
        >
          <Grid
            container
          >
            <Grid
              item
              xs={4}
            >
              <Typography>{name}</Typography>
            </Grid>
            <Grid
              item
              xs={4}
            >
            </Grid>
            <Grid
              item
              xs={4}
            >
              {intl.formatMessage(({ id: roleNameKey }))}
            </Grid>
          </Grid>
        </Card>
      );
    });
  }

  function getDialogActions(myPresence) {
    const { is_admin } = myPresence;
    
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id: marketId, name, expires_at } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user);
      const admin = marketPresences.find((presence) => presence.is_admin) || {};
      const sortedPresences = _.sortBy(marketPresences, 'name');
      return (
        <Grid
          item
          key={marketId}
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <Paper
            className={classes.paper}
            onClick={() => navigate(history, formMarketLink(marketId))}
          >
            <Typography>
              {name}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {intl.formatMessage({ id: 'decisionDialogsStartedBy' }, { name: admin.name })}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {intl.formatMessage({ id: 'decisionDialogsExpires' })}
              <FormattedDate
                value={expires_at}
              />
            </Typography>
            {getParticipantInfo(sortedPresences)}
          </Paper>
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
