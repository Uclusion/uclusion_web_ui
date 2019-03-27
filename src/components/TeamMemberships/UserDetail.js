import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
  root: {
    position: 'fixed',
    width: 400,
    height: '100%',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    zIndex: 999,
    padding: theme.spacing.unit * 2,
    paddingTop: 64 + theme.spacing.unit * 2,
    boxSizing: 'border-box',
    transition: theme.transitions.create(['right'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  detailOpen: {
    right: 0,
  },
  detailClose: {
    right: '-100%',
  },
  flex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    paddingTop: theme.spacing.unit * 1.25,
    paddingBottom: theme.spacing.unit,
    fontWeight: 'bold',
  },
  email: {
    marginBottom: theme.spacing.unit,
  },
});

class UserDetail extends React.PureComponent {
  componentDidUpdate() {
    const { user } = this.props;
    if (user) {
      this.lastUser = user;
    }
  }

  render() {
    const {
      classes,
      onClose,
    } = this.props;
    const show = !!this.props.user;
    const user = this.props.user || this.lastUser || {};

    return (
      <div
        className={classNames(classes.root, {
          [classes.detailOpen]: show,
          [classes.detailClose]: !show,
        })}
      >
        <div className={classes.flex}>
          <Typography variant="h6" className={classes.userName}>
            {user.name || 'Anonymous'}
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Typography className={classes.email}>
            {user.email}
          </Typography>
          <Typography>
            {`uShares available: ${user.quantity}`}
          </Typography>
          <Typography>
            {`uShares spent: ${user.quantityInvested}`}
          </Typography>
        </div>
      </div>
    );
  }
}

UserDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  user: PropTypes.object.isRequired, //eslint-disable-line
  onClose: PropTypes.func.isRequired,
};

export default withStyles(styles)(UserDetail);
