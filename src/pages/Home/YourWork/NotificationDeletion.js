import { Delete } from '@material-ui/icons'
import React from 'react'
import { removeWorkListItem, workListStyles } from './WorkListItem'
import { useIntl } from 'react-intl'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'

function NotificationDeletion(props) {
  const { message } = props;
  const workItemClasses = workListStyles();
  const intl = useIntl();

  function remove() {
    removeWorkListItem(message, workItemClasses.removed, true);
  }

  return (
    <SpinningIconLabelButton onClick={remove} doSpin={false} icon={Delete}>
      {intl.formatMessage({ id: 'notificationDelete' })}
    </SpinningIconLabelButton>
  );
}

export default NotificationDeletion;