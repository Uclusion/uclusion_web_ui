import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Menu, MenuItem, useTheme } from '@material-ui/core';
import { Notifications } from '@material-ui/icons';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import TooltipIconButton from './TooltipIconButton';
import { DARK_INFO_COLOR, useButtonColors } from './ButtonConstants';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { dehighlightMessage } from '../../contexts/NotificationsContext/notificationsContextHelper';
import {
  formInboxItemLink,
  getCanonicalNavigationUrl,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { deleteOrDehilightMessages } from '../../api/users';
import { addNavigation } from '../../contexts/NotificationsContext/notificationsContextReducer';

// T-all-2447 / B-all-582: every notification bell offers a choice - go to the notification or clear it -
// following the All Done button's menu-before-action pattern
function NotificationMenuButton(props) {
  const { message, lightSurface, unhighlightedColor, iconStyle, clearOnly } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const history = useHistory();
  const intl = useIntl();
  const theme = useTheme();
  const { warningColor } = useButtonColors();
  const useUnhighlightedColor = unhighlightedColor ||
    (theme.palette.type === 'dark' ? DARK_INFO_COLOR : undefined);
  return (
    <>
      <TooltipIconButton
        noAlign
        lightSurface={lightSurface}
        onClick={(event) => {
          preventDefaultAndProp(event);
          setAnchorEl(anchorEl ? null : event.currentTarget);
        }}
        icon={<Notifications fontSize='small'
                             htmlColor={message?.is_highlighted ? warningColor : useUnhighlightedColor}
                             style={iconStyle} />}
        size='small'
        translationId='messagePresentCommentChoice'
      />
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)}
            onClose={(event) => {
              preventDefaultAndProp(event);
              setAnchorEl(null);
            }}>
        {!clearOnly && (
          <MenuItem onClick={(event) => {
            preventDefaultAndProp(event);
            setAnchorEl(null);
            dehighlightMessage(message, messagesDispatch);
            // Preserve the page containing the bell as Back's return point.
            const originUrl = getCanonicalNavigationUrl(history.location.pathname, history.location.search);
            const existingUrls = (messagesState?.navigations || []).map((navigation) => navigation.url);
            messagesDispatch(addNavigation(originUrl, existingUrls.concat(originUrl)));
            navigate(history, formInboxItemLink(message));
          }}>
            {intl.formatMessage({ id: 'notificationGoTo' })}
          </MenuItem>
        )}
        <MenuItem onClick={(event) => {
          preventDefaultAndProp(event);
          setAnchorEl(null);
          deleteOrDehilightMessages([message], messagesDispatch, true, false, true);
        }}>
          {intl.formatMessage({ id: 'notificationClear' })}
        </MenuItem>
      </Menu>
    </>
  );
}

NotificationMenuButton.propTypes = {
  message: PropTypes.object.isRequired,
  // In the inbox you are already at the notification, so only clearing it makes sense
  clearOnly: PropTypes.bool,
};

export default NotificationMenuButton;
