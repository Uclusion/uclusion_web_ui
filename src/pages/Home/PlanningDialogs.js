import React from 'react';
import { Grid, Paper, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { makeStyles } from '@material-ui/styles';

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

  function getMarketItems() {
    return markets.map((market) => {
      const { id, name } = market;
      return (
        <Grid item>
          <Paper
            className={classes.paper}
            onClick={() => navigate(history, formMarketLink(id))}>
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

export default PlanningDialogs;