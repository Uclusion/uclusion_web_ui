import React from 'react'
import { AppBar, makeStyles, Paper, Toolbar, Typography } from '@material-ui/core';
import PropTypes from 'prop-types';


const useStyles = makeStyles({
  subHeader: {
    boxShadow: 'none',
  },
});

function SubSection(props) {
  const { children, hidden, title, leftActions, rightActions } = props;

  const classes = useStyles();

  return (
    <Paper hidden={hidden}>
      <AppBar
        className={classes.subHeader}
        position="static"
        color="background"
      >
        <Toolbar>
          <Typography color='textSecondary'>
            {title}
          </Typography>
        </Toolbar>
      </AppBar>
      { children }
    </Paper>
  );
}


SubSection.propTypes = {
  hidden: PropTypes.bool,
  title: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  leftActions: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  rightActions: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.object,
};

SubSection.defaultProps = {
  hidden: false,
  leftActions: undefined,
  rightActions: undefined,
  children: undefined,
};


export default SubSection;