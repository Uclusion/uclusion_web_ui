import React from 'react';
import PropTypes from 'prop-types';
import { Grid, Paper, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';

const useStyles = makeStyles(theme => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
  },
}));

function PlanningDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id, name } = market;
      return (
        <Grid
          item
          key={id}
        >
          <Paper
            className={classes.paper}
            onClick={() => navigate(history, formMarketLink(id))}
          >
            <Typography>
              {name}
            </Typography>
          </Paper>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={2}>
      {getMarketItems()}
    </Grid>
  );
}

PlanningDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default PlanningDialogs;
