import { Delete } from '@material-ui/icons'
import React from 'react'
import { removeWorkListItem, workListStyles } from './WorkListItem'
import { useIntl } from 'react-intl'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import DeleteIcon from '@material-ui/icons/Delete'
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'

function NotificationDeletion(props) {
  const { message, fromRow=false } = props;
  const workItemClasses = workListStyles();
  const intl = useIntl();

  function remove(event) {
    preventDefaultAndProp(event);
    removeWorkListItem(message, workItemClasses.removed, true);
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