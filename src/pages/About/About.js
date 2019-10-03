import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import withAppConfigs from '../../utils/withAppConfigs';
import { getMarketClient } from '../../api/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';
import { getFlags } from '../../utils/userFunctions';
import { getMarketId } from '../../utils/marketIdPathFunctions';

const styles = (theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  section: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  row: {
    display: 'flex',
    marginBottom: theme.spacing(0.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  label: {
    fontWeight: 600,
    marginRight: theme.spacing(1),
    minWidth: 140,
  },
  value: {
    //
  },
});

function About(props) {
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const marketId = getMarketId(pathname);
  const {
    user,
    appConfig,
    classes,
    intl,
    hidden,
  } = props;

  const { isAdmin } = getFlags(user);
  const { version } = appConfig;

  const [market, setMarket] = useState(undefined);

  useEffect(() => {
    if (marketId) {
      console.log(`Fetching market ${marketId}`);
      const clientPromise = getMarketClient(marketId);
      clientPromise.then((client) => client.markets.get(marketId))
        .then((market) => {
          setMarket(market);
        }).catch((error) => {
          console.debug(error);
          sendIntlMessage(ERROR, { id: 'marketFetchFailed' });
        });
    }
    return () => {
    };
  }, [marketId]);


  function handleClear() {


  }

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Activity
        title={intl.formatMessage({ id: 'about' })}
        hidden={hidden}
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
              <span className={classes.value}>{!!user && user.id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserNameLabel' })}</span>
              <span className={classes.value}>{!!user && user.name}</span>
            </Typography>
          </Paper>
          {isAdmin && (
            <Paper className={classes.section}>
              <Typography className={classes.row}>
                <span className={classes.label}>{intl.formatMessage({ id: 'aboutUclusionEmailLabel' })}</span>
                <span className={classes.value}>{appConfig.uclusionSupportInfo.email}</span>
              </Typography>
            </Paper>
          )}
          <br />
          <Button color="primary" onClick={handleClear}>{intl.formatMessage({ id: 'aboutClearStorageButton' })}</Button>
        </div>
      </Activity>
    </div>
  );
}

About.propTypes = {
  appConfig: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  user: PropTypes.object,
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withAppConfigs(withStyles(styles)(About)));
