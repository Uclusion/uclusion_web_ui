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
import { formInboxItemLink, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { deleteOrDehilightMessages } from '../../api/users';
import { NOT_FULLY_VOTED_TYPE } from '../../constants/notifications';

// T-all-2447: the comment bell offers a choice - go to the notification or clear it -
// following the All Done button's menu-before-action pattern
function NotificationMenuButton(props) {
  const { message, lightSurface, unhighlightedColor, iconStyle, clearOnly } = props;
  const [anchorEl, setAnchorEl] = useState(null);
  const [, messagesDispatch] = useContext(NotificationsContext);
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
            navigate(history, formInboxItemLink(message));
          }}>
            {intl.formatMessage({ id: 'notificationGoTo' })}
          </MenuItem>
        )}
        <MenuItem onClick={(event) => {
          preventDefaultAndProp(event);
          setAnchorEl(null);
          // Q-all-471: a NOT_FULLY_VOTED is never hidden. Since votes fold into it, the bell can
          // land on one, and dismissAIGenerated would force-delete it past the UNREAD-only rule
          // and lose a vote still owed - dehighlight those instead so only the highlight goes.
          const isVotePersistent = message?.type === NOT_FULLY_VOTED_TYPE;
          deleteOrDehilightMessages([message], messagesDispatch, true, false, !isVotePersistent);
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
