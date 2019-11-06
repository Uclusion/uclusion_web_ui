import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { FormattedDate } from 'react-intl';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  }
}));

function DecisionDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const intl = useIntl();

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id, name, expires_at } = market;
      return (
        <Grid
          item
          key={id}
          xs={12}
          sm={6}
          md={4}
          lg={3}
        >
          <Paper
            className={classes.paper}
            onClick={() => navigate(history, formMarketLink(id))}
          >
            <Typography>
              {name}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {intl.formatMessage({ id: 'decisionDialogsStartedBy' }, { name: 'Phillme Inlater' })}
            </Typography>
            <Typography
              color="textSecondary"
              className={classes.textData}
            >
              {intl.formatMessage({ id: 'decisionDialogsExpires'})}
              <FormattedDate
                value={expires_at}
              />
            </Typography>
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getMarketItems()}
    </Grid>
  );
}

DecisionDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DecisionDialogs;
