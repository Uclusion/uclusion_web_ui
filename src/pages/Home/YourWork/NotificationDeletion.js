import { Delete } from '@material-ui/icons'
import React, { useContext } from 'react';
import { removeWorkListItem } from './WorkListItem'
import { useIntl } from 'react-intl'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import DeleteIcon from '@material-ui/icons/Delete'
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function NotificationDeletion(props) {
  const { message, fromRow=false } = props;
  const [, messagesDispatch] = useContext(NotificationsContext);
  const intl = useIntl();

  function remove(event) {
    preventDefaultAndProp(event);
    removeWorkListItem(message, messagesDispatch);
  }

  if (fromRow) {
    return (
      <DeleteIcon onClick={remove} style={{color: 'black', marginRight: '0.5rem'}} />
    );
  }

  return (
    <SpinningIconLabelButton onClick={remove} doSpin={false} icon={Delete}>
      {intl.formatMessage({ id: 'notificationDelete' })}
    </SpinningIconLabelButton>
  );
}

export default NotificationDeletion;