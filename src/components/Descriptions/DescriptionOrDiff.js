import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import {
  getDiff,
  markContentViewed,
} from '../../contexts/DiffContext/diffContextHelper'
import DiffDisplay from '../TextEditors/DiffDisplay';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { useIntl } from 'react-intl';
import { Button, darken } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
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
  const [diffState,diffDispatch] = useContext(DiffContext);
  const [showDiff, setShowDiff] = useState(false);
  const [messagesState] = useContext(NotificationsContext);
  const myMessage = findMessageOfTypeAndId(id, messagesState);
  const highlightClass = myMessage ? classes.containerYellow : classes.containerNone;
  const diff = getDiff(diffState, id);

  function toggleDiffShow() {
    markContentViewed(diffDispatch, id, description);
    setShowDiff(!showDiff);
  }

  if (showDiff && myMessage) {
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
      />
      {myMessage && diff && (
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