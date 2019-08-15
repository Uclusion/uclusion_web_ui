import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import Paper from '@material-ui/core/Paper';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import Activity from '../../containers/Activity';

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
  const { intl, classes } = props;

  return (
    <Activity>
      <Paper className={classes.paper}>
        <div className={classes.container}>
          <Typography variant="display1">
            {intl.formatMessage({ id: 'warning_404_message' })}
          </Typography>
          <Typography variant="subheading">
            {intl.formatMessage({ id: 'warning_404_description' })}
          </Typography>
          <Button variant="fab" color="secondary" aria-label="home" href="/" className={classes.button}>
            <Icon>home</Icon>
          </Button>
        </div>
      </Paper>
    </Activity>
  );
}
export default injectIntl(withStyles(styles)(PageNotFound));
