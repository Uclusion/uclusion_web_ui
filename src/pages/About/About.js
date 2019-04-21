import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import { withUserAndPermissions } from '../../components/UserPermissions/UserPermissions';
import withAppConfigs from '../../utils/withAppConfigs';
import { withMarketId } from '../../components/PathProps/MarketId';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { formCurrentMarketLink } from '../../utils/marketIdPathFunctions';
import { clearUserState } from '../../utils/userStateFunctions';

const styles = theme => ({
  root: {
    padding: theme.spacing.unit * 2,
  },
  section: {
    padding: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  row: {
    display: 'flex',
    marginBottom: theme.spacing.unit * 0.5,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  label: {
    fontWeight: 600,
    marginRight: theme.spacing.unit,
    minWidth: 140,
  },
  value: {
    //
  },
});

function About(props) {
  const {
    upUser,
    userPermissions,
    appConfig,
    marketId,
    classes,
    history,
    dispatch,
    intl,
  } = props;

  const { isMarketAdmin } = userPermissions;
  const { version } = appConfig;

  const [market, setMarket] = useState(undefined);

  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.markets.get(marketId))
      .then((market) => {
        setMarket(market);
      }).catch((error) => {
        console.debug(error);
        sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
      });
    return () => {
    };
  }, [marketId]);


  function handleClear() {
    clearUserState(dispatch);
    history.push(formCurrentMarketLink('Login'));

  }

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Activity
        title={intl.formatMessage({ id: 'about' })}
      >
        <div className={classes.root}>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutApplicationVersionLabel' })}</span>
              <span className={classes.value}>{version}</span>
            </Typography>
          </Paper>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutMarketIdLabel' })}</span>
              <span className={classes.value}>{marketId}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutAccountIdLabel' })}</span>
              <span className={classes.value}>{!!market && market.account_id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutAccountNameLabel' })}</span>
              <span className={classes.value}>{!!market && market.account_name}</span>
            </Typography>
          </Paper>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserIdLabel' })}</span>
              <span className={classes.value}>{!!upUser && upUser.id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserNameLabel' })}</span>
              <span className={classes.value}>{!!upUser && upUser.name}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutTeamIdLabel' })}</span>
              <span className={classes.value}>{!!upUser && upUser.team_id}</span>
            </Typography>
          </Paper>
          {isMarketAdmin && (
            <Paper className={classes.section}>
              <Typography className={classes.row}>
                <span className={classes.label}>{intl.formatMessage({ id: 'aboutUclusionEmailLabel' })}</span>
                <span className={classes.value}>{appConfig.uclusionSupportInfo.email}</span>
              </Typography>
            </Paper>
          )}
          <br/>
          <Button color='primary' onClick={handleClear}>{intl.formatMessage({ id: 'aboutClearStorageButton' })}</Button>
        </div>
      </Activity>
    </div>
  );
}

About.propTypes = {
  upUser: PropTypes.object,
  userPermissions: PropTypes.object,
  appConfig: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  intl: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,
};

function mapStateToProps(state) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withUserAndPermissions(withAppConfigs(withMarketId(withStyles(styles)(About))))));
