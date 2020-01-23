import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import _ from 'lodash';
import {
  Avatar, makeStyles, Typography,
} from '@material-ui/core';
import { useHistory } from 'react-router';
import MenuItem from '@material-ui/core/MenuItem';
import { useIntl } from 'react-intl';
import Popover from '@material-ui/core/Popover';
import Chip from '@material-ui/core/Chip';
import { navigate } from '../../utils/marketIdPathFunctions';
import SignOut from '../../pages/Authentication/SignOut';

const useStyles = makeStyles((theme) => ({
  name: {
    color: theme.palette.text.primary,
  },
  menuStyle: {
    position: 'relative',
  },
}));

function Identity() {
  const classes = useStyles();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  useEffect(() => {
    if (!user) {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          setUser(attributes);
        });
    }
  });
  const chipLabel = !user ? '' : user.name;
  const chipAvatar = _.isEmpty(chipLabel) ? '' : chipLabel.substr(0, 1);

  const recordPositionToggle = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(!open);
  };

  function goTo(to) {
    return () => {
      setOpen(false);
      navigate(history, to);
    };
  }

  return (
    <>
      <Chip
        avatar={<Avatar>{chipAvatar}</Avatar>}
        label={chipLabel}
        onClick={recordPositionToggle}
      />
      <Popover
        id="profile-menu"
        open={open}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        anchorEl={anchorEl}
      >
        <MenuItem
          onClick={goTo('/support')}
        >
          <Typography className={classes.name}>
            {intl.formatMessage({ id: 'support' })}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={goTo('/notificationPreferences')}
        >
          <Typography className={classes.name}>
            {intl.formatMessage({ id: 'changePreferencesHeader' })}
          </Typography>
        </MenuItem>
        <MenuItem
          onClick={goTo('/changePassword')}
        >
          <Typography className={classes.name}>
            {intl.formatMessage({ id: 'changePasswordHeader' })}
          </Typography>
        </MenuItem>
        <MenuItem>
          <SignOut />
        </MenuItem>
      </Popover>
    </>
  );
}
export default Identity;
