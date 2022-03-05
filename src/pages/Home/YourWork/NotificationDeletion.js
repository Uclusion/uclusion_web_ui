import { Delete } from '@material-ui/icons'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import React, { useContext } from 'react'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { removeWorkListItem, workListStyles } from './WorkListItem'

function NotificationDeletion(props) {
  const { message } = props;
  const workItemClasses = workListStyles();
  const [operationRunning] = useContext(OperationInProgressContext);

  function remove() {
    removeWorkListItem(message, workItemClasses.removed, true);
  }

  return (
    <div style={{marginLeft: '1rem', marginTop: '1rem'}}>
      <TooltipIconButton
        disabled={operationRunning !== false}
        onClick={remove}
        icon={<Delete />}
        translationId="notificationDelete"
      />
    </div>
  );
}

export default NotificationDeletion;