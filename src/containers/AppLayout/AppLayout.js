import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Routes from '../Routes';
import Drawer from '../Drawer';

const styles = {
  body: {
    height: '100%',
  },
  root: {
    flexGrow: 1,
    zIndex: 1,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    width: '100%',
  },
};

function AppLayout (props) {
  const { classes, appConfig } = props;
  return (
    <div className={classes.body}>
      <div className={classes.root}>
        <Drawer appConfig={appConfig} />
        <Routes/>
      </div>
    </div>
  );
}

export default withStyles(styles)(AppLayout);
