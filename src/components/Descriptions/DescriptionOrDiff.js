import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import {
  hasDiff,
  hasUnViewedDiff, markContentViewed,
} from '../../contexts/DiffContext/diffContextHelper'
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { useIntl } from 'react-intl';
import { Button, darken } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { deleteSingleMessage } from '../../api/users'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer'
import { findMessageOfTypeAndId } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'

const style = makeStyles(() => {
    return {
      containerYellow: {
        boxShadow: "10px 5px 5px yellow",
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: 8,
        textTransform: 'capitalize',
        backgroundColor: '#2d9cdb',
        color: '#fff',
        '&:hover': {
          backgroundColor: darken('#2d9cdb', 0.08)
        },
        '&:focus': {
          backgroundColor: darken('#2d9cdb', 0.24)
        },
      },
      containerNone: {
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: 8,
        textTransform: 'capitalize',
        backgroundColor: '#2d9cdb',
        color: '#fff',
        '&:hover': {
          backgroundColor: darken('#2d9cdb', 0.08)
        },
        '&:focus': {
          backgroundColor: darken('#2d9cdb', 0.24)
        },
      }
    };
  }
);

function DescriptionOrDiff(props) {
  const {
    id,
    description,
    setBeingEdited,
    isEditable
  } = props;

  const intl = useIntl();
  const classes = style();
  const [diffState, diffDispatch] = useContext(DiffContext);
  const hasNewDiff = hasUnViewedDiff(diffState, id);
  const [showDiff, setShowDiff] = useState(false);
  const diffAvailable = hasDiff(diffState, id);
  const highlightClass = hasNewDiff ? classes.containerYellow : classes.containerNone;
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState);

  function toggleDiffShow() {
    if (myMessage) {
      deleteSingleMessage(myMessage).then(() => messagesDispatch(removeMessage(myMessage)));
    }
    markContentViewed(diffDispatch, id, description);
    setShowDiff(!showDiff);
  }

  if (showDiff && diffAvailable) {
    return (
      <DiffDisplay
        id={id}
        showToggle={toggleDiffShow}
        displayClass={classes.containerNone}
      />
    );
  }
  return (
    <div>
      <ReadOnlyQuillEditor
        value={description}
        setBeingEdited={setBeingEdited}
        isEditable={isEditable}
        notificationId={id}
      />
      {diffAvailable && (
        <Button
          onClick={toggleDiffShow}
          className={highlightClass}
        >
          {intl.formatMessage({ id: 'diffDisplayShowLabel' })}
        </Button>
      )}
    </div>
  );
}

DescriptionOrDiff.propTypes = {
  id: PropTypes.string.isRequired,
  description: PropTypes.string
};

export default DescriptionOrDiff;