import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Activity from '../../containers/Activity/Activity';
import withAppConfigs from '../../utils/withAppConfigs';
import { getFlags } from '../../utils/userFunctions';
import { AsyncMarketsContext } from '../../contexts/AsyncMarketContext';

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
  const { currentMarket, getAllMarketDetails, getCurrentUser } = useContext(AsyncMarketsContext);
  const {
    appConfig,
    classes,
    intl,
    hidden,
  } = props;

  const { version } = appConfig;
  const [market, setMarket] = useState(undefined);
  const [user, setUser] = useState(undefined);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (currentMarket && (market === undefined || currentMarket.id !== market.id)) {
      getAllMarketDetails()
        .then((marketDetails) => {
          const found = marketDetails
            && marketDetails.find((marketDetail) => marketDetail.id === currentMarket.id);
          if (found) {
            setMarket(found);
          }
        });
      if (getCurrentUser) {
        getCurrentUser()
          .then((currentUser) => {
            if (currentUser) {
              setUser(currentUser);
              const { market_admin: isAdmin } = getFlags(currentUser);
              setIsAdmin(isAdmin);
            }
          });
      }
    }
    return () => {
    };
  }, [currentMarket, market, getAllMarketDetails, getCurrentUser]);

  function handleClear() {
    // TODO need to clear storage here
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
              <span className={classes.value}>{!!market && market.id}</span>
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
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withAppConfigs(withStyles(styles)(About)));
