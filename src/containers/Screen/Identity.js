import React, { useState, useContext } from 'react';
import {
  makeStyles, Typography, Menu, Button
} from '@material-ui/core';
import SettingsIcon from '@material-ui/icons/Settings';
import { useHistory } from 'react-router';
import MenuItem from '@material-ui/core/MenuItem';
import { useIntl } from 'react-intl';
import { navigate } from '../../utils/marketIdPathFunctions';
import SignOut from '../../pages/Authentication/SignOut';
import { CognitoUserContext } from '../../contexts/CongitoUserContext';

const useStyles = makeStyles((theme) => ({
  name: {
    color: theme.palette.text.primary,
  },
  menuStyle: {
    position: 'relative',
  },
  buttonClass: {
    backgroundColor: '#efefef',
    textTransform: 'Capitalize',
    borderRadius: '8px'
  }
}));

function Identity () {
  const classes = useStyles();
  const user = useContext(CognitoUserContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const history = useHistory();
  const intl = useIntl();
  const chipLabel = !user ? '' : user.name;

  const recordPositionToggle = (event) => {
    setAnchorEl(event.currentTarget);
  };

  function goTo (to) {
    return () => {
      setAnchorEl(null);
      navigate(history, to);
    };
  }

  return (
    <div
      id="profileLink"
    >
      <Button
        onClick={recordPositionToggle}
        endIcon={<SettingsIcon htmlColor="#bdbdbd" />}
        className={classes.buttonClass}
      >
        {chipLabel}
      <Menu
        id="profile-menu"
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorEl={anchorEl}
        disableRestoreFocus
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
          <MenuItem
            onClick={goTo('/billing')}
          >
            <Typography className={classes.name}>
              {intl.formatMessage({ id: 'billingMenuItem' })}
            </Typography>
          </MenuItem>
          <MenuItem>
            <SignOut/>
          </MenuItem>
      </Menu>
      </Button>
    </div>
  );
}

export default Identity;
