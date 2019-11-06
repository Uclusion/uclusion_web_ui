import React from 'react';
import {
  AppBar, makeStyles, Paper, Toolbar, Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';

const useStyles = makeStyles({
  subHeader: {
    boxShadow: 'none',
    background: '#ffffff',
  },
});

function SubSection(props) {
  const { children, hidden, title } = props;

  const classes = useStyles();

  return (
    <Paper hidden={hidden}>
      <AppBar
        className={classes.subHeader}
        position="static"
      >
        <Toolbar>
          <Typography color="textSecondary">
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
  children: PropTypes.object,
};

SubSection.defaultProps = {
  hidden: false,
  children: undefined,
};

export default SubSection;
