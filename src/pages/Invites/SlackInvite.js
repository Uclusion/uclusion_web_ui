import React, { useContext, useEffect, useState } from 'react'
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { makeStyles, Paper, Typography } from '@material-ui/core';
import queryString from 'query-string';
import {
  navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { toastError } from '../../utils/userMessage';
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer'
import { getAccountClient } from '../../api/homeAccount';
import Link from '@material-ui/core/Link';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  section: {
    padding: theme.spacing(2),
    maxWidth: '40rem'
  },
  row: {
    display: 'flex',
    marginBottom: theme.spacing(0.5),
    '&:last-child': {
      marginBottom: 0,
    },
    fontWeight: 600,
  },
  value: {
    //
  },
}));

function SlackInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const classes = useStyles();
  const { hash } = location;
  const [myLoading, setMyLoading] = useState(true);
  const [, userDispatch] = useContext(AccountContext) || {};

  useEffect(() => {
    if (!hidden && hash) {
      const values = queryString.parse(hash);
      const { nonce } = values;
      if (nonce) {
        getAccountClient()
          .then((client) => client.users.register(nonce))
          .then((user) => {
            userDispatch(accountUserRefresh(user));
            return setTimeout(() => {navigate(history, '/userPreferences');}, 1000);
          }).catch((error) => {
            setMyLoading(false);
            console.error(error);
            toastError(error, 'slack_register_failed');
          });
      }
    }
  }, [hidden, hash, history, userDispatch]);

  return (
    <Screen
      title={intl.formatMessage({ id: 'loadingSlack' })}
      tabTitle={intl.formatMessage({ id: 'loadingSlack' })}
      hidden={hidden}
      loading={!!hash && myLoading}
    >
      <div className={classes.root}>
        <Paper className={classes.section}>
          <Typography className={classes.row}>
            Almost there!
          </Typography>
          <Typography className={classes.row}>
            Now type /uclusion in the Slack channel where you want group alerts to go.
          </Typography>
          <Typography>
            See <Link href="https://documentation.uclusion.com/notifications/slack" target="_blank"> Slack integration documentation</Link> for
            detailed instructions.
          </Typography>
        </Paper>
      </div>
    </Screen>
  );
}

SlackInvite.propTypes = {
  hidden: PropTypes.bool,
};

SlackInvite.defaultProps = {
  hidden: false,
};

export default SlackInvite;
