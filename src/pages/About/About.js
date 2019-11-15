import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography, Button } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Screen from '../../containers/Screen/Screen';
import withAppConfigs from '../../utils/withAppConfigs';

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
  const {
    appConfig,
    classes,
    intl,
    hidden,
  } = props;

  const { version } = appConfig;
  // TODO: make this identity
  const user = undefined;
  function handleClear() {
    // TODO need to clear storage here
  }

  // Each one of the paper blocks here represent a logical section of the page. We'll probably
  // want to skin it with pretty headers etc.
  return (
    <div>
      <Screen
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
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserIdLabel' })}</span>
              <span className={classes.value}>{!!user && user.id}</span>
            </Typography>
            <Typography className={classes.row}>
              <span className={classes.label}>{intl.formatMessage({ id: 'aboutUserNameLabel' })}</span>
              <span className={classes.value}>{!!user && user.name}</span>
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
  appConfig: PropTypes.object.isRequired,
  intl: PropTypes.object.isRequired,
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withAppConfigs(withStyles(styles)(About)));
