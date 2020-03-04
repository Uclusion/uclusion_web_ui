import React, { useState, useContext } from 'react';
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
import { CognitoUserContext } from '../../contexts/CongitoUserContext';

const useStyles = makeStyles((theme) => ({
  name: {
    color: theme.palette.text.primary,
  },
  menuStyle: {
    position: 'relative',
  },
}));

function Identity () {
  const classes = useStyles();
  const user = useContext(CognitoUserContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const history = useHistory();
  const intl = useIntl();
  const chipLabel = !user ? '' : user.name;
  const chipAvatar = _.isEmpty(chipLabel) ? '' : chipLabel.substr(0, 1);

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
      <Chip
        avatar={<Avatar>{chipAvatar}</Avatar>}
        label={chipLabel}
        onClick={recordPositionToggle}
      />
      <Popover
        id="profile-menu"
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
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
          onClick={goTo('/upgrade')}
        >
          <Typography className={classes.name}>
            {intl.formatMessage({ id: 'upgradeMenuItem' })}
          </Typography>
        </MenuItem>
        <MenuItem>
          <SignOut/>
        </MenuItem>
      </Popover>
    </div>
  );
}

export default Identity;
