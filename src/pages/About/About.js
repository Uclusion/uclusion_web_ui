import React, { useEffect, useState } from 'react';
import localforage from 'localforage';
import PropTypes from 'prop-types';
import {
  Paper, Typography, Button, makeStyles,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import Screen from '../../containers/Screen/Screen';
import config from '../../config';
import { toastErrorAndThrow } from '../../utils/userMessage';
import { getSSOInfo } from '../../api/sso';

const useStyles = makeStyles((theme) => ({
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
}));

function About(props) {
  const {
    hidden,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const { version } = config;
  const [idToken, setIdToken] = useState(undefined);
  function handleClear() {
    localforage.clear().then(() => {
      console.info('Reloading after clearing cache');
      window.location.reload(true);
    }).catch((error) => toastErrorAndThrow(error, 'errorClearFailed'));
  }

  useEffect(() => {
    if (!idToken) {
      getSSOInfo().then((ssoInfo) => {
        const { idToken: myIdToken } = ssoInfo;
        setIdToken(myIdToken);
      }).catch((error) => toastErrorAndThrow(error, 'errorGetIdFailed'));
    }
  }, [idToken]);

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Screen
        title={intl.formatMessage({ id: 'about' })}
        tabTitle={intl.formatMessage({ id: 'about' })}
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
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserIdLabel' })}</span>
              <span className={classes.value}>{idToken}</span>
            </Typography>
          </Paper>

          <br />
          <Button color="primary" onClick={handleClear}>{intl.formatMessage({ id: 'aboutClearStorageButton' })}</Button>
        </div>
      </Screen>
    </div>
  );
}

About.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default About;
