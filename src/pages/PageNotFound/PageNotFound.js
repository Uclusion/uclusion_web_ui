import Paper from '@material-ui/core/Paper';
import React from 'react';
import Typography from '@material-ui/core/Typography';
import { useIntl } from 'react-intl';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: '3px 89px 21px 21px',
    marginTop: '-6px',
    boxShadow: 'none',
    [theme.breakpoints.down('sm')]: {
      padding: '3px 21px 42px 21px',
    },
  },
}));

function PageNotFound(props) {
  const { hidden } = props;
  const intl = useIntl();
  const classes = useStyles();

  return (
    <Screen
      hidden={hidden}
      loading={false}
    >
      <Paper className={classes.container}>
        <Typography variant="h2">
          {intl.formatMessage({ id: 'warning_404_message' })}
        </Typography>
        <Typography variant="h3">
          {intl.formatMessage({ id: 'warning_404_description' })}
        </Typography>
      </Paper>
    </Screen>
  );
}

PageNotFound.propTypes = {
  hidden: PropTypes.bool,
};

PageNotFound.defaultProps = {
  hidden: false,
};

export default PageNotFound;
