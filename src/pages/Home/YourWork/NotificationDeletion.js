import React, { useContext } from 'react';
import { removeWorkListItem } from './WorkListItem'
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function NotificationDeletion(props) {
  const { message, isRed } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);

  function remove(event) {
    if (message) {
      preventDefaultAndProp(event);
      removeWorkListItem(message, messagesDispatch);
    }
  }

  return (
    // https://fonts.google.com/icons?selected=Material+Symbols+Outlined:delete:FILL@0;wght@400;GRAD@0;opsz@24&icon.query=delete
    <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"
          onClick={remove}>
      <path fill={isRed ? '#9B0000' : undefined}
        d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
    </svg>
  );
}

export default NotificationDeletion;