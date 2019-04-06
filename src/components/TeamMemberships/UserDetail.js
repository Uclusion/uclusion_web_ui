import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import {
  IconButton,
  Typography,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import InvestmentsList from './InvestmentsList';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';
import AdminUserItem from './AdminUserItem';

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

function UserDetail(props) {
  const [lastUser, setLastUser] = useState(undefined);
  const [value, setValue] = useState('investments');
  const {
    classes,
    onClose,
    investibles,
    teams,
    setTeams,
    users,
    setUsers,
    userPermissions,
    user,
  } = props;
  useEffect(() => {
    if (!lastUser) {
      setLastUser(user);
    }
    return () => {};
  });
  function handleTabChange(event, value) {
    setValue(value);
  }
  const show = !!user;
  const myUser = user || lastUser || {};
  const { canGrant } = userPermissions;
  return (
    <div
      className={classNames(classes.root, {
        [classes.detailOpen]: show,
        [classes.detailClose]: !show,
      })}
    >
      <div className={classes.flex}>
        <Typography variant="h6" className={classes.userName}>
          {myUser.name || 'Anonymous'}
        </Typography>
        <IconButton aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Typography className={classes.email}>
          {myUser.email}
        </Typography>
        <Typography>
          {`uShares available: ${myUser.quantity}`}
        </Typography>
        <Typography>
          {`uShares spent: ${myUser.quantityInvested}`}
        </Typography>
        <div className={classes.paper}>
          <Tabs
            className={classes.tabBar}
            indicatorColor="primary"
            textColor="primary"
            value={value}
            onChange={handleTabChange}
          >
            <Tab className={classes.tab} label="Investments" value="investments" />
            {canGrant && (
              <Tab className={classes.tab} label="Administer" value="administer" />
            )}
          </Tabs>
          {value === 'investments' && (
            <InvestmentsList
              teams={teams}
              setTeams={setTeams}
              users={users}
              setUsers={setUsers}
              userId={myUser.id}
              investibles={investibles}
            />
          )}
          {value === 'administer' && (
            <AdminUserItem
              teams={teams}
              setTeams={setTeams}
              users={users}
              setUsers={setUsers}
              user={myUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}

UserDetail.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  user: PropTypes.object.isRequired, //eslint-disable-line
  investibles: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  teams: PropTypes.arrayOf(PropTypes.object), //eslint-disable-line
  setTeams: PropTypes.func, //eslint-disable-line
  users: PropTypes.object.isRequired, //eslint-disable-line
  setUsers: PropTypes.func, //eslint-disable-line
  onClose: PropTypes.func.isRequired,
  userPermissions: PropTypes.object.isRequired, //eslint-disable-line
};

export default withUserAndPermissions(withStyles(styles)(UserDetail));
