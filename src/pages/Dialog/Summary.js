import React from 'react';
import PropTypes from 'prop-types';
import { Card, Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import QuillEditor from '../../components/TextEditors/QuillEditor';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    overflow: 'hidden',
    padding: theme,
  },
  paper: {},
}));

function Summary(props) {
  const classes = useStyles();
  const { market } = props;
  const { id, description } = market;

  return (
    <div className={classes.root}>
      <Card className={classes.paper}>
        <Grid
          container
        >
            <QuillEditor marketId={id} defaultValue={description} readOnly />
        </Grid>
      </Card>
    </div>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
};

export default Summary;
