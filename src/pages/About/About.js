import React, { useEffect, useState } from 'react';
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

  function clearIndexDB() {
    function deleteData() {
      console.log(db.objectStoreNames);
      // open a read/write db transaction, ready for deleting the data
      var transaction = db.transaction(['keyvaluepairs'], 'readwrite');
      // report on the success of the transaction completing, when everything is done
      var objStore = transaction.objectStore('keyvaluepairs');
      objStore.clear();
      transaction.oncomplete = function (event) {
        console.debug('Clear transaction completed.');
      };
      transaction.onerror = function (event) {
        console.log('Clear transaction not opened due to error');
      };
    }

    var DBOpenRequest = window.indexedDB.open('localforage', 2);
    var db;

    DBOpenRequest.onsuccess = function (event) {
      console.debug('Db opened for clear');
      // store the result of opening the database in the db variable. This is used a lot below
      db = DBOpenRequest.result;
      // Run the deleteData() function to delete a record from the database
      deleteData();
    };
  }

  function handleClear() {
    localStorage.clear();
    clearIndexDB();
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    history.push(formCurrentMarketLink('Login'));
  }

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Activity
        title={intl.formatMessage({ id: 'about' })}
        hideMarketSelect
      >
        <div className={classes.root}>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>Application version:</span>
              <span className={classes.value}>{version}</span>
            </Typography>
          </Paper>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>Market Id:</span>
              <span className={classes.value}>{marketId}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>Account Id:</span>
              <span className={classes.value}>{!!market && market.account_id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>Account Name:</span>
              <span className={classes.value}>{!!market && market.account_name}</span>
            </Typography>
          </Paper>
          <Paper className={classes.section}>
            <Typography className={classes.row}>
              <span className={classes.label}>User Id:</span>
              <span className={classes.value}>{!!upUser && upUser.id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>User Name:</span>
              <span className={classes.value}>{!!upUser && upUser.name}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>Team Id:</span>
              <span className={classes.value}>{!!upUser && upUser.team_id}</span>
            </Typography>
          </Paper>
          {isMarketAdmin && (
            <Paper className={classes.section}>
              <Typography className={classes.row}>
                <span className={classes.label}>Uclusion Email:</span>
                <span className={classes.value}>{appConfig.uclusionSupportInfo.email}</span>
              </Typography>
            </Paper>
          )}
          <br/>
          <Button color='primary' onClick={handleClear}>{intl.formatMessage({ id: 'clearStorageLabel' })}</Button>
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
};

export default injectIntl(withUserAndPermissions(withAppConfigs(withMarketId(withStyles(styles)(About)))));
