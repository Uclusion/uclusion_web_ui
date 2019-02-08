import React, { Component } from 'react';

import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import Routes from '../Routes';
import Drawer from '../Drawer';

const styles = theme => ({
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
});

export class AppLayout extends Component {
  render() {
    const { classes } = this.props;
    return (
      <div className={classes.body}>
        <div className={classes.root}>
          <Drawer />
          <Routes />

        </div>
      </div>
    );
  }
}

export default injectIntl(withStyles(styles, { withTheme: true })(AppLayout));
