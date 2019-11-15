import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Screen from '../../containers/Screen/Screen';

const styles = theme => ({
  icon: {
    width: 192,
    height: 192,
    color: theme.palette.secondary.main,
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  paper: {
    backgroundColor: theme.palette.background.default,
    height: '100vh',
    margin: 0,
  },
  button: {
    marginTop: 20,
  },

});

function PageNotFound(props) {
  const { intl, classes, hidden, } = props;

  return (
    <Screen hidden={hidden}>
      <Paper className={classes.paper}>
        <div className={classes.container}>
          <Typography variant="h2">
            {intl.formatMessage({ id: 'warning_404_message' })}
          </Typography>
          <Typography variant="h2">
            {intl.formatMessage({ id: 'warning_404_description' })}
          </Typography>
          <Button variant="outlined" color="secondary" aria-label="home" href="/" className={classes.button}>
            <Icon>home</Icon>
          </Button>
        </div>
      </Paper>
    </Screen>
  );
}
export default injectIntl(withStyles(styles)(PageNotFound));
