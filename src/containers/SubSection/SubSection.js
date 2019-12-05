import React from 'react';
import {
  AppBar, makeStyles, Toolbar, Typography,
} from '@material-ui/core';
import PropTypes from 'prop-types';

const useStyles = makeStyles((theme) => {
  return {
    subHeader: {
      boxShadow: 'none',
      background: '#ffffff',
      minHeight: 32,
    },
    toolbar: theme.mixins.toolbar,
  };
});

function SubSection(props) {
  const { children, hidden, title, actionButton } = props;

  const classes = useStyles();

  return (
    <React.Fragment>
      <AppBar
        className={classes.subHeader}
        position="static"
        hidden={hidden}
      >
        <Toolbar>
          <Typography color="textSecondary">
            {title}
          </Typography>
          {actionButton}
        </Toolbar>
      </AppBar>
      <div className={classes.toolbar}>
        {children}
      </div>
    </React.Fragment>

  );
}

SubSection.propTypes = {
  hidden: PropTypes.bool,
  title: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  actionButton: PropTypes.object,
};

SubSection.defaultProps = {
  title: '',
  hidden: false,
  children: undefined,
  fab: undefined,
};

export default SubSection;
